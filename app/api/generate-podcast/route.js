import { NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { generateSpeech } from "@/lib/deepgram";
import { uploadFile } from "@/lib/s3";
import { queryVectors } from "@/lib/pinecone";
import { generateEmbeddings } from "@/lib/embeddings";
import { ConvexHttpClient } from "convex/browser";
import { api } from "@/convex/_generated/api";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL);

export async function POST(req) {
    try {
        const { projectId, jobId, sources } = await req.json();

        // 0. Update status to processing
        await convex.mutation(api.studio_jobs.updateJobStatus, {
            jobId,
            status: "processing"
        });

        // 1. Pull actual document content from Pinecone
        // Use a broad query to get a representative sample of the project's content
        const queryVector = await generateEmbeddings("main topics key ideas overview summary");
        const matches = await queryVectors(queryVector, 20, { projectId });

        if (!matches || matches.length === 0) {
            return NextResponse.json({ 
                error: "No document content found. Please upload and process some sources first." 
            }, { status: 400 });
        }

        // Build a clean content block from the retrieved chunks
        const contentText = matches
            .map(m => m.metadata?.text || "")
            .filter(t => t.trim().length > 20)
            .join("\n\n")
            .substring(0, 8000); // Keep within token limits

        // 2. Generate Script using Gemini with forced JSON output
        const model = genAI.getGenerativeModel({ 
            model: process.env.GEMINI_MODEL || "gemini-3.1-flash-lite-preview",
            generationConfig: {
                responseMimeType: "application/json",
            }
        });

        const prompt = `You are a podcast script writer. Based on the following document content, write an engaging 2-person podcast conversation between "Alex" (the host) and "Jordan" (the expert guest).

DOCUMENT CONTENT:
${contentText}

RULES:
- Make it conversational, natural, and engaging
- 8-12 turns total (back and forth)
- Each turn should be 1-3 sentences
- Alex asks questions and reacts; Jordan explains and elaborates
- Start with Alex welcoming listeners and introducing the topic

Return ONLY a valid JSON array in this exact format:
[
  {"speaker": "Alex", "text": "Welcome to..."},
  {"speaker": "Jordan", "text": "Thanks for having me..."}
]`;
        
        const result = await model.generateContent(prompt);
        const rawText = result.response.text();
        
        let script;
        try {
            script = JSON.parse(rawText);
        } catch (parseError) {
            // Try to extract JSON array from the response if wrapped in text
            const jsonMatch = rawText.match(/\[[\s\S]*\]/);
            if (jsonMatch) {
                script = JSON.parse(jsonMatch[0]);
            } else {
                throw new Error("Gemini did not return valid JSON for the podcast script.");
            }
        }

        if (!Array.isArray(script) || script.length === 0) {
            throw new Error("Generated script is empty or invalid.");
        }

        // 3. Generate Audio for each turn
        const audioChunks = [];
        for (const turn of script) {
            const voice = turn.speaker === "Alex" 
                ? (process.env.DEEPGRAM_HOST_MODEL || "aura-2-thalia-en") 
                : (process.env.DEEPGRAM_EXPERT_MODEL || "aura-2-arcas-en");
            const audio = await generateSpeech(turn.text, voice);
            if (audio) audioChunks.push(audio);
        }

        if (audioChunks.length === 0) {
            throw new Error("No audio was generated for the podcast.");
        }

        // 4. Combine and upload audio
        const fullAudio = Buffer.concat(audioChunks);
        const fileName = `podcast-${jobId}-${Date.now()}.wav`;
        const audioUrl = await uploadFile(fullAudio, fileName);

        // 5. Update Convex with completion
        await convex.mutation(api.studio_jobs.updateJobStatus, {
            jobId,
            status: "completed",
            output: {
                audioUrl,
                script,
                turnCount: script.length
            }
        });

        return NextResponse.json({ success: true, url: audioUrl, turnCount: script.length });

    } catch (error) {
        console.error("Podcast Generation Error:", error);
        
        const errorStr = error.message?.toLowerCase() || "";
        const isGeminiOverload = errorStr.includes("503") || 
                               errorStr.includes("429") || 
                               errorStr.includes("overloaded") ||
                               errorStr.includes("capacity");

        let errorMessage = "Failed to generate content. Agent is overloaded. Please try again later. Apologies.";
        
        if (isGeminiOverload) {
            errorMessage = "Failed to generate content. Gemini is receiving high volume. Please try again later. Apologies.";
        } else if (errorStr.includes("quota") || errorStr.includes("limit")) {
            errorMessage = "Failed to generate content. API quota exceeded. Please try again later. Apologies.";
        }

        return NextResponse.json({ 
            error: errorMessage,
            isOverloaded: isGeminiOverload 
        }, { status: isGeminiOverload ? 503 : 500 });
    }
}

