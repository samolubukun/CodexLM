import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { langSearch } from '@/lib/langsearch';
import { queryVectors } from '@/lib/pinecone';
import { generateEmbeddings } from '@/lib/embeddings';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

export async function POST(req) {
    try {
        const { messages, projectId, sourceId, projectMemory, webSearchEnabled } = await req.json();

        const availableTools = [];

        // Always include source_lookup
        availableTools.push({
            name: "source_lookup",
            description: "Search inside the user's uploaded documents and sources for specific information.",
            parameters: {
                type: "object",
                properties: {
                    query: { type: "string", description: "The semantic search query for the documents." }
                },
                required: ["query"]
            }
        });

        // Only include web_search if enabled in UI
        if (webSearchEnabled) {
            availableTools.push({
                name: "web_search",
                description: "Search the internet for real-time information, news, and external facts.",
                parameters: {
                    type: "object",
                    properties: {
                        query: { type: "string", description: "The search query." }
                    },
                    required: ["query"]
                }
            });
        }

        const model = genAI.getGenerativeModel({
            model: "gemini-3.1-flash-lite-preview",
            tools: availableTools.length > 0 ? [{ functionDeclarations: availableTools }] : [],
            systemInstruction: `You are CodexLM, an elite research assistant. 
            PRIMARY MISSION: You must treat the user's uploaded documents as the absolute source of truth.
            
            OPERATIONAL PROTOCOL:
            1. For ANY question, your first step should almost always be to call 'source_lookup' to see if the project files contain the answer.
            2. Only use 'web_search' if the information is explicitly NOT found in the documents.
            3. If 'source_lookup' returns relevant information, prioritize it.
            
            CITATIONS:
            - When using information from the documents, you MUST include a citation in the format [n] where n is the index of the source in the provided context.
            - Example: "The company's revenue grew by 20% in 2023 [1]."
            - You can use multiple citations like [1][2] if multiple sources support the statement.
            - If you use 'web_search', you do not need to provide [n] citations for those facts, but still mention the source if possible.
            
            Project ID: ${projectId}
            Project Memory/Instructions: ${projectMemory || "None"}`
        });

        const chat = model.startChat({
            history: messages.slice(0, -1).map(m => ({
                role: m.role === 'user' ? 'user' : 'model',
                parts: [{ text: m.content }]
            })),
        });

        const lastMessage = messages[messages.length - 1].content;
        let result = await chat.sendMessage(lastMessage);
        let response = await result.response;

        const calls = response.functionCalls();
        let toolResults = [];
        if (calls) {
            for (const call of calls) {
                if (call.name === "web_search") {
                    const searchRes = await langSearch(call.args.query, process.env.LANGSEARCH_API_KEY);
                    toolResults.push({
                        name: "web_search",
                        response: { content: searchRes }
                    });
                } else if (call.name === "source_lookup") {
                    console.log("AI calling source_lookup with query:", call.args.query);
                    const vector = await generateEmbeddings(call.args.query);
                    const matches = await queryVectors(vector, 5, { projectId });
                    console.log(`Source lookup found ${matches.length} matches`);

                    // Format context with [n] labels for the model to cite
                    const context = matches.map((m, i) => `Source [${i + 1}]:\nContent: ${m.metadata.text}\nSource Name: ${m.metadata.sourceName}`).join("\n---\n");

                    toolResults.push({
                        name: "source_lookup",
                        response: { content: context },
                        matches: matches // Store matches for citation extraction later
                    });
                }
            }

            result = await chat.sendMessage(toolResults.map(tr => ({
                functionResponse: {
                    name: tr.name,
                    response: tr.response
                }
            })));
            response = await result.response;
        }

        let text = "";
        try {
            text = response.text();
        } catch (e) {
            console.error("Error getting text from response:", e);
            // Try to get text from candidates if text() fails
            if (response.candidates?.[0]?.content?.parts?.[0]?.text) {
                text = response.candidates[0].content.parts[0].text;
            }
        }
        
        // Smart fallback: If Gemini returned empty text after using a tool
        if (!text || text.trim().length === 0) {
            const lookupRes = toolResults.find(tr => tr.name === "source_lookup");
            const webRes = toolResults.find(tr => tr.name === "web_search");

            if (lookupRes && lookupRes.response.content && lookupRes.response.content.trim().length > 50) {
                // We have real document content — force Gemini to summarize it properly
                const summaryModel = genAI.getGenerativeModel({ model: "gemini-3.1-flash-lite-preview" });
                const summaryResult = await summaryModel.generateContent(
                    `The user asked: "${lastMessage}"\n\nHere is the relevant content found in their documents:\n\n${lookupRes.response.content}\n\nPlease write a clear, concise answer based only on this content. Include citations like [1], [2] based on the "Source [n]" labels provided above.`
                );
                text = summaryResult.response.text() || "I found relevant information in your documents but had trouble formatting a response.";
            } else if (webRes && webRes.response.content) {
                text = "I found some information online: " + webRes.response.content.substring(0, 500) + "...";
            } else if (!webSearchEnabled) {
                text = "I checked your documents but couldn't find a specific answer to that question.";
            } else {
                text = "I searched your documents and the web but couldn't find a definitive answer.";
            }
        }

        // Citation Extraction Logic
        const citations = [];
        const sourceLookup = toolResults.find(tr => tr.name === "source_lookup");

        if (sourceLookup && sourceLookup.matches) {
            // Find all [n] or [n, m] patterns in the text
            const bracketMatches = [...text.matchAll(/\[([\d,\s]+)\]/g)];
            const indices = [];
            
            bracketMatches.forEach(match => {
                const parts = match[1].split(',').map(s => parseInt(s.trim())).filter(n => !isNaN(n));
                indices.push(...parts);
            });
            
            const uniqueIndices = [...new Set(indices)];

            uniqueIndices.forEach(index => {
                const match = sourceLookup.matches[index - 1];
                if (match) {
                    citations.push({
                        index: index,
                        sourceId: match.metadata.sourceId,
                        sourceName: match.metadata.sourceName,
                        text: match.metadata.text,
                        chunkIndex: match.metadata.chunkIndex,
                        pageNumber: match.metadata.pageNumber
                    });
                }
            });
        }

        return NextResponse.json({
            message: {
                role: 'assistant',
                content: text,
                citations: citations
            }
        });

    } catch (error) {
        console.error("Chat Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
