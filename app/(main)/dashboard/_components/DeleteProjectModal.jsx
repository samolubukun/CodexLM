"use client";

import { useState } from "react";
import {
    Dialog,
    DialogContent,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Trash2, Loader2, AlertCircle } from "lucide-react";
import { toast } from "sonner";

export function DeleteProjectModal({ isOpen, onClose, project, onDeleteProject }) {
    const [isDeleting, setIsDeleting] = useState(false);

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
            <DialogContent className="sm:max-w-[400px] border-none shadow-2xl bg-white dark:bg-slate-900 overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-rose-500 to-red-500" />
                
                <div className="py-6 space-y-6">
                    <div className="flex flex-col items-center text-center space-y-3">
                        <div className="w-16 h-16 rounded-full bg-rose-50 dark:bg-rose-900/10 flex items-center justify-center">
                            <AlertCircle className="w-8 h-8 text-rose-500" />
                        </div>
                        <h3 className="text-lg font-bold text-slate-900 dark:text-white">Are you absolutely sure?</h3>
                        <p className="text-sm text-slate-500 dark:text-slate-400 max-w-xs">
                            This will permanently delete <span className="font-bold text-rose-500">"{project.name}"</span> and all its data. This action cannot be undone.
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
                            onClick={onClose}
                            disabled={isDeleting}
                            className="w-full h-12 rounded-xl text-slate-500 font-medium hover:bg-slate-100"
                        >
                            Cancel
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
