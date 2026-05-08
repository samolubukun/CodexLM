import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const getProjects = query({
    args: { userId: v.id('users') },
    handler: async (ctx, args) => {
        return await ctx.db
            .query("projects")
            .withIndex("by_user", (q) => q.eq("userId", args.userId))
            .collect();
    },
});

export const createProject = mutation({
    args: {
        userId: v.id('users'),
        name: v.string(),
    },
    handler: async (ctx, args) => {
        return await ctx.db.insert("projects", {
            userId: args.userId,
            name: args.name,
            costs: {},
            memory: "",
        });
    },
});

export const getProjectById = query({
    args: { projectId: v.id('projects') },
    handler: async (ctx, args) => {
        return await ctx.db.get(args.projectId);
    },
});

export const updateProjectMemory = mutation({
    args: {
        projectId: v.id('projects'),
        memory: v.any(),
    },
    handler: async (ctx, args) => {
        await ctx.db.patch(args.projectId, { memory: args.memory });
    },
});

export const deleteProject = mutation({
    args: { projectId: v.id("projects") },
    handler: async (ctx, args) => {
        // 1. Delete associated sources and their chunks
        const sources = await ctx.db
            .query("sources")
            .withIndex("by_project", (q) => q.eq("projectId", args.projectId))
            .collect();

        for (const source of sources) {
            const chunks = await ctx.db
                .query("chunks")
                .withIndex("by_source", (q) => q.eq("sourceId", source._id))
                .collect();
            for (const chunk of chunks) {
                await ctx.db.delete(chunk._id);
            }
            await ctx.db.delete(source._id);
        }

        // 2. Delete messages
        const messages = await ctx.db
            .query("messages")
            .withIndex("by_project", (q) => q.eq("projectId", args.projectId))
            .collect();
        for (const msg of messages) {
            await ctx.db.delete(msg._id);
        }

        // 3. Delete studio jobs
        const jobs = await ctx.db
            .query("studio_jobs")
            .withIndex("by_project", (q) => q.eq("projectId", args.projectId))
            .collect();
        for (const job of jobs) {
            await ctx.db.delete(job._id);
        }

        // 4. Delete the project itself
        await ctx.db.delete(args.projectId);
    },
});
