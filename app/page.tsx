"use client";
export const dynamic = "force-dynamic";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

export default function LoginPage() {
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
      console.error("Login failed:", error.message);
      setError("Invalid credentials. Please try again.");
      return;
    }

    console.log("✅ Login successful:", data);
    router.push("/play");
  };

  return (
    <main className="min-h-screen flex flex-col items-center justify-center bg-black text-white">
      <form onSubmit={handleLogin} className="flex flex-col gap-4 w-80">
        <h1 className="text-2xl font-bold mb-2 text-center">Login to Saga DM</h1>

        <input
          type="email"
          placeholder="Email"
          className="rounded-md p-2 bg-gray-900 border border-gray-600"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />

        <input
          type="password"
          placeholder="Password"
          className="rounded-md p-2 bg-gray-900 border border-gray-600"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />

        {error && <p className="text-red-500 text-sm">{error}</p>}

        <button
          type="submit"
          className="bg-saga.accent hover:bg-saga.accent/80 transition-colors text-white py-2 rounded-md"
        >
          Log In
        </button>
      </form>
    </main>
  );
}
