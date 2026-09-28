import { NextResponse } from "next/server";
import { redis } from "@/lib/redis";

export async function POST(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await context.params;

    const data = await redis.getdel<string>(`secret:${id}`);

    if (!data) {
      return NextResponse.json(
        { error: "Secret has already self-destructed or expired." },
        { status: 404 },
      );
    }

    const payload = typeof data === "string" ? JSON.parse(data) : data;

    return NextResponse.json(
      { ciphertext: payload.ciphertext, iv: payload.iv },
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
