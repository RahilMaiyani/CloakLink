import { NextResponse } from "next/server";
import { redis } from "@/lib/redis";
import crypto from "crypto";

const MAX_CIPHERTEXT_LENGTH = 720_000;

export async function POST(request: Request) {
  try {
    const { ciphertext, iv, ttl } = await request.json();

    if (!ciphertext || !iv || !ttl) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 },
      );
    }

    if (ciphertext.length > MAX_CIPHERTEXT_LENGTH) {
      return NextResponse.json(
        { error: "Payload exceeds the 512 KB limit." },
        { status: 413 },
      );
    }

    const allowedTtls = [300, 3600, 86400, 604800];
    const ttlSeconds = allowedTtls.includes(ttl) ? ttl : 86400;

    const secretId = crypto.randomBytes(12).toString("base64url");

    await redis.set(`secret:${secretId}`, JSON.stringify({ ciphertext, iv }), {
      ex: ttlSeconds,
    });

    return NextResponse.json({ id: secretId }, { status: 201 });
  } catch {
    return NextResponse.json(
      { error: "Failed to store secret" },
      { status: 500 },
    );
  }
}
