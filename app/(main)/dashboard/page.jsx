"use client"

import { useContext, useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { useQuery, useMutation } from "convex/react"
import { api } from "@/convex/_generated/api"
import { UserContext } from "@/app/_context/UserContext"
import { 
    Plus, Folder, Settings, MoreVertical, LayoutGrid, Clock, 
    Loader2, Layers, Trash2, Search, BookOpen, MessageSquare, 
    Zap, ArrowRight, TrendingUp, BarChart3, Filter
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { toast } from "sonner"
import { CreateProjectModal } from './_components/CreateProjectModal'
import { DeleteProjectModal } from './_components/DeleteProjectModal'
import moment from 'moment'
import { motion, AnimatePresence } from 'framer-motion'

export default function Dashboard() {
    const router = useRouter();
    const { userData } = useContext(UserContext);
    
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [activeProjectToDelete, setActiveProjectToDelete] = useState(null);
    const [searchQuery, setSearchQuery] = useState("");
    
    // Fetch projects
    const projects = useQuery(api.projects.getProjects, userData?._id ? { userId: userData._id } : "skip");
    
    const createProject = useMutation(api.projects.createProject);
    const deleteProject = useMutation(api.projects.deleteProject);

    const filteredProjects = useMemo(() => {
        if (!projects) return [];
        return projects.filter(p => p.name.toLowerCase().includes(searchQuery.toLowerCase()));
    }, [projects, searchQuery]);

    const stats = useMemo(() => {
        if (!projects) return { total: 0, sources: 0, messages: 0, jobs: 0 };
        return projects.reduce((acc, p) => ({
            total: acc.total + 1,
            sources: acc.sources + (p.stats?.sources || 0),
            messages: acc.messages + (p.stats?.messages || 0),
            jobs: acc.jobs + (p.stats?.jobs || 0),
        }), { total: 0, sources: 0, messages: 0, jobs: 0 });
    }, [projects]);

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
        <div className="h-full w-full bg-slate-50 dark:bg-slate-950 overflow-y-auto">
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

            <div className="max-w-7xl mx-auto p-6 md:p-10 lg:p-12 space-y-10">
                {/* Header Section */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                    <div className="space-y-1.5">
                        <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400">
                            <Layers className="w-5 h-5" />
                            <span className="text-[10px] font-black uppercase tracking-[0.2em]">Workspace Manager</span>
                        </div>
                        <h1 className="text-4xl md:text-5xl font-black tracking-tight text-slate-900 dark:text-white">Your Projects</h1>
                        <p className="text-slate-500 font-medium">Manage your knowledge bases and AI studio outputs.</p>
                    </div>

                    <Button 
                        onClick={() => {
                            if (!userData?._id) {
                                toast.error("Please wait, your session is still synchronizing...");
                                return;
                            }
                            setIsCreateModalOpen(true);
                        }}
                        className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl px-6 py-6 h-auto text-[13px] font-black uppercase tracking-widest shadow-xl shadow-indigo-500/20 transition-all hover:scale-[1.02] active:scale-[0.98]"
                    >
                        <Plus className="w-5 h-5 mr-2" />
                        New Project
                    </Button>
                </div>

                {/* Stats Overview */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                    {[
                        { label: 'Total Projects', value: stats.total, icon: Layers, color: 'bg-indigo-500' },
                        { label: 'Total Sources', value: stats.sources, icon: BookOpen, color: 'bg-blue-500' },
                        { label: 'AI Messages', value: stats.messages, icon: MessageSquare, color: 'bg-emerald-500' },
                        { label: 'Studio Jobs', value: stats.jobs, icon: Zap, color: 'bg-amber-500' },
                    ].map((s, i) => (
                        <div key={i} className="p-4 sm:p-5 bg-white dark:bg-slate-900 rounded-[1.5rem] sm:rounded-[2rem] border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col sm:flex-row items-center sm:items-center text-center sm:text-left gap-2 sm:gap-4 min-w-0">
                            <div className={`w-10 h-10 sm:w-12 sm:h-12 ${s.color} rounded-xl sm:rounded-2xl flex items-center justify-center shadow-lg shadow-black/5 shrink-0`}>
                                <s.icon className="w-5 h-5 text-white" />
                            </div>
                            <div className="min-w-0 flex-1">
                                <p className="text-[9px] sm:text-[10px] font-black uppercase tracking-wider sm:tracking-widest text-slate-400 leading-tight mb-1 whitespace-nowrap">{s.label}</p>
                                <p className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white leading-none">{s.value}</p>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Search & Filtering */}
                <div className="flex flex-col sm:flex-row gap-4 items-center bg-white dark:bg-slate-900 p-2 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 shadow-sm shadow-black/[0.02]">
                    <div className="relative flex-1 w-full">
                        <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <Input 
                            placeholder="Search projects..." 
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full bg-transparent border-none pl-14 pr-6 py-6 h-auto text-[15px] focus-visible:ring-0 placeholder:text-slate-400 font-medium"
                        />
                    </div>
                    <div className="flex items-center gap-2 pr-2">
                        <Button variant="ghost" className="rounded-full px-4 text-slate-400 hover:text-slate-900">
                            <Filter className="w-4 h-4 mr-2" />
                            <span className="text-xs font-bold uppercase tracking-widest">Filter</span>
                        </Button>
                    </div>
                </div>

                {/* Projects Grid */}
                {projects === undefined ? (
                    <div className="flex flex-col justify-center items-center py-32 space-y-4">
                        <Loader2 className="h-10 w-10 animate-spin text-indigo-600" />
                        <p className="text-xs font-black uppercase tracking-[0.3em] text-slate-400 animate-pulse">Synchronizing Intelligence</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
                        {/* Create Project Card */}
                        <motion.button 
                            whileHover={{ y: -8, scale: 1.01 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={() => setIsCreateModalOpen(true)}
                            className="group flex flex-col items-center justify-center min-h-[280px] rounded-[3rem] border-2 border-dashed border-slate-200 dark:border-slate-800 hover:border-indigo-400 bg-white/50 dark:bg-slate-900/50 hover:bg-indigo-50/30 transition-all duration-300 cursor-pointer p-8"
                        >
                            <div className="h-20 w-20 rounded-[2rem] bg-white dark:bg-slate-800 shadow-xl shadow-black/[0.03] border border-slate-200 dark:border-slate-700 group-hover:bg-indigo-100 group-hover:border-indigo-200 flex items-center justify-center mb-6 transition-all duration-300">
                                <Plus className="h-8 w-8 text-slate-400 group-hover:text-indigo-600 transition-colors duration-300" />
                            </div>
                            <div className="text-center space-y-2">
                                <h3 className="font-black text-xl text-slate-900 dark:text-white group-hover:text-indigo-700">Create Project</h3>
                                <p className="text-xs font-medium text-slate-400 max-w-[180px] mx-auto">Start a new knowledge base workspace.</p>
                            </div>
                        </motion.button>

                        {/* Existing Projects */}
                        <AnimatePresence mode="popLayout">
                            {filteredProjects.map((project) => (
                                <motion.div 
                                    layout
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, scale: 0.95 }}
                                    key={project._id}
                                    onClick={() => router.push(`/workspace/${project._id}`)}
                                    className="group relative flex flex-col min-h-[280px] rounded-[3rem] border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm hover:shadow-2xl hover:border-indigo-300 dark:hover:border-indigo-500/50 transition-all duration-500 cursor-pointer overflow-hidden"
                                >
                                    {/* Project Header / Type Icon */}
                                    <div className="p-8 pb-4 flex justify-between items-start">
                                        <div className="h-14 w-14 rounded-2xl bg-indigo-50 dark:bg-indigo-900/30 border border-indigo-100 dark:border-indigo-500/20 flex items-center justify-center group-hover:scale-110 transition-transform duration-500 shadow-sm">
                                            <Layers className="h-7 w-7 text-indigo-600 dark:text-indigo-400" />
                                        </div>
                                        <Button 
                                            variant="ghost" 
                                            size="icon" 
                                            onClick={(e) => handleOpenDelete(e, project)}
                                            className="h-10 w-10 text-slate-300 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-2xl opacity-0 group-hover:opacity-100 transition-all z-10"
                                        >
                                            <Trash2 className="h-5 w-5" />
                                        </Button>
                                    </div>

                                    {/* Content */}
                                    <div className="px-8 flex-1 flex flex-col justify-end pb-8">
                                        <div className="space-y-1 mb-6">
                                            <h3 className="font-black text-2xl text-slate-900 dark:text-white line-clamp-1 group-hover:text-indigo-600 transition-colors">{project.name}</h3>
                                            <div className="flex items-center text-[10px] font-black uppercase tracking-widest text-slate-400 gap-1.5">
                                                <Clock className="h-3 w-3" />
                                                <span>Active {moment(project.lastActivity).fromNow()}</span>
                                            </div>
                                        </div>

                                        {/* Real Metadata Stats */}
                                        <div className="flex items-center gap-2 sm:gap-4 pt-6 border-t border-slate-100 dark:border-slate-800">
                                            <div className="flex flex-col min-w-0">
                                                <span className="text-[14px] sm:text-[16px] font-black text-slate-900 dark:text-white leading-none truncate">{project.stats?.sources || 0}</span>
                                                <span className="text-[8px] sm:text-[9px] font-black uppercase tracking-wider text-slate-400 truncate">Sources</span>
                                            </div>
                                            <div className="w-px h-6 bg-slate-100 dark:bg-slate-800 shrink-0" />
                                            <div className="flex flex-col min-w-0">
                                                <span className="text-[14px] sm:text-[16px] font-black text-slate-900 dark:text-white leading-none truncate">{project.stats?.messages || 0}</span>
                                                <span className="text-[8px] sm:text-[9px] font-black uppercase tracking-wider text-slate-400 truncate">Chats</span>
                                            </div>
                                            <div className="w-px h-6 bg-slate-100 dark:border-slate-800 shrink-0" />
                                            <div className="flex flex-col min-w-0">
                                                <span className="text-[14px] sm:text-[16px] font-black text-slate-900 dark:text-white leading-none truncate">{project.stats?.jobs || 0}</span>
                                                <span className="text-[8px] sm:text-[9px] font-black uppercase tracking-wider text-slate-400 truncate">Jobs</span>
                                            </div>
                                            <div className="ml-auto shrink-0">
                                                <div className="h-8 w-8 sm:h-10 sm:w-10 rounded-full bg-slate-50 dark:bg-slate-800 flex items-center justify-center group-hover:bg-indigo-600 transition-all duration-300 group-hover:translate-x-1">
                                                    <ArrowRight className="w-3 h-3 sm:w-4 sm:h-4 text-slate-400 group-hover:text-white transition-colors" />
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    
                                    {/* Hover Overlay Gradient */}
                                    <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/0 via-transparent to-indigo-500/0 group-hover:from-indigo-500/[0.02] group-hover:to-violet-500/[0.02] pointer-events-none transition-all duration-500" />
                                </motion.div>
                            ))}
                        </AnimatePresence>
                    </div>
                )}

                {/* Empty State */}
                {projects !== undefined && filteredProjects.length === 0 && searchQuery && (
                    <div className="flex flex-col items-center justify-center py-20 text-center space-y-4">
                        <div className="w-20 h-20 bg-slate-100 dark:bg-slate-900 rounded-full flex items-center justify-center">
                            <Search className="w-10 h-10 text-slate-300" />
                        </div>
                        <div className="space-y-1">
                            <h3 className="font-bold text-slate-900 dark:text-white">No projects found</h3>
                            <p className="text-sm text-slate-500">We couldn't find anything matching "{searchQuery}"</p>
                        </div>
                        <Button variant="outline" onClick={() => setSearchQuery("")} className="rounded-xl font-bold">Clear Search</Button>
                    </div>
                )}
            </div>
        </div>
    )
}