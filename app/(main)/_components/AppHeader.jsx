"use client"

import { UserButton } from '@stackframe/stack'
import Image from 'next/image'
import Link from 'next/link'
import React, { useContext, useState } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { useQuery, useMutation } from 'convex/react'
import { api } from '@/convex/_generated/api'
import { UserContext } from '@/app/_context/UserContext'
import { Plus, Layers } from 'lucide-react'
import { CreateProjectModal } from '@/app/(main)/dashboard/_components/CreateProjectModal'
import { toast } from 'sonner'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

function AppHeader() {
    const { userData } = useContext(UserContext);
    const pathname = usePathname();
    const router = useRouter();
    
    // Only show controls if we are deep inside a workspace route
    const isWorkspace = pathname?.startsWith('/workspace/');
    
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    
    // Fetch projects to populate the switcher dropdown
    const projects = useQuery(api.projects.getProjects, userData?._id ? { userId: userData._id } : "skip") || [];
    const createProject = useMutation(api.projects.createProject);
    
    // Extract current project ID from the URL path
    let currentProjectId = null;
    if (isWorkspace) {
        const parts = pathname.split('/');
        currentProjectId = parts[parts.length - 1];
    }

    const handleCreateProject = async (name) => {
        if (!userData?._id) return;
        try {
            const id = await createProject({ name, userId: userData._id });
            toast.success("Workspace created!");
            router.push(`/workspace/${id}`);
        } catch (err) {
            toast.error("Failed to create workspace");
        }
    };

    return (
        <div className='p-2.5 md:py-2.5 md:px-6 shadow-sm flex justify-between items-center px-3 bg-background border-b border-border'>
            
            {/* Hidden Modal rendered here so it triggers over everything */}
            <CreateProjectModal 
                isOpen={isCreateModalOpen} 
                onClose={() => setIsCreateModalOpen(false)} 
                onCreate={handleCreateProject} 
            />

            {/* Left side: Logo — hide text on mobile when in workspace (switcher takes that space) */}
            <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">
                <Link href="/dashboard" className="flex items-center gap-1.5 sm:gap-2.5">
                    <Image src="/logo.png" alt="CodexLM Logo" width={32} height={32} className="w-8 h-8 object-contain shrink-0" />
                    <span className={`text-base sm:text-lg md:text-xl font-black tracking-tighter text-foreground ${
                        isWorkspace ? 'hidden sm:inline' : ''
                    }`}>
                        Codex<span className="text-indigo-600">LM</span>
                    </span>
                </Link>
            </div>

            {/* Right side: Controls & Profile */}
            <div className='flex items-center gap-2 sm:gap-3 md:gap-5 min-w-0'>
                
                {isWorkspace && (
                    <div className="flex items-center gap-1.5 sm:gap-2 md:gap-3 min-w-0">
                        {/* Project Switcher Dropdown — compact on mobile */}
                        <Select 
                            value={currentProjectId || ""}
                            onValueChange={(value) => router.push(`/workspace/${value}`)}
                        >
                            <SelectTrigger className="w-[125px] sm:w-[190px] lg:w-[240px] bg-slate-100 dark:bg-slate-900 border-border hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors shadow-sm focus:ring-indigo-500 text-[11px] sm:text-xs font-medium h-9 min-w-0">
                                <div className="flex items-center gap-1.5 overflow-hidden min-w-0">
                                    <Layers className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                                    <span className="truncate min-w-0">
                                        <SelectValue placeholder="Workspace" />
                                    </span>
                                </div>
                            </SelectTrigger>
                            <SelectContent position="popper" className="w-[200px] bg-white dark:bg-slate-950 border border-border shadow-lg z-50">
                                {projects.map(p => (
                                    <SelectItem key={p._id} value={p._id} className="cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800">
                                        {p.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>

                        {/* Create Workspace Button — icon only on mobile */}
                        <button 
                            onClick={() => setIsCreateModalOpen(true)}
                            className="flex items-center gap-1.5 bg-indigo-50 dark:bg-indigo-900/30 hover:bg-indigo-100 dark:hover:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300 font-semibold p-2 sm:py-2 sm:px-3 rounded-lg transition-colors border border-indigo-200 dark:border-indigo-800 shadow-sm shrink-0"
                        >
                            <Plus className="w-4 h-4" />
                            <span className="hidden sm:inline text-sm">New</span>
                        </button>
                    </div>
                )}
                
                <UserButton />
            </div>
        </div>
    )
}

export default AppHeader