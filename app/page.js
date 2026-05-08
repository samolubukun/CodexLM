"use client"

import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Button } from '@/components/ui/button';
import { motion, AnimatePresence } from "framer-motion";
import {
    Sparkles,
    ChevronRight,
    Send,
    Search,
    Cpu,
    Mic,
    BookOpen,
    Zap,
    Globe,
    FileText,
    Video,
    Layout,
    Layers,
    Bot,
    UploadCloud,
    ShieldCheck,
    Dices,
    Plus,
    MoreVertical,
    Trash2,
    HelpCircle,
    ChevronDown,
    ChevronLeft,
    Folder,
    Network,
    Workflow,
    Presentation,
    Table,
    PieChart,
    Headphones,
    Play,
    SkipForward,
    SkipBack,
    User
} from 'lucide-react';
import { useEffect, useState } from 'react';
import Header from "@/components/Header";
import Footer from "@/components/Footer";

const BackgroundElements = () => {
    return (
        <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
            {/* Animated Blobs */}
            <motion.div 
                animate={{ 
                    x: [0, 50, 0], 
                    y: [0, 30, 0],
                    scale: [1, 1.1, 1]
                }}
                transition={{ 
                    duration: 20, 
                    repeat: Infinity, 
                    ease: "linear" 
                }}
                className="absolute top-1/4 -left-20 w-[400px] md:w-[600px] h-[400px] md:h-[600px] bg-indigo-500/20 blur-[100px] md:blur-[140px] rounded-full" 
            />

            <motion.div 
                animate={{ 
                    x: [0, 30, 0], 
                    y: [0, -50, 0],
                }}
                transition={{ 
                    duration: 18, 
                    repeat: Infinity, 
                    ease: "linear" 
                }}
                className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] md:w-[500px] h-[300px] md:h-[500px] bg-blue-400/10 blur-[80px] md:blur-[120px] rounded-full" 
            />

            {/* Technical Grid */}
            <motion.div 
                animate={{ 
                    backgroundPosition: ['0px 0px', '40px 40px'] 
                }}
                transition={{ 
                    duration: 10, 
                    repeat: Infinity, 
                    ease: "linear" 
                }}
                className="absolute inset-0 opacity-[0.3] dark:opacity-[0.1]"
                style={{ 
                    backgroundImage: `linear-gradient(#6366f1 1px, transparent 1px), linear-gradient(90deg, #6366f1 1px, transparent 1px)`,
                    backgroundSize: '40px 40px',
                    maskImage: 'radial-gradient(circle at center, black, transparent 80%)'
                }}
            />



            {/* Floating Nodes */}
            {[...Array(15)].map((_, i) => {
                const size = 2 + Math.random() * 4;
                return (
                    <motion.div
                        key={i}
                        initial={{ 
                            x: Math.random() * 100 + "%", 
                            y: Math.random() * 100 + "%",
                            opacity: 0
                        }}
                        animate={{ 
                            y: ["110%", "-10%"],
                            x: ["-2%", "2%", "-2%"],
                            opacity: [0, 0.4, 0.4, 0],
                            scale: [0.8, 1.2, 0.8]
                        }}
                        transition={{ 
                            duration: 10 + Math.random() * 15, 
                            repeat: Infinity, 
                            ease: "easeInOut",
                            delay: i * 1.5
                        }}
                        className="absolute bg-indigo-600 rounded-full shadow-[0_0_15px_rgba(79,70,229,0.4)]"
                        style={{ 
                            width: `${size}px`, 
                            height: `${size}px`,
                        }}
                    />
                );
            })}
        </div>
    );
};

export default function LandingPage() {
    const router = useRouter();
    const [activeMobileTab, setActiveMobileTab] = useState('chat');
    
    const handleGetStarted = () => router.push('/dashboard');

    const features = [
        { 
            icon: BookOpen, 
            title: "Universal Knowledge Ingestion", 
            desc: "One workspace for everything you need to know. Seamlessly process PDFs, web articles, videos, and recordings into a single searchable library." 
        },
        { 
            icon: Globe, 
            title: "Live Knowledge Bridge", 
            desc: "Stay current. Connect your local research with real-time web access to ensure your insights are backed by the most up-to-date information." 
        },
        { 
            icon: Bot, 
            title: "Deep Context Conversations", 
            desc: "Explore your documents through natural dialogue. Our workspace understands the nuances of your sources and provides direct citations for every claim." 
        },
        { 
            icon: Zap, 
            title: "The Creative Studio", 
            desc: "Transform static data into dynamic outputs. Effortlessly generate study guides, technical briefs, and presentation outlines in seconds." 
        },
        { 
            icon: Layout, 
            title: "AI Visualizations", 
            desc: "Instantly visualize complex concepts. Generate fully interactive Mermaid.js mind maps and flow diagrams directly from your source material." 
        },
        { 
            icon: Dices, 
            title: "Interactive 3D Study Tools", 
            desc: "Master your materials with tactile, physical-feeling flashcards. Flip between questions and answers with a high-fidelity 3D interface." 
        },
        { 
            icon: Mic, 
            title: "Immersive Audio Experience", 
            desc: "Listen to your research on the go. Convert complex documents into professional audio briefings with a fully interactive player and scrubber." 
        },
        { 
            icon: Search, 
            title: "Precision Hybrid Search", 
            desc: "Find the needle in the haystack. We combine semantic understanding with exact matching to locate specific details across thousands of pages." 
        },
        { 
            icon: ShieldCheck, 
            title: "Total Data Control", 
            desc: "Your privacy is paramount. Use our full-purge system to completely remove sources from both the database and the knowledge base instantly." 
        }
    ];

    return (
        <div className="flex flex-col min-h-screen bg-white text-slate-900 selection:bg-indigo-500/10 overflow-x-hidden">
            <Header />

            <main className="flex-1">
                {/* Hero */}
                <section className="relative pt-24 md:pt-40 pb-20 md:pb-32 px-6 overflow-hidden bg-slate-50">
                    <BackgroundElements />
                    <div className="max-w-7xl mx-auto text-center relative z-10">
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.8 }}
                        >
                            <div className="inline-flex items-center gap-2 px-3 py-1.5 md:px-4 md:py-2 rounded-full border border-indigo-200 bg-white text-indigo-600 mb-6 md:mb-8 shadow-sm">
                                <Sparkles className="w-3.5 h-3.5 md:w-4 md:h-4" />
                                <span className="text-[9px] md:text-[10px] font-black uppercase tracking-[0.2em]">Every Source Understood</span>
                            </div>

                            <h1 className="text-4xl sm:text-6xl md:text-8xl font-black mb-6 md:mb-8 leading-[1.1] md:leading-[0.9] tracking-tighter text-slate-900">
                                Your Knowledge, <br />
                                <span className="bg-gradient-to-r from-indigo-600 via-violet-600 to-indigo-500 text-transparent bg-clip-text italic">Amplified.</span>
                            </h1>

                            <p className="text-lg md:text-2xl text-slate-500 max-w-2xl mx-auto mb-10 md:mb-12 font-medium leading-relaxed px-4">
                                Upload any source. Chat with deep context. Generate studio quality outputs. CodexLM is your personal agentic workspace for the era of intelligence.
                            </p>

                            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center px-4">
                                <Button
                                    onClick={handleGetStarted}
                                    className="w-full sm:w-auto px-8 md:px-10 py-6 md:py-8 text-lg md:text-xl rounded-2xl bg-indigo-600 hover:bg-indigo-700 shadow-2xl shadow-indigo-500/20 transition-all group border-b-4 border-indigo-800 active:border-b-0 active:translate-y-1"
                                >
                                    Get Started
                                </Button>
                            </div>
                        </motion.div>

                        {/* App Preview Mockup */}
                        <motion.div 
                            initial={{ opacity: 0, y: 100 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.5, duration: 1 }}
                            className="mt-16 md:mt-24 relative max-w-6xl mx-auto group px-4"
                        >
                            {/* Desktop View Mockup */}
                            <div className="hidden md:block p-3 rounded-[2.5rem] bg-white border border-slate-200 shadow-[0_40px_100px_-20px_rgba(0,0,0,0.12)] transition-transform duration-700 group-hover:scale-[1.01]">
                                <div className="rounded-[1.8rem] overflow-hidden bg-slate-50 aspect-[16/8] border border-slate-200 flex flex-col shadow-inner text-left">
                                    
                                    {/* Mockup AppHeader */}
                                    <div className="h-14 border-b border-slate-200 bg-white flex items-center px-6 justify-between flex-shrink-0">
                                        <div className="flex items-center gap-2">
                                            <Image src="/logo.png" alt="CodexLM" width={24} height={24} />
                                            <span className="text-sm font-black tracking-tighter">Codex<span className="text-indigo-600">LM</span></span>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <div className="h-8 px-3 bg-slate-100 rounded-lg flex items-center gap-2 border border-slate-200">
                                                <Folder className="w-3.5 h-3.5 text-slate-500" />
                                                <span className="text-xs font-bold text-slate-800">Project Apollo</span>
                                                <ChevronDown className="w-3.5 h-3.5 text-slate-500" />
                                            </div>
                                            <div className="h-8 px-3 bg-indigo-50 border border-indigo-100 rounded-lg flex items-center gap-1.5">
                                                <Plus className="w-3.5 h-3.5 text-indigo-600" />
                                                <span className="text-[10px] font-bold text-indigo-700 uppercase tracking-widest">New</span>
                                            </div>
                                            <div className="w-px h-5 bg-slate-200 mx-1" />
                                            <div className="w-8 h-8 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center">
                                                <User className="w-4 h-4 text-slate-500" />
                                            </div>
                                        </div>
                                    </div>

                                    {/* 3-Panel Workspace Mockup */}
                                    <div className="flex-1 flex overflow-hidden">
                                        {/* Sources Panel */}
                                        <div className="w-[28%] border-r border-slate-200 p-6 bg-white flex flex-col">
                                            <div className="flex items-center justify-between mb-6">
                                                <div className="flex items-center gap-2">
                                                    <BookOpen className="w-4 h-4 text-indigo-600" />
                                                    <span className="text-xs font-black uppercase tracking-widest text-slate-900">Sources</span>
                                                </div>
                                                <Plus className="w-4 h-4 text-slate-400" />
                                            </div>
                                            <div className="space-y-3 pt-2">
                                                <div className="p-3.5 rounded-2xl bg-indigo-50/50 border border-indigo-100 flex items-center gap-3">
                                                    <div className="w-10 h-10 bg-white rounded-xl shadow-sm border border-indigo-100 flex items-center justify-center flex-shrink-0">
                                                        <FileText className="w-5 h-5 text-rose-500" />
                                                    </div>
                                                    <div className="min-w-0">
                                                        <p className="text-xs font-bold text-indigo-700 truncate">Mission_Brief.pdf</p>
                                                        <p className="text-[10px] text-indigo-400 font-bold uppercase tracking-widest mt-0.5">Processed</p>
                                                    </div>
                                                </div>
                                                <div className="p-3.5 rounded-2xl flex items-center gap-3 opacity-50 hover:bg-slate-50 transition-colors">
                                                    <div className="w-10 h-10 bg-white rounded-xl border border-slate-200 flex items-center justify-center flex-shrink-0">
                                                        <Mic className="w-5 h-5 text-emerald-500" />
                                                    </div>
                                                    <p className="text-xs font-bold text-slate-600 truncate">Interview_Rec.mp3</p>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Chat Panel */}
                                        <div className="flex-[1.2] flex flex-col bg-slate-50/30 relative">
                                            <div className="p-5 border-b border-slate-100 flex items-center gap-3 bg-white">
                                                <div className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center shadow-md shadow-indigo-500/20"><Bot className="w-4 h-4 text-white" /></div>
                                                <div className="min-w-0">
                                                    <p className="text-xs font-black text-slate-900">CodexLM Assistant</p>
                                                    <p className="text-[9px] text-emerald-500 font-black uppercase tracking-widest mt-0.5">Active Context</p>
                                                </div>
                                            </div>
                                            <div className="flex-1 p-8 space-y-8 overflow-hidden bg-white/50 backdrop-blur-sm">
                                                <div className="flex gap-4">
                                                    <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center flex-shrink-0 border border-indigo-200">
                                                        <Bot className="w-4 h-4 text-indigo-600" />
                                                    </div>
                                                    <div className="p-5 bg-indigo-50 rounded-[2rem] rounded-tl-none border border-indigo-100 w-[85%] shadow-sm">
                                                        <p className="text-xs md:text-sm leading-relaxed text-indigo-900 font-medium italic">"I've fully analyzed the Mission Brief. The document outlines the new backend rendering engine. What would you like to know?"</p>
                                                    </div>
                                                </div>
                                                <div className="flex gap-4 flex-row-reverse">
                                                    <div className="w-8 h-8 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center flex-shrink-0">
                                                        <User className="w-4 h-4 text-slate-500" />
                                                    </div>
                                                    <div className="p-5 bg-white rounded-[2rem] rounded-tr-none border border-slate-200 shadow-sm shadow-slate-200/50">
                                                        <p className="text-xs md:text-sm leading-relaxed text-slate-700 font-bold">"What are the core architectural components?"</p>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="p-6 bg-white border-t border-slate-100">
                                                <div className="h-14 bg-slate-50 border border-slate-200 rounded-2xl flex items-center px-4 justify-between shadow-inner">
                                                    <p className="text-xs text-slate-400 font-medium">Ask anything about your sources...</p>
                                                    <div className="w-8 h-8 bg-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/20"><Send className="w-4 h-4 text-white" /></div>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Studio Panel */}
                                        <div className="flex-1 border-l border-slate-200 flex flex-col bg-slate-50 p-6 relative overflow-hidden">
                                            <div className="flex items-center gap-2 mb-6">
                                                <Zap className="w-5 h-5 text-indigo-600 fill-indigo-600" />
                                                <span className="text-sm font-black uppercase tracking-widest text-slate-900">Studio</span>
                                            </div>
                                            
                                            <div className="grid grid-cols-2 gap-2">
                                                <div className="p-2.5 bg-white rounded-xl border border-slate-200 shadow-sm flex items-center gap-2">
                                                    <Headphones className="w-3.5 h-3.5 text-emerald-500" />
                                                    <span className="text-[9px] font-bold">Podcast</span>
                                                </div>
                                                <div className="p-2.5 bg-white rounded-xl border border-slate-200 shadow-sm flex items-center gap-2">
                                                    <Dices className="w-3.5 h-3.5 text-indigo-500" />
                                                    <span className="text-[9px] font-bold">Cards</span>
                                                </div>
                                                <div className="p-2.5 bg-white rounded-xl border border-slate-200 shadow-sm flex items-center gap-2">
                                                    <HelpCircle className="w-3.5 h-3.5 text-rose-500" />
                                                    <span className="text-[9px] font-bold">Quiz</span>
                                                </div>
                                                <div className="p-2.5 bg-white rounded-xl border border-slate-200 shadow-sm flex items-center gap-2">
                                                    <Table className="w-3.5 h-3.5 text-blue-500" />
                                                    <span className="text-[9px] font-bold">Data Table</span>
                                                </div>
                                                <div className="p-2.5 bg-white rounded-xl border border-slate-200 shadow-sm flex items-center gap-2">
                                                    <PieChart className="w-3.5 h-3.5 text-purple-500" />
                                                    <span className="text-[9px] font-bold">Infographic</span>
                                                </div>
                                                <div className="p-2.5 bg-white rounded-xl border border-slate-200 shadow-sm flex items-center gap-2">
                                                    <Presentation className="w-3.5 h-3.5 text-orange-500" />
                                                    <span className="text-[9px] font-bold">Slide Deck</span>
                                                </div>
                                                <div className="p-2.5 bg-white rounded-xl border border-slate-200 shadow-sm flex items-center gap-2">
                                                    <Network className="w-3.5 h-3.5 text-indigo-600" />
                                                    <span className="text-[9px] font-bold">Mind Map</span>
                                                </div>
                                                <div className="p-2.5 bg-white rounded-xl border border-slate-200 shadow-sm flex items-center gap-2">
                                                    <Workflow className="w-3.5 h-3.5 text-orange-600" />
                                                    <span className="text-[9px] font-bold">Flow Diagram</span>
                                                </div>
                                            </div>

                                            {/* Preview Artifact */}
                                            <div className="mt-4 flex-1 bg-white rounded-2xl border border-slate-200 shadow-sm relative overflow-hidden flex flex-col">
                                                <div className="p-3 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                                                    <div className="flex items-center gap-2">
                                                        <Headphones className="w-3.5 h-3.5 text-emerald-600" />
                                                        <span className="text-[9px] font-black text-emerald-900 uppercase">Podcast Overview</span>
                                                    </div>
                                                    <MoreVertical className="w-3 h-3 text-slate-400" />
                                                </div>
                                                <div className="flex-1 p-5 flex flex-col justify-center items-center bg-[#1a1b3b] relative">
                                                    {/* Waveform Mockup */}
                                                    <div className="flex items-end gap-[2px] h-16 w-full justify-center mb-6">
                                                        {[30, 45, 60, 35, 50, 75, 40, 60, 85, 45, 30, 55, 70, 40, 65, 90, 50, 35, 60, 45, 30].map((h, i) => (
                                                            <div 
                                                                key={i} 
                                                                className={`w-[3px] rounded-full ${i < 8 ? 'bg-gradient-to-t from-indigo-500 to-blue-300 shadow-[0_0_10px_rgba(129,140,248,0.4)]' : 'bg-white/10'}`} 
                                                                style={{ height: `${h}%` }} 
                                                            />
                                                        ))}
                                                    </div>

                                                    <div className="w-12 h-12 rounded-full bg-white flex items-center justify-center shadow-[0_0_20px_rgba(255,255,255,0.15)] mb-4">
                                                        <Play className="w-5 h-5 text-slate-900 fill-slate-900 ml-0.5" />
                                                    </div>

                                                    <div className="flex items-center gap-2 text-[8px] font-black text-white/30 tracking-widest uppercase">
                                                        <span>02:14</span>
                                                        <div className="w-1 h-1 bg-white/10 rounded-full" />
                                                        <span>06:45</span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* INTERACTIVE MOBILE VIEW MOCKUP */}
                            <div className="md:hidden flex flex-col items-center justify-center relative">
                                <div className="w-[280px] h-[520px] bg-white border-[8px] border-slate-900 rounded-[3rem] shadow-2xl relative overflow-hidden flex flex-col">
                                    <div className="w-24 h-5 bg-slate-900 absolute top-0 left-1/2 -translate-x-1/2 rounded-b-2xl z-20" />
                                    
                                    <div className="flex-1 flex flex-col bg-slate-50 pt-10 px-4">
                                        <AnimatePresence mode="wait">
                                            {activeMobileTab === 'sources' && (
                                                <motion.div key="sources" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-4">
                                                    <div className="flex items-center justify-between mb-4">
                                                        <span className="text-[10px] font-black text-slate-900 uppercase tracking-widest">Sources</span>
                                                        <Plus className="w-4 h-4 text-indigo-600" />
                                                    </div>
                                                    {[
                                                        { name: "Mission_Brief.pdf", icon: FileText, color: "text-rose-500", status: "Processed" },
                                                        { name: "Market_Research.pdf", icon: FileText, color: "text-rose-500", status: "Processed" },
                                                        { name: "Interview.mp3", icon: Mic, color: "text-emerald-500", status: "Active" }
                                                    ].map((s, i) => (
                                                        <div key={i} className="p-3 bg-white rounded-2xl border border-slate-200 shadow-sm flex items-center gap-3">
                                                            <div className="w-8 h-8 bg-slate-50 rounded-lg flex items-center justify-center"><s.icon className={`w-4 h-4 ${s.color}`} /></div>
                                                            <div className="min-w-0">
                                                                <p className="text-[11px] font-bold text-slate-800 truncate">{s.name}</p>
                                                                <p className="text-[8px] text-indigo-500 font-bold uppercase tracking-widest">{s.status}</p>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </motion.div>
                                            )}

                                            {activeMobileTab === 'chat' && (
                                                <motion.div key="chat" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="flex-1 flex flex-col space-y-4">
                                                    <div className="flex items-center gap-3 mb-2">
                                                        <div className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center"><Bot className="w-5 h-5 text-white" /></div>
                                                        <span className="text-[10px] font-black text-slate-900 uppercase">Assistant</span>
                                                    </div>
                                                    <div className="p-4 bg-indigo-600 rounded-2xl rounded-tl-none shadow-lg shadow-indigo-500/20">
                                                        <p className="text-[10px] text-white font-medium leading-relaxed italic">"I've fully analyzed your research documents. What questions do you have?"</p>
                                                    </div>
                                                    <div className="flex justify-end gap-2">
                                                        <div className="p-3 bg-white rounded-2xl rounded-tr-none border border-slate-200 shadow-sm">
                                                            <p className="text-[10px] text-slate-700 font-bold">"Summarize the core findings."</p>
                                                        </div>
                                                        <div className="w-6 h-6 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center flex-shrink-0">
                                                            <User className="w-3 h-3 text-slate-500" />
                                                        </div>
                                                    </div>
                                                    <div className="mt-auto pb-4">
                                                        <div className="h-10 bg-white border border-slate-200 rounded-xl flex items-center px-3 justify-between">
                                                            <span className="text-[9px] text-slate-400">Ask anything...</span>
                                                            <Send className="w-4 h-4 text-indigo-600" />
                                                        </div>
                                                    </div>
                                                </motion.div>
                                            )}

                                            {activeMobileTab === 'studio' && (
                                                <motion.div key="studio" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-6">
                                                    <div className="flex items-center gap-2 mb-2">
                                                        <Zap className="w-4 h-4 text-indigo-600 fill-indigo-600" />
                                                        <span className="text-[10px] font-black text-slate-900 uppercase tracking-widest">Studio</span>
                                                    </div>
                                                    
                                                    <div className="grid grid-cols-2 gap-2">
                                                        <div className="p-2 bg-white rounded-xl border border-slate-200 shadow-sm flex items-center gap-2">
                                                            <Headphones className="w-3 h-3 text-emerald-500" />
                                                            <span className="text-[8px] font-bold">Podcast</span>
                                                        </div>
                                                        <div className="p-2 bg-white rounded-xl border border-slate-200 shadow-sm flex items-center gap-2">
                                                            <Dices className="w-3 h-3 text-indigo-500" />
                                                            <span className="text-[8px] font-bold">Cards</span>
                                                        </div>
                                                        <div className="p-2 bg-white rounded-xl border border-slate-200 shadow-sm flex items-center gap-2">
                                                            <HelpCircle className="w-3 h-3 text-rose-500" />
                                                            <span className="text-[8px] font-bold">Quiz</span>
                                                        </div>
                                                        <div className="p-2 bg-white rounded-xl border border-slate-200 shadow-sm flex items-center gap-2">
                                                            <Table className="w-3 h-3 text-blue-500" />
                                                            <span className="text-[8px] font-bold">Data Table</span>
                                                        </div>
                                                        <div className="p-2 bg-white rounded-xl border border-slate-200 shadow-sm flex items-center gap-2">
                                                            <Network className="w-3 h-3 text-indigo-600" />
                                                            <span className="text-[8px] font-bold">Mind Map</span>
                                                        </div>
                                                        <div className="p-2 bg-white rounded-xl border border-slate-200 shadow-sm flex items-center gap-2">
                                                            <Presentation className="w-3 h-3 text-orange-500" />
                                                            <span className="text-[8px] font-bold">Slide Deck</span>
                                                        </div>
                                                    </div>
                                                </motion.div>
                                            )}
                                        </AnimatePresence>
                                    </div>

                                    <div className="h-14 bg-white border-t border-slate-100 flex items-center justify-around px-6 pb-2">
                                        <button onClick={() => setActiveMobileTab('sources')} className={`p-2 transition-all ${activeMobileTab === 'sources' ? 'text-indigo-600 scale-125' : 'text-slate-300'}`}>
                                            <BookOpen className="w-5 h-5" />
                                        </button>
                                        <button onClick={() => setActiveMobileTab('chat')} className={`p-2 transition-all ${activeMobileTab === 'chat' ? 'text-indigo-600 scale-125' : 'text-slate-300'}`}>
                                            <Bot className="w-5 h-5" />
                                        </button>
                                        <button onClick={() => setActiveMobileTab('studio')} className={`p-2 transition-all ${activeMobileTab === 'studio' ? 'text-indigo-600 scale-125' : 'text-slate-300'}`}>
                                            <Zap className="w-5 h-5" />
                                        </button>
                                    </div>
                                </div>

                                <motion.div animate={{ y: [0, -10, 0] }} transition={{ repeat: Infinity, duration: 4 }} className="absolute -top-6 -left-2 p-2.5 rounded-2xl bg-white border border-slate-200 shadow-xl z-20"><FileText className="w-4 h-4 text-rose-500" /></motion.div>
                                <motion.div animate={{ y: [0, 10, 0] }} transition={{ repeat: Infinity, duration: 5, delay: 1 }} className="absolute -bottom-4 -right-2 p-2.5 rounded-2xl bg-white border border-slate-200 shadow-xl z-20"><Mic className="w-4 h-4 text-emerald-500" /></motion.div>
                            </div>
                        </motion.div>
                    </div>

                </section>

                {/* Features Grid */}
                <section className="py-20 md:py-32 px-6 bg-white">
                    <div className="max-w-7xl mx-auto">
                        <div className="text-center mb-12 md:mb-20 px-4">
                            <h2 className="text-[10px] md:text-xs font-black uppercase tracking-[0.3em] text-indigo-600 mb-4">The Platform</h2>
                            <p className="text-3xl md:text-4xl font-black text-slate-900 tracking-tight">Everything you need to master your library.</p>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
                            {features.map((f, i) => (
                                <div key={i} className="p-8 md:p-10 rounded-[2rem] bg-slate-50 border border-slate-200 hover:border-indigo-500/30 hover:bg-white hover:shadow-2xl hover:shadow-indigo-500/5 transition-all group">
                                    <div className="w-14 h-14 md:w-16 md:h-16 rounded-2xl bg-white border border-slate-200 flex items-center justify-center mb-6 md:mb-8 group-hover:scale-110 group-hover:rotate-3 transition-all duration-500 shadow-sm">
                                        <f.icon className="w-7 h-7 md:w-8 md:h-8 text-indigo-600" />
                                    </div>
                                    <h3 className="text-xl md:text-2xl font-black mb-4 text-slate-900 tracking-tight">{f.title}</h3>
                                    <p className="text-slate-500 leading-relaxed font-medium text-sm">{f.desc}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>
            </main>

            <Footer />
        </div>
    );
}
