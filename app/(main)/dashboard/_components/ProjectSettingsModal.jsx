"use client";

import { useState, useEffect } from "react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Trash2, Save, Loader2, AlertCircle } from "lucide-react";
import { toast } from "sonner";

export function ProjectSettingsModal({ isOpen, onClose, project, onUpdateMemory, onDeleteProject }) {
    const [memory, setMemory] = useState("");
    const [isSaving, setIsSaving] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

    useEffect(() => {
        if (project) {
            // Ensure memory is always a string for the textarea
            const projectMemory = project.memory;
            if (typeof projectMemory === 'string') {
                setMemory(projectMemory);
            } else if (projectMemory && typeof projectMemory === 'object') {
                // If it was accidentally initialized as an object, stringify or empty it
                setMemory(Object.keys(projectMemory).length === 0 ? "" : JSON.stringify(projectMemory));
            } else {
                setMemory("");
            }
        }
    }, [project, isOpen]);

    const handleSave = async () => {
        setIsSaving(true);
        try {
            await onUpdateMemory(project._id, memory);
            onClose();
        } catch (err) {
            toast.error("Failed to update preferences");
        } finally {
            setIsSaving(false);
        }
    };

    const handleDelete = async () => {
        setIsDeleting(true);
        try {
            await onDeleteProject(project._id);
            onClose();
        } catch (err) {
            toast.error("Failed to delete project");
        } finally {
            setIsDeleting(false);
        }
    };

    if (!project) return null;

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[500px] border-none shadow-2xl bg-white dark:bg-slate-900 overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-emerald-500" />
                
                <DialogHeader className="pt-6">
                    <DialogTitle className="text-2xl font-bold flex items-center gap-2">
                        Project Settings
                    </DialogTitle>
                    <DialogDescription>
                        Manage preferences and data for <span className="font-semibold text-foreground">"{project.name}"</span>
                    </DialogDescription>
                </DialogHeader>

                {!showDeleteConfirm ? (
                    <>
                        <div className="space-y-4 py-4">
                            <div className="space-y-2">
                                <label className="text-sm font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                                    Project-wide Instructions
                                </label>
                                <Textarea
                                    placeholder="e.g. 'Use technical tone', 'Focus on financial data', 'Always summarize in bullet points'"
                                    value={memory}
                                    onChange={(e) => setMemory(e.target.value)}
                                    className="min-h-[150px] bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-indigo-500 rounded-xl transition-all resize-none text-sm leading-relaxed placeholder:text-slate-600 dark:placeholder:text-slate-400"
                                />
                                <p className="text-[11px] text-slate-400 italic">
                                    These instructions will be provided to the AI for every question in this project.
                                </p>
                            </div>
                        </div>

                        <div className="flex justify-between items-center pt-4 border-t border-slate-100 dark:border-slate-800">
                            <Button 
                                variant="ghost" 
                                size="sm"
                                onClick={() => setShowDeleteConfirm(true)}
                                className="text-rose-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/10 gap-2 font-medium"
                            >
                                <Trash2 className="w-4 h-4" />
                                Delete Project
                            </Button>
                            
                            <div className="flex gap-3">
                                <Button variant="ghost" onClick={onClose} className="rounded-xl">
                                    Cancel
                                </Button>
                                <Button 
                                    onClick={handleSave} 
                                    disabled={isSaving}
                                    className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl shadow-lg shadow-indigo-500/20 px-6 gap-2"
                                >
                                    {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                                    Save Preferences
                                </Button>
                            </div>
                        </div>
                    </>
                ) : (
                    <div className="py-6 space-y-6">
                        <div className="flex flex-col items-center text-center space-y-3">
                            <div className="w-16 h-16 rounded-full bg-rose-50 dark:bg-rose-900/10 flex items-center justify-center">
                                <AlertCircle className="w-8 h-8 text-rose-500" />
                            </div>
                            <h3 className="text-lg font-bold text-slate-900 dark:text-white">Are you absolutely sure?</h3>
                            <p className="text-sm text-slate-500 dark:text-slate-400 max-w-xs">
                                This will permanently delete <span className="font-bold text-rose-500">"{project.name}"</span> and all its sources, messages, and processed data. This action cannot be undone.
                            </p>
                        </div>

                        <div className="flex flex-col gap-3">
                            <Button 
                                onClick={handleDelete}
                                disabled={isDeleting}
                                className="w-full h-12 rounded-xl text-base font-bold bg-rose-600 hover:bg-rose-700 text-white shadow-lg shadow-rose-500/20 gap-2 border-none"
                            >
                                {isDeleting ? <Loader2 className="w-5 h-5 animate-spin" /> : <Trash2 className="w-5 h-5" />}
                                Yes, Delete Everything
                            </Button>
                            <Button 
                                variant="ghost" 
                                onClick={() => setShowDeleteConfirm(false)}
                                className="w-full h-12 rounded-xl text-slate-500 font-medium"
                            >
                                Go back
                            </Button>
                        </div>
                    </div>
                )}
            </DialogContent>
        </Dialog>
    );
}
