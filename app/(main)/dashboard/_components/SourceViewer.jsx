"use client"

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { ChevronLeft, FileText, ExternalLink, Search } from "lucide-react";
import { useEffect, useRef } from "react";
import { cn } from "@/lib/utils";

export default function SourceViewer({ sourceId, activePassage, onBack }) {
    const chunks = useQuery(api.chunks.getChunksBySource, sourceId ? { sourceId } : "skip") || [];
    const scrollRef = useRef(null);
    const activeRef = useRef(null);

    useEffect(() => {
        if (activePassage && activeRef.current) {
            activeRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
    }, [activePassage, chunks]);

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

    return (
        <div className="flex flex-col h-full bg-white dark:bg-slate-950">
            <div className="p-4 border-b border-border bg-slate-50/50 dark:bg-slate-900/50 flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <Button variant="ghost" size="icon" onClick={onBack} className="h-8 w-8">
                        <ChevronLeft className="w-4 h-4" />
                    </Button>
                    <div className="flex items-center gap-2">
                        <FileText className="w-4 h-4 text-indigo-600" />
                        <h2 className="font-bold text-sm truncate max-w-[150px]">Source Viewer</h2>
                    </div>
                </div>
            </div>

            <ScrollArea ref={scrollRef} className="flex-1 p-6">
                <div className="max-w-2xl mx-auto space-y-4">
                    {chunks.length === 0 ? (
                        <div className="py-20 text-center space-y-4">
                            <div className="animate-pulse flex flex-col items-center gap-4">
                                <div className="h-4 w-3/4 bg-slate-100 dark:bg-slate-800 rounded" />
                                <div className="h-4 w-1/2 bg-slate-100 dark:bg-slate-800 rounded" />
                                <div className="h-4 w-5/6 bg-slate-100 dark:bg-slate-800 rounded" />
                            </div>
                            <p className="text-xs text-slate-400">Loading document content...</p>
                        </div>
                    ) : (
                        chunks.map((chunk, i) => {
                            const isActive = activePassage && activePassage.chunkIndex === chunk.chunkIndex;
                            return (
                                <div 
                                    key={chunk._id}
                                    ref={isActive ? activeRef : null}
                                    className={cn(
                                        "text-sm transition-all duration-500 p-4 rounded-xl whitespace-pre-wrap break-words",
                                        isActive 
                                            ? "bg-indigo-50 dark:bg-indigo-900/30 ring-1 ring-indigo-200 dark:ring-indigo-800 shadow-md scale-[1.02] z-10" 
                                            : "text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-900/50"
                                    )}
                                    style={{ lineHeight: '1.6' }}
                                >
                                    {chunk.text}
                                    {chunk.pageNumber && (
                                        <span className="ml-2 text-[10px] font-bold text-slate-400 bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded">
                                            Page {chunk.pageNumber}
                                        </span>
                                    )}
                                </div>
                            );
                        })
                    )}
                </div>
            </ScrollArea>
        </div>
    );
}
