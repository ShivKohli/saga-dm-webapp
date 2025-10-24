"use client";
export const dynamic = "force-dynamic";

import { useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useRouter } from "next/navigation";

export default function LandingPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setError(error.message);
    } else {
      router.push("/play"); // Redirects to chat after login
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-black text-white">
      <h1 className="text-4xl mb-4 font-bold">Sága DM</h1>
      <p className="mb-6 text-gray-400">The AI Dungeon Master awaits...</p>

      <form onSubmit={handleLogin} className="flex flex-col gap-3 w-72">
        <input
          className="p-2 rounded bg-gray-800 border border-gray-600"
          placeholder="Email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <input
          className="p-2 rounded bg-gray-800 border border-gray-600"
          placeholder="Password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        {error && <p className="text-red-400 text-sm">{error}</p>}
        <button
          type="submit"
          className="p-2 mt-2 bg-saga.accent text-white rounded hover:bg-saga.accent/80"
        >
          Login
        </button>
      </form>
    </div>
  );
}
