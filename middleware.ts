import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { createSecretLimiter, burnSecretLimiter } from "@/lib/ratelimit";

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const forwardedFor = request.headers.get("x-forwarded-for");
  const realIp = request.headers.get("x-real-ip");
  const ip = forwardedFor
    ? forwardedFor.split(",")[0].trim()
    : realIp || "127.0.0.1";

  if (pathname === "/api/secrets" && request.method === "POST") {
    const { success, limit, remaining, reset } =
      await createSecretLimiter.limit(ip);

    if (!success) {
      const retryAfterSeconds = Math.max(
        1,
        Math.ceil((reset - Date.now()) / 1000),
      );
      return NextResponse.json(
        {
          error: `Rate limit reached. You can only create ${limit} secrets per minute. Try again in ${retryAfterSeconds}s.`,
        },
        {
          status: 429,
          headers: {
            "Retry-After": retryAfterSeconds.toString(),
            "X-RateLimit-Limit": limit.toString(),
            "X-RateLimit-Remaining": remaining.toString(),
            "X-RateLimit-Reset": reset.toString(),
          },
        },
      );
    }
  }

  if (pathname.endsWith("/burn") && request.method === "POST") {
    const { success, limit, remaining, reset } =
      await burnSecretLimiter.limit(ip);

    if (!success) {
      const retryAfterSeconds = Math.max(
        1,
        Math.ceil((reset - Date.now()) / 1000),
      );
      return NextResponse.json(
        {
          error: `Too many reveal requests. Please wait ${retryAfterSeconds}s before retrying.`,
        },
        {
          status: 429,
          headers: {
            "Retry-After": retryAfterSeconds.toString(),
            "X-RateLimit-Limit": limit.toString(),
            "X-RateLimit-Remaining": remaining.toString(),
            "X-RateLimit-Reset": reset.toString(),
          },
        },
      );
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/api/secrets", "/api/secrets/:path*/burn"],
};
