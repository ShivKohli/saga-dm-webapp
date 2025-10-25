import { NextResponse } from "next/server";
import OpenAI from "openai";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";
import { limitRequest } from "@/lib/ratelimit";
import { env } from "@/lib/env";
// ✅ Top of /app/api/upload-character/route.ts
import pdf from "pdf-parse";
import mammoth from "mammoth";

export const runtime = "nodejs";

const openai = new OpenAI({ apiKey: env.OPENAI_API_KEY });

/* 🧩 Zod schema for file metadata */
const FileSchema = z.object({
  name: z
    .string()
    .min(1, "File name is missing.")
    .regex(/\.(pdf|docx|txt)$/i, "Unsupported file type (only PDF, DOCX, TXT)."),
  size: z.number().max(10 * 1024 * 1024, "File too large (max 10MB)."),
});

export async function POST(req: Request) {
  try {
    /* ───────────────────────────────────────────────
       🧱 RATE-LIMIT CHECK (Upstash Redis)
    ─────────────────────────────────────────────── */
    const ip =
      req.headers.get("x-forwarded-for") ||
      req.headers.get("x-real-ip") ||
      "anonymous";

    const { success, remaining } = await limitRequest(ip.toString());
    if (!success) {
      console.warn(`🚫 Upload rate limit exceeded for IP: ${ip}`);
      return NextResponse.json(
        { error: "📜 Slow down, adventurer! Too many uploads too quickly." },
        { status: 429 }
      );
    }

    console.log(`📨 Upload request received (remaining ${remaining} for ${ip})`);

    /* ───────────────────────────────────────────────
       🧩 PARSE & VALIDATE FORM INPUT (Zod)
    ─────────────────────────────────────────────── */
    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    if (!file) {
      return NextResponse.json({ error: "No file uploaded." }, { status: 400 });
    }

    const meta = { name: file.name, size: file.size };
    const parsed = FileSchema.safeParse(meta);
    if (!parsed.success) {
      console.warn("⚠️ Invalid upload:", parsed.error.flatten());
      return NextResponse.json(
        { error: "Invalid file upload.", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    console.log(
      `📥 Received valid file: ${file.name} (${(file.size / 1024).toFixed(1)} KB)`
    );

    /* ───────────────────────────────────────────────
       🧠 Extract Text Content
    ─────────────────────────────────────────────── */


    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    let text = "";

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

    /* ───────────────────────────────────────────────
       🧬 Generate Embedding (OpenAI)
    ─────────────────────────────────────────────── */
    const truncated = text.slice(0, 8000);
    const embedRes = await openai.embeddings.create({
      model: "text-embedding-3-small",
      input: truncated,
    });
    const embedding = embedRes.data[0].embedding;

    /* ───────────────────────────────────────────────
       🗃️ Store in Supabase (RLS-ready)
    ─────────────────────────────────────────────── */
    const supabase = createClient(env.SUPABASE_URL!, env.SUPABASE_SERVICE_ROLE_KEY!);

    // Extract user_id from Authorization header if provided
    const authHeader = req.headers.get("authorization");
    let userId: string | null = null;
    if (authHeader) {
      const token = authHeader.replace("Bearer ", "").trim();
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser(token);
        userId = user?.id ?? null;
      } catch (authErr) {
        console.warn("⚠️ Failed to resolve user from token:", authErr);
      }
    }

    const { data, error } = await supabase
      .from("player_sheets")
      .insert({
        filename: file.name,
        content: truncated,
        embedding,
        user_id: userId, // ✅ attach user for RLS
      })
      .select()
      .single();

    if (error) {
      console.error("❌ Supabase insert error:", error);
      return NextResponse.json(
        { error: "Failed to save to Supabase." },
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
