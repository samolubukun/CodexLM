import { Zap } from 'lucide-react'

export function InfographicViewer({ data }) {
    return (
        <div className="space-y-6 pb-12 max-w-6xl mx-auto animate-in fade-in duration-700">
            {/* High-Info Header Section */}
            <div className="p-8 bg-[#1e1b4b] rounded-[2.5rem] text-white shadow-2xl relative overflow-hidden border border-indigo-500/20">
                <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
                    <div className="lg:col-span-7 space-y-4">
                        <div className="flex items-center gap-3">
                            <span className="px-2.5 py-1 bg-indigo-500/30 border border-indigo-400/30 rounded-lg text-[9px] font-black uppercase tracking-[0.2em]">Intelligence Synthesis</span>
                            <div className="h-px flex-1 bg-gradient-to-r from-indigo-500/50 to-transparent" />
                        </div>
                        <h4 className="text-3xl font-black leading-[1.1] tracking-tight max-w-xl">{data.title}</h4>
                        <p className="text-indigo-200/70 text-xs font-medium leading-relaxed max-w-lg">{data.mainGoal}</p>
                    </div>
                    
                    {/* Stats Grid - Now wraps correctly */}
                    <div className="lg:col-span-5 grid grid-cols-2 gap-3 overflow-x-auto sleek-scroll">
                        {data.stats?.slice(0, 4).map((stat, i) => (
                            <div key={i} className="bg-white/5 backdrop-blur-xl p-4 rounded-2xl border border-white/10 flex flex-col justify-between h-24">
                                <p className="text-[8px] font-black uppercase tracking-widest text-indigo-300 leading-none">{stat.label}</p>
                                <p className="text-lg font-black text-white mt-1">{stat.value}</p>
                                <div className="h-1 w-8 bg-indigo-500 rounded-full mt-2" />
                            </div>
                        ))}
                    </div>
                </div>
                {/* Visual texture */}
                <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-600/10 blur-[120px] rounded-full -mr-48 -mt-48" />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Column 1: Core Insights */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="p-8 bg-white dark:bg-slate-900 rounded-[2.5rem] border border-border shadow-sm">
                        <div className="flex items-center gap-3 mb-8">
                            <div className="w-8 h-8 rounded-xl bg-indigo-600 flex items-center justify-center text-white">
                                <Zap className="w-4 h-4" />
                            </div>
                            <h5 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Critical Analysis & Takeaways</h5>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                            {data.keyTakeaways?.map((item, i) => (
                                <div key={i} className="flex gap-4 group">
                                    <div className="mt-1 w-1.5 h-1.5 rounded-full bg-indigo-600 shrink-0 group-hover:scale-150 transition-all" />
                                    <p className="text-[13px] text-slate-600 dark:text-slate-300 leading-relaxed font-medium">{item}</p>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* New Info Section: Action Items */}
                    <div className="p-8 bg-emerald-50/50 dark:bg-emerald-950/10 rounded-[2.5rem] border border-emerald-100 dark:border-emerald-900/30">
                        <h5 className="text-[10px] font-black uppercase tracking-[0.2em] text-emerald-600 mb-6">Actionable Next Steps</h5>
                        <div className="flex flex-wrap gap-3">
                            {data.timeline?.map((step, i) => (
                                <div key={i} className="px-5 py-3 bg-white dark:bg-slate-800 rounded-2xl border border-emerald-200 dark:border-emerald-800/50 flex items-center gap-3">
                                    <span className="text-[10px] font-black text-emerald-600">{i+1}</span>
                                    <span className="text-xs font-bold text-slate-700 dark:text-slate-200">{step.stage}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Column 2: Detailed Process / Specs */}
                <div className="p-8 bg-slate-50 dark:bg-slate-900/50 rounded-[2.5rem] border border-border">
                    <h5 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-8">Structural Roadmap</h5>
                    <div className="space-y-8 relative">
                        <div className="absolute left-[11px] top-2 bottom-2 w-px bg-slate-200 dark:bg-slate-800" />
                        {data.timeline?.map((step, i) => (
                            <div key={i} className="flex gap-6 relative">
                                <div className="w-[23px] h-[23px] rounded-full bg-white dark:bg-slate-800 border-2 border-indigo-600 flex items-center justify-center text-[9px] font-black z-10 shrink-0">
                                    {i+1}
                                </div>
                                <div className="space-y-1.5 pt-0.5">
                                    <p className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-tight">{step.stage}</p>
                                    <p className="text-[11px] text-slate-500 leading-relaxed font-medium">{step.description}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
