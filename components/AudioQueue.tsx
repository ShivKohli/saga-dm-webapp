"use client";
import React, { createContext, useContext, useEffect, useRef, useState } from "react";
import type { VoiceClip } from "@/lib/voices";

type QueueItem = VoiceClip;
type Ctx = {
  enqueue: (items: QueueItem[] | QueueItem) => void;
  playing: boolean;
  pause: () => void;
  resume: () => void;
  clear: () => void;
  enabled: boolean;
  setEnabled: (b: boolean) => void;
};

const AudioCtx = createContext<Ctx | null>(null);

export function AudioProvider({ children }: { children: React.ReactNode }) {
  const queue = useRef<QueueItem[]>([]);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [playing, setPlaying] = useState(false);
  const [enabled, setEnabled] = useState(true);

  useEffect(() => {
    if (!audioRef.current) {
      audioRef.current = new Audio();
      audioRef.current.addEventListener("ended", () => {
        playNext();
      });
      audioRef.current.addEventListener("error", () => {
        playNext();
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const playNext = async () => {
    const next = queue.current.shift();
    if (!next || !enabled) {
      setPlaying(false);
      return;
    }
    if (!next.url) {
      playNext();
      return;
    }
    try {
      if (audioRef.current) {
        audioRef.current.src = next.url;
        await audioRef.current.play();
        setPlaying(true);
      }
    } catch {
      setPlaying(false);
    }
  };

  const enqueue = (items: QueueItem[] | QueueItem) => {
    const arr = Array.isArray(items) ? items : [items];
    queue.current.push(...arr);
    if (!playing) playNext();
  };

  const pause = () => {
    audioRef.current?.pause();
    setPlaying(false);
  };

  const resume = () => {
    if (audioRef.current && !playing && enabled) {
      audioRef.current.play();
      setPlaying(true);
    }
  };

  const clear = () => {
    queue.current = [];
    pause();
  };

  return (
    <AudioCtx.Provider value={{ enqueue, playing, pause, resume, clear, enabled, setEnabled }}>
      {children}
    </AudioCtx.Provider>
  );
}

export function useAudioQueue() {
  const ctx = useContext(AudioCtx);
  if (!ctx) throw new Error("useAudioQueue must be used within AudioProvider");
  return ctx;
}
