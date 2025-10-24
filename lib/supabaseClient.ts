"use client";

import { createBrowserClient } from "@supabase/ssr";

// ✅ Always use NEXT_PUBLIC_ vars here — safe for browser use
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// Optional: lightweight fallback guard for local dev
if (!supabaseUrl || !supabaseAnonKey) {
  console.warn("⚠️ Missing Supabase public environment variables.");
}

// ✅ Create client with browser session persistence
export const supabase = createBrowserClient(supabaseUrl, supabaseAnonKey);
