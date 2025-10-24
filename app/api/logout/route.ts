import { NextResponse } from "next/server";
import { createRouteHandlerClient } from "@supabase/ssr";
import type { NextRequest } from "next/server";

export async function POST(req: NextRequest) {
  const res = NextResponse.json({ success: true });
  const supabase = createRouteHandlerClient({ req, res });
  await supabase.auth.signOut();
  return res;
}
