"use client"

import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Plus, FileText, Globe, Video, Music, Image as ImageIcon, Loader2, UploadCloud, Folder, Library, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { useState } from "react";
import { toast } from "sonner";
import { 
    Dialog, 
    DialogContent, 
    DialogHeader, 
    DialogTitle, 
    DialogDescription, 
    DialogFooter,
    DialogClose
} from "@/components/ui/dialog";

export default function SourcesPanel({ projectId, onSourceSelect, selectedSourceId }) {
    const [isDragging, setIsDragging] = useState(false);
    const [sourceToDelete, setSourceToDelete] = useState(null);
    const sources = useQuery(api.sources.getSourcesByProject, projectId ? { projectId } : "skip") || [];
    const createSource = useMutation(api.sources.createSource);
    const deleteSource = useMutation(api.sources.deleteSource);

    const processFiles = async (files) => {
        if (!files || files.length === 0 || !projectId) return;

        const filesArray = Array.from(files);
        const uploadPromises = filesArray.map(async (file) => {
            const formData = new FormData();
            formData.append("file", file);
            formData.append("projectId", projectId);

            const toastId = toast.loading(`Uploading ${file.name}...`);

            try {
                const res = await fetch("/api/upload", {
                    method: "POST",
                    body: formData,
                });
                const data = await res.json();
                
                if (data.success) {
                    let fileType = 'pdf';
                    if (file.type.includes('word')) fileType = 'docx';
                    else if (file.type.includes('presentation') || file.name.endsWith('.pptx')) fileType = 'pptx';
                    else if (file.type.includes('audio')) fileType = 'audio';
                    else if (file.type.includes('text')) fileType = 'text';

                    const sourceId = await createSource({
                        projectId,
                        type: fileType,
                        name: data.name,
                        url: data.url,
                        status: "processing"
                    });
                    
                    toast.success(`${file.name} uploaded!`, { id: toastId });

                    // 3. Trigger RAG Pipeline (Async, don't wait for all to finish before showing success)
                    fetch("/api/process-source", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                            sourceId,
                            projectId,
                            url: data.url,
                            type: fileType,
                            sourceName: data.name
                        })
                    });
                } else {
                    toast.error(`Upload failed: ${data.error || 'Unknown error'}`, { id: toastId });
                }
            } catch (error) {
                console.error("Upload failed:", error);
                toast.error(`Error uploading ${file.name}`, { id: toastId });
            }
        });

        await Promise.all(uploadPromises);
    };

    const handleFileUpload = (e) => {
        const files = e.target.files;
        processFiles(files);
    };

    const handleDragOver = (e) => {
        e.preventDefault();
        setIsDragging(true);
    };

    const handleDragLeave = () => {
        setIsDragging(false);
    };

    const handleDrop = (e) => {
        e.preventDefault();
        setIsDragging(false);
        const files = e.dataTransfer.files;
        processFiles(files);
    };

    const handleAddSource = async () => {
        if (!projectId) {
            toast.error("Please select a project first.");
            return;
        }
        const type = prompt("Enter source type (url, youtube) or leave empty for file:");
        if (type === null) return;
        if (!type) {
            document.getElementById('file-upload').click();
            return;
        }

        const url = prompt(`Enter ${type} link:`);
        if (url) {
            await createSource({
                projectId,
                type: type === 'youtube' ? 'youtube' : 'url',
                name: url,
                url: url,
                status: "processed"
            });
            toast.success("Source added!");
        }
    };

    const handleDeleteSource = async () => {
        if (!sourceToDelete) return;
        const sourceId = sourceToDelete._id;
        const toastId = toast.loading("Purging source from knowledge base...");
        
        try {
            // 1. Delete from Pinecone via API
            await fetch("/api/delete-source", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ sourceId })
            });

            // 2. Delete from Convex
            await deleteSource({ sourceId });
            
            toast.success("Source purged completely", { id: toastId });
            if (selectedSourceId === sourceId) onSourceSelect(null);
            setSourceToDelete(null);
        } catch (error) {
            console.error("Purge failed:", error);
            toast.error("Failed to fully purge source", { id: toastId });
        }
    };

    const getIcon = (type) => {
        switch (type) {
            case 'pdf': return <FileText className="w-4 h-4 text-rose-500" />;
            case 'url': return <Globe className="w-4 h-4 text-blue-500" />;
            case 'youtube': return <Video className="w-4 h-4 text-red-500" />;
            case 'audio': return <Music className="w-4 h-4 text-emerald-500" />;
            default: return <FileText className="w-4 h-4" />;
        }
    }

    if (!projectId) {
        return (
            <div className="flex flex-col h-full items-center justify-center p-6 text-center">
                <div className="w-16 h-16 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center mb-4">
                    <Folder className="w-8 h-8 text-slate-400" />
                </div>
                <p className="text-muted-foreground text-sm font-medium">Select a project to manage sources</p>
            </div>
        );
    }

    return (
        <div 
            className="flex flex-col h-full relative"
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
        >
            {isDragging && (
                <div className="absolute inset-0 z-50 bg-indigo-600/10 backdrop-blur-sm border-2 border-dashed border-indigo-500 rounded-lg flex flex-col items-center justify-center p-4 m-2 pointer-events-none animate-in fade-in zoom-in duration-200">
                    <UploadCloud className="w-12 h-12 text-indigo-600 mb-2 animate-bounce" />
                    <p className="text-indigo-700 font-bold text-lg">Drop file to upload</p>
                    <p className="text-indigo-600/70 text-sm">PDF, Docx, PPTX, MP3, TXT</p>
                </div>
            )}

            <div className="p-4 border-b border-border flex justify-between items-center bg-slate-50/50 dark:bg-slate-900/50 gap-2">
                <div className="flex items-center gap-2">
                    <Library className="w-5 h-5 text-indigo-600" />
                    <h2 className="font-bold text-lg tracking-tight">Sources</h2>
                </div>
                <input 
                    type="file" 
                    id="file-upload" 
                    className="hidden" 
                    accept=".pdf,.docx,.pptx,.txt,.mp3,.wav" 
                    onChange={handleFileUpload}
                    multiple
                />
                <Button size="icon" variant="ghost" onClick={handleAddSource} className="rounded-full hover:bg-white dark:hover:bg-slate-800 shadow-sm border border-border/50">
                    <Plus className="w-4 h-4" />
                </Button>
            </div>

            <ScrollArea className="flex-1">
                <div className="p-2 space-y-1">
                    {sources.map((source) => (
                        <div
                            key={source._id}
                            onClick={() => onSourceSelect(source._id)}
                            role="button"
                            tabIndex={0}
                            onKeyDown={(e) => e.key === 'Enter' && onSourceSelect(source._id)}
                            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all duration-200 group cursor-pointer ${
                                selectedSourceId === source._id 
                                ? 'bg-indigo-50 text-indigo-700 dark:bg-indigo-900/20 dark:text-indigo-300 ring-1 ring-indigo-200 dark:ring-indigo-800' 
                                : 'hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400'
                            }`}
                        >
                            <div className={`p-2 rounded-lg bg-white dark:bg-slate-800 shadow-sm border border-border/50 group-hover:scale-110 transition-transform flex-shrink-0 ${selectedSourceId === source._id ? 'border-indigo-200 dark:border-indigo-800' : ''}`}>
                                {source.status === 'processing' ? <Loader2 className="w-4 h-4 animate-spin" /> : getIcon(source.type)}
                            </div>
                            <div className="flex-1 min-w-0">
                                <p 
                                    className="font-medium text-left text-slate-700 dark:text-slate-200 break-words leading-tight"
                                >
                                    {source.name}
                                </p>
                            </div>
                            <Button 
                                size="icon" 
                                variant="ghost" 
                                className="w-8 h-8 opacity-0 group-hover:opacity-100 transition-opacity hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setSourceToDelete(source);
                                }}
                            >
                                <Trash2 className="w-3.5 h-3.5" />
                            </Button>
                        </div>
                    ))}
                    {sources.length === 0 && (
                        <div className="p-8 text-center text-sm text-muted-foreground flex flex-col items-center gap-3">
                            <UploadCloud className="w-8 h-8 opacity-20" />
                            <p>No sources yet. Drag and drop files here or click the + button to add multiple sources.</p>
                        </div>
                    )}
                </div>
            </ScrollArea>

            <div className="p-4 border-t border-border bg-slate-50/50 dark:bg-slate-900/50">
                <div className="p-4 rounded-2xl bg-indigo-600 text-white shadow-xl shadow-indigo-500/20 relative overflow-hidden group">
                    <div className="relative z-10">
                        <p className="text-xs font-bold uppercase tracking-wider opacity-80 mb-1">Project Status</p>
                        <div className="flex items-baseline gap-1 mb-2">
                            <span className="text-xl font-bold">{sources.length}</span>
                            <span className="text-xs opacity-80">Sources Loaded</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Delete Confirmation Modal */}
            <Dialog open={!!sourceToDelete} onOpenChange={(open) => !open && setSourceToDelete(null)}>
                <DialogContent className="sm:max-w-md border-red-500/20">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2 text-red-600">
                            <Trash2 className="w-5 h-5" />
                            Delete Source
                        </DialogTitle>
                        <DialogDescription className="py-2">
                            Are you sure you want to delete <span className="font-bold text-slate-900 dark:text-white">"{sourceToDelete?.name}"</span>? 
                            This action cannot be undone and will remove all associated data.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter className="flex gap-2">
                        <DialogClose asChild>
                            <Button variant="outline" className="flex-1 rounded-xl">Cancel</Button>
                        </DialogClose>
                        <Button 
                            variant="destructive" 
                            className="flex-1 rounded-xl bg-red-600 hover:bg-red-700"
                            onClick={handleDeleteSource}
                        >
                            Delete Source
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}
