"use client"

import { useState, useRef, useEffect } from 'react'
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
import { cn } from "@/lib/utils";
import { 
    Play, Download, Wand2, Mic, Headphones, GraduationCap, 
    FileText, Share2, Palette, Presentation, Plus, 
    Check, Loader2, Zap, ChevronRight, CheckCircle2, Pause, Trash2, ChevronDown, ChevronUp
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { useQuery, useMutation } from "convex/react"
import { api } from "@/convex/_generated/api"

function AudioVisualizer({ src }) {
    const audioRef = useRef(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(0);
    
    // Generate static bar heights for a consistent look
    const bars = Array.from({ length: 24 }, (_, i) => ({
        id: i,
        height: 25 + Math.abs(Math.sin(i * 0.8) * 45) + Math.random() * 5
    }));

    const togglePlay = () => {
        if (!audioRef.current) return;
        if (audioRef.current.paused) {
            audioRef.current.play();
            setIsPlaying(true);
        } else {
            audioRef.current.pause();
            setIsPlaying(false);
        }
    };

    const handleSeek = (e) => {
        if (!audioRef.current || !duration) return;
        const rect = e.currentTarget.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const percentage = Math.max(0, Math.min(1, x / rect.width));
        const newTime = percentage * duration;
        audioRef.current.currentTime = newTime;
        setCurrentTime(newTime);
    };

    const handleMouseDown = (e) => {
        const rect = e.currentTarget.getBoundingClientRect();
        
        const seek = (clientX) => {
            if (!audioRef.current || !duration) return;
            const x = clientX - rect.left;
            const percentage = Math.max(0, Math.min(1, x / rect.width));
            const newTime = percentage * duration;
            audioRef.current.currentTime = newTime;
            setCurrentTime(newTime);
        };

        seek(e.clientX);

        const onMouseMove = (moveEvent) => {
            seek(moveEvent.clientX);
        };
        
        const onMouseUp = () => {
            window.removeEventListener('mousemove', onMouseMove);
            window.removeEventListener('mouseup', onMouseUp);
        };
        
        window.addEventListener('mousemove', onMouseMove);
        window.addEventListener('mouseup', onMouseUp);
    };

    const formatTime = (time) => {
        const mins = Math.floor(time / 60);
        const secs = Math.floor(time % 60);
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    useEffect(() => {
        const audio = audioRef.current;
        const updateTime = () => setCurrentTime(audio.currentTime);
        const updateDuration = () => setDuration(audio.duration);
        
        audio.addEventListener('timeupdate', updateTime);
        audio.addEventListener('loadedmetadata', updateDuration);
        audio.addEventListener('ended', () => setIsPlaying(false));
        
        return () => {
            audio.removeEventListener('timeupdate', updateTime);
            audio.removeEventListener('loadedmetadata', updateDuration);
        };
    }, []);

    const progress = duration ? (currentTime / duration) : 0;

    return (
        <div className="w-full flex flex-col items-center gap-6 py-2">
            <audio ref={audioRef} src={src} preload="metadata" />
            
            {/* Waveform Visualization */}
            <div 
                className="flex items-end gap-[3px] h-24 w-full justify-center px-4 overflow-hidden cursor-pointer group/wave select-none"
                onMouseDown={handleMouseDown}
            >
                {bars.map((bar, i) => {
                    const isActive = i / bars.length <= progress;
                    return (
                        <div 
                            key={bar.id}
                            className={`w-[4px] rounded-full transition-all duration-500 ease-out group-hover/wave:opacity-80 ${
                                isActive 
                                    ? 'bg-gradient-to-t from-purple-500 via-indigo-400 to-blue-300 shadow-[0_0_15px_rgba(129,140,248,0.6)]' 
                                    : 'bg-white/10'
                            }`}
                            style={{ 
                                height: `${bar.height}%`,
                                transform: isActive && isPlaying ? `scaleY(${1.05 + Math.random() * 0.15})` : 'scaleY(1)'
                            }}
                        />
                    );
                })}
            </div>

            {/* Play Button */}
            <button 
                onClick={togglePlay}
                className="w-20 h-20 bg-white rounded-full flex items-center justify-center shadow-[0_0_30px_rgba(255,255,255,0.2)] hover:scale-105 transition-all active:scale-95 cursor-pointer group"
            >
                {isPlaying ? (
                    <Pause className="w-10 h-10 text-slate-900 fill-slate-900" />
                ) : (
                    <Play className="w-10 h-10 text-slate-900 fill-slate-900 ml-1" />
                )}
            </button>

            {/* Timestamps */}
            <div className="flex items-center gap-3 text-[12px] font-black text-white/40 tracking-[0.2em] tabular-nums bg-white/5 px-4 py-1.5 rounded-full">
                <span className={currentTime > 0 ? "text-white/80" : ""}>{formatTime(currentTime)}</span>
                <div className="w-1.5 h-1.5 bg-white/10 rounded-full" />
                <span>{formatTime(duration)}</span>
            </div>
        </div>
    );
}

const Flashcard = ({ question, answer }) => {
    const [isFlipped, setIsFlipped] = useState(false);

    return (
        <div 
            className="w-full aspect-[4/3] cursor-pointer perspective-1000 group"
            onClick={() => setIsFlipped(!isFlipped)}
        >
            <div className={cn(
                "relative w-full h-full transition-all duration-500 preserve-3d",
                isFlipped ? "rotate-y-180" : ""
            )}>
                {/* Front */}
                <div className="absolute inset-0 backface-hidden bg-white dark:bg-slate-800 rounded-3xl border-2 border-indigo-100 dark:border-indigo-900 shadow-xl flex flex-col items-center justify-center p-8 text-center gap-4">
                    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-indigo-500 opacity-50">Question</span>
                    <p className="text-lg font-bold text-slate-800 dark:text-white leading-tight">
                        {question}
                    </p>
                    <div className="mt-4 px-4 py-2 bg-indigo-50 dark:bg-indigo-950/30 rounded-full">
                        <p className="text-[10px] font-bold text-indigo-600 uppercase tracking-widest">Tap to reveal</p>
                    </div>
                </div>

                {/* Back */}
                <div className="absolute inset-0 backface-hidden rotate-y-180 bg-indigo-600 rounded-3xl shadow-xl flex flex-col items-center justify-center p-8 text-center gap-4">
                    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white/50">Answer</span>
                    <p className="text-lg font-medium text-white leading-relaxed">
                        {answer}
                    </p>
                    <div className="mt-4 px-4 py-2 bg-white/10 rounded-full">
                        <p className="text-[10px] font-bold text-white uppercase tracking-widest">Tap to flip back</p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default function StudioPanel({ projectId }) {
    const [isGenerating, setIsGenerating] = useState(false);
    const [result, setResult] = useState(null);
    const [activeType, setActiveType] = useState(null);
    const [jobToDelete, setJobToDelete] = useState(null);
    const [isTranscriptOpen, setIsTranscriptOpen] = useState(false);

    const jobs = useQuery(api.studio_jobs.getJobsByProject, projectId ? { projectId } : "skip") || [];
    const createJob = useMutation(api.studio_jobs.createJob);
    const updateJobStatus = useMutation(api.studio_jobs.updateJobStatus);
    const deleteJob = useMutation(api.studio_jobs.deleteJob);

    const categories = [
        { id: 'audio', name: 'Audio', icon: Headphones, items: [{id: 'podcast', name: 'Podcast Overview'}] },
        { id: 'learning', name: 'Learning', icon: GraduationCap, items: [{id: 'flashcards', name: 'Flash Cards'}, {id: 'quiz', name: 'Interactive Quiz'}] },
        { id: 'docs', name: 'Documents', icon: FileText, items: [{id: 'prd', name: 'PRD Draft'}, {id: 'report', name: 'Business Report'}] },
        { id: 'marketing', name: 'Marketing', icon: Share2, items: [{id: 'marketing', name: 'Social Pack'}] },
        { id: 'design', name: 'Design', icon: Palette, items: [{id: 'diagram', name: 'Flow Diagram'}] },
        { id: 'slides', name: 'Presentations', icon: Presentation, items: [{id: 'slides', name: 'Slide Deck'}] },
    ];

    const handleGenerateContent = async (type) => {
        if (!projectId) return;
        setIsGenerating(true);
        setActiveType(type);

        try {
            const jobId = await createJob({
                projectId,
                type,
                input: { type }
            });

            let res;
            if (type === 'podcast') {
                res = await fetch("/api/generate-podcast", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ projectId, jobId })
                });
            } else {
                res = await fetch('/api/generate-content', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ projectId, type, jobId })
                });
            }
            
            const data = await res.json();
            
            // Backend already handles database update for podcast/content
            setResult(data.output || data);
        } catch (error) {
            console.error("Studio Error:", error);
        } finally {
            setIsGenerating(false);
        }
    };

    const handleDeleteJob = async () => {
        if (!jobToDelete) return;
        const jobId = jobToDelete._id;
        try {
            await deleteJob({ jobId });
            toast.success("Job deleted");
            setJobToDelete(null);
        } catch (error) {
            toast.error("Failed to delete job");
        }
    };

    const renderResult = () => {
        if (!result) return null;

        // Case 1: Audio Result
        if (result.audioUrl) {
            return (
                <div className="space-y-6 animate-in fade-in zoom-in duration-500 overflow-x-hidden">
                    <div className="p-6 pb-6 bg-[#1a1b3b] rounded-[2rem] text-white shadow-2xl shadow-indigo-950/40 flex flex-col items-center text-center gap-4 border border-white/5 w-full max-w-full">
                        <div>
                            <h4 className="text-lg font-black tracking-tight">Podcast Ready</h4>
                            <p className="text-white/40 text-[9px] font-bold uppercase tracking-[0.2em] mt-1">Generated overview with Alex & Jordan</p>
                        </div>
                        
                        <AudioVisualizer src={result.audioUrl} />

                        <Button 
                            variant="secondary" 
                            className="w-full bg-white text-indigo-600 hover:bg-slate-100 font-bold rounded-xl cursor-pointer"
                            onClick={async () => {
                                try {
                                    const res = await fetch(result.audioUrl);
                                    const blob = await res.blob();
                                    const blobUrl = URL.createObjectURL(blob);
                                    const a = document.createElement('a');
                                    a.href = blobUrl;
                                    a.download = 'podcast-overview.wav';
                                    document.body.appendChild(a);
                                    a.click();
                                    document.body.removeChild(a);
                                    URL.revokeObjectURL(blobUrl);
                                } catch (e) {
                                    console.error('Download failed:', e);
                                }
                            }}
                        >
                            <Download className="w-4 h-4 mr-2" />
                            Download Audio
                        </Button>
                    </div>

                    {result.script && (
                        <div className="space-y-3 mt-4">
                            <button 
                                onClick={() => setIsTranscriptOpen(!isTranscriptOpen)}
                                className="w-full flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-900 rounded-2xl border border-border/50 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors group"
                            >
                                <div className="flex items-center gap-2">
                                    <FileText className="w-4 h-4 text-indigo-600" />
                                    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-200">Transcript</span>
                                </div>
                                {isTranscriptOpen ? (
                                    <ChevronUp className="w-4 h-4 text-slate-400" />
                                ) : (
                                    <ChevronDown className="w-4 h-4 text-slate-400" />
                                )}
                            </button>
                            
                            {isTranscriptOpen && (
                                <div className="space-y-2 animate-in slide-in-from-top-2 duration-300">
                                    {result.script.map((turn, i) => (
                                        <div key={i} className="p-3 bg-white dark:bg-slate-800 rounded-xl border border-border/50 shadow-sm">
                                            <span className="text-[9px] font-black text-indigo-600 uppercase tracking-tighter mr-2">{turn.speaker}</span>
                                            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed inline">{turn.text}</p>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}
                </div>
            );
        }

        // Case 2: Array of items (Quiz, Flashcards, etc)
        if (Array.isArray(result)) {
            const isFlashcards = result.length > 0 && result[0].question && result[0].answer;
            if (isFlashcards || activeType === 'flashcards') {
                return (
                    <div className="grid grid-cols-1 gap-6 pb-8">
                        {result.map((card, i) => (
                            <Flashcard key={i} question={card.question} answer={card.answer} />
                        ))}
                    </div>
                );
            }
            if (activeType === 'flashcards') {
                return (
                    <div className="grid grid-cols-1 gap-6 pb-8">
                        {result.map((card, i) => (
                            <Flashcard key={i} question={card.question} answer={card.answer} />
                        ))}
                    </div>
                );
            }
            
            return (
                <div className="space-y-4">
                    {result.map((item, i) => (
                        <div key={i} className="p-5 bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-border/50">
                            <h4 className="font-black text-xs uppercase tracking-wider text-indigo-600 mb-2">{item.question || item.title || `Item ${i+1}`}</h4>
                            <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
                                {item.answer || (Array.isArray(item.content) ? item.content.join('\n') : item.content)}
                            </p>
                        </div>
                    ))}
                </div>
            );
        }

        // Case 3: Simple string or object with content
        const displayContent = typeof result === 'string' ? result : (result.content || JSON.stringify(result, null, 2));
        
        return (
            <div className="prose prose-sm dark:prose-invert max-w-none whitespace-pre-wrap font-mono text-[11px] leading-relaxed text-slate-700 dark:text-slate-300 p-4 bg-white dark:bg-slate-800 rounded-2xl border border-border/50">
                {displayContent}
            </div>
        );
    };

    if (!projectId) {
        return (
            <div className="flex flex-col h-full items-center justify-center p-6 text-center">
                <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-2xl flex items-center justify-center mb-4">
                    <Wand2 className="w-8 h-8 text-slate-400" />
                </div>
                <h3 className="text-lg font-semibold">Studio</h3>
                <p className="text-muted-foreground text-sm max-w-xs mx-auto italic">Select a project to access the Studio and generate content.</p>
            </div>
        );
    }

    return (
        <div className="flex flex-col h-full bg-white dark:bg-slate-950">
            <div className="p-4 border-b border-border bg-slate-50/50 dark:bg-slate-900/50 flex items-center gap-2">
                <Zap className="w-5 h-5 text-indigo-600 fill-indigo-600" />
                <h2 className="font-bold text-lg tracking-tight">Studio</h2>
            </div>

            <ScrollArea className="flex-1">
                <div className="p-6 space-y-8">
                    {/* Categories Grid */}
                    <div className="grid grid-cols-2 gap-4">
                        {categories.map((cat) => (
                            <div key={cat.id} className="space-y-3">
                                <div className="flex items-center gap-2 px-1">
                                    <cat.icon className="w-4 h-4 text-indigo-600" />
                                    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">{cat.name}</span>
                                </div>
                                <div className="space-y-2">
                                    {cat.items.map((item) => (
                                        <Button
                                            key={item.id}
                                            variant="outline"
                                            className="w-full justify-start h-auto py-3 px-4 rounded-xl border-border hover:border-indigo-500/50 hover:bg-indigo-50/30 dark:hover:bg-indigo-900/10 transition-all group"
                                            onClick={() => handleGenerateContent(item.id)}
                                            disabled={isGenerating}
                                        >
                                            <div className="flex items-center justify-between w-full">
                                                <span className="text-xs font-bold">{item.name}</span>
                                                {isGenerating && activeType === item.id ? (
                                                    <Loader2 className="w-3 h-3 animate-spin text-indigo-600" />
                                                ) : (
                                                    <Plus className="w-3 h-3 text-slate-300 group-hover:text-indigo-500 transition-colors" />
                                                )}
                                            </div>
                                        </Button>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Output Area */}
                    {result && (
                        <div className="mt-8 space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500 border-t pt-8">
                            <div className="flex items-center justify-between">
                                <h3 className="text-xs font-black uppercase tracking-[0.2em] text-indigo-600">Studio Output</h3>
                                <Button variant="ghost" size="sm" className="h-8 text-[10px] font-bold uppercase tracking-widest text-slate-400" onClick={() => setResult(null)}>Clear</Button>
                            </div>
                            <div className="w-full">
                                {renderResult()}
                            </div>
                        </div>
                    )}

                    <div className="space-y-4 pt-4 border-t border-border">
                        <h3 className="text-xs font-black uppercase tracking-[0.2em] text-slate-400 px-1">Job History</h3>
                        <div className="space-y-3">
                            {jobs.map((job) => (
                                <div key={job._id} className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-border shadow-sm flex items-center justify-between group hover:border-indigo-500/50 transition-colors">
                                    <div className="flex items-center gap-3">
                                        {job.status === 'completed' ? (
                                            <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                                        ) : (
                                            <Loader2 className="w-5 h-5 text-indigo-500 animate-spin" />
                                        )}
                                        <div>
                                            <p className="text-xs font-bold capitalize">{job.type} Job</p>
                                            <p className="text-[10px] text-slate-400 font-medium uppercase tracking-widest">{job.status}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        {job.status === 'completed' && (
                                            <Button 
                                                variant="ghost" 
                                                size="sm" 
                                                className="h-8 text-[10px] font-bold uppercase tracking-widest text-indigo-600"
                                                onClick={() => setResult(job.output)}
                                            >
                                                View
                                            </Button>
                                        )}
                                        <Button 
                                            variant="ghost" 
                                            size="icon" 
                                            className="w-8 h-8 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 opacity-0 group-hover:opacity-100 transition-opacity"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setJobToDelete(job);
                                            }}
                                        >
                                            <Trash2 className="w-3.5 h-3.5" />
                                        </Button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </ScrollArea>

            {/* Delete Confirmation Modal */}
            <Dialog open={!!jobToDelete} onOpenChange={(open) => !open && setJobToDelete(null)}>
                <DialogContent className="sm:max-w-md border-red-500/20">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2 text-red-600">
                            <Trash2 className="w-5 h-5" />
                            Delete Job History
                        </DialogTitle>
                        <DialogDescription className="py-2">
                            Are you sure you want to delete this <span className="font-bold text-slate-900 dark:text-white capitalize">{jobToDelete?.type}</span> job? 
                            This will permanently remove the record from your history.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter className="flex gap-2">
                        <DialogClose asChild>
                            <Button variant="outline" className="flex-1 rounded-xl">Cancel</Button>
                        </DialogClose>
                        <Button 
                            variant="destructive" 
                            className="flex-1 rounded-xl bg-red-600 hover:bg-red-700"
                            onClick={handleDeleteJob}
                        >
                            Delete History
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}
