import { NextResponse } from "next/server";
import { redis } from "@/lib/redis";
import crypto from "crypto";

export async function POST(request: Request) {
  try {
    const { ciphertext, iv, ttl } = await request.json();

    if (!ciphertext || !iv || !ttl) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 },
      );
    }

    const allowedTtl = [300, 3600, 86400, 604800];
    const ttlSeconds = allowedTtl.includes(ttl) ? parseInt(ttl) : 86400;

    const secretId = crypto.randomBytes(12).toString("base64url");

    await redis.set(`secret:${secretId}`, JSON.stringify({ ciphertext, iv }), {
      ex: ttlSeconds,
    });

    return NextResponse.json({ id: secretId }, { status: 200 });
  } catch (e: any) {
    return NextResponse.json(
      { error: "Failed to store secret" },
      { status: 500 },
    );
  }
}
