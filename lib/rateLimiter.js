/**
 * Simple in-memory rate limiter with request queuing
 * Limits requests to stay within Gemini's free tier limits (15 RPM)
 */

class RateLimiter {
    constructor(maxRequestsPerMinute = 12) {
        // Use 12 instead of 15 to have a small buffer
        this.maxRequests = maxRequestsPerMinute;
        this.requests = [];
        this.queue = [];
        this.processing = false;
    }

    /**
     * Clean up old request timestamps (older than 1 minute)
     */
    cleanup() {
        const oneMinuteAgo = Date.now() - 60000;
        this.requests = this.requests.filter(timestamp => timestamp > oneMinuteAgo);
    }

    /**
     * Check if we can make a request right now
     */
    canMakeRequest() {
        this.cleanup();
        return this.requests.length < this.maxRequests;
    }

    /**
     * Record a request
     */
    recordRequest() {
        this.requests.push(Date.now());
    }

    /**
     * Get wait time until next available slot (in ms)
     */
    getWaitTime() {
        this.cleanup();
        if (this.requests.length < this.maxRequests) {
            return 0;
        }
        // Calculate when the oldest request will expire
        const oldestRequest = Math.min(...this.requests);
        const waitTime = (oldestRequest + 60000) - Date.now();
        return Math.max(0, waitTime + 100); // Add 100ms buffer
    }

    /**
     * Execute a function with rate limiting
     * Queues the request if rate limit is reached
     */
    async execute(fn) {
        return new Promise((resolve, reject) => {
            const task = { fn, resolve, reject };
            this.queue.push(task);
            this.processQueue();
        });
    }

    /**
     * Process queued requests
     */
    async processQueue() {
        if (this.processing || this.queue.length === 0) {
            return;
        }

        this.processing = true;

        while (this.queue.length > 0) {
            const waitTime = this.getWaitTime();

            if (waitTime > 0) {
                // Wait before processing next request
                await new Promise(resolve => setTimeout(resolve, waitTime));
            }

            const task = this.queue.shift();
            if (task) {
                this.recordRequest();
                try {
                    const result = await task.fn();
                    task.resolve(result);
                } catch (error) {
                    task.reject(error);
                }
            }
        }

        this.processing = false;
    }

    /**
     * Get current queue length
     */
    getQueueLength() {
        return this.queue.length;
    }

    /**
     * Get current request count in the last minute
     */
    getCurrentRequestCount() {
        this.cleanup();
        return this.requests.length;
    }
}

// Singleton instance for skin analysis API
export const skinAnalysisLimiter = new RateLimiter(12);

// Singleton instance for product usage guide (same 15 RPM limit total)
export const productUsageLimiter = new RateLimiter(10);
