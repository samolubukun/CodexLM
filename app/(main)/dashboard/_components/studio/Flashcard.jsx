import { useState } from 'react'
import { cn } from "@/lib/utils"

export function Flashcard({ question, answer }) {
    const [isFlipped, setIsFlipped] = useState(false);

    return (
        <div 
            className="w-full cursor-pointer perspective-1000 group"
            onClick={() => setIsFlipped(!isFlipped)}
        >
            <div className={cn(
                "relative w-full transition-all duration-500 preserve-3d grid",
                isFlipped ? "rotate-y-180" : ""
            )}>
                {/* Front */}
                <div className="col-start-1 row-start-1 backface-hidden bg-white dark:bg-slate-800 rounded-3xl border-2 border-indigo-100 dark:border-indigo-900 shadow-sm hover:shadow-md transition-shadow flex flex-col items-center justify-center p-6 sm:p-8 text-center gap-4 h-full min-h-[250px]">
                    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-indigo-500 opacity-50 shrink-0">Question</span>
                    <p className="text-base sm:text-lg font-bold text-slate-800 dark:text-white leading-relaxed">
                        {question}
                    </p>
                    <div className="mt-auto pt-4 shrink-0">
                        <div className="px-4 py-2 bg-indigo-50 dark:bg-indigo-950/30 rounded-full inline-block">
                            <p className="text-[10px] font-bold text-indigo-600 uppercase tracking-widest">Tap to reveal</p>
                        </div>
                    </div>
                </div>

                {/* Back */}
                <div className="col-start-1 row-start-1 backface-hidden rotate-y-180 bg-indigo-600 rounded-3xl shadow-sm flex flex-col items-center justify-center p-6 sm:p-8 text-center gap-4 h-full min-h-[250px]">
                    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white/50 shrink-0">Answer</span>
                    <p className="text-base sm:text-lg font-medium text-white leading-relaxed">
                        {answer}
                    </p>
                    <div className="mt-auto pt-4 shrink-0">
                        <div className="px-4 py-2 bg-white/10 rounded-full inline-block">
                            <p className="text-[10px] font-bold text-white uppercase tracking-widest">Tap to flip back</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
