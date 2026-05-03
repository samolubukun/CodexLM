import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const createChunk = mutation({
    args: {
        sourceId: v.id('sources'),
        text: v.string(),
        pageNumber: v.optional(v.number()),
        chunkIndex: v.number(),
        embeddingId: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        return await ctx.db.insert("chunks", {
            sourceId: args.sourceId,
            text: args.text,
            pageNumber: args.pageNumber,
            chunkIndex: args.chunkIndex,
            embeddingId: args.embeddingId,
        });
    },
});

export const getChunksBySource = query({
    args: { sourceId: v.id('sources') },
    handler: async (ctx, args) => {
        return await ctx.db
            .query("chunks")
            .withIndex("by_source", (q) => q.eq("sourceId", args.sourceId))
            .order("asc")
            .collect();
    },
});

export const getChunkById = query({
    args: { chunkId: v.id('chunks') },
    handler: async (ctx, args) => {
        return await ctx.db.get(args.chunkId);
    },
});

export const deleteChunksBySource = mutation({
    args: { sourceId: v.id('sources') },
    handler: async (ctx, args) => {
        const chunks = await ctx.db
            .query("chunks")
            .withIndex("by_source", (q) => q.eq("sourceId", args.sourceId))
            .collect();
        for (const chunk of chunks) {
            await ctx.db.delete(chunk._id);
        }
    },
});
