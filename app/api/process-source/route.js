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
import { runWithConcurrency, withRetry } from "@/lib/concurrency";
import PDFParser from "pdf2json";

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL);
const deepgram = createClient(process.env.DEEPGRAM_API_KEY);
const textExtractor = getTextExtractor();

// ─── SHARED ANCHOR UTILITIES ───────────────────────────────────────────────

/**
 * Builds a map of { charOffset: chunkIndex } from sequential chunks.
 */
function buildChunkMap(chunks) {
    const map = {};
    const CHUNK_SIZE = 1000;

    for (let i = 0; i < chunks.length; i++) {
        map[i * CHUNK_SIZE] = i;
    }
    return map;
}

/**
 * Walks an HTML string and injects anchor spans at specific character offsets,
 * ignoring HTML tags when counting positions.
 */
function injectAnchorsByOffset(html, chunkMap) {
    let charOffset = 0;
    let result = "";
    let inTag = false;

    for (let i = 0; i < html.length; i++) {
        const char = html[i];

        // Handle HTML tags (don't count them towards charOffset)
        if (char === "<") inTag = true;
        if (char === ">") {
            inTag = false;
            result += char;
            continue;
        }

        if (!inTag) {
            // Check if a chunk starts at this EXACT character position
            if (chunkMap[charOffset] !== undefined) {
                const chunkIndex = chunkMap[charOffset];
                result += `<span data-chunk="${chunkIndex}" id="chunk-${chunkIndex}"></span>`;
            }
            charOffset++;
        }
        result += char;
    }
    return result;
}

// ─── UNIFIED PDF PROCESSING ────────────────────────────────────────────────

/**
 * PDF → { text, html, pageCount } using pdf2json.
 * Injects anchors inline during construction using character offsets.
 */
async function processPdfUnified(buffer, chunks) {
    const chunkMap = buildChunkMap(chunks);

    return new Promise((resolve, reject) => {
        const pdfParser = new PDFParser();

        pdfParser.on("pdfParser_dataReady", (pdfData) => {
            let fullText = "";
            let html = "";
            let charOffset = 0;
            const pages = pdfData.Pages || [];

            pages.forEach((page, pageIndex) => {
                const pageNum = pageIndex + 1;
                html += `<div data-page="${pageNum}" class="pdf-page">`;

                const items = (page.Texts || []).map((t) => ({
                    x: t.x,
                    y: Math.round(t.y * 10),
                    text: decodeURIComponent(t.R.map((r) => r.T).join("")),
                }));

                const columns = [];
                let currentColumn = [];
                items
                    .sort((a, b) => a.x - b.x)
                    .forEach((item) => {
                        if (
                            currentColumn.length === 0 ||
                            Math.abs(item.x - currentColumn[currentColumn.length - 1].x) < 8
                        ) {
                            currentColumn.push(item);
                        } else {
                            columns.push(currentColumn);
                            currentColumn = [item];
                        }
                    });
                if (currentColumn.length > 0) columns.push(currentColumn);
                columns.sort((a, b) => a[0].x - b[0].x);

                let pageText = "";
                columns.forEach((colItems) => {
                    colItems.sort((a, b) => a.y - b.y);
                    const lines = {};
                    colItems.forEach((item) => {
                        if (!lines[item.y]) lines[item.y] = [];
                        lines[item.y].push(item);
                    });

                    const sortedYs = Object.keys(lines)
                        .map(Number)
                        .sort((a, b) => a - b);
                    let colPara = "";

                    sortedYs.forEach((y) => {
                        const lineText = lines[y]
                            .sort((a, b) => a.x - b.x)
                            .map((i) => i.text)
                            .join(" ")
                            .trim();
                        if (!lineText) return;

                        // Build the anchor HTML for any chunk boundaries falling in this line
                        let anchors = "";
                        for (const [startChar, chunkIndex] of Object.entries(chunkMap)) {
                            const start = parseInt(startChar);
                            if (start >= charOffset && start < charOffset + lineText.length) {
                                anchors += `<span data-chunk="${chunkIndex}" id="chunk-${chunkIndex}"></span>`;
                            }
                        }

                        pageText += lineText + " ";
                        charOffset += lineText.length + 1;

                        const isHeading =
                            lineText.length < 60 &&
                            (lineText === lineText.toUpperCase() || !lineText.match(/[.,:;]$/));
                        if (isHeading) {
                            if (colPara) {
                                html += `<p>${colPara.trim()}</p>`;
                                colPara = "";
                            }
                            html += `<h3>${anchors}${lineText}</h3>`;
                        } else {
                            colPara += " " + anchors + lineText;
                        }
                    });
                    if (colPara.trim()) html += `<p>${colPara.trim()}</p>`;
                });

                html += `</div>`;
                fullText += pageText + "\n\n";
            });

            resolve({ text: fullText.trim(), html, pageCount: pages.length });
        });

        pdfParser.on("pdfParser_dataError", (err) => reject(err));
        pdfParser.parseBuffer(buffer);
    });
}

// ─── RAG PATH: Other formats ───────────────────────────────────────────────

async function extractDocxText(buffer) {
    const result = await mammoth.extractRawText({ buffer });
    return result.value;
}

// ─── DISPLAY PATH: HTML extraction with Offset Anchoring ────────────────────

async function extractDocxHtml(buffer, chunks) {
    const result = await mammoth.convertToHtml({ buffer });
    const chunkMap = buildChunkMap(chunks);
    const html = injectAnchorsByOffset(result.value, chunkMap);
    return { html };
}

async function extractUrlHtml(rawHtml, chunks) {
    const $ = cheerio.load(rawHtml);
    $("script, style, nav, footer, header, iframe, noscript, aside").remove();
    const mainHtml =
        $("main").html() ||
        $("article").html() ||
        $('[role="main"]').html() ||
        $("body").html() ||
        "";

    const chunkMap = buildChunkMap(chunks);
    const html = injectAnchorsByOffset(mainHtml, chunkMap);
    return { html };
}

function extractTextHtml(plainText, chunks) {
    const chunkMap = buildChunkMap(chunks);
    let charOffset = 0;
    let html = "";

    const paragraphs = plainText.split(/\n\n+/).filter((p) => p.trim());

    for (const para of paragraphs) {
        const trimmed = para.trim();

        // Build anchors for this paragraph
        let anchors = "";
        for (const [startChar, chunkIndex] of Object.entries(chunkMap)) {
            const start = parseInt(startChar);
            if (start >= charOffset && start < charOffset + trimmed.length) {
                anchors += `<span data-chunk="${chunkIndex}" id="chunk-${chunkIndex}"></span>`;
            }
        }

        html += `<p>${anchors}${escapeHtml(trimmed)}</p>\n`;
        charOffset += trimmed.length + 2; // +2 for the \n\n split
    }

    return { html };
}

/** Minimal HTML entity escaping */
function escapeHtml(str) {
    return str
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

// ─── Main Handler ────────────────────────────────────────────────────────────

export async function POST(req) {
    try {
        const { sourceId, projectId, url, type, sourceName, textContent } = await req.json();

        let extractedText = "";
        let _rawHtml = null;
        let _buffer = null;

        // ── 1. PRE-EXTRACTION ───────────────────────────────────────────────

        if (type === "pdf") {
            const response = await fetch(url);
            _buffer = Buffer.from(await response.arrayBuffer());
            // Need a temp extraction to build chunks first
            const unifiedTemp = await processPdfUnified(_buffer, []);
            extractedText = unifiedTemp.text;
        } else if (type === "docx") {
            const response = await fetch(url);
            _buffer = Buffer.from(await response.arrayBuffer());
            extractedText = await extractDocxText(_buffer);
        } else if (type === "url") {
            const response = await fetch(url);
            _rawHtml = await response.text();
            const $ = cheerio.load(_rawHtml);
            $("script, style").remove();
            extractedText = $("body").text().replace(/\s+/g, " ").trim();
        } else if (type === "audio") {
            const response = await deepgram.listen.prerecorded.transcribeUrl(
                { url: url },
                { smart_format: true, model: "nova-2" }
            );
            extractedText = response.result?.results?.channels[0]?.alternatives[0]?.transcript || "";
        } else if (type === "text") {
            extractedText = textContent;
        }

        if (!extractedText) {
            return NextResponse.json({ error: "No text found." }, { status: 400 });
        }

        // ── 2. CHUNKING (Sequential) ────────────────────────────────────────

        const chunks = [];
        const CHUNK_SIZE = 1000;
        const OVERLAP = 200;
        for (let i = 0; i < extractedText.length; i += CHUNK_SIZE) {
            chunks.push({
                text: extractedText.substring(i, i + CHUNK_SIZE + OVERLAP),
                chunkIndex: chunks.length,
            });
        }

        // ── 3. DISPLAY PATH (Offset-Based Anchoring) ────────────────────────

        let displayResult = { html: "" };
        if (type === "pdf") {
            displayResult = await processPdfUnified(_buffer, chunks);
        } else if (type === "docx") {
            displayResult = await extractDocxHtml(_buffer, chunks);
        } else if (type === "url") {
            displayResult = await extractUrlHtml(_rawHtml, chunks);
        } else {
            displayResult = extractTextHtml(extractedText, chunks);
        }

        // Save to Convex
        await convex.mutation(api.sourceDisplay.create, {
            sourceId,
            html: displayResult.html,
            pageCount: displayResult.pageCount || 0,
        });

        // ── 4. VECTORIZATION (UNCHANGED) ────────────────────────────────────

        await runWithConcurrency(chunks, 5, async (chunk, i) => {
            const chunkId = `${sourceId}-chunk-${i}`;
            const embedding = await withRetry(() => generateEmbeddings(chunk.text), 3, 1000);

            await withRetry(
                () =>
                    upsertVector(chunkId, embedding, {
                        projectId,
                        sourceId,
                        sourceName,
                        text: chunk.text.substring(0, 20000),
                        chunkIndex: i,
                    }),
                3,
                1500
            );

            await withRetry(
                () =>
                    convex.mutation(api.chunks.createChunk, {
                        sourceId,
                        text: chunk.text,
                        chunkIndex: i,
                        embeddingId: chunkId,
                    }),
                3,
                1000
            );
        });

        // ── 5. Mark Source as Completed ──────────────────────────────────────

        await convex.mutation(api.sources.updateSourceStatus, {
            sourceId,
            status: "processed",
        });

        return NextResponse.json({ success: true, chunkCount: chunks.length });
    } catch (error) {
        console.error("Processing error:", error);

        if (sourceId) {
            await convex
                .mutation(api.sources.updateSourceStatus, {
                    sourceId,
                    status: "failed",
                })
                .catch((e) => console.error("Failed to update status to failed:", e));
        }

        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
