import { NextResponse } from "next/server";
import { redis } from "@/lib/redis";

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await context.params;
    const rawLink = await redis.get<string | object>(`secret:link:${id}`);

    if (!rawLink) {
      return NextResponse.json({ exists: false }, { status: 404 });
    }

    const linkData = typeof rawLink === "string" ? JSON.parse(rawLink) : rawLink;
    const ttlRemaining = await redis.ttl(`secret:link:${id}`);

    return NextResponse.json({
      exists: true,
      burnOnRead: linkData.burnOnRead ?? true,
      ttlRemaining: ttlRemaining > 0 ? ttlRemaining : 0,
    });
  } catch {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
