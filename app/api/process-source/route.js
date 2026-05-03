import { NextResponse } from "next/server";
import mammoth from "mammoth";
import * as cheerio from "cheerio";
import { getTextExtractor } from "office-text-extractor";
import { createClient } from "@deepgram/sdk";
import { generateEmbeddings } from "@/lib/embeddings";
import { upsertVector } from "@/lib/pinecone";
import pdf from "pdf-parse-fork";
import { ConvexHttpClient } from "convex/browser";
import { api } from "@/convex/_generated/api";

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL);
const deepgram = createClient(process.env.DEEPGRAM_API_KEY);
const textExtractor = getTextExtractor();

async function extractPdfText(buffer) {
    try {
        const data = await pdf(buffer);
        // Clean up the text: remove excessive whitespace and non-printable characters
        return data.text
            .replace(/\r\n/g, '\n')
            .replace(/[^\x20-\x7E\n]/g, ' ') // Replace non-printable with space
            .replace(/\s+/g, ' ')            // Collapse all whitespace
            .trim();
    } catch (error) {
        console.error("PDF Extraction Error:", error);
        throw new Error("Failed to extract text from PDF");
    }
}

export async function POST(req) {
    let body;
    try {
        body = await req.json();
    } catch (e) {
        return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
    }

    const { sourceId, projectId, url, type, textContent, sourceName } = body;

    try {
        let extractedText = "";

        // 1. Text Extraction based on type
        if (type === 'pdf') {
            const response = await fetch(url);
            const buffer = Buffer.from(await response.arrayBuffer());
            extractedText = await extractPdfText(buffer);
        } else if (type === 'docx') {
            const response = await fetch(url);
            const buffer = Buffer.from(await response.arrayBuffer());
            const result = await mammoth.extractRawText({ buffer });
            extractedText = result.value;
        } else if (type === 'pptx') {
            const response = await fetch(url);
            const buffer = Buffer.from(await response.arrayBuffer());
            extractedText = await textExtractor.extractText({ input: buffer, type: 'buffer' });
        } else if (type === 'url') {
            const response = await fetch(url);
            const html = await response.text();
            const $ = cheerio.load(html);
            $('script, style').remove();
            extractedText = $('body').text().replace(/\s+/g, ' ').trim();
        } else if (type === 'audio') {
            const response = await deepgram.listen.prerecorded.transcribeUrl(
                { url: url },
                { smart_format: true, model: "nova-2" }
            );
            extractedText = response.result?.results?.channels[0]?.alternatives[0]?.transcript || "";
        } else if (type === 'text') {
            extractedText = textContent;
        } else if (type === 'youtube') {
            extractedText = "YouTube transcript extraction placeholder.";
        }

        if (!extractedText) {
            return NextResponse.json({ error: "No text could be extracted from this source." }, { status: 400 });
        }

        // 2. Chunking
        const chunks = [];
        const CHUNK_SIZE = 1000;
        const OVERLAP = 200;
        for (let i = 0; i < extractedText.length; i += CHUNK_SIZE) {
            chunks.push(extractedText.substring(i, i + CHUNK_SIZE + OVERLAP));
        }

        // 3. Vectorization
        for (let i = 0; i < chunks.length; i++) {
            const chunk = chunks[i];
            const embedding = await generateEmbeddings(chunk);
            const chunkId = `${sourceId}-chunk-${i}`;

            await upsertVector(chunkId, embedding, {
                projectId,
                sourceId,
                sourceName,
                text: chunk.substring(0, 20000),
                chunkIndex: i
            });
        }

        // 4. Mark Source as Completed
        await convex.mutation(api.sources.updateSourceStatus, {
            sourceId,
            status: "completed"
        });

        return NextResponse.json({ success: true, chunkCount: chunks.length });

    } catch (error) {
        console.error("Processing error:", error);
        
        if (sourceId) {
            await convex.mutation(api.sources.updateSourceStatus, {
                sourceId,
                status: "failed"
            }).catch(e => console.error("Failed to update status to failed:", e));
        }

        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
