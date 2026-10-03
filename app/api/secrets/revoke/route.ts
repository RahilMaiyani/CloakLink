import { NextResponse } from "next/server";
import { redis } from "@/lib/redis";
import crypto from 'crypto';
import { stat } from "fs";

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const linkIds: string[] | undefined = body?.linkIds;
        const revocationToken: string | undefined = body?.revocationToken;

        if (!Array.isArray(linkIds) || linkIds.length === 0 || typeof revocationToken !== "string" || !revocationToken.trim()) {
            return NextResponse.json(
                { error: "Valid linkIds array and revocationToken are required." },
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

        const storedTokenHash = await redis.get<string>(`secret:revoke:${masterId}`);
        if (!storedTokenHash) {
            return NextResponse.json({ error: "Revocation record not found or secret already destroyed." }, { status: 404 });
        }

        const providedTokenHash = crypto.createHash("sha256").update(revocationToken.trim()).digest('hex');

        const storedBuf = Buffer.from(storedTokenHash, 'utf-8');
        const providedBuf = Buffer.from(providedTokenHash, 'utf-8');

        if (storedBuf.length !== providedBuf.length || !crypto.timingSafeEqual(storedBuf, providedBuf)) {
            return NextResponse.json({ error: "Unauthorized: Invalid revocation token." }, { status: 403 });
        }

        const allRefs = await redis.smembers(`secret:refs:${masterId}`);
        const pipeline = redis.pipeline();

        const linksToDelete = new Set([...linkIds, ...allRefs]);
        for (const link of linksToDelete) {
            pipeline.del(`secret:link:${link}`);
        }

        pipeline.del(`secret:payload:${masterId}`);
        pipeline.del(`secret:refs:${masterId}`);
        pipeline.del(`secret:revoke:${masterId}`);

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
