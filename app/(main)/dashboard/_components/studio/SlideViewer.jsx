import { useState } from 'react'
import { cn } from "@/lib/utils"
import { ChevronLeft, ChevronRight, Palette } from 'lucide-react'
import { Button } from '@/components/ui/button'

export function SlideViewer({ data }) {
    const [currentSlide, setCurrentSlide] = useState(0);
    const slides = data.slides || [];
    const totalSlides = slides.length;

    if (totalSlides === 0) return null;

    const nextSlide = () => setCurrentSlide((prev) => (prev + 1) % totalSlides);
    const prevSlide = () => setCurrentSlide((prev) => (prev - 1 + totalSlides) % totalSlides);

    return (
        <div className="space-y-8 pb-10 max-w-5xl mx-auto">
            {/* Header / Intro */}
            <div className="p-8 bg-slate-900 rounded-[2.5rem] text-white shadow-2xl relative overflow-hidden">
                <div className="relative z-10">
                    <span className="px-3 py-1 bg-amber-500 rounded-full text-[10px] font-black uppercase tracking-widest mb-4 inline-block">Presentation Deck</span>
                    <h4 className="text-3xl font-black mb-2 leading-tight">{data.title}</h4>
                    <p className="text-white/60 text-sm font-medium">{data.subtitle}</p>
                </div>
                <div className="absolute top-0 right-0 w-64 h-64 bg-amber-600/20 blur-[100px] rounded-full -mr-20 -mt-20" />
            </div>

            {/* Slide Container */}
            <div className="relative group">
                <div className="min-h-[500px] bg-white dark:bg-slate-800 rounded-[3rem] border border-border shadow-xl overflow-hidden flex flex-col transition-all duration-500">
                    {/* Slide Progress */}
                    <div className="flex gap-1 p-4 bg-slate-50 dark:bg-slate-900/50 border-b border-border">
                        {Array.from({ length: totalSlides }).map((_, i) => (
                            <div 
                                key={i} 
                                className={cn(
                                    "h-1.5 flex-1 rounded-full transition-all duration-500",
                                    i === currentSlide ? "bg-indigo-600 w-full" : "bg-slate-200 dark:bg-slate-700"
                                )} 
                            />
                        ))}
                    </div>

                    <div className="flex-1 p-12 flex flex-col items-center justify-center text-center animate-in fade-in slide-in-from-right-8 duration-500" key={currentSlide}>
                        <span className="text-[10px] font-black uppercase tracking-[0.3em] text-indigo-500 mb-6 opacity-50">Slide {currentSlide + 1} of {totalSlides}</span>
                        <h5 className="text-4xl font-black text-slate-900 dark:text-white mb-8 leading-tight tracking-tight">
                            {slides[currentSlide].title}
                        </h5>
                        <ul className="space-y-4 max-w-2xl">
                            {slides[currentSlide].content.map((point, idx) => (
                                <li key={idx} className="flex items-start gap-4 text-left group/item">
                                    <div className="mt-1.5 w-2 h-2 rounded-full bg-indigo-600 shrink-0 group-hover/item:scale-150 transition-transform" />
                                    <p className="text-lg text-slate-600 dark:text-slate-300 leading-relaxed font-medium">{point}</p>
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* Footer Controls */}
                    <div className="p-6 bg-slate-50 dark:bg-slate-900/50 border-t border-border flex justify-between items-center">
                        <Button 
                            variant="ghost" 
                            onClick={prevSlide}
                            className="rounded-2xl px-6 py-5 h-auto text-[10px] font-black uppercase tracking-widest text-slate-500 hover:text-indigo-600"
                        >
                            <ChevronLeft className="w-4 h-4 mr-2" />
                            Previous
                        </Button>
                        <div className="flex items-center gap-2">
                            <span className="text-[10px] font-black tabular-nums text-slate-400">
                                {currentSlide + 1} / {totalSlides}
                            </span>
                        </div>
                        <Button 
                            onClick={nextSlide}
                            className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl px-8 py-5 h-auto text-[10px] font-black uppercase tracking-widest shadow-lg shadow-indigo-500/20"
                        >
                            Next Slide
                            <ChevronRight className="w-4 h-4 ml-2" />
                        </Button>
                    </div>
                </div>

                {/* Keyboard Hint */}
                <div className="mt-4 flex justify-center">
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest bg-slate-100 dark:bg-slate-800 px-4 py-2 rounded-full border border-border">
                        Use buttons to navigate through your deck
                    </p>
                </div>
            </div>

            {/* Visual Context Card */}
            {slides[currentSlide].imagePrompt && (
                <div className="p-6 bg-indigo-50 dark:bg-indigo-950/20 rounded-3xl border border-indigo-100 dark:border-indigo-900/50 flex items-center gap-6">
                    <div className="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center shrink-0 shadow-lg shadow-indigo-500/20">
                        <Palette className="w-6 h-6 text-white" />
                    </div>
                    <div className="space-y-1">
                        <h6 className="text-[10px] font-black uppercase tracking-widest text-indigo-600">Visual Concept</h6>
                        <p className="text-xs text-indigo-700/70 dark:text-indigo-300/70 italic font-medium leading-relaxed">
                            "{slides[currentSlide].imagePrompt}"
                        </p>
                    </div>
                </div>
            )}
        </div>
    );
}
