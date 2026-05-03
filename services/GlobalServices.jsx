import axios from "axios"
import { CoachingOptions } from "./Options";

// Meta Llama API integration for AI functionality (via Hugging Face)
export const AIModel = async (topic, coachingOption, lastTwoConversation) => {
    const option = CoachingOptions.find((item) => item.name == coachingOption);
    const PROMPT = (option.prompt).replace('{user_topic}', topic);

    const response = await axios.post('/api/gemini', {
        messages: [
            { role: 'system', content: PROMPT },
            ...lastTwoConversation
        ],
    });

    return response.data.message;
}

export const AIModelToGenerateFeedbackAndNotes = async (coachingOption, conversation) => {
    const option = CoachingOptions.find((item) => item.name == coachingOption);
    const PROMPT = option.summeryPrompt;

    const response = await axios.post('/api/gemini', {
        messages: [
            ...conversation,
            { role: 'system', content: PROMPT },
        ],
    });

    return response.data.message;
}
