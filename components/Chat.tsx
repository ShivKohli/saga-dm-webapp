"use client";
import { useState, useRef, useEffect } from "react";
import { useAudioQueue } from "./AudioQueue";
import clsx from "clsx";

type Msg = { role: "user" | "assistant"; content: string };

export default function Chat() {
  const [messages, setMessages] = useState<Msg[]>([
    {
      role: "assistant",
      content:
        "Welcome, adventurers. I am Sága, the AI Dungeon Master — keeper of all stories ever told, and those yet to unfold.\nTell me how many heroes stand before me (1–4), and have each introduce themselves:\nName, Race, Class, Brief Backstory, Current HP, and Starting Items.\nWhen all have spoken, I shall inscribe your names in the Book of Lore and begin your adventure.",
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false); // 🆕 upload state
  const { enqueue, enabled, setEnabled, pause, resume, playing } = useAudioQueue();
  const bottomRef = useRef<HTMLDivElement | null>(null);

  // ───────────────────────────────────────────────
  // 🧠 Send chat messages to Saga
  // ───────────────────────────────────────────────
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
          userMessage: userMsg.content,
        }),
      });
      const data = await res.json();
      if (data?.text) {
        setMessages((m) => [...m, { role: "assistant", content: data.text }]);
      }
      if (Array.isArray(data?.clips) && data.clips.length) {
        enqueue(
          data.clips.map((c: any) => ({
            character: c.character,
            url: c.url,
            voice_used: c.voice_used,
          }))
        );
      }
    } catch (e: any) {
      console.error("Saga send error:", e);
      setMessages((m) => [
        ...m,
        {
          role: "assistant",
          content:
            "The winds falter… I could not speak that line. Try again.",
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  // ───────────────────────────────────────────────
  // 🧾 Handle Character Sheet Upload
  // ───────────────────────────────────────────────
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/upload-character", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Upload failed");

      setMessages((m) => [
        ...m,
        {
          role: "assistant",
          content: `📜 I have received your character sheet **${file.name}** and will keep it in mind during our adventure.`,
        },
      ]);
    } catch (err: any) {
      console.error("Upload error:", err);
      setMessages((m) => [
        ...m,
        {
          role: "assistant",
          content: "⚠️ I could not read that parchment. Try again, adventurer.",
        },
      ]);
    } finally {
      setUploading(false);
      e.target.value = ""; // reset file input
    }
  };

  // Auto-scroll
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  // ───────────────────────────────────────────────
  // 💬 UI
  // ───────────────────────────────────────────────
  return (
    <div className="max-w-3xl mx-auto p-6">
      <header className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-semibold">Sága — AI Dungeon Master</h1>
        <div className="flex items-center gap-3 text-sm">
          <button
            className={clsx(
              "px-3 py-1 rounded-md border",
              enabled ? "border-green-500" : "border-gray-500"
            )}
            onClick={() => setEnabled(!enabled)}
            title={enabled ? "Sound enabled" : "Sound disabled"}
          >
            {enabled ? "Sound: ON" : "Sound: OFF"}
          </button>
          <button
            className="px-3 py-1 rounded-md border border-gray-500"
            onClick={() => (playing ? pause() : resume())}
          >
            {playing ? "Pause" : "Resume"}
          </button>
        </div>
      </header>

      <div className="bg-saga.card rounded-2xl p-4 space-y-4 min-h-[60vh]">
        {messages.map((m, i) => (
          <div
            key={i}
            className={m.role === "assistant" ? "text-saga.text" : "text-gray-300"}
          >
            <p className="whitespace-pre-wrap">{m.content}</p>
          </div>
        ))}
        {loading && <p className="text-sm text-gray-400">Sága composes the next line…</p>}
        <div ref={bottomRef} />
      </div>

      {/* 🆕 Upload Button Section */}
      <div className="mt-3 flex items-center gap-3">
        <label className="cursor-pointer bg-gray-700 text-white px-3 py-2 rounded-md hover:bg-gray-600 text-sm">
          {uploading ? "Uploading..." : "📜 Upload Character Sheet"}
          <input
            type="file"
            accept=".pdf,.txt,.docx"
            className="hidden"
            onChange={handleFileChange}
            disabled={uploading}
          />
        </label>
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
