"use client"

import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Plus, Folder, Hash, Settings, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { useContext, useState } from "react";
import { UserContext } from "@/app/_context/UserContext";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { CreateProjectModal } from "./CreateProjectModal";
import { ProjectSettingsModal } from "./ProjectSettingsModal";

export default function ProjectSidebar({ selectedProjectId, onProjectSelect, isCollapsed, setIsCollapsed }) {
    const { userData } = useContext(UserContext);
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
    const [activeSettingsProject, setActiveSettingsProject] = useState(null);
    
    const projects = useQuery(api.projects.getProjects, userData?._id ? { userId: userData._id } : "skip") || [];
    const createProject = useMutation(api.projects.createProject);
    const updateProjectMemory = useMutation(api.projects.updateProjectMemory);
    const deleteProject = useMutation(api.projects.deleteProject);

    const handleCreateProject = async (name) => {
        if (!userData?._id) return;
        try {
            const id = await createProject({ name, userId: userData._id });
            onProjectSelect(id);
            toast.success("Project created!");
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
            if (selectedProjectId === projectId) {
                onProjectSelect(null);
            }
            toast.success("Project deleted");
        } catch (err) {
            toast.error("Failed to delete project");
        }
    };

    return (
        <motion.div 
            initial={false}
            animate={{ width: isCollapsed ? 48 : 210 }}
            className="border-r border-border bg-slate-100/50 dark:bg-slate-950 flex flex-col h-full relative group/sidebar min-w-[48px] overflow-hidden"
        >
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

            <div className={cn(
                "p-2 border-b border-border flex justify-between items-center bg-white/50 dark:bg-slate-900/50 h-12",
                isCollapsed && "justify-center px-0"
            )}>
                {!isCollapsed && <h2 className="font-semibold text-xs uppercase tracking-wider text-muted-foreground ml-1">Projects</h2>}
                <Button 
                    variant="ghost" 
                    size="icon" 
                    onClick={() => {
                        if (!userData?._id) {
                            toast.error("Please wait, your session is still synchronizing...");
                            return;
                        }
                        setIsCreateModalOpen(true);
                    }} 
                    className={cn("h-8 w-8", isCollapsed && "h-8 w-8")}
                >
                    <Plus className="h-4 w-4" />
                </Button>
            </div>

            <ScrollArea className="flex-1">
                <div className={cn("p-2 space-y-1", isCollapsed && "px-1")}>
                    {projects.map((project) => (
                        <div key={project._id} className="group relative">
                            <button
                                onClick={() => onProjectSelect(project._id)}
                                title={project.name}
                                className={cn(
                                    "w-full flex items-center gap-2 px-2 py-2 text-sm font-medium rounded-md transition-colors",
                                    selectedProjectId === project._id
                                        ? "bg-white dark:bg-slate-800 text-primary shadow-sm ring-1 ring-black/5 dark:ring-white/10"
                                        : "text-muted-foreground hover:bg-white/50 dark:hover:bg-slate-800/50",
                                    isCollapsed && "justify-center px-0"
                                )}
                            >
                                <Folder className="h-4 w-4 shrink-0" />
                                {!isCollapsed && <span className="truncate flex-1 text-left">{project.name}</span>}
                            </button>
                            {!isCollapsed && (
                                <Button 
                                    variant="ghost" 
                                    size="icon" 
                                    onClick={(e) => handleOpenSettings(e, project)}
                                    className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity"
                                >
                                    <Settings className="h-3 w-3" />
                                </Button>
                            )}
                        </div>
                    ))}
                    {projects.length === 0 && !isCollapsed && (
                        <div className="p-4 text-center text-xs text-muted-foreground italic">
                            No projects yet.
                        </div>
                    )}
                </div>
            </ScrollArea>

            {/* Toggle Button */}
            <Button
                variant="outline"
                size="icon"
                onClick={() => setIsCollapsed(!isCollapsed)}
                className="absolute -right-3 top-20 h-6 w-6 rounded-full border border-border bg-background shadow-sm z-50 opacity-0 group-hover/sidebar:opacity-100 transition-opacity"
            >
                {isCollapsed ? <ChevronRight className="h-3 w-3" /> : <ChevronLeft className="h-3 w-3" />}
            </Button>
        </motion.div>
    );
}
