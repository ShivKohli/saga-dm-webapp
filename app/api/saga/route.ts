import { NextResponse } from "next/server";
import { extractVoiceSegments } from "@/lib/voices";
import { queryKnowledgeBase } from "@/lib/vectorDB";   // 🧠 new import
import OpenAI from "openai";

export const runtime = "nodejs";

const OPENAI_API_KEY = process.env.OPENAI_API_KEY!;
const OPENAI_MODEL = process.env.OPENAI_MODEL ?? "gpt-4o-mini";
const SAGA_TTS_URL = process.env.SAGA_TTS_URL ?? "https://saga-tts.vercel.app/tts";

const systemPrompt = `You are Sága, an AI Dungeon Master. Be cinematic, fair, and immersive.
Use D&D 5e logic. For any spoken narration or dialogue, include [Voice: CharacterName] before the sentence and wrap the sentence in quotes.
Example:
[Voice: Saga] "The torchlight flickers across the ruins."
[Voice: Nyra] "Halt! Who goes there?"
Keep paragraphs concise. Do not include code blocks.`;

// ────────────────────────────────────────────────
// POST handler
// ────────────────────────────────────────────────
export async function POST(req: Request) {
  try {
    console.log("Saga API: request received");
    const { history, userMessage } = await req.json();

    // 🧠 Step 1: Retrieve relevant lore/context from Supabase
    console.log("Fetching context from Supabase...");
    const matches = await queryKnowledgeBase(String(userMessage ?? ""));
    const contextText = matches.map((m: any) => m.content).join("\n");
    console.log(`Context retrieved (${matches.length} chunks)`);

    // 🧠 Step 2: Build the full prompt with system + context
    const messages = [
      { role: "system", content: systemPrompt },
      { role: "system", content: "Reference Context:\n" + contextText },
      ...(Array.isArray(history) ? history : []),
      { role: "user", content: String(userMessage ?? "") },
    ];

    // 🧩 Step 3: Call OpenAI API
    console.log("Calling OpenAI...");
    const comp = await fetch("https://api.openai.com/v1/chat/completions", {
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

    console.log("OpenAI status:", comp.status);
    if (!comp.ok) {
      const errText = await comp.text();
      console.error("OpenAI error:", errText);
      return NextResponse.json({ error: "OpenAI error", detail: errText }, { status: 500 });
    }

    const completion = await comp.json();
    const assistantText: string = completion.choices?.[0]?.message?.content ?? "";
    console.log("Assistant text:", assistantText.slice(0, 120));

    // 🗣️ Step 4: Extract voice segments & generate audio
    const segments = extractVoiceSegments(assistantText);
    console.log("Voice segments:", segments);

    const clips = [];
    for (const seg of segments) {
      console.log("TTS for:", seg.character);
      const ttsRes = await fetch(SAGA_TTS_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ character: seg.character, text: seg.line }),
      });
      console.log("TTS status:", ttsRes.status);
      if (!ttsRes.ok) {
        console.error("TTS error:", await ttsRes.text());
        continue;
      }
      const data = await ttsRes.json();
      clips.push({ character: seg.character, url: data.audio_url, voice_used: data.voice_used });
    }

    // 🪄 Step 5: Return both text and audio
    return NextResponse.json({ text: assistantText, clips });
  } catch (e: any) {
    console.error("Saga route error:", e);
    return NextResponse.json({ error: e?.message ?? "Unknown error" }, { status: 500 });
  }
}
