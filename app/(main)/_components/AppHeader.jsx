"use client"

import { UserButton } from '@stackframe/stack'
import Image from 'next/image'
import Link from 'next/link'
import React, { useContext, useState } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { useQuery, useMutation } from 'convex/react'
import { api } from '@/convex/_generated/api'
import { UserContext } from '@/app/_context/UserContext'
import { Plus, Folder } from 'lucide-react'
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
        <div className='p-3 md:p-4 shadow-sm flex justify-between items-center px-4 md:px-6 bg-background border-b border-border'>
            
            {/* Hidden Modal rendered here so it triggers over everything */}
            <CreateProjectModal 
                isOpen={isCreateModalOpen} 
                onClose={() => setIsCreateModalOpen(false)} 
                onCreate={handleCreateProject} 
            />

            {/* Left side: Logo */}
            <div className="flex items-center gap-2 md:gap-4">
                <Link href="/dashboard" className="flex items-center gap-2.5">
                    <Image src="/logo.png" alt="CodexLM Logo" width={32} height={32} className="w-8 h-8 md:w-9 md:h-9 object-contain" />
                    <span className="text-xl font-black tracking-tighter text-foreground hidden sm:block">
                        Codex<span className="text-indigo-600">LM</span>
                    </span>
                </Link>
            </div>

            {/* Right side: Controls & Profile */}
            <div className='flex items-center gap-3 md:gap-5'>
                
                {isWorkspace && (
                    <div className="flex items-center gap-2 md:gap-3">
                        {/* Project Switcher Dropdown */}
                        <Select 
                            value={currentProjectId || ""}
                            onValueChange={(value) => router.push(`/workspace/${value}`)}
                        >
                            <SelectTrigger className="w-[160px] sm:w-[200px] lg:w-[240px] bg-slate-100 dark:bg-slate-900 border-border hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors shadow-sm focus:ring-indigo-500 text-sm font-medium h-10">
                                <div className="flex items-center gap-2 overflow-hidden">
                                    <Folder className="w-4 h-4 text-slate-500 shrink-0" />
                                    <span className="truncate">
                                        <SelectValue placeholder="Select Workspace" />
                                    </span>
                                </div>
                            </SelectTrigger>
                            <SelectContent position="popper" className="w-[160px] sm:w-[200px] lg:w-[240px] bg-white dark:bg-slate-950 border border-border shadow-lg z-50">
                                {projects.map(p => (
                                    <SelectItem key={p._id} value={p._id} className="cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800">
                                        {p.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>

                        {/* Create Workspace Button */}
                        <button 
                            onClick={() => setIsCreateModalOpen(true)}
                            className="flex items-center gap-1.5 bg-indigo-50 dark:bg-indigo-900/30 hover:bg-indigo-100 dark:hover:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300 text-sm font-semibold py-2 px-3 rounded-lg transition-colors border border-indigo-200 dark:border-indigo-800 shadow-sm"
                        >
                            <Plus className="w-4 h-4" />
                            <span className="hidden sm:inline">New Workspace</span>
                        </button>
                        
                        {/* Separator line */}
                        <div className="hidden sm:block w-px h-6 bg-border mx-1" />
                    </div>
                )}
                
                <UserButton />
            </div>
        </div>
    )
}

export default AppHeader