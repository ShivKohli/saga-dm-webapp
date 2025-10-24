import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(req: NextRequest) {
  const session = req.cookies.get("sb-access-token")?.value; // Supabase stores the JWT here
  const pathname = req.nextUrl.pathname;

  // Redirect unauthenticated users trying to access /play
  if (pathname.startsWith("/play") && !session) {
    const redirectUrl = req.nextUrl.clone();
    redirectUrl.pathname = "/";
    return NextResponse.redirect(redirectUrl);
  }

  return NextResponse.next();
}
