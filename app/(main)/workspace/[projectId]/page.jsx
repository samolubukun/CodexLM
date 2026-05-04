"use client"

import { useState, use } from 'react'
import SourcesPanel from '@/app/(main)/dashboard/_components/SourcesPanel'
import ChatPanel from '@/app/(main)/dashboard/_components/ChatPanel'
import StudioPanel from '@/app/(main)/dashboard/_components/StudioPanel'
import SourceViewer from '@/app/(main)/dashboard/_components/SourceViewer'
import { cn } from '@/lib/utils'

export default function Workspace({ params }) {
    // Unwind params Promise for Next.js 14+ best practices if it's dynamic
    const resolvedParams = use(params);
    const projectId = resolvedParams.projectId;

    const [selectedSourceId, setSelectedSourceId] = useState(null);
    const [activePassage, setActivePassage] = useState(null);
    const [leftPanelTab, setLeftPanelTab] = useState('list'); // 'list' or 'source'

    const handleCitationClick = (citation) => {
        setSelectedSourceId(citation.sourceId);
        setActivePassage(citation);
        setLeftPanelTab('source');
    };

    return (
        <div className='flex h-full w-full bg-slate-50 dark:bg-slate-950 overflow-hidden'>
            {/* Left Panel: Sources / Source Viewer */}
            <div className={cn(
                'border-r border-border bg-white dark:bg-slate-900 flex-shrink-0 relative overflow-hidden transition-all duration-300 w-[320px]'
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
                        onSourceSelect={(id) => {
                            setSelectedSourceId(id);
                            setLeftPanelTab('source');
                            setActivePassage(null);
                        }} 
                        selectedSourceId={selectedSourceId} 
                    />
                )}
            </div>

            {/* Center Panel: Chat */}
            <div className='flex-1 flex flex-col min-w-0'>
                <ChatPanel 
                    projectId={projectId}
                    selectedSourceId={selectedSourceId} 
                    onCitationClick={handleCitationClick}
                />
            </div>

            {/* Right Panel: StudioPanel */}
            <div className={cn(
                'border-l border-border bg-white dark:bg-slate-900 flex-shrink-0 transition-all duration-300 overflow-hidden min-w-0 flex-1'
            )}>
                <StudioPanel 
                    projectId={projectId}
                />
            </div>
        </div>
    )
}
