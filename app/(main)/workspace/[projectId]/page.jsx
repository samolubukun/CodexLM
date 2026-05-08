"use client"
import { useState, use } from 'react'
import SourcesPanel from '@/app/(main)/dashboard/_components/SourcesPanel'
import ChatPanel from '@/app/(main)/dashboard/_components/ChatPanel'
import StudioPanel from '@/app/(main)/dashboard/_components/StudioPanel'
import SourceViewer from '@/app/(main)/dashboard/_components/SourceViewer'
import { cn } from '@/lib/utils'
import { BookOpen, Bot, Zap, ChevronLeft } from 'lucide-react'
import { useQuery } from "convex/react"
import { api } from "@/convex/_generated/api"

export default function Workspace({ params }) {
    // Unwind params Promise for Next.js 14+ best practices if it's dynamic
    const resolvedParams = use(params);
    const projectId = resolvedParams.projectId;

    const [selectedSourceId, setSelectedSourceId] = useState(null);
    const [activePassage, setActivePassage] = useState(null);
    const [leftPanelTab, setLeftPanelTab] = useState('list'); // 'list' or 'source'
    const [activeMobileTab, setActiveMobileTab] = useState('chat'); // 'sources', 'chat', 'studio'

    const sources = useQuery(api.sources.getSourcesByProject, projectId ? { projectId } : "skip") || [];

    const handleCitationClick = (citation) => {
        setSelectedSourceId(citation.sourceId);
        setActivePassage(citation);
        setLeftPanelTab('source');
        setActiveMobileTab('sources'); // Switch to sources to see the viewer on mobile
    };

    const handleSourceSelect = (id) => {
        setSelectedSourceId(id);
        setLeftPanelTab('source');
        setActivePassage(null);
    };

    return (
        <div className='flex flex-col lg:flex-row h-full w-full bg-slate-50 dark:bg-slate-950 overflow-hidden relative'>
            
            {/* Left Panel: Sources / Source Viewer */}
            <div className={cn(
                'border-r border-border bg-white dark:bg-slate-900 flex-shrink-0 relative overflow-hidden transition-all duration-300',
                'absolute inset-0 z-40 pb-16 lg:pb-0 lg:relative lg:inset-auto lg:z-0 lg:w-[340px]', // Desktop: side panel, Mobile: Full screen overlay
                activeMobileTab === 'sources' ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
            )}>
                {leftPanelTab === 'source' && selectedSourceId ? (
                    <SourceViewer 
                        sourceId={selectedSourceId}
                        activePassage={activePassage}
                        onBack={() => setLeftPanelTab('list')}
                    />
                ) : (
                    <SourcesPanel 
                        projectId={projectId}
                        onSourceSelect={handleSourceSelect} 
                        selectedSourceId={selectedSourceId} 
                    />
                )}
            </div>

            {/* Center Panel: Chat */}
            <div className={cn(
                'flex-[1.2] flex flex-col min-w-0 bg-background',
                'absolute inset-0 z-30 pb-16 lg:pb-0 lg:relative lg:inset-auto lg:z-0', // Desktop: center, Mobile: Full screen
                activeMobileTab === 'chat' ? 'opacity-100' : 'opacity-0 pointer-events-none lg:opacity-100 lg:pointer-events-auto'
            )}>
                <ChatPanel 
                    projectId={projectId}
                    selectedSourceId={selectedSourceId} 
                    onCitationClick={handleCitationClick}
                />
            </div>

            {/* Right Panel: StudioPanel */}
            <div className={cn(
                'border-l border-border bg-white dark:bg-slate-900 flex-shrink-0 transition-all duration-300 overflow-hidden min-w-0 flex-1',
                'absolute inset-0 z-35 pb-16 lg:pb-0 lg:relative lg:inset-auto lg:z-0', // Desktop: right, Mobile: Full screen
                activeMobileTab === 'studio' ? 'translate-x-0' : 'translate-x-full lg:translate-x-0'
            )}>
                <StudioPanel 
                    projectId={projectId}
                />
            </div>

            {/* Mobile Navigation Bar */}
            <div className="lg:hidden h-16 border-t border-border bg-white dark:bg-slate-900 flex items-center justify-around px-4 z-50 fixed bottom-0 left-0 right-0">
                <button 
                    onClick={() => setActiveMobileTab('sources')}
                    className={cn(
                        "flex flex-col items-center gap-1 transition-colors",
                        activeMobileTab === 'sources' ? "text-indigo-600" : "text-slate-400"
                    )}
                >
                    <div className="relative">
                        <BookOpen className="w-5 h-5" />
                        {sources.length > 0 && (
                            <span className="absolute -top-2 -right-2 flex min-w-[14px] h-[14px] items-center justify-center rounded-full bg-indigo-600 px-1 text-[7px] font-black text-white ring-2 ring-white dark:ring-slate-900 shadow-sm animate-in zoom-in duration-300">
                                {sources.length}
                            </span>
                        )}
                    </div>
                    <span className="text-[9px] font-bold uppercase tracking-widest">Sources</span>
                </button>
                
                <button 
                    onClick={() => setActiveMobileTab('chat')}
                    className={cn(
                        "flex flex-col items-center gap-1 transition-colors",
                        activeMobileTab === 'chat' ? "text-indigo-600" : "text-slate-400"
                    )}
                >
                    <Bot className="w-6 h-6" />
                    <span className="text-[9px] font-bold uppercase tracking-widest">Chat</span>
                </button>
                
                <button 
                    onClick={() => setActiveMobileTab('studio')}
                    className={cn(
                        "flex flex-col items-center gap-1 transition-colors",
                        activeMobileTab === 'studio' ? "text-indigo-600" : "text-slate-400"
                    )}
                >
                    <Zap className="w-5 h-5" />
                    <span className="text-[9px] font-bold uppercase tracking-widest">Studio</span>
                </button>
            </div>
        </div>
    )
}
