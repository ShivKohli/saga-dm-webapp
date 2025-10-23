// /lib/vectorDB.ts
import OpenAI from "openai";
import { createClient } from "@supabase/supabase-js";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
});

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_ANON_KEY! // NOT the service role key — use anon for client-side access
);

// Function to embed text using OpenAI
export async function embedText(text: string) {
  const response = await openai.embeddings.create({
    model: "text-embedding-3-small",
    input: text,
  });
  return response.data[0].embedding;
}

// Function to query Supabase for relevant lore
export async function queryKnowledgeBase(query: string, matchThreshold = 0.8, matchCount = 5) {
  // Step 1: Embed the user query
  const embedding = await embedText(query);

  // Step 2: Call your SQL function in Supabase
  const { data, error } = await supabase.rpc("match_saga_knowledge", {
    query_embedding: embedding,
    match_threshold: matchThreshold,
    match_count: matchCount,
  });

  if (error) {
    console.error("❌ Supabase error:", error);
    return [];
  }

  return data || [];
}
