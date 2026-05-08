"use client"

import { useState, useRef, useEffect } from 'react'
import mermaid from 'mermaid'
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
    Check, Loader2, Zap, ChevronLeft, ChevronRight, CheckCircle2, Pause, Trash2, ChevronDown, ChevronUp, ZoomIn, ZoomOut, Maximize
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { useQuery, useMutation } from "convex/react"
import { api } from "@/convex/_generated/api"
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { TransformWrapper, TransformComponent } from "react-zoom-pan-pinch";
import { AudioVisualizer } from './studio/AudioVisualizer';
import { Flashcard } from './studio/Flashcard';
import { MermaidDiagram } from './studio/MermaidDiagram';
import { SlideViewer } from './studio/SlideViewer';
import { InfographicViewer } from './studio/InfographicViewer';
import { DataTableViewer } from './studio/DataTableViewer';


export default function StudioPanel({ projectId }) {
    const [isGenerating, setIsGenerating] = useState(false);
    const [result, setResult] = useState(null);
    const [activeType, setActiveType] = useState(null);
    const [jobToDelete, setJobToDelete] = useState(null);
    const [isTranscriptOpen, setIsTranscriptOpen] = useState(false);
    const [isResultModalOpen, setIsResultModalOpen] = useState(false);

    const jobs = useQuery(api.studio_jobs.getJobsByProject, projectId ? { projectId } : "skip") || [];
    const createJob = useMutation(api.studio_jobs.createJob);
    const updateJobStatus = useMutation(api.studio_jobs.updateJobStatus);
    const deleteJob = useMutation(api.studio_jobs.deleteJob);

    // Clear results when switching projects
    useEffect(() => {
        setResult(null);
        setActiveType(null);
        setIsResultModalOpen(false);
    }, [projectId]);

    const handleViewResult = (jobOutput, type) => {
        setResult(jobOutput);
        setActiveType(type);
        
        // Only open modal for documents, keep interactive in sidebar
        if (!isInteractiveType(type)) {
            setIsResultModalOpen(true);
        } else {
            toast.success(`Viewing ${type} in sidebar`);
        }
    };

    const categories = [
        { id: 'audio', name: 'Audio', icon: Headphones, items: [{id: 'podcast', name: 'Podcast Overview'}] },
        { id: 'learning', name: 'Learning', icon: GraduationCap, items: [{id: 'flashcards', name: 'Flash Cards'}, {id: 'quiz', name: 'Interactive Quiz'}] },
        { id: 'docs', name: 'Documents', icon: FileText, items: [{id: 'prd', name: 'PRD Draft'}, {id: 'report', name: 'Business Report'}, {id: 'table', name: 'Data Table'}] },
        { id: 'marketing', name: 'Marketing', icon: Share2, items: [{id: 'marketing', name: 'Social Pack'}, {id: 'infographic', name: 'Infographic'}] },
        { id: 'design', name: 'Design', icon: Palette, items: [{id: 'diagram', name: 'Flow Diagram'}, {id: 'mindmap', name: 'Mind Map'}] },
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
            const finalResult = data.output || data;
            setResult(finalResult);
            
            // Only auto-pop the modal for document types
            if (!isInteractiveType(type)) {
                setIsResultModalOpen(true);
            } else {
                toast.success(`${type} generated!`);
            }
        } catch (error) {
            console.error("Studio Error:", error);
            toast.error("Failed to generate content.");
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

    const isInteractiveType = (type) => ['podcast', 'flashcards', 'quiz'].includes(type);

    const renderResult = (inModal = false) => {
        if (!result) return null;

        // NEW: Compact "Mini Card" for Sidebar (reverting from the big placeholder)
        if (!inModal && !isInteractiveType(activeType)) {
            return (
                <div className="space-y-3 pt-1">
                    <div className="p-3.5 bg-gradient-to-r from-indigo-600 to-indigo-700 rounded-2xl text-white shadow-lg shadow-indigo-500/10 border border-indigo-400/20 group cursor-pointer transition-all hover:scale-[1.01]"
                         onClick={() => setIsResultModalOpen(true)}>
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
                                    <Zap className="w-4 h-4 text-white" />
                                </div>
                                <div>
                                    <h4 className="text-[9px] font-black uppercase tracking-[0.2em] text-white/60 mb-0">Studio</h4>
                                    <p className="text-xs font-bold text-white capitalize">{activeType} Ready</p>
                                </div>
                            </div>
                            <Button 
                                size="sm"
                                className="bg-white text-indigo-600 hover:bg-indigo-50 rounded-lg px-3 text-[9px] font-black uppercase tracking-widest h-7"
                            >
                                View
                            </Button>
                        </div>
                    </div>
                    
                    <div className="p-4 bg-slate-50 dark:bg-slate-900/50 rounded-2xl border border-dashed border-border flex flex-col items-center justify-center text-center">
                        <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest leading-relaxed">
                            Click to open dashboard.
                        </p>
                    </div>
                </div>
            );
        }

        // Clean up display content: strip any code block wrappers
        let cleanContent = typeof result === 'string' ? result : (result.content || JSON.stringify(result, null, 2));
        if (typeof cleanContent === 'string') {
            // First try to extract just the mermaid block if it exists
            const mermaidMatch = cleanContent.match(/```(?:mermaid)?\s*\n([\s\S]*?)\n```/);
            if (mermaidMatch) {
                cleanContent = mermaidMatch[1].trim();
            } else {
                // Fallback to original replacement logic
                cleanContent = cleanContent
                    .replace(/^```[a-zA-Z]*\s*/, '')
                    .replace(/\s*```$/, '')
                    .trim();
            }
        }

        const sidebarHeader = !inModal && isInteractiveType(activeType) && (
            <div className="flex items-center justify-end mb-4">
                <Button 
                    variant="ghost" 
                    size="sm" 
                    className="h-7 text-[9px] font-black uppercase tracking-widest text-slate-400 hover:text-indigo-600 hover:bg-indigo-50"
                    onClick={() => setIsResultModalOpen(true)}
                >
                    <Zap className="w-3 h-3 mr-1" />
                    Full Screen
                </Button>
            </div>
        );

        // If we are in the sidebar but the type is a document, show a condensed version
        if (!inModal && !isInteractiveType(activeType)) {
            return (
                <div className="p-4 bg-indigo-50/50 dark:bg-indigo-900/10 rounded-2xl border border-indigo-200/50 dark:border-indigo-500/20 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <FileText className="w-4 h-4 text-indigo-600" />
                        <span className="text-[10px] font-bold uppercase tracking-widest text-indigo-600 truncate max-w-[120px]">
                            {activeType === 'prd' ? 'PRD' : activeType} Document
                        </span>
                    </div>
                    <Button 
                        variant="ghost" 
                        size="sm" 
                        className="h-7 text-[9px] font-black uppercase tracking-tighter text-indigo-600 hover:bg-indigo-100"
                        onClick={() => setIsResultModalOpen(true)}
                    >
                        Open Viewer
                    </Button>
                </div>
            );
        }

        // Case 1: Slide Deck Presentation (Highest Priority for structured data)
        if (activeType === 'slides') {
            const slideData = Array.isArray(result) ? { title: "Presentation", subtitle: "Project Overview", slides: result } : result;
            if (slideData && slideData.slides) {
                return (
                    <div className="space-y-8 pb-10">
                        {sidebarHeader}
                        <SlideViewer data={slideData} />
                    </div>
                );
            }
        }

        // Case 2: Audio Result
        const audioUrl = result.audioUrl || result.url;
        if (audioUrl && (audioUrl.endsWith('.wav') || audioUrl.endsWith('.mp3') || audioUrl.includes('podcast-'))) {
            return (
                <div className="space-y-4 animate-in fade-in zoom-in duration-500 overflow-x-hidden">
                    {sidebarHeader}
                    <div className="p-6 pb-6 bg-[#1a1b3b] rounded-[2rem] text-white shadow-2xl shadow-indigo-950/40 flex flex-col items-center text-center gap-4 border border-white/5 w-full max-w-full">
                        <div>
                            <h4 className="text-lg font-black tracking-tight">Podcast Ready</h4>
                            <p className="text-white/40 text-[9px] font-bold uppercase tracking-[0.2em] mt-1">Generated overview with Alex & Jordan</p>
                        </div>
                        
                        <AudioVisualizer src={audioUrl} />

                        <Button 
                            variant="secondary" 
                            className="w-full bg-white text-indigo-600 hover:bg-slate-100 font-bold rounded-xl cursor-pointer"
                            onClick={async () => {
                                try {
                                    const res = await fetch(audioUrl);
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
                    <div className="space-y-4">
                        {sidebarHeader}
                        <div className="grid grid-cols-1 gap-6 pb-8">
                            {result.map((card, i) => (
                                <Flashcard key={i} question={card.question} answer={card.answer} />
                            ))}
                        </div>
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
                    {sidebarHeader}
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
                </div>
            );
        }

        // Case 3: Marketing Social Pack
        if (activeType === 'marketing' && typeof result === 'object' && !Array.isArray(result)) {
            return (
                <div className="space-y-8 pb-10">
                    {sidebarHeader}
                    
                    {/* Strategy Header */}
                    <div className="p-6 bg-indigo-600 rounded-3xl text-white shadow-xl shadow-indigo-500/20">
                        <div className="flex items-center gap-2 mb-4">
                            <span className="px-2 py-0.5 bg-white/20 rounded text-[9px] font-black uppercase tracking-widest">Campaign Strategy</span>
                        </div>
                        <h4 className="text-xl font-black mb-2 leading-tight">{result.campaignGoal}</h4>
                        <p className="text-white/70 text-xs font-medium">Target: {result.targetAudience}</p>
                    </div>

                    {/* Twitter Section */}
                    <div className="space-y-4">
                        <div className="flex items-center gap-2 px-1">
                            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Twitter Posts</span>
                        </div>
                        <div className="grid grid-cols-1 gap-4">
                            {result.twitter?.map((post, i) => (
                                <div key={i} className="p-5 bg-white dark:bg-slate-800 rounded-2xl border border-border shadow-sm hover:border-blue-400 transition-colors">
                                    <div className="flex items-center gap-2 mb-3">
                                        <div className="w-6 h-6 bg-slate-100 dark:bg-slate-700 rounded-full" />
                                        <div className="flex flex-col">
                                            <span className="text-[10px] font-bold">Post {i+1}</span>
                                        </div>
                                    </div>
                                    <p className="text-sm text-slate-700 dark:text-slate-200 leading-relaxed">{post}</p>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* LinkedIn Section */}
                    <div className="space-y-4">
                        <div className="flex items-center gap-2 px-1">
                            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">LinkedIn Post</span>
                        </div>
                        <div className="p-6 bg-white dark:bg-slate-800 rounded-2xl border border-border shadow-sm">
                            <div className="text-sm text-slate-700 dark:text-slate-200 leading-relaxed prose-p:mb-4">
                                <ReactMarkdown>{result.linkedin}</ReactMarkdown>
                            </div>
                        </div>
                    </div>

                    {/* Email Section */}
                    <div className="space-y-4">
                        <div className="flex items-center gap-2 px-1">
                            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Email Template</span>
                        </div>
                        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-border shadow-sm overflow-hidden">
                            <div className="px-6 py-3 bg-slate-50 dark:bg-slate-900 border-b border-border">
                                <p className="text-[10px] font-bold text-slate-400"><span className="text-slate-500 mr-2 uppercase tracking-widest">Subject:</span> {result.email?.subject}</p>
                            </div>
                            <div className="p-6">
                                <div className="text-sm text-slate-700 dark:text-slate-200 leading-relaxed whitespace-pre-wrap">
                                    <ReactMarkdown>{result.email?.body}</ReactMarkdown>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            );
        }

        // Case 4: Business Report Dashboard
        if (activeType === 'report' && typeof result === 'object' && !Array.isArray(result)) {
            return (
                <div className="space-y-8 pb-10">
                    {sidebarHeader}
                    <div className="p-8 bg-slate-900 rounded-[2.5rem] text-white shadow-2xl relative overflow-hidden">
                        <div className="relative z-10">
                            <span className="px-3 py-1 bg-indigo-500 rounded-full text-[10px] font-black uppercase tracking-widest mb-4 inline-block">Business Intelligence</span>
                            <h4 className="text-3xl font-black mb-4 leading-tight">{result.title}</h4>
                            <p className="text-white/60 text-sm leading-relaxed max-w-2xl">{result.executiveSummary}</p>
                        </div>
                        <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-600/20 blur-[100px] rounded-full -mr-20 -mt-20" />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {result.keyAnalysis?.map((item, i) => (
                            <div key={i} className="p-6 bg-white dark:bg-slate-800 rounded-3xl border border-border shadow-sm">
                                <h5 className="font-black text-indigo-600 uppercase tracking-tighter mb-2 text-sm">{item.point}</h5>
                                <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">{item.detail}</p>
                            </div>
                        ))}
                    </div>

                    <div className="p-8 bg-indigo-50 dark:bg-indigo-900/20 rounded-[2.5rem] border border-indigo-100 dark:border-indigo-800">
                        <h5 className="text-xs font-black uppercase tracking-[0.2em] text-indigo-600 mb-6">Strategic Recommendations</h5>
                        <div className="space-y-4">
                            {result.recommendations?.map((rec, i) => (
                                <div key={i} className="flex gap-4">
                                    <div className="w-6 h-6 rounded-full bg-indigo-600 text-white flex items-center justify-center text-[10px] font-bold shrink-0">{i+1}</div>
                                    <p className="text-sm text-slate-700 dark:text-slate-200 leading-relaxed">{rec}</p>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="p-8 bg-white dark:bg-slate-800 rounded-[2.5rem] border border-border shadow-sm">
                        <h5 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-4 text-center">Final Conclusion</h5>
                        <p className="text-center text-slate-600 dark:text-slate-300 leading-relaxed italic">"{result.conclusion}"</p>
                    </div>
                </div>
            );
        }

        // Case 5: PRD Dashboard
        if (activeType === 'prd' && typeof result === 'object' && !Array.isArray(result)) {
            return (
                <div className="space-y-8 pb-10">
                    {sidebarHeader}
                    <div className="p-8 bg-gradient-to-br from-indigo-600 to-violet-700 rounded-[2.5rem] text-white shadow-xl shadow-indigo-500/20">
                        <span className="px-3 py-1 bg-white/20 rounded-full text-[10px] font-black uppercase tracking-widest mb-4 inline-block">Product Requirement Document</span>
                        <h4 className="text-3xl font-black mb-4 leading-tight">{result.title}</h4>
                        <div className="flex flex-wrap gap-4 mt-6">
                            <div className="bg-white/10 px-4 py-2 rounded-xl backdrop-blur-md">
                                <p className="text-[8px] font-bold uppercase tracking-widest opacity-60">Target Audience</p>
                                <p className="text-xs font-bold">{result.targetAudience}</p>
                            </div>
                        </div>
                    </div>

                    <div className="p-6 bg-slate-50 dark:bg-slate-900 rounded-3xl border border-border">
                        <h5 className="text-xs font-black uppercase tracking-[0.2em] text-slate-400 mb-4">Product Overview</h5>
                        <p className="text-sm text-slate-700 dark:text-slate-200 leading-relaxed">{result.overview}</p>
                    </div>

                    <div className="space-y-4">
                        <h5 className="text-xs font-black uppercase tracking-[0.2em] text-indigo-600 px-2">Key Features</h5>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {result.keyFeatures?.map((feature, i) => (
                                <div key={i} className="p-6 bg-white dark:bg-slate-800 rounded-3xl border border-border shadow-sm hover:border-indigo-400 transition-colors">
                                    <div className="w-10 h-10 rounded-2xl bg-indigo-50 dark:bg-indigo-900/30 flex items-center justify-center mb-4">
                                        <Zap className="w-5 h-5 text-indigo-600" />
                                    </div>
                                    <h6 className="font-bold text-sm mb-2">{feature.feature}</h6>
                                    <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">{feature.description}</p>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="p-6 bg-emerald-50 dark:bg-emerald-950/20 rounded-3xl border border-emerald-100 dark:border-emerald-900/50">
                            <h5 className="text-xs font-black uppercase tracking-[0.2em] text-emerald-600 mb-4">Success Metrics</h5>
                            <ul className="space-y-2">
                                {result.successMetrics?.map((metric, i) => (
                                    <li key={i} className="flex items-center gap-2 text-xs text-emerald-700 dark:text-emerald-300">
                                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                                        {metric}
                                    </li>
                                ))}
                            </ul>
                        </div>
                        <div className="p-6 bg-blue-50 dark:bg-blue-950/20 rounded-3xl border border-blue-100 dark:border-blue-900/50">
                            <h5 className="text-xs font-black uppercase tracking-[0.2em] text-blue-600 mb-4">User Stories</h5>
                            <ul className="space-y-2">
                                {result.userStories?.map((story, i) => (
                                    <li key={i} className="text-xs text-blue-700 dark:text-blue-300 leading-relaxed">
                                        "As a user, I want to {story}"
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </div>
                </div>
            );
        }

        // Case 6: Diagram & Mindmap
        if ((activeType === 'diagram' || activeType === 'mindmap') && typeof cleanContent === 'string') {
            return (
                <div className="space-y-8 pb-10">
                    {sidebarHeader}
                    <div className="p-8 bg-indigo-600 rounded-[2.5rem] text-white shadow-xl shadow-indigo-500/20">
                        <span className="px-3 py-1 bg-white/20 rounded-full text-[10px] font-black uppercase tracking-widest mb-4 inline-block">
                            {activeType === 'mindmap' ? 'Visual Mind Map' : 'Visual Flow Diagram'}
                        </span>
                        <h4 className="text-2xl font-black mb-2 leading-tight">
                            {activeType === 'mindmap' ? 'Theme Architecture' : 'Process Visualization'}
                        </h4>
                        <p className="text-white/70 text-xs font-medium">Auto-generated visualization of your research context.</p>
                    </div>
                    <MermaidDiagram chart={cleanContent} />
                </div>
            );
        }

        // Case 9: Infographic
        if (activeType === 'infographic' && typeof result === 'object' && !Array.isArray(result)) {
            return (
                <div className="space-y-8 pb-10">
                    {sidebarHeader}
                    <InfographicViewer data={result} />
                </div>
            );
        }

        // Case 10: Data Table
        if (activeType === 'table' && typeof result === 'object' && !Array.isArray(result)) {
            return (
                <div className="space-y-8 pb-10">
                    {sidebarHeader}
                    <DataTableViewer data={result} />
                </div>
            );
        }

        // Case 7: Simple string or object with content (fallback)
        
        const handleExportPDF = () => {
            const printWindow = window.open('', '_blank');
            const content = cleanContent;
            
            printWindow.document.write(`
                <html>
                    <head>
                        <title>${activeType?.toUpperCase() || 'Document'}</title>
                        <link href="https://cdn.jsdelivr.net/npm/tailwindcss@2.2.19/dist/tailwind.min.css" rel="stylesheet">
                        <style>
                            @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;700;900&display=swap');
                            body { 
                                font-family: 'Inter', sans-serif; 
                                padding: 50px; 
                                color: #1e293b;
                                line-height: 1.6;
                            }
                            .prose h1 { font-weight: 900; font-size: 2.5rem; margin-bottom: 1.5rem; border-bottom: 4px solid #4f46e5; padding-bottom: 0.5rem; }
                            .prose h2 { font-weight: 800; font-size: 1.8rem; margin-top: 2rem; margin-bottom: 1rem; color: #4f46e5; }
                            .prose h3 { font-weight: 700; font-size: 1.4rem; margin-top: 1.5rem; }
                            .prose p { margin-bottom: 1rem; }
                            .prose table { width: 100%; border-collapse: collapse; margin: 2rem 0; }
                            .prose th { background: #f8fafc; border: 1px solid #e2e8f0; padding: 12px; text-align: left; font-weight: bold; }
                            .prose td { border: 1px solid #e2e8f0; padding: 12px; }
                            @media print {
                                body { padding: 0; }
                                .no-print { display: none; }
                            }
                        </style>
                    </head>
                    <body>
                        <div class="prose max-w-none">
                            ${document.getElementById('studio-result-content').innerHTML}
                        </div>
                    </body>
                </html>
            `);
            printWindow.document.close();
            setTimeout(() => {
                printWindow.print();
            }, 500);
        };

        return (
            <div className="bg-white dark:bg-slate-900 rounded-3xl border border-border/50 shadow-sm overflow-hidden w-full min-w-0 font-sans">
                <div 
                    id="studio-result-content" 
                    className="p-8 prose prose-slate dark:prose-invert max-w-none w-full min-w-0 overflow-x-hidden font-sans
                        prose-headings:font-black prose-headings:tracking-tight prose-headings:break-words prose-headings:font-sans
                        prose-h1:text-3xl prose-h1:mb-6 prose-h1:border-b-4 prose-h1:border-indigo-600 prose-h1:pb-4
                        prose-h2:text-xl prose-h2:text-indigo-600 prose-h2:mt-10
                        prose-p:leading-relaxed prose-p:text-slate-600 dark:prose-p:text-slate-300 prose-p:break-words prose-p:font-sans
                        prose-table:block prose-table:overflow-x-auto prose-th:p-3 prose-td:p-3 prose-td:whitespace-normal"
                >
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>{cleanContent}</ReactMarkdown>
                </div>
                <div className="px-8 py-4 bg-slate-50 dark:bg-slate-800/50 border-t border-border/50 flex justify-end gap-3">
                    <Button 
                        variant="outline" 
                        size="sm" 
                        className="text-[10px] font-black uppercase tracking-widest text-slate-500 hover:text-indigo-600 rounded-xl"
                        onClick={() => {
                            const blob = new Blob([cleanContent], { type: 'text/markdown' });
                            const url = URL.createObjectURL(blob);
                            const a = document.createElement('a');
                            a.href = url;
                            a.download = `${activeType || 'studio'}-output.md`;
                            document.body.appendChild(a);
                            a.click();
                            document.body.removeChild(a);
                            URL.revokeObjectURL(url);
                        }}
                    >
                        <Download className="w-3 h-3 mr-2" />
                        Markdown
                    </Button>
                    <Button 
                        variant="default" 
                        size="sm" 
                        className="text-[10px] font-black uppercase tracking-widest bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl shadow-lg shadow-indigo-500/20"
                        onClick={handleExportPDF}
                    >
                        <FileText className="w-3 h-3 mr-2" />
                        Export PDF
                    </Button>
                </div>
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
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                                {renderResult(false)}
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
                                                onClick={() => handleViewResult(job.output, job.type)}
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

            {/* Result Modal */}
            <Dialog open={isResultModalOpen} onOpenChange={setIsResultModalOpen}>
                <DialogContent className="max-w-[95vw] lg:max-w-5xl h-[90vh] flex flex-col p-0 border-none shadow-2xl overflow-hidden bg-white dark:bg-slate-950">
                    <DialogHeader className="p-6 bg-slate-50 dark:bg-slate-900 border-b border-border flex flex-row items-center justify-between space-y-0 shrink-0">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/20">
                                <Wand2 className="w-5 h-5 text-white" />
                            </div>
                            <div>
                                <DialogTitle className="text-xl font-black tracking-tight capitalize">{activeType} Result</DialogTitle>
                                <DialogDescription className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Studio Intelligence Output</DialogDescription>
                            </div>
                        </div>
                    </DialogHeader>
                    
                    <div className="flex-1 overflow-y-auto sleek-scrollbar">
                        <div className="max-w-4xl mx-auto w-full py-12 px-6 lg:px-12">
                            {renderResult(true)}
                        </div>
                    </div>
                    
                    <DialogFooter className="p-4 bg-slate-50 dark:bg-slate-900 border-t border-border flex justify-end shrink-0">
                        <DialogClose asChild>
                            <Button variant="outline" className="rounded-xl font-bold">Close Viewer</Button>
                        </DialogClose>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

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
