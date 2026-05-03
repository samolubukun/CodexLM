"use client"

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";

export function CreateProjectModal({ isOpen, onClose, onCreate }) {
    const [name, setName] = useState("");
    const [isPending, setIsPending] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!name.trim()) return;

        setIsPending(true);
        try {
            await onCreate(name);
            setName("");
            onClose();
        } finally {
            setIsPending(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[425px] bg-white dark:bg-slate-900 border-none shadow-2xl">
                <DialogHeader>
                    <DialogTitle className="text-2xl font-bold tracking-tight">Create New Project</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-6 pt-4">
                    <div className="space-y-2">
                        <Label htmlFor="name" className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                            Project Name
                        </Label>
                        <Input
                            id="name"
                            placeholder="e.g. Market Research 2024"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="h-12 text-lg focus-visible:ring-indigo-500 bg-slate-50 dark:bg-slate-800/50 border-border/50"
                            autoFocus
                        />
                    </div>
                    <DialogFooter className="pt-4">
                        <Button 
                            type="button" 
                            variant="ghost" 
                            onClick={onClose}
                            className="font-medium"
                        >
                            Cancel
                        </Button>
                        <Button 
                            type="submit" 
                            disabled={isPending || !name.trim()}
                            className="bg-indigo-600 hover:bg-indigo-700 text-white px-8 h-11 font-semibold shadow-lg shadow-indigo-500/20 transition-all active:scale-95"
                        >
                            {isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                            Create Project
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
