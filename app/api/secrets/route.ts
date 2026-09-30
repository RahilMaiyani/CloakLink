import { NextResponse } from "next/server";
import { redis } from "@/lib/redis";
import crypto from "crypto";

const MAX_CIPHERTEXT_LENGTH = 720_000;
const MAX_LINK_COUNT = 3;

export async function POST(request: Request) {
  try {
    const { ciphertext, iv, ttl, burnOnRead = true, linkCount = 1, passcodeHash = null, passcodeSalt = null } = await request.json();

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

    if (!Number.isInteger(linkCount) || linkCount < 1 || linkCount > MAX_LINK_COUNT) {
      return NextResponse.json({ error: "Link count invalid." }, { status: 400 });
    }

    const allowedTtls: number[] = [300, 3600, 86400, 604800];
    const ttlSeconds: number = allowedTtls.includes(ttl) ? ttl : 86400;

    const masterId = crypto.randomBytes(12).toString("base64url");
    const linkIds = Array.from({ length: linkCount }, () => crypto.randomBytes(12).toString('base64url'));

    const pipeline = redis.pipeline();

    pipeline.set(`secret:payload:${masterId}`, JSON.stringify({ ciphertext, iv }), { ex: ttlSeconds });

    for (const linkId of linkIds) {
      pipeline.set(`secret:link:${linkId}`, JSON.stringify({
        masterId,
        burnOnRead: Boolean(burnOnRead),
        passcodeHash: passcodeHash || null,
        passcodeSalt: passcodeSalt || null,
        strikes: 0,
      }), { ex: ttlSeconds });
    }
    // @ts-expect-error Upstash Redis pipeline sadd spread arguments
    pipeline.sadd(`secret:refs:${masterId}`, ...linkIds);
    pipeline.expire(`secret:refs:${masterId}`, ttlSeconds);

    await pipeline.exec();

    return NextResponse.json({ linkIds, ttl: ttlSeconds }, { status: 201 });

  } catch {
    return NextResponse.json(
      { error: "Failed to store secret" },
      { status: 500 },
    );
  }
}
