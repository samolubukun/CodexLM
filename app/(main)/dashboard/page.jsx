"use client"

import { useState } from 'react'
import ProjectSidebar from './_components/ProjectSidebar'
import SourcesPanel from './_components/SourcesPanel'
import ChatPanel from './_components/ChatPanel'
import StudioPanel from './_components/StudioPanel'
import SourceViewer from './_components/SourceViewer'
import { cn } from '@/lib/utils'

export default function Dashboard() {
    const [selectedProjectId, setSelectedProjectId] = useState(null);
    const [selectedSourceId, setSelectedSourceId] = useState(null);
    const [activePassage, setActivePassage] = useState(null);
    const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
    const [leftPanelTab, setLeftPanelTab] = useState('list'); // 'list' or 'source'

    const handleCitationClick = (citation) => {
        setSelectedSourceId(citation.sourceId);
        setActivePassage(citation);
        setLeftPanelTab('source');
    };

    return (
        <div className='flex h-full w-full bg-slate-50 dark:bg-slate-950 overflow-hidden'>
            {/* Project Sidebar */}
            <ProjectSidebar 
                selectedProjectId={selectedProjectId} 
                onProjectSelect={setSelectedProjectId} 
                isCollapsed={isSidebarCollapsed}
                setIsCollapsed={setIsSidebarCollapsed}
            />

            {/* Left Panel: Sources / Source Viewer */}
            <div className={cn(
                'border-r border-border bg-white dark:bg-slate-900 flex-shrink-0 relative overflow-hidden transition-all duration-300',
                isSidebarCollapsed ? 'w-[450px]' : 'w-[300px]'
            )}>
                {leftPanelTab === 'source' && selectedSourceId ? (
                    <SourceViewer 
                        sourceId={selectedSourceId}
                        activePassage={activePassage}
                        onBack={() => setLeftPanelTab('list')}
                    />
                ) : (
                    <SourcesPanel 
                        projectId={selectedProjectId}
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
                    projectId={selectedProjectId}
                    selectedSourceId={selectedSourceId} 
                    onCitationClick={handleCitationClick}
                />
            </div>

            {/* Right Panel: Always StudioPanel */}
            <div className={cn(
                'border-l border-border bg-white dark:bg-slate-900 flex-shrink-0 transition-all duration-300 overflow-hidden min-w-0',
                isSidebarCollapsed ? 'flex-1' : 'w-96'
            )}>
                <StudioPanel 
                    projectId={selectedProjectId}
                />
            </div>
        </div>
    )
}