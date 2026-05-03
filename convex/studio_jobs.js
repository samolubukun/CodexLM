import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const getJobsByProject = query({
    args: { projectId: v.id('projects') },
    handler: async (ctx, args) => {
        return await ctx.db
            .query("studio_jobs")
            .withIndex("by_project", (q) => q.eq("projectId", args.projectId))
            .order("desc")
            .collect();
    },
});

export const createJob = mutation({
    args: {
        projectId: v.id('projects'),
        type: v.string(),
        input: v.any(),
    },
    handler: async (ctx, args) => {
        return await ctx.db.insert("studio_jobs", {
            projectId: args.projectId,
            type: args.type,
            status: "queued",
            input: args.input,
        });
    },
});

export const updateJobStatus = mutation({
    args: {
        jobId: v.id('studio_jobs'),
        status: v.string(),
        output: v.optional(v.any()),
    },
    handler: async (ctx, args) => {
        const patch = { status: args.status };
        if (args.output) patch.output = args.output;
        await ctx.db.patch(args.jobId, patch);
    },
});

export const deleteJob = mutation({
    args: { jobId: v.id('studio_jobs') },
    handler: async (ctx, args) => {
        await ctx.db.delete(args.jobId);
    },
});

