import { NextResponse } from "next/server";
import { uploadFile } from "@/lib/s3";

export async function POST(req) {
    try {
        const formData = await req.formData();
        const file = formData.get("file");
        const projectId = formData.get("projectId");

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
