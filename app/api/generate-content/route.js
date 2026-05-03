import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { queryVectors } from '@/lib/pinecone';
import { generateEmbeddings } from '@/lib/embeddings';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

export async function POST(req) {
    try {
        const { projectId, type, instructions } = await req.json();

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
                prompt = `Generate a marketing campaign pack including 3 Twitter posts, 1 LinkedIn post, and 1 Email template based on the following context.
                Format: Markdown.
                Context: ${context}`;
                break;
            default:
                return NextResponse.json({ error: "Invalid content type" }, { status: 400 });
        }

        const result = await model.generateContent(prompt);
        let output = result.response.text();

        // If it's supposed to be JSON, try to parse it (minimal cleanup)
        if (['flashcards', 'quiz', 'slides'].includes(type)) {
            try {
                const jsonMatch = output.match(/\[[\s\S]*\]/);
                if (jsonMatch) output = JSON.parse(jsonMatch[0]);
            } catch (e) {
                console.error("Failed to parse JSON output", e);
            }
        }

        return NextResponse.json({ output });

    } catch (error) {
        console.error("Generation Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
