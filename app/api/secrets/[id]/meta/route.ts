import { NextResponse } from "next/server";
import { redis } from "@/lib/redis";
import { stat } from "fs";

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await context.params;
    const exists = await redis.exists(`secret:${id}`);

    if (!exists) {
      return NextResponse.json({ exists: false }, { status: 404 });
    }

    const ttlRemaining = await redis.ttl(`secret:${id}`);

    return NextResponse.json({
      exists: true,
      ttlRemaining: ttlRemaining > 0 ? ttlRemaining : 0,
    });
  } catch {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
