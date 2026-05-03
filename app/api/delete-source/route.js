import { NextResponse } from "next/server";
import { deleteVectors } from "@/lib/pinecone";

export async function POST(req) {
    try {
        const { sourceId } = await req.json();

        if (!sourceId) {
            return NextResponse.json({ error: "Source ID is required" }, { status: 400 });
        }

        console.log(`[Full Purge] Starting cleanup for source: ${sourceId}`);

        // 1. Delete vectors from Pinecone
        try {
            await deleteVectors({
                sourceId: { "$eq": sourceId }
            });
            console.log(`[Full Purge] Pinecone vectors deleted for source: ${sourceId}`);
        } catch (error) {
            console.error(`[Full Purge] Pinecone deletion failed for ${sourceId}:`, error);
            // We continue anyway so the Convex record can be deleted
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("[Full Purge] API Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
