"use client"

import { useContext, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useQuery, useMutation } from "convex/react"
import { api } from "@/convex/_generated/api"
import { UserContext } from "@/app/_context/UserContext"
import { Plus, Folder, Settings, MoreVertical, LayoutGrid, Clock, Loader2, Layers, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"
import { CreateProjectModal } from './_components/CreateProjectModal'
import { DeleteProjectModal } from './_components/DeleteProjectModal'

export default function Dashboard() {
    const router = useRouter();
    const { userData } = useContext(UserContext);
    
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [activeProjectToDelete, setActiveProjectToDelete] = useState(null);
    
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

    const handleOpenDelete = (e, project) => {
        e.stopPropagation();
        setActiveProjectToDelete(project);
        setIsDeleteModalOpen(true);
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
            
            <DeleteProjectModal 
                isOpen={isDeleteModalOpen}
                onClose={() => setIsDeleteModalOpen(false)}
                project={activeProjectToDelete}
                onDeleteProject={handleDeleteProject}
            />

            <div className="max-w-6xl mx-auto space-y-8">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
                    <div className="space-y-1.5">
                        <h1 className="text-3xl md:text-4xl font-black tracking-tight text-slate-900">Projects</h1>
                        <p className="text-slate-500 font-medium">Select a workspace or create a new one.</p>
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
                            className="group flex flex-col items-center justify-center h-[220px] rounded-3xl border-2 border-dashed border-slate-200 hover:border-indigo-400 bg-slate-50/50 hover:bg-indigo-50/30 transition-all duration-300 cursor-pointer"
                        >
                            <div className="h-16 w-16 rounded-full bg-white shadow-sm border border-slate-200 group-hover:bg-indigo-100 group-hover:border-indigo-200 group-hover:scale-110 flex items-center justify-center mb-4 transition-all duration-300">
                                <Plus className="h-6 w-6 text-slate-400 group-hover:text-indigo-600 transition-colors duration-300" />
                            </div>
                            <span className="font-bold text-[15px] text-slate-500 group-hover:text-indigo-700 transition-colors duration-300">Create New Project</span>
                        </button>

                        {/* Existing Projects */}
                        {projects.map((project) => (
                            <div 
                                key={project._id}
                                onClick={() => router.push(`/workspace/${project._id}`)}
                                className="group relative flex flex-col h-[220px] rounded-3xl border border-slate-200 bg-white shadow-sm hover:shadow-xl hover:-translate-y-1.5 hover:border-indigo-300 transition-all duration-300 cursor-pointer overflow-hidden p-6"
                            >
                                <Button 
                                    variant="ghost" 
                                    size="icon" 
                                    onClick={(e) => handleOpenDelete(e, project)}
                                    className="absolute top-4 right-4 h-8 w-8 text-slate-300 hover:text-red-600 hover:bg-red-50 opacity-0 group-hover:opacity-100 transition-all z-10"
                                >
                                    <Trash2 className="h-4 w-4" />
                                </Button>

                                <div className="flex-1 flex flex-col items-center justify-center mt-2">
                                    <div className="h-16 w-16 rounded-2xl bg-indigo-50/50 border border-indigo-100 flex items-center justify-center group-hover:bg-indigo-100 group-hover:scale-110 transition-all duration-300 shadow-sm shadow-indigo-100">
                                        <Layers className="h-8 w-8 text-indigo-500 group-hover:text-indigo-600 transition-colors" />
                                    </div>
                                </div>

                                <div className="mt-auto pt-4 text-center space-y-1.5 border-t border-slate-50">
                                    <h3 className="font-bold text-[16px] text-slate-900 line-clamp-1">{project.name}</h3>
                                    <div className="flex items-center justify-center text-[12px] font-medium text-slate-400 gap-1.5">
                                        <Clock className="h-3.5 w-3.5" />
                                        <span>Active recently</span>
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