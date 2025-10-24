// /lib/env.ts
import { z } from "zod";

/**
 * Define which environment variables are required
 * and what type each should have.
 */
const EnvSchema = z.object({
  // Public vars used by middleware and client
  NEXT_PUBLIC_SUPABASE_URL: z.string().url("NEXT_PUBLIC_SUPABASE_URL must be valid"),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z
    .string()
    .min(1, "Missing NEXT_PUBLIC_SUPABASE_ANON_KEY"),

  // Server-side secrets
  OPENAI_API_KEY: z.string().min(1, "Missing OPENAI_API_KEY"),
  SUPABASE_URL: z.string().url("SUPABASE_URL must be a valid URL"),
  SUPABASE_ANON_KEY: z.string().min(1, "Missing SUPABASE_ANON_KEY"),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1, "Missing SUPABASE_SERVICE_ROLE_KEY"),
  SAGA_TTS_URL: z.string().url("SAGA_TTS_URL must be a valid URL"),

  UPSTASH_REDIS_REST_URL: z.string().url().optional(),
  UPSTASH_REDIS_REST_TOKEN: z.string().optional(),
  OPENAI_MODEL: z.string().optional(),
});

/**
 * Parse the current process.env using Zod.
 * This throws a clear error (and halts boot) if something is missing.
 */
export const env = (() => {
  const parsed = EnvSchema.safeParse(process.env);
  if (!parsed.success) {
    console.error("❌ Environment variable validation failed:");
    console.error(parsed.error.flatten().fieldErrors);
    throw new Error("Invalid or missing environment variables");
  }
  return parsed.data;
})();
