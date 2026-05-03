/**
 * Utility for managing and rotating Gemini API keys
 */

class GeminiKeyManager {
    constructor() {
        this.skinAnalysisIndex = 0;
    }

    /**
     * Get all available Gemini API keys from environment
     * @returns {string[]}
     */
    getKeys() {
        const keysString = process.env.GEMINI_API_KEY || '';
        return keysString.split(',').map(key => key.trim()).filter(key => key.length > 0);
    }

    /**
     * For skin scan/analysis: rotates between ALL available keys
     * @returns {string|null}
     */
    getSkinAnalysisKey() {
        const keys = this.getKeys();
        if (keys.length === 0) return null;

        // Rotate through all available keys
        const key = keys[this.skinAnalysisIndex % keys.length];
        this.skinAnalysisIndex++;
        return key;
    }

    /**
     * Get prioritized list of all skin analysis keys for fallback retries
     * @returns {string[]}
     */
    getSkinAnalysisKeys() {
        const keys = this.getKeys();
        if (keys.length === 0) return [];

        // Return keys starting from the current rotation index
        const prioritized = [];
        for (let i = 0; i < keys.length; i++) {
            prioritized.push(keys[(this.skinAnalysisIndex + i) % keys.length]);
        }
        return prioritized;
    }

    /**
     * For product usage guide: uses the third key
     * @returns {string|null}
     */
    getProductUsageKey() {
        const keys = this.getKeys();
        if (keys.length === 0) return null;

        // Use 3rd key if available, else fallback down
        if (keys.length >= 3) return keys[2];
        if (keys.length >= 2) return keys[1];
        return keys[0];
    }

    /**
     * Get prioritized list of keys for product usage guide (starting from 3rd key)
     * @returns {string[]}
     */
    getProductUsageKeys() {
        const keys = this.getKeys();
        if (keys.length === 0) return [];

        const prioritized = [];
        const startIndex = keys.length >= 3 ? 2 : (keys.length >= 2 ? 1 : 0);

        for (let i = 0; i < keys.length; i++) {
            prioritized.push(keys[(startIndex + i) % keys.length]);
        }
        return prioritized;
    }

    /**
     * For chatbots: uses the fourth key mostly, and third
     * Current implementation returns an array of priority keys for retry logic
     * @returns {string[]}
     */
    getChatKeys() {
        const keys = this.getKeys();
        if (keys.length === 0) return [];

        const chatKeys = [];

        // 4th key is priority
        if (keys.length >= 4) {
            chatKeys.push(keys[3]);
        }

        // 3rd key is fallback
        if (keys.length >= 3) {
            chatKeys.push(keys[2]);
        }

        // If none of those, use whatever is available
        if (chatKeys.length === 0) {
            chatKeys.push(keys[0]);
        }

        return chatKeys;
    }
}

// Export singleton instance
export const geminiKeyManager = new GeminiKeyManager();
export default geminiKeyManager;
