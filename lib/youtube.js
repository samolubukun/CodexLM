/**
 * Fetches transcript for a given YouTube URL using Supadata AI.
 * Handles both immediate responses and asynchronous jobs with polling.
 * @param {string} youtubeUrl - The full YouTube video URL.
 * @returns {Promise<string>} - The transcript text.
 */
export async function getYouTubeTranscript(youtubeUrl) {
    const apiKey = process.env.SUPADATA_API_KEY;
    const apiUrl = 'https://api.supadata.ai/v1/transcript';
    
    if (!apiKey) {
        throw new Error("SUPADATA_API_KEY is not defined in environment variables.");
    }

    try {
        // We use text=true to get a plain text transcript directly
        const initialResponse = await fetch(`${apiUrl}?url=${encodeURIComponent(youtubeUrl)}&text=true`, {
            headers: {
                'x-api-key': apiKey
            }
        });

        if (initialResponse.status === 202) {
            // Asynchronous job started
            const { jobId } = await initialResponse.json();
            console.log(`Supadata job started: ${jobId}. Polling for results...`);
            return await pollJobStatus(jobId, apiKey);
        }

        if (!initialResponse.ok) {
            const errorData = await initialResponse.json().catch(() => ({}));
            throw new Error(errorData.error || `Supadata Error: ${initialResponse.statusText}`);
        }

        const data = await initialResponse.json();
        return data.content || JSON.stringify(data);

    } catch (error) {
        console.error("YouTube Transcript Error (Supadata):", error);
        throw error;
    }
}

/**
 * Polls the job status until completion or failure.
 * @param {string} jobId - The Supadata job ID.
 * @param {string} apiKey - The Supadata API key.
 * @returns {Promise<string>}
 */
async function pollJobStatus(jobId, apiKey) {
    const pollUrl = `https://api.supadata.ai/v1/transcript/${jobId}`;
    let attempts = 0;
    const maxAttempts = 120; // 2 minutes with 1s interval

    while (attempts < maxAttempts) {
        await new Promise(resolve => setTimeout(resolve, 1000)); // Poll every 1 second
        attempts++;

        try {
            const response = await fetch(pollUrl, {
                headers: {
                    'x-api-key': apiKey
                }
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.error || `Polling Error: ${response.statusText}`);
            }

            const data = await response.json();
            
            if (data.status === 'completed') {
                return data.content;
            } else if (data.status === 'failed') {
                throw new Error(data.error || "Supadata job failed without a specific error message.");
            }
            
            // If queued or active, continue polling
        } catch (error) {
            console.error(`Error polling job ${jobId}:`, error);
            throw error;
        }
    }

    throw new Error("Supadata job timed out after 2 minutes.");
}
