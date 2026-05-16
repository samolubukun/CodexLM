import { NextResponse } from "next/server";
import { deleteVectors } from "@/lib/pinecone";
import { ConvexHttpClient } from "convex/browser";
import { api } from "@/convex/_generated/api";
import { stackServerApp } from "@/stack";

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL);

export async function POST(req) {
    try {
        const user = await stackServerApp.getUser();
        if (!user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { sourceId } = await req.json();

        if (!sourceId) {
            return NextResponse.json({ error: "Source ID is required" }, { status: 400 });
        }

        // Security: Verify project ownership
        const convexUser = await convex.query(api.users.getUserByStackId, { stackId: user.id });
        const source = await convex.query(api.sources.getSourceById, { sourceId });
        
        if (!source) {
            return NextResponse.json({ error: "Source not found" }, { status: 404 });
        }

        const project = await convex.query(api.projects.getProjectById, { projectId: source.projectId });
        if (!project || project.userId !== convexUser?._id) {
            return NextResponse.json({ error: "Unauthorized access to source" }, { status: 403 });
        }


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
        }

        // 2. Delete chunks from Convex
        try {
            await convex.mutation(api.chunks.deleteChunksBySource, { sourceId });
            console.log(`[Full Purge] Convex chunks deleted for source: ${sourceId}`);
        } catch (error) {
            console.error(`[Full Purge] Convex chunks deletion failed for ${sourceId}:`, error);
        }

        // 3. Delete display HTML from Convex
        try {
            await convex.mutation(api.sourceDisplay.deleteBySource, { sourceId });
            console.log(`[Full Purge] Convex sourceDisplay deleted for source: ${sourceId}`);
        } catch (error) {
            console.error(`[Full Purge] Convex sourceDisplay deletion failed for ${sourceId}:`, error);
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("[Full Purge] API Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
