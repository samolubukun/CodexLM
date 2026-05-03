export async function generateSpeech(text, voice = "aura-asteria-en") {
    console.log(`Generating speech with voice: ${voice}`);
    
    const response = await fetch("https://api.deepgram.com/v1/speak?model=" + voice, {
        method: "POST",
        headers: {
            "Authorization": `Token ${process.env.DEEPGRAM_API_KEY}`,
            "Content-Type": "application/json",
        },
        body: JSON.stringify({ text }),
    });

    if (!response.ok) {
        const errorText = await response.text();
        console.error("Deepgram REST Error:", errorText);
        throw new Error(`Deepgram Speak API failed: ${response.status} ${errorText}`);
    }

    const buffer = await response.arrayBuffer();
    return Buffer.from(buffer);
}
