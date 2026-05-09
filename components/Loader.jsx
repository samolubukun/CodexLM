"use client";
import React from 'react';

const Loader = () => {
    return (
        <div className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-background/80 backdrop-blur-md animate-in fade-in duration-500">
            <div className="relative flex items-center justify-center">
                {/* Outer Ring */}
                <div className="h-24 w-24 rounded-full border-t-2 border-r-2 border-indigo-600 animate-spin"></div>

                {/* Inner Ring (Reverse) */}
                <div className="absolute h-16 w-16 rounded-full border-b-2 border-l-2 border-emerald-500 animate-[spin_1.5s_linear_infinite_reverse]"></div>

                {/* Core Logo */}
                <div className="absolute flex flex-col items-center justify-center">
                    <div className="relative h-14 w-14 flex items-center justify-center">
                        <img 
                            src="/logo.png" 
                            alt="CodexLM" 
                            className="h-10 w-10 object-contain animate-pulse"
                        />
                        {/* Subtle glow behind logo */}
                        <div className="absolute inset-0 bg-indigo-600/10 blur-xl rounded-full animate-pulse"></div>
                    </div>
                </div>
            </div>

            <div className="mt-10 flex flex-col items-center gap-3">
                <div className="flex items-center gap-2">
                    <span className="h-px w-8 bg-gradient-to-r from-transparent to-indigo-500/50"></span>
                    <h2 className="text-2xl font-black tracking-tight text-indigo-600 dark:text-indigo-400 uppercase italic">
                        CodexLM
                    </h2>
                    <span className="h-px w-8 bg-gradient-to-l from-transparent to-indigo-500/50"></span>
                </div>
                <p className="text-xs font-bold uppercase tracking-[0.3em] text-slate-400 animate-in slide-in-from-bottom-4 duration-1000 delay-300">
                    Preparing your research workspace
                </p>
            </div>

            {/* Subtle Background Glows */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-indigo-600/5 blur-[100px] rounded-full pointer-events-none"></div>
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-emerald-500/5 blur-[120px] rounded-full pointer-events-none delay-700"></div>
        </div>
    );
};

export default Loader;
