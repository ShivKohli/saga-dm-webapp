import { NextResponse } from "next/server";
import { extractVoiceSegments } from "@/lib/voices";
import { queryKnowledgeBase, getPlayerSheets } from "@/lib/vectorDB"; // ✅ merged import
import { sagaSystemPrompt } from "@/lib/systemPrompt";

export const runtime = "nodejs";

const OPENAI_API_KEY = process.env.OPENAI_API_KEY!;
const OPENAI_MODEL = process.env.OPENAI_MODEL ?? "gpt-4o-mini";
const SAGA_TTS_URL =
  process.env.SAGA_TTS_URL ?? "https://saga-tts.vercel.app/tts";

export async function POST(req: Request) {
  try {
    console.log("📨 Saga API: request received");
    const { history, userMessage } = await req.json();

    // 🧠 STEP 1: Fetch contextual lore or rules from Supabase
    console.log("🔍 Fetching context from Supabase...");
    const matches = await queryKnowledgeBase(String(userMessage ?? ""));
    const contextText = matches.map((m: any) => m.content).join("\n");
    console.log(`✅ Retrieved ${matches.length} relevant context chunks`);

    // 🧝‍♀️ STEP 2: Retrieve any uploaded player sheets
    console.log("📜 Fetching uploaded character sheets...");
    const playerSheets = await getPlayerSheets();
    const sheetContext = playerSheets
      .map(
        (s) =>
          `Character Sheet: ${s.filename}\n──────────────────────\n${s.content}`
      )
      .join("\n\n");
    console.log(`✅ Loaded ${playerSheets.length} player sheet(s)`);

    // 🧩 STEP 3: Build the chat prompt (system + sheets + lore + user)
    const messages = [
      { role: "system", content: sagaSystemPrompt },
      { role: "system", content: "Player Character Sheets:\n" + sheetContext },
      { role: "system", content: "Reference Context:\n" + contextText },
      ...(Array.isArray(history) ? history : []),
      { role: "user", content: String(userMessage ?? "") },
    ];

    // 🧠 STEP 4: Call OpenAI Chat API
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
    console.log("🧾 Assistant output:", assistantText.slice(0, 100));

    // 🗣️ STEP 5: Parse voice segments
    const segments = extractVoiceSegments(assistantText);
    console.log("🎙️ Voice segments found:", segments.length);

    // 🔊 STEP 6: Generate TTS clips sequentially
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

    // ✅ STEP 7: Return both text and generated audio clips
    return NextResponse.json({ text: assistantText, clips });
  } catch (e: any) {
    console.error("💥 Saga route error:", e);
    return NextResponse.json(
      { error: e?.message ?? "Unknown error" },
      { status: 500 }
    );
  }
}
