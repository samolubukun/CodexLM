"use client"

import { useState } from 'react'
import ProjectSidebar from './_components/ProjectSidebar'
import SourcesPanel from './_components/SourcesPanel'
import ChatPanel from './_components/ChatPanel'
import StudioPanel from './_components/StudioPanel'
import { cn } from '@/lib/utils'

export default function Dashboard() {
    const [selectedProjectId, setSelectedProjectId] = useState(null);
    const [selectedSourceId, setSelectedSourceId] = useState(null);
    const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

    return (
        <div className='flex h-full w-full bg-slate-50 dark:bg-slate-950 overflow-hidden'>
            {/* Project Sidebar */}
            <ProjectSidebar 
                selectedProjectId={selectedProjectId} 
                onProjectSelect={setSelectedProjectId} 
                isCollapsed={isSidebarCollapsed}
                setIsCollapsed={setIsSidebarCollapsed}
            />

            {/* Left Panel: Sources */}
            <div className='w-60 border-r border-border bg-white dark:bg-slate-900 flex-shrink-0'>
                <SourcesPanel 
                    projectId={selectedProjectId}
                    onSourceSelect={setSelectedSourceId} 
                    selectedSourceId={selectedSourceId} 
                />
            </div>

            {/* Center Panel: Chat */}
            <div className='flex-1 flex flex-col min-w-0'>
                <ChatPanel 
                    projectId={selectedProjectId}
                    selectedSourceId={selectedSourceId} 
                />
            </div>

            {/* Right Panel: Studio */}
            <div className={cn(
                'border-l border-border bg-white dark:bg-slate-900 flex-shrink-0 transition-all duration-300',
                isSidebarCollapsed ? 'flex-1' : 'w-96'
            )}>
                <StudioPanel 
                    projectId={selectedProjectId}
                />
            </div>
        </div>
    )
}