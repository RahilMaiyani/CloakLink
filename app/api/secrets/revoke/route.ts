import { NextResponse } from "next/server";
import { redis } from "@/lib/redis";

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const linkIds: string[] | undefined = body?.linkIds;

        if (!Array.isArray(linkIds) || linkIds.length === 0) {
            return NextResponse.json(
                { error: "Valid linkIds array required." },
                { status: 400 },
            );
        }

        let masterId: string | null = null;
        for (const id of linkIds) {
            const raw = await redis.get<string | object>(`secret:link:${id}`);
            if (raw) {
                const data = typeof raw === "string" ? JSON.parse(raw) : raw;
                masterId = data.masterId;
                break;
            }
        }

        if (!masterId) {
            return NextResponse.json(
                { error: "Secret has already expired or been destroyed." },
                { status: 404 },
            );
        }

        const allRefs = await redis.smembers(`secret:refs:${masterId}`);
        const pipeline = redis.pipeline();

        const linksToDelete = new Set([...linkIds, ...allRefs]);
        for (const link of linksToDelete) {
            pipeline.del(`secret:link:${link}`);
        }

        pipeline.del(`secret:payload:${masterId}`);
        pipeline.del(`secret:refs:${masterId}`);

        await pipeline.exec();

        return NextResponse.json(
            { message: "Secret and all associated links successfully revoked." },
            { status: 200 },
        );
    } catch {
        return NextResponse.json(
            { error: "Failed to revoke links." },
            { status: 500 },
        );
    }
}
