export async function generateEmbeddings(text) {
    const response = await fetch(
        `https://api.cloudflare.com/client/v4/accounts/${process.env.CLOUDFLARE_ACCOUNT_ID}/ai/run/@cf/qwen/qwen3-embedding-0.6b`,
        {
            method: "POST",
            headers: {
                Authorization: `Bearer ${process.env.CLOUDFLARE_API_KEY}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ text }),
        }
    );

    if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Cloudflare AI HTTP ${response.status}: ${errorText}`);
    }

    const result = await response.json();
    console.log("Cloudflare embedding response:", JSON.stringify(result));

    const data = result.data ?? result.result?.data;
    if (!data || !Array.isArray(data) || data.length === 0) {
        throw new Error(`Cloudflare AI returned empty embedding: ${JSON.stringify(result)}`);
    }

    const embeddingArray = data[0];
    if (!Array.isArray(embeddingArray)) {
        throw new Error(`Invalid embedding format: expected array, got ${typeof embeddingArray}`);
    }

    return embeddingArray;
}
