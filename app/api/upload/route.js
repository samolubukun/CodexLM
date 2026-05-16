import { NextResponse } from "next/server";
import { uploadFile } from "@/lib/s3";
import { stackServerApp } from "@/stack";
import { ConvexHttpClient } from "convex/browser";
import { api } from "@/convex/_generated/api";

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL);

export async function POST(req) {
    try {
        const user = await stackServerApp.getUser();
        if (!user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const formData = await req.formData();
        const file = formData.get("file");
        const projectId = formData.get("projectId");

        // Security: Verify project ownership
        const convexUser = await convex.query(api.users.getUserByStackId, { stackId: user.id });
        if (!convexUser) {
            return NextResponse.json({ error: "User not synced" }, { status: 403 });
        }

        const project = await convex.query(api.projects.getProjectById, { projectId });
        if (!project || project.userId !== convexUser._id) {
            return NextResponse.json({ error: "Unauthorized access to project" }, { status: 403 });
        }


        if (!file || !projectId) {
            return NextResponse.json({ error: "Missing file or projectId" }, { status: 400 });
        }

        const buffer = Buffer.from(await file.arrayBuffer());
        const fileName = `${Date.now()}-${file.name}`;
        
        // 1. Upload to S3 (DigitalOcean)
        const fileUrl = await uploadFile(buffer, fileName);

        // 2. The client will handle adding the record to Convex 
        // OR we can do it here if we had the convex client.
        // For simplicity and alignment with the client-side mutation, we return the URL.

        return NextResponse.json({ 
            success: true, 
            url: fileUrl, 
            name: file.name,
            type: file.type.includes("pdf") ? "pdf" : "file"
        });

    } catch (error) {
        console.error("Upload error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
