import { NextResponse } from "next/server";
import { extractVoiceSegments } from "@/lib/voices";

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

export async function POST(req: Request) {
  try {
    const { history, userMessage } = await req.json();

    const messages = [
      { role: "system", content: systemPrompt },
      ...(Array.isArray(history) ? history : []),
      { role: "user", content: String(userMessage ?? "") }
    ];

    const comp = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${OPENAI_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: OPENAI_MODEL,
        messages,
        temperature: 0.9
      })
    });

    if (!comp.ok) {
      const errText = await comp.text();
      return NextResponse.json({ error: "OpenAI error", detail: errText }, { status: 500 });
    }

    const completion = await comp.json();
    const assistantText: string = completion.choices?.[0]?.message?.content ?? "";

    // Extract voice segments
    const segments = extractVoiceSegments(assistantText);

    // Generate audio clips sequentially to preserve order
    const clips: { character: string; url: string; voice_used?: string }[] = [];
    for (const seg of segments) {
      const ttsRes = await fetch(SAGA_TTS_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ character: seg.character, text: seg.line })
      });
      if (!ttsRes.ok) {
        const err = await ttsRes.text();
        clips.push({ character: seg.character, url: "", voice_used: undefined });
        console.error("TTS error:", err);
        continue;
      }
      const data = await ttsRes.json();
      clips.push({ character: seg.character, url: data.audio_url, voice_used: data.voice_used });
    }

    return NextResponse.json({ text: assistantText, clips });
  } catch (e: any) {
    console.error("Saga route error:", e);
    return NextResponse.json({ error: e?.message ?? "Unknown error" }, { status: 500 });
  }
}
