// middleware.js
// Edge middleware — runs before API requests hit the serverless functions.
// Rate limits sensitive endpoints by IP to prevent abuse and protect
// Claude API credits, Resend quota, and payment flows.

import { NextResponse } from "next/server";
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL,
  token: process.env.UPSTASH_REDIS_REST_TOKEN,
});

// Sliding window limits per IP per hour
const limiters = {
  "/api/contact":        new Ratelimit({ redis, limiter: Ratelimit.slidingWindow(5,  "1 h") }),
  "/api/checkout":       new Ratelimit({ redis, limiter: Ratelimit.slidingWindow(10, "1 h") }),
  "/api/promo/redeem":   new Ratelimit({ redis, limiter: Ratelimit.slidingWindow(5,  "1 h") }),
  "/api/promo/validate": new Ratelimit({ redis, limiter: Ratelimit.slidingWindow(10, "1 h") }),
  "/api/process-review": new Ratelimit({ redis, limiter: Ratelimit.slidingWindow(5,  "1 h") }),
};

export async function middleware(req) {
  const path = req.nextUrl.pathname;
  const limiter = limiters[path];
  if (!limiter) return NextResponse.next();

  const ip = req.headers.get("x-forwarded-for")?.split(",")[0].trim() ?? "anonymous";
  const { success, limit, remaining, reset } = await limiter.limit(ip);

  if (!success) {
    return new NextResponse(
      JSON.stringify({ error: "Too many requests. Please try again later." }),
      {
        status: 429,
        headers: {
          "Content-Type": "application/json",
          "X-RateLimit-Limit": String(limit),
          "X-RateLimit-Remaining": "0",
          "X-RateLimit-Reset": String(reset),
        },
      }
    );
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/api/contact",
    "/api/checkout",
    "/api/promo/redeem",
    "/api/promo/validate",
    "/api/process-review",
  ],
};
