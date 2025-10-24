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
    <main className="min-h-screen flex items-center justify-center bg-saga-gradient text-saga-text font-ui">
      <form
        onSubmit={handleLogin}
        className="
          card-saga
          flex flex-col gap-4
          w-80 sm:w-96
          p-6
          shadow-glow
          border border-saga-accent/30
        "
      >
        <h1 className="text-3xl font-saga text-center text-saga-accent mb-2">
          Sága DM
        </h1>
        <p className="text-center text-saga-subtext mb-4">
          Enter your credentials to begin your adventure
        </p>

        <input
          type="email"
          placeholder="Email"
          className="
            bg-saga-panel
            border border-saga-accent/30
            rounded-md
            p-2
            focus:border-saga-accent
            focus:ring-1 focus:ring-saga-accent
            outline-none
            placeholder-saga-subtext
          "
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />

        <input
          type="password"
          placeholder="Password"
          className="
            bg-saga-panel
            border border-saga-accent/30
            rounded-md
            p-2
            focus:border-saga-accent
            focus:ring-1 focus:ring-saga-accent
            outline-none
            placeholder-saga-subtext
          "
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />

        {error && (
          <p className="text-saga-danger text-sm text-center">{error}</p>
        )}

        <button
          type="submit"
          disabled={!email || !password}
          className="
            btn-saga
            mt-2
            disabled:opacity-50 disabled:cursor-not-allowed
            font-semibold
          "
        >
          Log In
        </button>
      </form>
    </main>
  );
}
