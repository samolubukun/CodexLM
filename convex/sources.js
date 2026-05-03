import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const getSourcesByProject = query({
    args: { projectId: v.id('projects') },
    handler: async (ctx, args) => {
        return await ctx.db
            .query("sources")
            .withIndex("by_project", (q) => q.eq("projectId", args.projectId))
            .collect();
    },
});

export const createSource = mutation({
    args: {
        projectId: v.id('projects'),
        name: v.string(),
        type: v.string(),
        url: v.optional(v.string()),
        storageKey: v.optional(v.string()),
        status: v.string(),
        metadata: v.optional(v.any()),
    },
    handler: async (ctx, args) => {
        return await ctx.db.insert("sources", {
            projectId: args.projectId,
            name: args.name,
            type: args.type,
            url: args.url,
            storageKey: args.storageKey,
            status: args.status,
            metadata: args.metadata || {},
        });
    },
});

export const updateSourceStatus = mutation({
    args: {
        sourceId: v.id('sources'),
        status: v.string(),
        metadata: v.optional(v.any()),
    },
    handler: async (ctx, args) => {
        const patch = { status: args.status };
        if (args.metadata) patch.metadata = args.metadata;
        await ctx.db.patch(args.sourceId, patch);
    },
});
export const deleteSource = mutation({
    args: { sourceId: v.id('sources') },
    handler: async (ctx, args) => {
        await ctx.db.delete(args.sourceId);
    },
});
