"use client";

import { createBrowserClient } from "@supabase/ssr";
import { env } from "@/lib/env";

const supabaseUrl =
  env.NEXT_PUBLIC_SUPABASE_URL || env.SUPABASE_URL;
const supabaseAnonKey =
  env.NEXT_PUBLIC_SUPABASE_ANON_KEY || env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn("⚠️ Missing Supabase environment variables — skipping init.");
}

// ✅ Create client with browser session persistence
export const supabase = supabaseUrl && supabaseAnonKey
  ? createBrowserClient(supabaseUrl, supabaseAnonKey)
  : (null as any);
