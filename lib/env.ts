// /lib/env.ts
import { z } from "zod";

/**
 * Define your expected environment variables.
 * Both public (NEXT_PUBLIC_*) and private vars can live here.
 */
const EnvSchema = z.object({
  // Public (exposed to client and middleware)
  NEXT_PUBLIC_SUPABASE_URL: z.string().url("NEXT_PUBLIC_SUPABASE_URL must be a valid URL"),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1, "Missing NEXT_PUBLIC_SUPABASE_ANON_KEY"),

  // Private (server-side only)
  OPENAI_API_KEY: z.string().min(1, "Missing OPENAI_API_KEY"),
  SUPABASE_URL: z.string().url("SUPABASE_URL must be a valid URL"),
  SUPABASE_ANON_KEY: z.string().min(1, "Missing SUPABASE_ANON_KEY"),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1, "Missing SUPABASE_SERVICE_ROLE_KEY"),
  SAGA_TTS_URL: z.string().url("SAGA_TTS_URL must be a valid URL"),

  // Optional
  UPSTASH_REDIS_REST_URL: z.string().url().optional(),
  UPSTASH_REDIS_REST_TOKEN: z.string().optional(),
  OPENAI_MODEL: z.string().optional(),
});

/**
 * Detect whether this code is running in the browser or on the server.
 */
const isServer = typeof window === "undefined";

/**
 * On the server → fully validate using Zod
 * On the client → skip validation, return a subset of public vars only
 */
export const env = (() => {
  if (isServer) {
    // ✅ Full validation at boot time
    const parsed = EnvSchema.safeParse(process.env);
    if (!parsed.success) {
      console.error("❌ Environment variable validation failed:");
      console.error(parsed.error.flatten().fieldErrors);
      throw new Error("Invalid or missing environment variables");
    }
    return parsed.data;
  } else {
    // 🧩 In browser — only expose NEXT_PUBLIC_ vars
    return {
      NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL!,
      NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    };
  }
})();
