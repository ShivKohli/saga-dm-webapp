import { NextResponse } from "next/server";
import { z } from "zod"; // 🧱 Zod for input validation
import { extractVoiceSegments } from "@/lib/voices";
import { queryKnowledgeBase, getPlayerSheets } from "@/lib/vectorDB";
import { sagaSystemPrompt } from "@/lib/systemPrompt";
import { limitRequest } from "@/lib/ratelimit"; // 🧱 Upstash rate limiter
import { env } from "@/lib/env";

export const runtime = "nodejs";

const OPENAI_API_KEY = env.OPENAI_API_KEY!;
const OPENAI_MODEL = env.OPENAI_MODEL ?? "gpt-4o-mini";
const SAGA_TTS_URL =
  env.SAGA_TTS_URL ?? "https://saga-tts.vercel.app/tts";

/* 🧩 Zod schema for validating incoming requests */
const SagaSchema = z.object({
  history: z
    .array(
      z.object({
        role: z.enum(["user", "assistant"]),
        content: z.string().min(1),
      })
    )
    .default([]),
  userMessage: z.string().min(1, "User message cannot be empty"),
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
      console.warn(`🚫 Rate limit exceeded for IP: ${ip}`);
      return NextResponse.json(
        {
          error:
            "⏳ Too many requests. Please wait a moment before speaking again.",
        },
        { status: 429 }
      );
    }

    console.log(`📨 Saga API request received (${remaining} remaining for ${ip})`);

    /* ───────────────────────────────────────────────
       🧩 VALIDATE REQUEST BODY (Zod)
    ─────────────────────────────────────────────── */
    const body = await req.json();
    const parsed = SagaSchema.safeParse(body);

    if (!parsed.success) {
      console.warn("⚠️ Invalid Saga request:", parsed.error.flatten());
      return NextResponse.json(
        {
          error: "Invalid payload format.",
          details: parsed.error.flatten(),
        },
        { status: 400 }
      );
    }

    const { history, userMessage } = parsed.data;

    /* ───────────────────────────────────────────────
       🧠 STEP 1: Fetch contextual lore from Supabase
    ─────────────────────────────────────────────── */
    console.log("🔍 Fetching context from Supabase...");
    const matches = await queryKnowledgeBase(String(userMessage ?? ""));
    const contextText = matches.map((m: any) => m.content).join("\n");
    console.log(`✅ Retrieved ${matches.length} relevant context chunks`);

    /* ───────────────────────────────────────────────
       🧝 STEP 2: Load uploaded player sheets
    ─────────────────────────────────────────────── */
    console.log("📜 Fetching uploaded character sheets...");
    const playerSheets = await getPlayerSheets();
    const sheetContext = playerSheets
      .map(
        (s) =>
          `Character Sheet: ${s.filename}\n──────────────────────\n${s.content}`
      )
      .join("\n\n");
    console.log(`✅ Loaded ${playerSheets.length} player sheet(s)`);

    /* ───────────────────────────────────────────────
       🧩 STEP 3: Build the system + user prompt
    ─────────────────────────────────────────────── */
    const messages = [
      { role: "system", content: sagaSystemPrompt },
      { role: "system", content: "Player Character Sheets:\n" + sheetContext },
      { role: "system", content: "Reference Context:\n" + contextText },
      ...(Array.isArray(history) ? history : []),
      { role: "user", content: String(userMessage ?? "") },
    ];

    /* ───────────────────────────────────────────────
       🤖 STEP 4: Call OpenAI Chat Completion API
    ─────────────────────────────────────────────── */
    console.log("🤖 Calling OpenAI...");
    const completion = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: OPENAI_MODEL,
        messages,
        temperature: 0.9,
      }),
    });

    if (!completion.ok) {
      const errText = await completion.text();
      console.error("❌ OpenAI API error:", errText);
      return NextResponse.json(
        { error: "OpenAI API error", detail: errText },
        { status: 500 }
      );
    }

    const data = await completion.json();
    const assistantText: string = data.choices?.[0]?.message?.content ?? "";
    console.log("🧾 Assistant output:", assistantText.slice(0, 120));

    /* ───────────────────────────────────────────────
       🎙️ STEP 5: Parse and generate TTS voice clips
    ─────────────────────────────────────────────── */
    const segments = extractVoiceSegments(assistantText);
    console.log("🎙️ Voice segments found:", segments.length);

    const clips = [];
    for (const seg of segments) {
      console.log(`🔊 Generating TTS for: ${seg.character}`);
      const ttsRes = await fetch(SAGA_TTS_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ character: seg.character, text: seg.line }),
      });

      if (!ttsRes.ok) {
        console.error("⚠️ TTS error:", await ttsRes.text());
        continue;
      }

      const clipData = await ttsRes.json();
      clips.push({
        character: seg.character,
        url: clipData.audio_url,
        voice_used: clipData.voice_used,
      });
    }

    /* ───────────────────────────────────────────────
       ✅ STEP 6: Return text + audio clip URLs
    ─────────────────────────────────────────────── */
    return NextResponse.json({ text: assistantText, clips });
  } catch (e: any) {
    console.error("💥 Saga route error:", e);
    return NextResponse.json(
      { error: e?.message ?? "Unknown error" },
      { status: 500 }
    );
  }
}
