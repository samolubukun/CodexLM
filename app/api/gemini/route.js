import { NextResponse } from 'next/server';

const API_URL = "https://text-gen-llama.samuel-olubukun.workers.dev/";
const API_KEY = process.env.CLOUDFLARE_LLM_API_KEY;

export async function POST(request) {
    try {
        const { messages } = await request.json();

        // Extract system prompt if present
        const systemMessage = messages.find(m => m.role === 'system');
        const systemPrompt = systemMessage?.content || 'You are a helpful AI assistant.';

        // Get the last user message as the prompt
        const lastUserMessage = messages.filter(m => m.role === 'user').pop();
        const prompt = lastUserMessage?.content || '';

        // Build history (excluding system message and last user message)
        const history = messages
            .filter(m => m.role !== 'system')
            .slice(0, -1)
            .map(m => ({
                role: m.role,
                content: m.content
            }));

        const res = await fetch(API_URL, {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${API_KEY}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                prompt: prompt,
                systemPrompt: systemPrompt,
                max_tokens: 500,
                history: history
            })
        });

        const data = await res.json();
        const text = data.response || "I'm sorry, I couldn't generate a response. Please try again.";

        return NextResponse.json({
            message: {
                role: 'assistant',
                content: text
            }
        });

    } catch (error) {
        console.error('Chat API error:', error);
        return NextResponse.json(
            { error: 'Failed to generate response' },
            { status: 500 }
        );
    }
}