// /lib/ratelimit.ts
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

/**
 * Initialize a Redis client using your Upstash REST credentials.
 * Make sure UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN
 * are set in your .env file (and in Vercel's environment variables).
 */
const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

/**
 * This rate limiter allows 5 requests per minute per IP.
 * You can adjust this number freely.
 */
export const rateLimiter = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(5, "1 m"),
  analytics: true,
  prefix: "saga_ratelimit",
});

/**
 * Helper that runs the check and returns true/false
 */
export async function limitRequest(ip: string) {
  const { success, remaining, reset } = await rateLimiter.limit(ip);
  return { success, remaining, reset };
}
