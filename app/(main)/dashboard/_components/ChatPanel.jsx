"use client"

import { useState, useEffect, useRef } from 'react'
import { Send, User, Bot, Loader2, Paperclip, Globe, FileText, Command, Sparkles, Mic } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import ReactMarkdown from 'react-markdown';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

const renderWithCitations = (children, citations, onCitationClick) => {
    const processCitations = (child) => {
        if (typeof child !== 'string') return child;
        
        // Find patterns like [1], [1, 2], [1][2]
        const parts = child.split(/(\[[\d,\s]+\])/g);
        return parts.map((part, idx) => {
            const match = part.match(/\[([\d,\s]+)\]/);
            if (match) {
                // Split by comma and clean up spaces to handle [1, 2, 3]
                const indices = match[1].split(',').map(s => parseInt(s.trim())).filter(n => !isNaN(n));
                
                return indices.map((citationIndex, iIdx) => {
                    const citation = Array.isArray(citations) ? citations.find(c => c.index === citationIndex) : null;
                    return (
                        <span 
                            key={`${idx}-${iIdx}`}
                            onClick={() => citation && onCitationClick?.(citation)}
                            className={cn(
                                "inline-flex items-center justify-center w-5 h-5 ml-1 text-[10px] font-bold rounded-full cursor-pointer transition-all shrink-0",
                                citation 
                                    ? "bg-indigo-600 text-white hover:bg-indigo-700 shadow-sm" 
                                    : "bg-slate-200 text-slate-500"
                            )}
                            title={citation?.text?.substring(0, 200) + "..."}
                        >
                            {citationIndex}
                        </span>
                    );
                });
            }
            return part;
        });
    };

    return Array.isArray(children) ? children.map(processCitations) : processCitations(children);
};

const TypewriterEffect = ({ text, isNew = false, children }) => {
    const [displayedText, setDisplayedText] = useState(isNew ? "" : text);
    const [isComplete, setIsComplete] = useState(!isNew);
    
    useEffect(() => {
        if (!isNew || isComplete || !text) {
            setDisplayedText(text);
            return;
        }

        let currentIndex = 0;
        let lastTime = performance.now();
        const fullText = text;
        
        const animate = (currentTime) => {
            const deltaTime = currentTime - lastTime;
            
            // Fast, dynamic reveal speed
            const char = fullText[currentIndex];
            let delay = 10; // ms per char base
            
            if (char === '.' || char === '?' || char === '!') delay = 100; 
            if (char === ' ' || char === '\n') delay = 5; 
            
            if (deltaTime >= delay) {
                const charsToAppend = Math.max(1, Math.floor(deltaTime / delay));
                currentIndex = Math.min(fullText.length, currentIndex + charsToAppend);
                setDisplayedText(fullText.substring(0, currentIndex));
                lastTime = currentTime;
            }

            if (currentIndex < fullText.length) {
                requestAnimationFrame(animate);
            } else {
                setIsComplete(true);
            }
        };

        const animationFrame = requestAnimationFrame(animate);
        return () => cancelAnimationFrame(animationFrame);
    }, [text, isNew]);

    return (
        <div className={cn(
            "relative transition-all duration-300",
            !isComplete && "after:content-[''] after:inline-block after:w-1 after:h-3 after:bg-indigo-500 after:ml-0.5 after:animate-pulse"
        )}>
            {children ? children(displayedText) : displayedText}
        </div>
    );
};

export default function ChatPanel({ projectId, selectedSourceId, onCitationClick }) {
    const [input, setInput] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    const [isRecording, setIsRecording] = useState(false);
    const [isWebSearchActive, setIsWebSearchActive] = useState(false);
    const [optimisticMessages, setOptimisticMessages] = useState([]);
    const scrollRef = useRef(null);

    const messages = useQuery(api.messages.getMessagesByProject, projectId ? { projectId } : "skip") || [];
    const project = useQuery(api.projects.getProjectById, projectId ? { projectId } : "skip");
    const sendMessage = useMutation(api.messages.sendMessage);

    useEffect(() => {
        if (scrollRef.current) {
            const scrollContainer = scrollRef.current.querySelector('[data-radix-scroll-area-viewport]');
            if (scrollContainer) {
                scrollContainer.scrollTop = scrollContainer.scrollHeight;
            }
        }
    }, [messages]);

    const handleSend = async () => {
        if (!input.trim() || !projectId) return;

        const userMsg = input;
        const currentWebSearchState = isWebSearchActive;
        setInput('');

        // Immediately show user message in UI (optimistic update)
        const tempUserMsg = { role: 'user', content: userMsg, _id: 'temp-user' };
        setOptimisticMessages(prev => [...prev, tempUserMsg]);
        
        // 1. Save user message to database
        await sendMessage({
            projectId,
            role: 'user',
            content: userMsg
        });

        setIsTyping(true);

        try {
            // 2. Call our chat API with the full history including new message
            const allMessages = [...messages, { role: 'user', content: userMsg }];
            const response = await fetch('/api/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    projectId,
                    messages: allMessages,
                    sourceId: selectedSourceId,
                    projectMemory: project?.memory,
                    webSearchEnabled: currentWebSearchState
                })
            });

            if (!response.ok) throw new Error('Failed to fetch response');

            const data = await response.json();
            const assistantContent = data.message?.content || "";
            const citations = data.message?.citations || [];

            // Update optimistic message with final content
            setOptimisticMessages(prev => [...prev, {
                role: 'assistant',
                content: assistantContent,
                _id: 'temp-assistant',
                citations
            }]);

            // 3. Save assistant message to database
            await sendMessage({
                projectId,
                role: 'assistant',
                content: assistantContent,
                citations: citations
            });
        } catch (error) {
            console.error("Failed to get AI response:", error);
            // Show an error message in the chat
            setOptimisticMessages(prev => [...prev, { 
                role: 'assistant', 
                content: "Sorry, I ran into an error. Please try again.", 
                _id: 'temp-error' 
            }]);
        } finally {
            setIsTyping(false);
            // Wait a moment for Convex to reflect the new message before clearing optimistic state
            // this prevents the "disappearing message" flicker
            setTimeout(() => {
                setOptimisticMessages([]);
            }, 1000);
        }
    };

    const handleVoiceInput = () => {
        if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
            toast.error("Speech recognition is not supported in this browser.");
            return;
        }

        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        const recognition = new SpeechRecognition();

        recognition.lang = 'en-US';
        recognition.interimResults = false;
        recognition.maxAlternatives = 1;

        if (isRecording) {
            // If already recording, we'd normally stop it, but for Web Speech API 
            // it usually stops automatically after speech ends.
            // We'll just toggle the state.
            setIsRecording(false);
            return;
        }

        setIsRecording(true);
        toast.info("Listening...");

        recognition.onresult = (event) => {
            const transcript = event.results[0][0].transcript;
            setInput(prev => prev + (prev ? " " : "") + transcript);
            setIsRecording(false);
        };

        recognition.onerror = (event) => {
            console.error("Speech recognition error:", event.error);
            setIsRecording(false);
            toast.error("Could not recognize speech.");
        };

        recognition.onend = () => {
            setIsRecording(false);
        };

        recognition.start();
    };

    if (!projectId) {
        return (
            <div className="flex-1 flex items-center justify-center bg-white dark:bg-slate-900">
                <div className="text-center space-y-4">
                    <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-2xl flex items-center justify-center mx-auto">
                        <Bot className="w-8 h-8 text-slate-400" />
                    </div>
                    <h3 className="text-xl font-semibold text-slate-900 dark:text-white">Ready to chat?</h3>
                    <p className="text-slate-500 max-w-xs mx-auto text-sm">Select or create a project to start chatting with your personal AI assistant.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="flex flex-col h-full bg-white dark:bg-slate-900 overflow-hidden w-full min-w-0">
            <div className="p-3 sm:p-4 border-b border-border flex items-center justify-between shrink-0">
                <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center">
                        <Bot className="w-5 h-5 text-white" />
                    </div>
                    <div>
                        <h3 className="text-sm font-bold">CodexLM Assistant</h3>
                        <p className="text-[10px] text-emerald-500 font-medium uppercase tracking-wider">Online</p>
                    </div>
                </div>
            </div>

            <ScrollArea ref={scrollRef} className="flex-1 w-full min-w-0">
                <div className="space-y-6 w-full max-w-4xl mx-auto p-4 sm:p-6 pb-6 min-w-0">
                    {/* Merge DB messages with optimistic ones, avoiding duplicates */}
                    {[
                        ...messages,
                        ...optimisticMessages.filter(om => 
                            !messages.some(m => m.role === om.role && m.content === om.content)
                        )
                    ].map((msg, i) => (
                        <div key={i} className="w-full min-w-0 animate-in fade-in slide-in-from-bottom-2 duration-300">
                            {/* --- MOBILE MESSAGE UI (sm:hidden) --- */}
                            <div className="flex sm:hidden flex-col w-full min-w-0 gap-1.5">
                                <div className={cn(
                                    "flex items-center gap-1.5 px-1",
                                    msg.role === 'user' ? "flex-row-reverse" : "flex-row"
                                )}>
                                    <div className={cn(
                                        "w-5 h-5 rounded-full flex items-center justify-center shrink-0",
                                        msg.role === 'user' ? "bg-slate-200 dark:bg-slate-800" : "bg-indigo-100 dark:bg-indigo-900/30"
                                    )}>
                                        {msg.role === 'user' ? <User className="w-3 h-3 text-slate-500" /> : <Bot className="w-3 h-3 text-indigo-600" />}
                                    </div>
                                    <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
                                        {msg.role === 'user' ? 'You' : 'Assistant'}
                                    </span>
                                </div>
                                <div className={cn(
                                    "w-fit max-w-[90%] min-w-0 rounded-2xl p-3 text-[13px] leading-relaxed break-words shadow-sm border",
                                    msg.role === 'user' 
                                        ? "bg-indigo-600 text-white border-indigo-500 rounded-tr-none ml-auto" 
                                        : "bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 border-border rounded-tl-none mr-auto"
                                )}>
                                    <TypewriterEffect 
                                        text={msg.content} 
                                        isNew={msg._id && msg._id.startsWith('temp')}
                                    >
                                        {(text) => (
                                            <ReactMarkdown 
                                                components={{
                                                    p: ({node, children, ...props}) => (
                                                        <p className="mb-2 last:mb-0 break-words max-w-full overflow-hidden" {...props}>
                                                            {renderWithCitations(children, msg.citations, onCitationClick)}
                                                        </p>
                                                    ),
                                                    li: ({node, children, ...props}) => (
                                                        <li className="mb-1 break-words max-w-full overflow-hidden" {...props}>
                                                            {renderWithCitations(children, msg.citations, onCitationClick)}
                                                        </li>
                                                    ),
                                                    ul: ({node, ...props}) => <ul className="list-disc pl-4 mb-2 space-y-1" {...props} />,
                                                    ol: ({node, ...props}) => <ol className="list-decimal pl-4 mb-2 space-y-1" {...props} />,
                                                }}
                                            >
                                                {text}
                                            </ReactMarkdown>
                                        )}
                                    </TypewriterEffect>
                                    
                                    {Array.isArray(msg.citations) && msg.citations.length > 0 && (
                                        <div className="mt-2 pt-2 border-t border-black/10 dark:border-white/10 flex flex-wrap gap-1">
                                            {msg.citations.reduce((unique, cit) => {
                                                if (!unique.some(u => u.sourceId === cit.sourceId)) {
                                                    unique.push(cit);
                                                }
                                                return unique;
                                            }, []).map((cit, idx) => (
                                                <span 
                                                    key={idx} 
                                                    onClick={() => onCitationClick?.(cit)}
                                                    className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-lg bg-black/5 dark:bg-white/5 text-[9px] font-bold text-slate-500 dark:text-slate-400 cursor-pointer border border-black/5"
                                                >
                                                    <FileText className="w-2.5 h-2.5" /> <span className="max-w-[80px] truncate">{cit.sourceName}</span>
                                                </span>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* --- DESKTOP MESSAGE UI (hidden sm:flex) --- */}
                            <div className={cn(
                                "hidden sm:flex gap-3 w-full min-w-0",
                                msg.role === 'user' ? "flex-row-reverse" : "flex-row"
                            )}>
                                <div className={cn(
                                    "w-8 h-8 rounded-full flex items-center justify-center shrink-0 shadow-sm",
                                    msg.role === 'user' ? "bg-slate-100 dark:bg-slate-700" : "bg-indigo-100 dark:bg-indigo-900/30"
                                )}>
                                    {msg.role === 'user' ? <User className="w-4 h-4 text-slate-500" /> : <Bot className="w-4 h-4 text-indigo-600" />}
                                </div>
                                <div className={cn(
                                    "w-fit max-w-[75%] min-w-0 rounded-2xl p-4 text-sm leading-relaxed break-words shadow-sm border transition-all duration-300",
                                    msg.role === 'user' 
                                        ? "bg-indigo-600 text-white border-indigo-500 rounded-tr-none hover:shadow-indigo-500/10" 
                                        : "bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200 border-border rounded-tl-none hover:border-indigo-500/30"
                                )}>
                                    <TypewriterEffect 
                                        text={msg.content} 
                                        isNew={msg._id && msg._id.startsWith('temp')}
                                    >
                                        {(text) => (
                                            <ReactMarkdown 
                                                components={{
                                                    p: ({node, children, ...props}) => (
                                                        <p className="mb-3 last:mb-0 break-words max-w-full overflow-hidden" {...props}>
                                                            {renderWithCitations(children, msg.citations, onCitationClick)}
                                                        </p>
                                                    ),
                                                    li: ({node, children, ...props}) => (
                                                        <li className="mb-1 break-words max-w-full overflow-hidden" {...props}>
                                                            {renderWithCitations(children, msg.citations, onCitationClick)}
                                                        </li>
                                                    ),
                                                    ul: ({node, ...props}) => <ul className="list-disc pl-5 mb-3 space-y-1.5" {...props} />,
                                                    ol: ({node, ...props}) => <ol className="list-decimal pl-5 mb-3 space-y-1.5" {...props} />,
                                                    strong: ({node, ...props}) => (
                                                        <strong className={cn("font-bold", msg.role === 'user' ? "text-white underline decoration-white/30" : "text-indigo-600 dark:text-indigo-400")} {...props} />
                                                    ),
                                                }}
                                            >
                                                {text}
                                            </ReactMarkdown>
                                        )}
                                    </TypewriterEffect>
                                    
                                    {Array.isArray(msg.citations) && msg.citations.length > 0 && (
                                        <div className="mt-3 pt-3 border-t border-black/10 dark:border-white/10 flex flex-wrap gap-2">
                                            {msg.citations.reduce((unique, cit) => {
                                                if (!unique.some(u => u.sourceId === cit.sourceId)) {
                                                    unique.push(cit);
                                                }
                                                return unique;
                                            }, []).map((cit, idx) => (
                                                <span 
                                                    key={idx} 
                                                    onClick={() => onCitationClick?.(cit)}
                                                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-black/5 dark:bg-white/5 text-[10px] font-bold text-slate-600 dark:text-slate-400 cursor-pointer hover:bg-black/10 dark:hover:bg-white/10 transition-colors border border-black/5 dark:border-white/5" 
                                                >
                                                    <FileText className="w-3 h-3 text-indigo-500" /> <span className="max-w-[120px] truncate">{cit.sourceName}</span>
                                                </span>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}
                    {isTyping && (
                        <div className="flex gap-2 sm:gap-4">
                            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center">
                                <Bot className="w-4 h-4 sm:w-5 sm:h-5 text-indigo-600" />
                            </div>
                            <div className="bg-slate-100 dark:bg-slate-800 rounded-2xl rounded-tl-none p-3 sm:p-4 shadow-sm border border-border/50">
                                <div className="flex gap-1">
                                    <div className="w-1 h-1 sm:w-1.5 sm:h-1.5 bg-slate-400 rounded-full animate-bounce" />
                                    <div className="w-1 h-1 sm:w-1.5 sm:h-1.5 bg-slate-400 rounded-full animate-bounce [animation-delay:0.2s]" />
                                    <div className="w-1 h-1 sm:w-1.5 sm:h-1.5 bg-slate-400 rounded-full animate-bounce [animation-delay:0.4s]" />
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </ScrollArea>

            <div className="p-3 sm:p-4 border-t border-border bg-white dark:bg-slate-900 w-full min-w-0 shrink-0">
                <div className="max-w-3xl mx-auto relative group w-full min-w-0">
                    <div className="absolute left-2 sm:left-4 top-1/2 -translate-y-1/2 flex items-center gap-1 sm:gap-2">
                        <Button 
                            variant="ghost" 
                            size="icon" 
                            onClick={() => {
                                console.log("Globe clicked, old state:", isWebSearchActive);
                                setIsWebSearchActive(!isWebSearchActive);
                            }}
                            className={`h-8 w-8 sm:h-9 sm:w-9 transition-all duration-300 rounded-full shrink-0 ${
                                isWebSearchActive 
                                ? 'bg-indigo-600 text-white shadow-[0_0_15px_rgba(79,70,229,0.5)] scale-110' 
                                : 'text-slate-400 hover:text-indigo-600 hover:bg-indigo-50'
                            }`}
                            title={isWebSearchActive ? "Web Search Active" : "Enable Web Search"}
                        >
                            <Globe className={`h-3.5 w-3.5 sm:h-4 sm:w-4 ${isWebSearchActive ? 'animate-spin-slow' : ''}`} />
                        </Button>
                        <Button 
                            variant="ghost" 
                            size="icon" 
                            onClick={handleVoiceInput}
                            className={`h-7 w-7 sm:h-8 sm:w-8 transition-colors shrink-0 ${isRecording ? 'text-red-500 animate-pulse bg-red-50' : 'text-slate-400 hover:text-indigo-600 hover:bg-indigo-50'}`}
                        >
                            <Mic className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                        </Button>
                    </div>
                    <Input 
                        placeholder={isWebSearchActive ? "Search..." : "Ask anything..."}
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                        className="pl-[85px] sm:pl-28 pr-12 h-12 sm:h-14 bg-slate-50 dark:bg-slate-800 border-border focus:ring-indigo-500 rounded-2xl transition-all shadow-sm text-sm w-full min-w-0"
                    />
                    <Button 
                        onClick={handleSend}
                        className="absolute right-1.5 sm:right-2 top-1/2 -translate-y-1/2 h-9 w-9 sm:h-10 sm:w-10 rounded-xl bg-indigo-600 hover:bg-indigo-700 shadow-lg shadow-indigo-500/30 p-0 text-white shrink-0"
                    >
                        <Send className="h-4 w-4 sm:h-5 sm:w-5" />
                    </Button>
                </div>
                <div className="mt-2 flex justify-center gap-4 sm:gap-6 text-[9px] sm:text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                    <span className={`flex items-center gap-1 transition-colors ${isWebSearchActive ? 'text-indigo-600' : ''}`}>
                        <Globe className="w-2.5 h-2.5 sm:w-3 sm:h-3" /> {isWebSearchActive ? 'Search ON' : 'Search OFF'}
                    </span>
                    <span className="flex items-center gap-1"><Sparkles className="w-2.5 h-2.5 sm:w-3 sm:h-3" /> Analysis</span>
                </div>
            </div>
        </div>
    )
}
