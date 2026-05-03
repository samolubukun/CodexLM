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
            model: "gemini-2.5-flash-lite", 
            tools: availableTools.length > 0 ? [{ functionDeclarations: availableTools }] : [],
            systemInstruction: `You are CodexLM, an elite research assistant. 
            PRIMARY MISSION: You must treat the user's uploaded documents as the absolute source of truth.
            
            OPERATIONAL PROTOCOL:
            1. For ANY question, your first step should almost always be to call 'source_lookup' to see if the project files contain the answer.
            2. Only use 'web_search' if the information is explicitly NOT found in the documents OR if the user asks for external real-time data (like news or stock prices).
            3. If 'source_lookup' returns relevant information, prioritize it over general knowledge.
            
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
                    
                    const context = matches.map(m => m.metadata.text).join("\n---\n");
                    toolResults.push({
                        name: "source_lookup",
                        response: { content: context },
                        matches: matches // Store matches for citation extraction
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

        let text = response.text();
        
        // Smart fallback: If Gemini returned empty text after using a tool
        if (!text || text.trim().length === 0) {
            const lookupRes = toolResults.find(tr => tr.name === "source_lookup");

            if (lookupRes && lookupRes.response.content && lookupRes.response.content.trim().length > 50) {
                // We have real document content — force Gemini to summarize it properly
                const summaryModel = genAI.getGenerativeModel({ model: "gemini-2.5-flash-lite" });
                const summaryResult = await summaryModel.generateContent(
                    `The user asked: "${lastMessage}"\n\nHere is the relevant content found in their documents:\n\n${lookupRes.response.content}\n\nPlease write a clear, concise answer based only on this content. Do not mention that you searched documents — just answer naturally.`
                );
                text = summaryResult.response.text() || "I found some relevant content but had trouble summarizing it. Please try rephrasing your question.";
            } else if (!webSearchEnabled) {
                // No relevant docs found AND web search is off
                text = "I couldn't find anything in your documents about that. 💡 **Tip:** Enable **Web Search** (the 🌐 globe icon) in the chat to search the internet for real-time questions like this one.";
            } else {
                text = "I searched but couldn't find a specific answer. Could you please rephrase your question?";
            }
        }

        const citations = [];
        
        // Extract citations from toolResults
        if (toolResults && toolResults.length > 0) {
            const lookupResult = toolResults.find(tr => tr.name === "source_lookup");
            if (lookupResult && lookupResult.matches) {
                lookupResult.matches.forEach(m => {
                    if (m.metadata.sourceName && !citations.includes(m.metadata.sourceName)) {
                        citations.push(m.metadata.sourceName);
                    }
                });
            }
        }

        console.log("Final Response Text Length:", text.length);
        console.log("Citations found:", citations.length);

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
