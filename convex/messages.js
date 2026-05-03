import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const getMessagesByProject = query({
    args: { projectId: v.id('projects') },
    handler: async (ctx, args) => {
        return await ctx.db
            .query("messages")
            .withIndex("by_project", (q) => q.eq("projectId", args.projectId))
            .order("asc")
            .collect();
    },
});

export const sendMessage = mutation({
    args: {
        projectId: v.id('projects'),
        role: v.string(),
        content: v.any(),
        citations: v.optional(v.array(v.string())),
    },
    handler: async (ctx, args) => {
        return await ctx.db.insert("messages", {
            projectId: args.projectId,
            role: args.role,
            content: args.content,
            citations: args.citations || [],
        });
    },
});

export const deleteMessagesByProject = mutation({
    args: { projectId: v.id('projects') },
    handler: async (ctx, args) => {
        const messages = await ctx.db
            .query("messages")
            .withIndex("by_project", (q) => q.eq("projectId", args.projectId))
            .collect();
        for (const message of messages) {
            await ctx.db.delete(message._id);
        }
    },
});
