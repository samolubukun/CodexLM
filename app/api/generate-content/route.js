import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { queryVectors } from '@/lib/pinecone';
import { generateEmbeddings } from '@/lib/embeddings';
import { ConvexHttpClient } from "convex/browser";
import { api } from "@/convex/_generated/api";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL);

export async function POST(req) {
    try {
        const { projectId, type, instructions, jobId } = await req.json();

        if (jobId) {
            await convex.mutation(api.studio_jobs.updateJobStatus, {
                jobId,
                status: "processing"
            });
        }

        // 1. Fetch Context from Pinecone (RAG)
        // We'll use the instructions as a query to find relevant chunks
        const vector = await generateEmbeddings(instructions || "General summary of the project");
        const matches = await queryVectors(vector, 10, { projectId });
        const context = matches.map(m => m.metadata.text).join("\n---\n");

        const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash-lite" });

        let prompt = "";
        
        switch (type) {
            case 'flashcards':
                prompt = `Generate a set of 5-10 educational flashcards based on the following context. 
                Return the result as a JSON array of objects with 'question' and 'answer' fields.
                Context: ${context}`;
                break;
            case 'quiz':
                prompt = `Generate a 5-question multiple choice quiz based on the following context. 
                Return the result as a JSON array of objects with 'question', 'options' (array), and 'correctIndex' (number) fields.
                Context: ${context}`;
                break;
            case 'prd':
                prompt = `Generate a professional Product Requirement Document (PRD) based on the following context and instructions.
                Instructions: ${instructions}
                Format: Markdown.
                Context: ${context}`;
                break;
            case 'diagram':
                prompt = `Generate a Mermaid.js flowchart or sequence diagram that visualizes the processes or concepts described in the following context.
                Instructions: ${instructions}
                Return ONLY the mermaid code block (starting with graph TD or similar).
                Context: ${context}`;
                break;
            case 'slides':
                prompt = `Generate a slide deck outline (6-8 slides) based on the following context.
                Return the result as a JSON array of objects with 'title' and 'content' (bullet points) fields.
                Context: ${context}`;
                break;
            case 'marketing':
                prompt = `Generate a marketing campaign pack based on the following context. 
                Return the result as a JSON object with:
                - "targetAudience": string
                - "campaignGoal": string
                - "twitter": array of strings (3 posts)
                - "linkedin": string (long post)
                - "email": { "subject": string, "body": string }
                Context: ${context}`;
                break;
            default:
                return NextResponse.json({ error: "Invalid content type" }, { status: 400 });
        }

        const result = await model.generateContent(prompt);
        let output = result.response.text();

        // If it's supposed to be JSON, try to parse it (minimal cleanup)
        if (['flashcards', 'quiz', 'slides', 'marketing'].includes(type)) {
            try {
                const jsonMatch = output.match(/[\[\{][\s\S]*[\]\}]/);
                if (jsonMatch) output = JSON.parse(jsonMatch[0]);
            } catch (e) {
                console.error("Failed to parse JSON output", e);
            }
        }

        if (jobId) {
            await convex.mutation(api.studio_jobs.updateJobStatus, {
                jobId,
                status: "completed",
                output: output
            });
        }

        return NextResponse.json({ output });

    } catch (error) {
        console.error("Generation Error:", error);
        
        // Try to update job status to failed if we have a jobId
        try {
            const body = await req.json().catch(() => ({}));
            const jobId = body.jobId;
            if (jobId) {
                await convex.mutation(api.studio_jobs.updateJobStatus, {
                    jobId,
                    status: "failed",
                    output: { error: error.message }
                });
            }
        } catch (e) {
            console.error("Failed to update error status:", e);
        }

        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
