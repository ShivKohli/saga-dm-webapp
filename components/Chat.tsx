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
  const [uploading, setUploading] = useState(false);
  const { enqueue, enabled, setEnabled, pause, resume, playing } = useAudioQueue();
  const bottomRef = useRef<HTMLDivElement | null>(null);

  // ───────────────────────────────
  // 🧠 Send chat message to Saga
  // ───────────────────────────────
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
        body: JSON.stringify({ history: messages, userMessage: userMsg.content }),
      });
      const data = await res.json();
      if (data?.text)
        setMessages((m) => [...m, { role: "assistant", content: data.text }]);
      if (Array.isArray(data?.clips) && data.clips.length) {
        enqueue(
          data.clips.map((c: any) => ({
            character: c.character,
            url: c.url,
            voice_used: c.voice_used,
          }))
        );
      }
    } catch (e) {
      console.error("Saga send error:", e);
      setMessages((m) => [
        ...m,
        {
          role: "assistant",
          content:
            "🌫️ The winds falter… I could not speak that line. Try again, adventurer.",
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  // ───────────────────────────────
  // 📜 Upload Character Sheet
  // ───────────────────────────────
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
    } catch (err) {
      console.error("Upload error:", err);
      setMessages((m) => [
        ...m,
        { role: "assistant", content: "⚠️ I could not read that parchment. Try again." },
      ]);
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  };

  // Auto-scroll
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  // ───────────────────────────────
  // 💬 UI Rendering
  // ───────────────────────────────
  return (
    <div className="w-full max-w-3xl mx-auto flex flex-col">
      {/* Header */}
      <header className="flex items-center justify-between mb-4 p-3 bg-saga-bg/80 border border-saga-accent/30 rounded-xl shadow-glow">
        <h1 className="font-saga text-xl text-saga-accent">
          Sága — AI Dungeon Master
        </h1>
        <div className="flex items-center gap-2 text-xs">
          <button
            className={clsx(
              "px-3 py-1 rounded-md border transition",
              enabled
                ? "border-saga-success text-saga-success hover:bg-saga-success/20"
                : "border-saga-subtext text-saga-subtext hover:bg-saga-panel"
            )}
            onClick={() => setEnabled(!enabled)}
          >
            {enabled ? "Sound: ON" : "Sound: OFF"}
          </button>
          <button
            className="px-3 py-1 rounded-md border border-saga-accent/30 hover:bg-saga-accent/20 transition"
            onClick={() => (playing ? pause() : resume())}
          >
            {playing ? "Pause" : "Resume"}
          </button>
          <button
            onClick={async () => {
              await fetch("/api/logout", { method: "POST" });
              window.location.href = "/";
            }}
            className="px-3 py-1 rounded-md border border-saga-danger text-saga-danger hover:bg-saga-danger hover:text-saga-text transition"
          >
            Logout
          </button>
        </div>
      </header>

      {/* Message Area */}
      <div className="flex-1 bg-saga-panel rounded-2xl p-4 space-y-4 border border-saga-accent/20 shadow-glow overflow-y-auto min-h-[60vh]">
        {messages.map((m, i) => (
          <div
            key={i}
            className={clsx(
              "p-3 rounded-lg whitespace-pre-wrap max-w-[90%]",
              m.role === "assistant"
                ? "bg-saga-bg/80 text-saga-text self-start border border-saga-accent/30 shadow-glow"
                : "bg-saga-accent/20 text-saga-gold self-end border border-saga-accent/30 ml-auto"
            )}
          >
            {m.content}
          </div>
        ))}
        {loading && (
          <p className="text-sm text-saga-subtext italic">
            Sága composes the next line…
          </p>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Upload + Input Controls */}
      <div className="mt-4 flex flex-col sm:flex-row items-center gap-3">
        {/* Upload */}
        <label className="cursor-pointer btn-saga text-sm flex items-center gap-2">
          {uploading ? "Uploading..." : "📜 Upload Character Sheet"}
          <input
            type="file"
            accept=".pdf,.txt,.docx"
            className="hidden"
            onChange={handleFileChange}
            disabled={uploading}
          />
        </label>

        {/* Input */}
        <div className="flex w-full gap-2">
          <input
            className="
              flex-1 rounded-lg border border-saga-accent/30 bg-saga-bg
              px-3 py-2 outline-none focus:border-saga-accent
              focus:ring-1 focus:ring-saga-accent placeholder-saga-subtext
            "
            placeholder="Speak to Sága…"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && send()}
          />
          <button
            onClick={send}
            disabled={loading}
            className="btn-saga px-5 py-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Send
          </button>
        </div>
      </div>
    </div>
  );
}
