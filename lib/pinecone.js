import { Pinecone } from '@pinecone-database/pinecone';

const pc = new Pinecone({
    apiKey: process.env.PINECONE_API_KEY
});

// Cache the index host so we only look it up once
let _indexHost = null;

async function getIndexHost() {
    if (_indexHost) return _indexHost;
    
    // Prefer the env var — avoids a flaky SDK control-plane call
    if (process.env.PINECONE_INDEX_HOST) {
        // Strip trailing slash, ensure no double https://
        _indexHost = process.env.PINECONE_INDEX_HOST.replace(/\/$/, '');
        console.log("Pinecone host from env:", _indexHost);
        return _indexHost;
    }

    // Fallback: resolve via SDK (requires network to Pinecone control plane)
    const description = await pc.describeIndex(process.env.PINECONE_INDEX_NAME);
    // SDK returns host without protocol, so we add it
    _indexHost = `https://${description.host}`;
    console.log("Pinecone index host resolved via SDK:", _indexHost);
    return _indexHost;
}

export async function upsertVector(id, embedding, metadata) {
    // Ensure embedding is a flat array of numbers
    let values = Array.isArray(embedding) ? embedding : [];

    // Handle nested array [[...]] from some embedding APIs
    if (values.length > 0 && Array.isArray(values[0])) {
        values = values[0];
    }

    if (!values || values.length === 0) {
        throw new Error(`Invalid or empty embedding values for id: ${id}`);
    }

    const host = await getIndexHost();
    const record = { id, values, metadata };

    console.log(`Upserting to Pinecone REST [${id}]: ${values.length} dims`);

    const response = await fetch(`${host}/vectors/upsert`, {
        method: 'POST',
        headers: {
            'Api-Key': process.env.PINECONE_API_KEY,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ vectors: [record] }),
    });

    if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Pinecone REST upsert failed (${response.status}): ${errorText}`);
    }

    const result = await response.json();
    console.log(`Pinecone upsert success [${id}]:`, result);
    return result;
}

export async function queryVectors(vector, topK = 5, filter = {}) {
    const host = await getIndexHost();

    const response = await fetch(`${host}/query`, {
        method: 'POST',
        headers: {
            'Api-Key': process.env.PINECONE_API_KEY,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            vector,
            topK,
            includeMetadata: true,
            filter: Object.keys(filter).length > 0 ? filter : undefined,
        }),
    });

    if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Pinecone REST query failed (${response.status}): ${errorText}`);
    }

    const result = await response.json();
    return result.matches || [];
}

export async function deleteVectors(filter) {
    const host = await getIndexHost();

    console.log(`Deleting vectors from Pinecone with filter:`, filter);

    const response = await fetch(`${host}/vectors/delete`, {
        method: 'POST',
        headers: {
            'Api-Key': process.env.PINECONE_API_KEY,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ filter }),
    });

    if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Pinecone REST delete failed (${response.status}): ${errorText}`);
    }

    return await response.json();
}
