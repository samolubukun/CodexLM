"use client"

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { ChevronLeft, FileText, Search, Loader2 } from "lucide-react";
import { useEffect, useRef } from "react";

export default function SourceViewer({ sourceId, activePassage, onBack }) {
    const display = useQuery(
        api.sourceDisplay.getBySource,
        sourceId ? { sourceId } : "skip"
    );
    const containerRef = useRef(null);

    // Scroll to & highlight the active chunk anchor whenever a citation is clicked
    useEffect(() => {
        if (!activePassage || !containerRef.current) return;

        const anchor = containerRef.current.querySelector(
            `[data-chunk="${activePassage.chunkIndex}"]`
        );
        if (!anchor) return;

        // Smooth-scroll the anchor into view
        anchor.scrollIntoView({ behavior: "smooth", block: "center" });

        // Highlight the nearest block-level parent (p, div, etc.)
        const target = anchor.closest("p, div, li, td") || anchor.parentElement;
        if (target) {
            target.classList.add("chunk-highlight");
            // Auto-remove highlight after 8 seconds
            const timer = setTimeout(() => {
                target.classList.remove("chunk-highlight");
            }, 8000);
            return () => clearTimeout(timer);
        }
    }, [activePassage]);

    // ── Empty state ──────────────────────────────────────────────────────────
    if (!sourceId) {
        return (
            <div className="flex flex-col h-full items-center justify-center p-6 text-center text-slate-500">
                <Search className="w-12 h-12 mb-4 opacity-20" />
                <p>Select a source to view its content</p>
                <Button variant="ghost" className="mt-4" onClick={onBack}>
                    Go back to Studio
                </Button>
            </div>
        );
    }

    // ── Loading state (display doc not yet saved or still syncing) ───────────
    const isLoading = display === undefined;

    // ── Header (shared) ──────────────────────────────────────────────────────
    const header = (
        <div className="p-4 border-b border-border bg-slate-50/50 dark:bg-slate-900/50 flex items-center justify-between flex-shrink-0">
            <div className="flex items-center gap-2">
                <Button variant="ghost" size="icon" onClick={onBack} className="h-8 w-8">
                    <ChevronLeft className="w-4 h-4" />
                </Button>
                <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4 text-indigo-600" />
                    <h2 className="font-bold text-sm truncate max-w-[150px]">Source Viewer</h2>
                </div>
            </div>
            {display?.pageCount && (
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    {display.pageCount} pages
                </span>
            )}
        </div>
    );

    if (isLoading) {
        return (
            <div className="flex flex-col h-full bg-white dark:bg-slate-950">
                {header}
                <div className="flex-1 flex flex-col items-center justify-center gap-3 text-slate-400">
                    <Loader2 className="w-6 h-6 animate-spin text-indigo-500" />
                    <p className="text-xs">Loading document…</p>
                </div>
            </div>
        );
    }

    // ── No display doc yet (source still processing or old source pre-migration) ──
    if (!display) {
        return (
            <div className="flex flex-col h-full bg-white dark:bg-slate-950">
                {header}
                <div className="flex-1 flex flex-col items-center justify-center gap-3 p-6 text-center text-slate-400">
                    <FileText className="w-10 h-10 opacity-20" />
                    <p className="text-sm">
                        Document preview is being generated…
                    </p>
                    <p className="text-xs opacity-70">
                        Re-process this source to enable the viewer.
                    </p>
                </div>
            </div>
        );
    }

    // ── Main viewer ──────────────────────────────────────────────────────────
    return (
        <div className="flex flex-col h-full bg-white dark:bg-slate-950">
            {header}
            <ScrollArea className="flex-1">
                <div
                    ref={containerRef}
                    className="source-viewer-body"
                    dangerouslySetInnerHTML={{ __html: display.html }}
                />
            </ScrollArea>
        </div>
    );
}
