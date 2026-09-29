import { NextResponse } from "next/server";
import { redis } from "@/lib/redis";

export async function POST(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await context.params;

    const rawLink = await redis.get<string | object>(`secret:link:${id}`);

    if (!rawLink) {
      return NextResponse.json(
        { error: "Secret has already self-destructed or expired." },
        { status: 404 },
      );
    }

    const linkData = typeof rawLink === "string" ? JSON.parse(rawLink) : rawLink;

    const { masterId, burnOnRead } = linkData;

    if (burnOnRead) {
      await redis.del(`secret:link:${id}`);
      await redis.srem(`secret:refs:${masterId}`, id);
    }

    const rawPayload = await redis.get<string | object>(`secret:payload:${masterId}`);

    if (!rawPayload) {
      return NextResponse.json({ error: "Master payload expired or destroyed." }, { status: 404 });
    }
    const payload = typeof rawPayload === "string" ? JSON.parse(rawPayload) : rawPayload;

    if (burnOnRead) {
      const remaining = await redis.scard(`secret:refs:${masterId}`);
      if (remaining === 0) {
        await redis.del(`secret:payload:${masterId}`);
        await redis.del(`secret:refs:${masterId}`);
      }
    }


    return NextResponse.json(
      { ciphertext: payload.ciphertext, iv: payload.iv, burnOnRead: Boolean(burnOnRead) },
      {
        headers: {
          "Cache-Control": "no-store, no-cache, must-revalidate, max-age=0",
          Pragma: "no-cache",
        },
      },
    );
  } catch {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
