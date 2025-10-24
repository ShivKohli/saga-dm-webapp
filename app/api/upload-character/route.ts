import { NextResponse } from "next/server";
import OpenAI from "openai";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File;
    if (!file) {
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
    }

    // 🧠 Lazy-load pdf-parse and mammoth ONLY at runtime
    const pdf = await import("pdf-parse");
    const mammoth = await import("mammoth");

    console.log(`📥 Received file: ${file.name} (${file.type})`);

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
    } else {
      return NextResponse.json(
        { error: "Unsupported file type. Please upload PDF, DOCX, or TXT." },
        { status: 400 }
      );
    }

    if (!text.trim()) {
      return NextResponse.json(
        { error: "File contained no readable text." },
        { status: 400 }
      );
    }

    console.log(`🧠 Extracted ${text.length} characters from ${file.name}`);

    const truncated = text.slice(0, 8000);

    const embedRes = await openai.embeddings.create({
      model: "text-embedding-3-small",
      input: truncated,
    });

    const embedding = embedRes.data[0].embedding;

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
