"use client";
import { useState, useRef, useEffect } from "react";
import { useAudioQueue } from "./AudioQueue";
import { supabase } from "@/lib/supabaseClient";
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
    } catch {
      setMessages((m) => [
        ...m,
        { role: "assistant", content: "📜 The quill falters… Try again." },
      ]);
    } finally {
      setLoading(false);
    }
  };

  // ───────────────────────────────────────────────
  // 📜 Handle Character Sheet Upload (RLS token)
  // ───────────────────────────────────────────────
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);

    try {
      const formData = new FormData();
      formData.append("file", file);

      // 🧾 Get Supabase access token (for RLS user_id mapping)
      const {
        data: { session },
      } = await supabase.auth.getSession();

      const res = await fetch("/api/upload-character", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${session?.access_token ?? ""}`,
        },
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
        {
          role: "assistant",
          content: "⚠️ The parchment was unreadable. Try again, adventurer.",
        },
      ]);
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  };

  // ───────────────────────────────────────────────
  // 🔁 Auto-scroll
  // ───────────────────────────────────────────────
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  // ───────────────────────────────────────────────
  // 💬 UI Layout
  // ───────────────────────────────────────────────
  return (
    <div className="w-full max-w-3xl mx-auto flex flex-col font-ui">
      {/* Controls */}
      <div className="flex items-center justify-end mb-4 gap-2 text-xs">
        <button
          className={clsx(
            "px-3 py-1 rounded-md border transition",
            enabled
              ? "border-saga-success text-saga-success hover:bg-saga-success/20"
              : "border-saga-subtext text-saga-subtext hover:bg-saga-panel"
          )}
          onClick={() => setEnabled(!enabled)}
        >
          {enabled ? "Sound ON" : "Sound OFF"}
        </button>
        <button
          className="px-3 py-1 rounded-md border border-saga-gold/40 hover:bg-saga-gold/20 transition"
          onClick={() => (playing ? pause() : resume())}
        >
          {playing ? "Pause" : "Resume"}
        </button>
        <button
          onClick={async () => {
            await fetch("/api/logout", { method: "POST" });
            window.location.href = "/";
          }}
          className="px-3 py-1 rounded-md border border-saga-danger text-saga-danger hover:bg-saga-danger hover:text-saga-parchment transition"
        >
          Logout
        </button>
      </div>

      {/* Message Scroll Area */}
      <div
        className="
          flex-1 relative rounded-2xl p-4 space-y-4 border border-saga-gold/30 shadow-glow overflow-y-auto min-h-[60vh]
          bg-saga-parchment text-saga-ink
        "
      >
        {/* parchment texture overlay */}
        <div
          className="absolute inset-0 pointer-events-none opacity-15 mix-blend-multiply rounded-2xl"
          style={{
            backgroundImage:
              "radial-gradient(circle at 30% 30%, rgba(0,0,0,0.05) 0%, transparent 70%), url('data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%22100%22 height=%22100%22%3E%3Crect width=%22100%22 height=%22100%22 fill=%22%23f5ecd6%22/%3E%3Ccircle cx=%2250%22 cy=%2250%22 r=%2248%22 fill=%22none%22 stroke=%22%23e0d8b8%22 stroke-width=%221%22/%3E%3C/svg%3E')",
            backgroundSize: "cover",
          }}
        />

        {messages.map((m, i) => (
          <div
            key={i}
            className={clsx(
              "relative p-3 rounded-lg whitespace-pre-wrap max-w-[90%] z-10",
              m.role === "assistant"
                ? "bg-saga-parchmentDark/90 text-saga-ink border border-saga-gold/40 shadow-md self-start"
                : "bg-saga-parchment text-saga-ink font-semibold border border-saga-gold/30 self-end ml-auto"
            )}
          >
            {m.content}
          </div>
        ))}

        {loading && (
          <p className="text-sm text-saga-subtext italic z-10">
            Sága dips her quill in ink…
          </p>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Upload & Input */}
      <div className="mt-4 flex flex-col sm:flex-row items-center gap-3 z-10">
        <label className="cursor-pointer bg-saga-gold/20 text-saga-gold px-3 py-2 rounded-md border border-saga-gold/40 hover:bg-saga-gold/30 transition text-sm">
          {uploading ? "Uploading…" : "📜 Upload Character Sheet"}
          <input
            type="file"
            accept=".pdf,.txt,.docx"
            className="hidden"
            onChange={handleFileChange}
            disabled={uploading}
          />
        </label>

        <div className="flex w-full gap-2">
          <input
            className="
              flex-1 rounded-lg border border-saga-gold/40
              bg-saga-parchment px-3 py-2 outline-none
              focus:border-saga-gold focus:ring-1 focus:ring-saga-gold
              placeholder-saga-subtext text-saga-ink
            "
            placeholder="Speak to Sága…"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && send()}
          />
          <button
            onClick={send}
            disabled={loading}
            className="bg-saga-gold text-saga-ink font-semibold px-5 py-2 rounded-lg hover:bg-saga-gold/80 disabled:opacity-50 transition"
          >
            Send
          </button>
        </div>
      </div>
    </div>
  );
}
