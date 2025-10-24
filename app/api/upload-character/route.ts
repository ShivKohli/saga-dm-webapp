import { NextResponse } from "next/server";
import OpenAI from "openai";
import { createClient } from "@supabase/supabase-js";
import { limitRequest } from "@/lib/ratelimit"; // 🆕 add rate limiter

export const runtime = "nodejs";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: Request) {
  try {
    // 🧱 RATE-LIMIT CHECK ────────────────────────────────
    const ip =
      req.headers.get("x-forwarded-for") ||
      req.headers.get("x-real-ip") ||
      "anonymous";

    const { success, remaining } = await limitRequest(ip.toString());

    if (!success) {
      console.warn(`🚫 Upload rate limit exceeded for IP: ${ip}`);
      return NextResponse.json(
        {
          error:
            "📜 Slow down, adventurer! You are uploading too many parchments too quickly.",
        },
        { status: 429 }
      );
    }

    console.log(`📨 Upload request received (remaining ${remaining} for ${ip})`);

    // 🧾 Parse uploaded form data
    const formData = await req.formData();
    const file = formData.get("file") as File;
    if (!file) {
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
    }

    console.log(`📥 Received file: ${file.name} (${file.type})`);

    // 🛡️ FILE VALIDATION ────────────────────────────────
    const MAX_MB = 10;
    const allowedExt = /\.(pdf|docx|txt)$/i;

    if (!allowedExt.test(file.name)) {
      return NextResponse.json(
        { error: "Unsupported file type. Please upload PDF, DOCX, or TXT." },
        { status: 400 }
      );
    }

    if (file.size > MAX_MB * 1024 * 1024) {
      return NextResponse.json(
        { error: `File too large (max ${MAX_MB}MB).` },
        { status: 413 }
      );
    }

    // 🧠 Lazy-load pdf-parse and mammoth ONLY when needed
    const pdf = await import("pdf-parse");
    const mammoth = await import("mammoth");

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    let text = "";

    // Extract text depending on file type
    if (file.name.endsWith(".pdf")) {
      const pdfData = await pdf.default(buffer);
      text = pdfData.text;
    } else if (file.name.endsWith(".docx")) {
      const result = await mammoth.extractRawText({ buffer });
      text = result.value;
    } else if (file.name.endsWith(".txt")) {
      text = buffer.toString("utf8");
    }

    if (!text.trim()) {
      return NextResponse.json(
        { error: "File contained no readable text." },
        { status: 400 }
      );
    }

    console.log(`🧠 Extracted ${text.length} characters from ${file.name}`);

    // 🔍 Truncate overly long text to keep embeddings under token limit
    const truncated = text.slice(0, 8000);

    // 🧬 Generate embedding
    const embedRes = await openai.embeddings.create({
      model: "text-embedding-3-small",
      input: truncated,
    });

    const embedding = embedRes.data[0].embedding;

    // 🗃️ Insert into Supabase
    const { data, error } = await supabase
      .from("player_sheets")
      .insert({
        filename: file.name,
        content: truncated,
        embedding,
      })
      .select()
      .single();

    if (error) {
      console.error("❌ Supabase insert error:", error);
      return NextResponse.json(
        { error: "Failed to save to Supabase" },
        { status: 500 }
      );
    }

    console.log(`✅ Uploaded and embedded: ${file.name}`);
    return NextResponse.json({
      success: true,
      filename: file.name,
      id: data.id,
      message: "Character sheet uploaded and stored successfully.",
    });
  } catch (err: any) {
    console.error("💥 Upload error:", err);
    return NextResponse.json(
      { error: err.message ?? "Upload failed." },
      { status: 500 }
    );
  }
}
