"use client";
import { useState, useRef, useEffect } from "react";
import { useAudioQueue } from "./AudioQueue";
import clsx from "clsx";

type Msg = { role: "user" | "assistant"; content: string };

export default function Chat() {
  const [messages, setMessages] = useState<Msg[]>([
    { role: "assistant", content: "Welcome, adventurers. I am Sága, the AI Dungeon Master — keeper of all stories ever told, and those yet to unfold.\nTell me how many heroes stand before me (1–4), and have each introduce themselves:\nName, Race, Class, Brief Backstory, Current HP, and Starting Items.\nWhen all have spoken, I shall inscribe your names in the Book of Lore and begin your adventure." }
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const { enqueue, enabled, setEnabled, pause, resume, playing } = useAudioQueue();
  const bottomRef = useRef<HTMLDivElement | null>(null);

  const send = async () => {
    if (!input.trim() || loading) return;
    const userMsg: Msg = { role: "user", content: input.trim() };
    setMessages((m) => [...m, userMsg]);
    setInput("");
    setLoading(true);
    try {
      const res = await fetch("/api/saga", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          history: messages,
          userMessage: userMsg.content
        })
      });
      const data = await res.json();
      if (data?.text) {
        setMessages((m) => [...m, { role: "assistant", content: data.text }]);
      }
      if (Array.isArray(data?.clips) && data.clips.length) {
        enqueue(data.clips.map((c: any) => ({ character: c.character, url: c.url, voice_used: c.voice_used })));
      }
    } catch (e: any) {
      setMessages((m) => [...m, { role: "assistant", content: "The winds falter… I could not speak that line. Try again." }]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  return (
    <div className="max-w-3xl mx-auto p-6">
      <header className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-semibold">Sága — AI Dungeon Master</h1>
        <div className="flex items-center gap-3 text-sm">
          <button
            className={clsx("px-3 py-1 rounded-md border", enabled ? "border-green-500" : "border-gray-500")}
            onClick={() => setEnabled(!enabled)}
            title={enabled ? "Sound enabled" : "Sound disabled"}
          >
            {enabled ? "Sound: ON" : "Sound: OFF"}
          </button>
          <button className="px-3 py-1 rounded-md border border-gray-500" onClick={() => (playing ? pause() : resume())}>
            {playing ? "Pause" : "Resume"}
          </button>
        </div>
      </header>

      <div className="bg-saga.card rounded-2xl p-4 space-y-4 min-h-[60vh]">
        {messages.map((m, i) => (
          <div key={i} className={m.role === "assistant" ? "text-saga.text" : "text-gray-300"}>
            <p className="whitespace-pre-wrap">{m.content}</p>
          </div>
        ))}
        {loading && <p className="text-sm text-gray-400">Sága composes the next line…</p>}
        <div ref={bottomRef} />
      </div>

      <div className="mt-4 flex gap-2">
        <input
          className="flex-1 rounded-lg border border-gray-700 bg-transparent px-3 py-2 outline-none focus:border-saga.accent"
          placeholder="Speak to Sága…"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && send()}
        />
        <button
          onClick={send}
          disabled={loading}
          className="rounded-lg bg-saga.accent text-white px-4 py-2 disabled:opacity-50"
        >
          Send
        </button>
      </div>
    </div>
  );
}
