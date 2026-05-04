"use client"

import { useContext, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useQuery, useMutation } from "convex/react"
import { api } from "@/convex/_generated/api"
import { UserContext } from "@/app/_context/UserContext"
import { Plus, Folder, Settings, MoreVertical, LayoutGrid, Clock, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"
import { CreateProjectModal } from './_components/CreateProjectModal'
import { ProjectSettingsModal } from './_components/ProjectSettingsModal'

export default function Dashboard() {
    const router = useRouter();
    const { userData } = useContext(UserContext);
    
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
    const [activeSettingsProject, setActiveSettingsProject] = useState(null);
    
    // Fetch projects
    const projects = useQuery(api.projects.getProjects, userData?._id ? { userId: userData._id } : "skip");
    
    const createProject = useMutation(api.projects.createProject);
    const updateProjectMemory = useMutation(api.projects.updateProjectMemory);
    const deleteProject = useMutation(api.projects.deleteProject);

    const handleCreateProject = async (name) => {
        if (!userData?._id) return;
        try {
            const id = await createProject({ name, userId: userData._id });
            toast.success("Project created!");
            router.push(`/workspace/${id}`);
        } catch (err) {
            toast.error("Failed to create project");
        }
    };

    const handleOpenSettings = (e, project) => {
        e.stopPropagation();
        setActiveSettingsProject(project);
        setIsSettingsModalOpen(true);
    };

    const handleDeleteProject = async (projectId) => {
        try {
            await deleteProject({ projectId });
            toast.success("Project deleted");
        } catch (err) {
            toast.error("Failed to delete project");
        }
    };

    return (
        <div className="h-full w-full bg-slate-50 dark:bg-slate-950 overflow-y-auto p-8 md:p-12 lg:p-16">
            <CreateProjectModal 
                isOpen={isCreateModalOpen} 
                onClose={() => setIsCreateModalOpen(false)} 
                onCreate={handleCreateProject} 
            />
            
            <ProjectSettingsModal 
                isOpen={isSettingsModalOpen}
                onClose={() => setIsSettingsModalOpen(false)}
                project={activeSettingsProject}
                onUpdateMemory={async (id, memory) => {
                    await updateProjectMemory({ projectId: id, memory });
                    toast.success("Preferences saved");
                }}
                onDeleteProject={handleDeleteProject}
            />

            <div className="max-w-7xl mx-auto space-y-10">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
                    <div className="space-y-1">
                        <h1 className="text-3xl md:text-4xl font-black tracking-tight text-foreground">Your Projects</h1>
                        <p className="text-muted-foreground text-lg">Manage your workspaces and start researching.</p>
                    </div>
                </div>

                {projects === undefined ? (
                    <div className="flex justify-center items-center py-20">
                        <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
                    </div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                        
                        {/* Create Project Card */}
                        <button 
                            onClick={() => {
                                if (!userData?._id) {
                                    toast.error("Please wait, your session is still synchronizing...");
                                    return;
                                }
                                setIsCreateModalOpen(true);
                            }}
                            className="group flex flex-col items-center justify-center h-48 rounded-[2rem] border-2 border-dashed border-indigo-200 dark:border-indigo-900/50 bg-indigo-50/50 dark:bg-indigo-950/20 hover:bg-indigo-100/50 dark:hover:bg-indigo-900/40 hover:border-indigo-300 dark:hover:border-indigo-800 transition-all duration-300 cursor-pointer"
                        >
                            <div className="h-14 w-14 rounded-full bg-white dark:bg-slate-900 shadow-sm border border-indigo-100 dark:border-indigo-900 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform duration-300">
                                <Plus className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
                            </div>
                            <span className="font-semibold text-indigo-900 dark:text-indigo-300">Create New Project</span>
                        </button>

                        {/* Existing Projects */}
                        {projects.map((project) => (
                            <div 
                                key={project._id}
                                onClick={() => router.push(`/workspace/${project._id}`)}
                                className="group relative flex flex-col h-48 rounded-[2rem] border border-border bg-white dark:bg-slate-900 shadow-sm hover:shadow-md hover:border-indigo-200 dark:hover:border-indigo-800 transition-all duration-300 cursor-pointer overflow-hidden p-6"
                            >
                                <div className="flex justify-between items-start mb-4">
                                    <div className="h-12 w-12 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center group-hover:bg-indigo-100 dark:group-hover:bg-indigo-900/50 transition-colors">
                                        <Folder className="h-6 w-6 text-slate-500 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors" />
                                    </div>
                                    <Button 
                                        variant="ghost" 
                                        size="icon" 
                                        onClick={(e) => handleOpenSettings(e, project)}
                                        className="h-8 w-8 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 -mr-2 -mt-2 opacity-0 group-hover:opacity-100 transition-opacity"
                                    >
                                        <Settings className="h-4 w-4" />
                                    </Button>
                                </div>
                                <div className="mt-auto space-y-1">
                                    <h3 className="font-bold text-lg text-foreground line-clamp-1">{project.name}</h3>
                                    <div className="flex items-center text-xs text-muted-foreground gap-1.5">
                                        <Clock className="h-3 w-3" />
                                        <span>Updated recently</span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    )
}