import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// Fetch the rendered HTML display document for a given source
export const getBySource = query({
    args: { sourceId: v.id("sources") },
    handler: async (ctx, args) => {
        return await ctx.db
            .query("sourceDisplay")
            .withIndex("by_source", (q) => q.eq("sourceId", args.sourceId))
            .first();
    },
});

// Create a new display document for a source
export const create = mutation({
    args: {
        sourceId: v.id("sources"),
        html: v.string(),
        pageCount: v.optional(v.number()),
    },
    handler: async (ctx, args) => {
        // Delete any existing display doc for this source before inserting
        const existing = await ctx.db
            .query("sourceDisplay")
            .withIndex("by_source", (q) => q.eq("sourceId", args.sourceId))
            .first();
        if (existing) {
            await ctx.db.delete(existing._id);
        }
        return await ctx.db.insert("sourceDisplay", {
            sourceId: args.sourceId,
            html: args.html,
            pageCount: args.pageCount,
        });
    },
});

// Delete a display document for a source (called when a source is deleted)
export const deleteBySource = mutation({
    args: { sourceId: v.id("sources") },
    handler: async (ctx, args) => {
        const existing = await ctx.db
            .query("sourceDisplay")
            .withIndex("by_source", (q) => q.eq("sourceId", args.sourceId))
            .first();
        if (existing) {
            await ctx.db.delete(existing._id);
        }
    },
});
