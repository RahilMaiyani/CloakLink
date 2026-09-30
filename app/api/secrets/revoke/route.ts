import { NextResponse } from "next/server";
import { redis } from "@/lib/redis";

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const linkIds: string[] | undefined = body?.linkIds;

        if (!linkIds) {
            return NextResponse.json(
                { error: "LinkId(s) not found." },
                { status: 404 },
            );
        }

        const rawLink = await redis.get<string | object>(`secret:link:${linkIds[0]}`);
        if (!rawLink) {
            return NextResponse.json({ error: "Link invalid or do not exists" }, { status: 404 });
        }

        const linkData = typeof rawLink === "string" ? JSON.parse(rawLink) : rawLink;
        const masterId = linkData.masterId;

        const pipeline = redis.pipeline();

        for (let link of linkIds) {
            pipeline.del(`secret:link:${link}`);
        }
        pipeline.del(`secret:payload:${masterId}`);
        pipeline.del(`secret:refs:${masterId}`);

        await pipeline.exec();

        return NextResponse.json({ message: "Links successfully revoked." }, { status: 200 });
    }
    catch {
        return NextResponse.json(
            { error: "Failed to revoke links" },
            { status: 500 },
        );

    }
}