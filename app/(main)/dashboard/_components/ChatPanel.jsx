"use client"

import { useState, useEffect, useRef } from 'react'
import { Send, User, Bot, Loader2, Paperclip, Globe, FileText, Command, Sparkles, Mic } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import ReactMarkdown from 'react-markdown';

export default function ChatPanel({ projectId, selectedSourceId }) {
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

            const data = await response.json();
            if (!data.message?.content) throw new Error("Empty response from AI");

            // 3. Save assistant message to database
            await sendMessage({
                projectId,
                role: 'assistant',
                content: data.message.content,
                citations: data.message.citations || []
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
            // Clear optimistic messages - the real ones from DB will take over
            setOptimisticMessages([]);
        }
    };

    const handleVoiceInput = async () => {
        if (isRecording) {
            setIsRecording(false);
            // In a real implementation, you'd stop recording and send to API
            const transcript = "Tell me about the main themes.";
            setInput(transcript);
        } else {
            setIsRecording(true);
        }
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
        <div className="flex flex-col h-full bg-white dark:bg-slate-900">
            <div className="p-4 border-b border-border flex items-center justify-between">
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

            <ScrollArea ref={scrollRef} className="flex-1 p-4">
                <div className="space-y-6 w-full max-w-4xl mx-auto px-2">
                    {/* Merge DB messages with optimistic ones, avoiding duplicates */}
                    {[
                        ...messages,
                        ...optimisticMessages.filter(om => 
                            !messages.some(m => m.role === om.role && m.content === om.content)
                        )
                    ].map((msg, i) => (
                        <div key={i} className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''} w-full`}>
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${msg.role === 'user' ? 'bg-slate-200 dark:bg-slate-700' : 'bg-indigo-100 dark:bg-indigo-900/30'}`}>
                                {msg.role === 'user' ? <User className="w-5 h-5 text-slate-600" /> : <Bot className="w-5 h-5 text-indigo-600" />}
                            </div>
                            <div className={`max-w-[85%] sm:max-w-[75%] rounded-2xl p-4 text-sm leading-relaxed break-words overflow-hidden ${
                                msg.role === 'user' 
                                ? 'bg-indigo-600 text-white rounded-tr-none shadow-md' 
                                : 'bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 rounded-tl-none shadow-sm border border-border/50'
                            }`}>
                                <ReactMarkdown 
                                    components={{
                                        p: ({node, ...props}) => <p className="mb-3 last:mb-0" {...props} />,
                                        ul: ({node, ...props}) => <ul className="list-disc pl-4 mb-3 space-y-1" {...props} />,
                                        ol: ({node, ...props}) => <ol className="list-decimal pl-4 mb-3 space-y-1" {...props} />,
                                        li: ({node, ...props}) => <li className="mb-1" {...props} />,
                                        strong: ({node, ...props}) => (
                                            <strong className={`font-bold ${msg.role === 'user' ? 'text-white underline decoration-white/30' : 'text-indigo-600 dark:text-indigo-400'}`} {...props} />
                                        ),
                                    }}
                                >
                                    {msg.content}
                                </ReactMarkdown>
                                
                                {msg.citations && msg.citations.length > 0 && (
                                    <div className="mt-3 pt-3 border-t border-black/10 dark:border-white/10 flex flex-wrap gap-2">
                                        {msg.citations.map((cit, idx) => (
                                            <span key={idx} className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-black/5 dark:bg-white/5 text-[10px] font-medium cursor-help hover:bg-black/10 dark:hover:bg-white/10 transition-colors" title={cit}>
                                                <FileText className="w-3 h-3" /> {cit}
                                            </span>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                    {isTyping && (
                        <div className="flex gap-4">
                            <div className="w-8 h-8 rounded-full bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center">
                                <Bot className="w-5 h-5 text-indigo-600" />
                            </div>
                            <div className="bg-slate-100 dark:bg-slate-800 rounded-2xl rounded-tl-none p-4 shadow-sm border border-border/50">
                                <div className="flex gap-1">
                                    <div className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" />
                                    <div className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce [animation-delay:0.2s]" />
                                    <div className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce [animation-delay:0.4s]" />
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </ScrollArea>

            <div className="p-4 border-t border-border">
                <div className="max-w-3xl mx-auto relative group">
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 flex items-center gap-2">
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50">
                            <Paperclip className="h-4 w-4" />
                        </Button>
                        <Button 
                            variant="ghost" 
                            size="icon" 
                            onClick={() => {
                                console.log("Globe clicked, old state:", isWebSearchActive);
                                setIsWebSearchActive(!isWebSearchActive);
                            }}
                            className={`h-9 w-9 transition-all duration-300 rounded-full ${
                                isWebSearchActive 
                                ? 'bg-indigo-600 text-white shadow-[0_0_15px_rgba(79,70,229,0.5)] scale-110' 
                                : 'text-slate-400 hover:text-indigo-600 hover:bg-indigo-50'
                            }`}
                            title={isWebSearchActive ? "Web Search Active" : "Enable Web Search"}
                        >
                            <Globe className={`h-4 w-4 ${isWebSearchActive ? 'animate-spin-slow' : ''}`} />
                        </Button>
                        <Button 
                            variant="ghost" 
                            size="icon" 
                            onClick={handleVoiceInput}
                            className={`h-8 w-8 transition-colors ${isRecording ? 'text-red-500 animate-pulse bg-red-50' : 'text-slate-400 hover:text-indigo-600 hover:bg-indigo-50'}`}
                        >
                            <Mic className="h-4 w-4" />
                        </Button>
                    </div>
                    <Input 
                        placeholder={isWebSearchActive ? "Search the web and your sources..." : "Ask anything about your sources..."}
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                        className="pl-[140px] pr-12 h-14 bg-slate-50 dark:bg-slate-800 border-border focus:ring-indigo-500 rounded-2xl transition-all shadow-sm"
                    />
                    <Button 
                        onClick={handleSend}
                        className="absolute right-2 top-1/2 -translate-y-1/2 h-10 w-10 rounded-xl bg-indigo-600 hover:bg-indigo-700 shadow-lg shadow-indigo-500/30 p-0 text-white"
                    >
                        <Send className="h-5 w-5" />
                    </Button>
                </div>
                <div className="mt-3 flex justify-center gap-6 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                    <span className={`flex items-center gap-1.5 transition-colors ${isWebSearchActive ? 'text-indigo-600' : ''}`}>
                        <Globe className="w-3 h-3" /> Search Internet {isWebSearchActive ? '(ON)' : '(OFF)'}
                    </span>
                    <span className="flex items-center gap-1.5"><Sparkles className="w-3 h-3" /> Deep Analysis</span>
                </div>
            </div>
        </div>
    )
}
