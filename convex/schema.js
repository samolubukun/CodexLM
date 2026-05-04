import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
    users: defineTable({
        name: v.string(),
        email: v.string(),
        credits: v.number(),
        stackId: v.string(), // ID from Stack Auth
    }).index("by_email", ["email"]).index("by_stackId", ["stackId"]),

    projects: defineTable({
        userId: v.id('users'),
        name: v.string(),
        costs: v.optional(v.any()), // JSON storage for tracking costs
        memory: v.optional(v.any()), // Persistent project context
    }).index("by_user", ["userId"]),

    sources: defineTable({
        projectId: v.id('projects'),
        name: v.string(),
        type: v.string(), // pdf, url, youtube, audio, etc.
        url: v.optional(v.string()), // URL for web/youtube/audio
        storageKey: v.optional(v.string()), // Key for DigitalOcean Spaces
        status: v.string(), // uploaded, processing, ready, error
        metadata: v.optional(v.any()),
    }).index("by_project", ["projectId"]),

    chunks: defineTable({
        sourceId: v.id('sources'),
        text: v.string(),
        pageNumber: v.optional(v.number()),
        chunkIndex: v.number(),
        embeddingId: v.optional(v.string()), // Reference to Pinecone ID
    }).index("by_source", ["sourceId"]),

    sourceDisplay: defineTable({
        sourceId: v.id('sources'),
        html: v.string(),        // Rendered HTML for the Source Viewer UI
        pageCount: v.optional(v.number()), // For PDFs
    }).index("by_source", ["sourceId"]),

    messages: defineTable({
        projectId: v.id('projects'),
        role: v.string(), // user, assistant, system
        content: v.any(), // JSONB to store complex message blocks
        citations: v.optional(v.any()), // Array of rich citation objects
    }).index("by_project", ["projectId"]),

    studio_jobs: defineTable({
        projectId: v.id('projects'),
        type: v.string(), // podcast, presentation, prd
        status: v.string(), // queued, processing, completed, failed
        input: v.any(),
        output: v.optional(v.any()),
    }).index("by_project", ["projectId"]),
});