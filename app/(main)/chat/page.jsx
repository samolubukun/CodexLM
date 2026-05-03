'use client'
import React, { useState, useContext, useEffect, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { MessageCircle, Send, Loader2, Sparkles, Trash2, User, Bot, ArrowLeft, Plus, History } from 'lucide-react'
import { useMutation, useConvex } from 'convex/react'
import { api } from '@/convex/_generated/api'
import { UserContext } from '@/app/_context/UserContext'
import { useSearchParams, useRouter } from 'next/navigation'
import { toast } from 'sonner'
import Link from 'next/link'
import moment from 'moment'
import { ProductRecommendations } from '@/components/ProductRecommendations'
import { useMetricsTracker } from '@/hooks/useMetricsTracker'
import { CREDIT_LIMITS, getMaxChats } from '@/config/credits'

function ChatPage() {
    const { userData } = useContext(UserContext)
    const convex = useConvex()
    const searchParams = useSearchParams()
    const router = useRouter()
    const scanId = searchParams.get('scanId')

    const createChatSession = useMutation(api.chatHistory.createChatSession)
    const addMessage = useMutation(api.chatHistory.addMessage)
    const clearChatMessages = useMutation(api.chatHistory.clearChatMessages)
    const updateChatTopic = useMutation(api.chatHistory.updateChatTopic)
    const deleteChatSession = useMutation(api.chatHistory.deleteChatSession)
    const DeductChatCredit = useMutation(api.users.DeductChatCredit)
    const { trackAIChat } = useMetricsTracker()

    // Chat limit constants
    const isProUser = !!userData?.subscriptionId
    const chatCredits = userData?.chatCredits ?? CREDIT_LIMITS.FREE_PLAN.CHAT_CREDITS
    const hasReachedChatLimit = !isProUser && chatCredits <= 0

    const [messages, setMessages] = useState([])
    const [input, setInput] = useState('')
    const [isLoading, setIsLoading] = useState(false)
    const [chatSessionId, setChatSessionId] = useState(null)
    const [scanData, setScanData] = useState(null)
    const [loadingScan, setLoadingScan] = useState(!!scanId)
    const [chatHistory, setChatHistory] = useState([])
    const [loadingHistory, setLoadingHistory] = useState(false)
    const [showHistory, setShowHistory] = useState(false)
    const messagesEndRef = useRef(null)
    const initialized = useRef(false)
    const currentUserId = useRef(null)

    const suggestedQuestions = [
        "What's the best routine for acne-prone skin?",
        "How can I reduce dark spots naturally?",
        "What ingredients should I avoid for sensitive skin?",
        "How often should I exfoliate?",
        "What's the difference between AHA and BHA?",
        "How can I prevent breakouts during my period?"
    ]

    useEffect(() => {
        if (userData && !initialized.current) {
            initialized.current = true
            currentUserId.current = userData._id

            loadChatHistory()
            if (scanId) {
                fetchScanData()
            } else {
                createNewChat()
            }
        } else if (userData && userData._id !== currentUserId.current) {
            // Handle user switch if necessary, though rare in single-session apps
            initialized.current = true
            currentUserId.current = userData._id
            loadChatHistory()
            if (scanId) {
                fetchScanData()
            } else {
                createNewChat()
            }
        }
    }, [userData, scanId])

    const loadChatHistory = async () => {
        try {
            setLoadingHistory(true)
            // Get all chat sessions for this user
            const sessions = await convex.query(api.chatHistory.getChatSessions, {
                uid: userData._id
            })
            setChatHistory(sessions || [])
        } catch (error) {
            console.error('Error loading chat history:', error)
        } finally {
            setLoadingHistory(false)
        }
    }

    const createNewChat = async () => {
        try {
            const newSessionId = await createChatSession({
                uid: userData._id,
                topic: 'Skincare Consultation'
            })
            setChatSessionId(newSessionId)
            setMessages([])
            setScanData(null)
            setShowHistory(false)
        } catch (error) {
            console.error('Error creating new chat:', error)
            toast.error('Failed to create new chat')
        }
    }

    const loadChatSession = async (sessionId) => {
        try {
            const session = await convex.query(api.chatHistory.getChatSession, {
                id: sessionId
            })
            if (session) {
                setChatSessionId(session._id)
                setMessages(session.messages || [])
                setScanData(null)
                setShowHistory(false)
            }
        } catch (error) {
            console.error('Error loading session:', error)
            toast.error('Failed to load chat')
        }
    }

    const fetchScanData = async () => {
        try {
            const scan = await convex.query(api.skinScans.getSkinScan, {
                id: scanId
            })
            setScanData(scan)
            // Create a new session for this scan instead of loading existing one
            const newSessionId = await createChatSession({
                uid: userData._id,
                topic: `Scan Analysis - ${new Date(scan._creationTime).toLocaleDateString()}`
            })
            setChatSessionId(newSessionId)
            setMessages([])
            setLoadingScan(false)
        } catch (error) {
            console.error('Error fetching scan:', error)
            toast.error('Failed to load scan data')
            setLoadingScan(false)
        }
    }

    useEffect(() => {
        scrollToBottom()
    }, [messages])

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }

    const sendMessage = async (messageText = input) => {
        if (!messageText.trim() || !chatSessionId || !userData) return

        // Check chat limit for free users
        if (hasReachedChatLimit) {
            toast.error('You are out of free chat credits, dont forget to join the waitlist!')
            return
        }

        const userMessage = {
            role: 'user',
            content: messageText.trim(),
            timestamp: Date.now()
        }

        setMessages(prev => [...prev, userMessage])
        setInput('')
        setIsLoading(true)

        try {
            // Save user message
            await addMessage({
                id: chatSessionId,
                message: userMessage
            })

            // Update chat topic based on first message (for non-scan chats)
            if (!scanData && messages.length === 0) {
                const truncatedMessage = messageText.substring(0, 50)
                await updateChatTopic({
                    id: chatSessionId,
                    topic: truncatedMessage
                }).catch(() => { }) // Silent fail if update doesn't work
            }

            // Get AI response
            const response = await fetch('/api/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    messages: [...messages, userMessage].map(m => ({
                        role: m.role,
                        content: m.content
                    })),
                    scanContext: scanData ? {
                        overallScore: scanData.analysis?.overallScore,
                        skinType: scanData.analysis?.skinType,
                        conditions: scanData.analysis?.conditions,
                        detailedAnalysis: scanData.analysis?.detailedAnalysis
                    } : null
                })
            })

            if (!response.ok) throw new Error('Failed to get response')

            const data = await response.json()

            const assistantMessage = {
                role: 'assistant',
                content: data.message.content,
                products: data.products && data.products.length > 0 ? data.products : undefined,
                timestamp: Date.now()
            }

            setMessages(prev => [...prev, assistantMessage])

            // Track the AI chat activity
            trackAIChat()

            // Save assistant message
            await addMessage({
                id: chatSessionId,
                message: assistantMessage
            })

            // Decrement chat credits for free plan users
            if (!isProUser) {
                await DeductChatCredit({
                    id: userData._id
                })
            }

        } catch (error) {
            console.error('Error sending message:', error)
            toast.error('Failed to get response. Please try again.')
        } finally {
            setIsLoading(false)
        }
    }

    const handleClearChat = async () => {
        if (!chatSessionId) return

        try {
            await clearChatMessages({ id: chatSessionId })
            setMessages([])
            toast.success('Chat cleared')
        } catch (error) {
            console.error('Error clearing chat:', error)
            toast.error('Failed to clear chat')
        }
    }

    const handleKeyPress = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault()
            sendMessage()
        }
    }

    if (loadingScan) {
        return (
            <div className='flex items-center justify-center min-h-screen'>
                <div className='animate-spin rounded-full h-12 w-12 border-b-2 border-primary'></div>
            </div>
        )
    }

    return (
        <div className='max-w-6xl mx-auto h-[calc(100dvh-120px)] flex gap-4 px-2 sm:px-0 overflow-hidden'>
            {/* Chat History Sidebar - Mobile Toggle + Desktop */}
            {!scanData && (
                <>

                    {/* Mobile Overlay */}
                    {showHistory && (
                        <div
                            className='fixed inset-0 bg-black/50 lg:hidden z-30'
                            onClick={() => setShowHistory(false)}
                        />
                    )}

                    {/* Sidebar - Desktop always visible, Mobile overlay */}
                    <div className={`${showHistory ? 'flex' : 'hidden lg:flex'
                        } w-64 bg-card border border-border rounded-2xl p-4 flex-col fixed lg:relative left-0 top-0 h-full lg:h-full z-40 lg:z-0 overflow-hidden`}>

                        {/* Close button for mobile */}
                        <div className='flex justify-between items-center mb-3 lg:mb-0'>
                            <h3 className='text-sm font-semibold text-foreground flex items-center gap-2 lg:hidden'>
                                <History className='w-4 h-4' />
                                Chat History
                            </h3>
                            <Button
                                variant='ghost'
                                size='icon'
                                onClick={() => setShowHistory(false)}
                                className='lg:hidden h-8 w-8'
                            >
                                <ArrowLeft className='w-4 h-4' />
                            </Button>
                        </div>

                        <Button
                            onClick={createNewChat}
                            className='w-full mb-4 cursor-pointer bg-gradient-to-r from-[#E8C77A] via-[#C9A44A] to-[#8FAF6A] hover:from-[#E8C77A]/90 hover:via-[#C9A44A]/90 hover:to-[#8FAF6A]/90 text-white border-0 text-sm'
                        >
                            <Plus className='w-4 h-4 mr-2' />
                            New Chat
                        </Button>

                        <div className='flex-1 overflow-y-auto overflow-x-hidden min-h-0'>
                            <h3 className='text-sm font-semibold text-foreground mb-3 items-center gap-2 hidden lg:flex'>
                                <History className='w-4 h-4' />
                                Chat History
                            </h3>

                            {loadingHistory ? (
                                <div className='flex justify-center py-4'>
                                    <Loader2 className='w-4 h-4 animate-spin text-muted-foreground' />
                                </div>
                            ) : chatHistory.length === 0 ? (
                                <p className='text-xs sm:text-sm text-muted-foreground py-4'>No chat history yet</p>
                            ) : (
                                <div className='space-y-2'>
                                    {chatHistory.map(session => (
                                        <div
                                            key={session._id}
                                            className={`relative p-3 rounded-lg text-sm transition-colors group ${chatSessionId === session._id
                                                ? 'bg-primary/20 text-primary'
                                                : 'bg-muted/50 text-muted-foreground hover:bg-muted'
                                                }`}
                                        >
                                            <button
                                                onClick={() => {
                                                    loadChatSession(session._id)
                                                    setShowHistory(false)
                                                }}
                                                className='w-full text-left pr-10 py-1'
                                            >
                                                <p className='truncate font-medium text-foreground text-xs sm:text-sm pr-2'>{session.topic}</p>
                                                <p className='text-xs text-muted-foreground'>
                                                    {moment(session._creationTime).fromNow()}
                                                </p>
                                            </button>

                                            {/* Delete Button - Always visible on mobile, hover on desktop */}
                                            <Button
                                                variant='ghost'
                                                size='icon'
                                                onClick={async (e) => {
                                                    e.stopPropagation()

                                                    try {
                                                        await deleteChatSession({ id: session._id })
                                                        await loadChatHistory()
                                                        if (chatSessionId === session._id) {
                                                            createNewChat()
                                                        }
                                                        toast.success('Chat deleted')
                                                    } catch (error) {
                                                        console.error('Error deleting chat:', error)
                                                        toast.error('Failed to delete chat')
                                                    }
                                                }}
                                                className='absolute top-2 right-2 h-7 w-7 cursor-pointer opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity text-red-500 hover:text-red-700 hover:bg-red-50'
                                                title='Delete chat'
                                            >
                                                <Trash2 className='w-3 h-3' />
                                            </Button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </>
            )}

            {/* Main Chat Area */}
            <div className='flex-1 flex flex-col min-h-0 min-w-0 overflow-hidden'>

                {/* Header */}
                <div className='mb-4 px-2 sm:px-0'>
                    <div className='flex items-start gap-2 sm:gap-3 mb-3'>
                        <Link href='/dashboard'>
                            <Button variant='ghost' size='icon' className='cursor-pointer flex-shrink-0 h-9 w-9'>
                                <ArrowLeft className='w-5 h-5' />
                            </Button>
                        </Link>
                        {/* History Toggle for Mobile */}
                        {!scanData && (
                            <Button
                                onClick={() => setShowHistory(!showHistory)}
                                variant='ghost'
                                size='icon'
                                className='lg:hidden cursor-pointer flex-shrink-0 bg-primary/10 hover:bg-primary/20 h-9 w-9'
                                title='Chat History'
                            >
                                <History className='w-5 h-5 text-primary' />
                            </Button>
                        )}
                        <div className='flex-1 min-w-0 ml-0.5'>
                            <div className='inline-flex items-center gap-1 px-2 py-1 bg-primary/10 rounded-full text-[9px] sm:text-sm'>
                                <MessageCircle className='w-3 h-3 text-primary flex-shrink-0' />
                                <span className='font-medium truncate'>
                                    {scanData ? 'Scan Analysis' : 'AI Skincare Expert'}
                                </span>
                            </div>
                            <h1 className='text-lg sm:text-3xl font-bold text-foreground mt-0.5 whitespace-nowrap overflow-hidden text-ellipsis'>
                                {scanData ? 'Scan Analysis' : 'AI Chat Companion'}
                            </h1>
                            <p className='text-muted-foreground text-[10px] sm:text-sm line-clamp-2 leading-tight mt-0.5'>
                                {scanData
                                    ? 'Get personalized advice based on your skin analysis'
                                    : 'Ask any skincare question and get science-backed answers'
                                }
                            </p>
                            {/* Chat credits indicator for free users */}
                            {!isProUser && (
                                <div className={`mt-1 text-[9px] sm:text-xs font-medium ${hasReachedChatLimit ? 'text-red-500' : 'text-muted-foreground'}`}>
                                    {hasReachedChatLimit ? (
                                        <span className='line-clamp-1'>Join the waitlist for more credits!</span>
                                    ) : (
                                        <span>{chatCredits} chats remaining</span>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Chat Container */}
                <div className='flex-1 bg-card border border-border rounded-2xl flex flex-col overflow-hidden min-h-0'>
                    {/* Messages */}
                    <div className='flex-1 overflow-y-auto overflow-x-hidden p-3 sm:p-4 space-y-3 sm:space-y-4 min-h-0'>
                        {messages.length === 0 ? (
                            <div className='h-full flex flex-col items-center justify-center text-center p-4 sm:p-6'>
                                <Sparkles className='w-10 h-10 sm:w-12 sm:h-12 text-primary mb-3 sm:mb-4' />
                                <h3 className='font-semibold text-base sm:text-lg mb-2'>Start a conversation</h3>
                                <p className='text-muted-foreground text-xs sm:text-sm mb-4 sm:mb-6'>
                                    Ask me anything about skincare, routines, ingredients, or concerns
                                </p>
                                <div className='grid grid-cols-1 sm:grid-cols-2 gap-2 w-full max-w-lg'>
                                    {suggestedQuestions.slice(0, 2).map((question, index) => (
                                        <button
                                            key={index}
                                            onClick={() => sendMessage(question)}
                                            className='text-left p-2 sm:p-3 bg-muted/50 hover:bg-muted rounded-xl text-xs sm:text-sm transition-colors'
                                        >
                                            {question}
                                        </button>
                                    ))}
                                    {/* Show more suggestions on desktop only */}
                                    {suggestedQuestions.slice(2, 4).map((question, index) => (
                                        <button
                                            key={index + 2}
                                            onClick={() => sendMessage(question)}
                                            className='hidden sm:block text-left p-2 sm:p-3 bg-muted/50 hover:bg-muted rounded-xl text-xs sm:text-sm transition-colors'
                                        >
                                            {question}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        ) : (
                            <>
                                {messages.map((message, index) => (
                                    <div key={index}>
                                        <div
                                            className={`flex gap-2 sm:gap-3 ${message.role === 'user' ? 'flex-row-reverse' : ''}`}
                                        >
                                            <div className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center flex-shrink-0
                                            ${message.role === 'user' ? 'bg-primary' : 'bg-muted'}`}>
                                                {message.role === 'user'
                                                    ? <User className='w-4 h-4 text-primary-foreground' />
                                                    : <Bot className='w-4 h-4 text-foreground' />
                                                }
                                            </div>
                                            <div className={`max-w-[85%] sm:max-w-[80%] rounded-2xl px-3 sm:px-4 py-2 sm:py-3
                                            ${message.role === 'user'
                                                    ? 'bg-primary text-primary-foreground'
                                                    : 'bg-muted'}`}>
                                                <p className='whitespace-pre-wrap text-xs sm:text-sm'>{message.content}</p>
                                                {message.role === 'assistant' && message.products && (
                                                    <ProductRecommendations products={message.products} />
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                                {isLoading && (
                                    <div className='flex gap-2 sm:gap-3'>
                                        <div className='w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-muted flex items-center justify-center flex-shrink-0'>
                                            <Bot className='w-4 h-4' />
                                        </div>
                                        <div className='bg-muted rounded-2xl px-3 sm:px-4 py-2 sm:py-3'>
                                            <Loader2 className='w-4 h-4 sm:w-5 sm:h-5 animate-spin' />
                                        </div>
                                    </div>
                                )}
                                <div ref={messagesEndRef} />
                            </>
                        )}
                    </div>

                    {/* Input Area */}
                    <div className='border-t border-border p-3 sm:p-4'>
                        <div className='flex gap-2'>
                            {messages.length > 0 && (
                                <Button
                                    variant='ghost'
                                    size='icon'
                                    onClick={handleClearChat}
                                    className='cursor-pointer flex-shrink-0'
                                    title='Clear chat'
                                >
                                    <Trash2 className='w-5 h-5' />
                                </Button>
                            )}
                            <Textarea
                                placeholder='Ask a skincare question...'
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                onKeyPress={handleKeyPress}
                                rows={1}
                                className='resize-none min-h-[40px] sm:min-h-[44px] text-xs sm:text-sm placeholder:whitespace-nowrap placeholder:overflow-hidden placeholder:text-ellipsis'
                            />
                            <Button
                                onClick={() => sendMessage()}
                                disabled={!input.trim() || isLoading}
                                className='cursor-pointer flex-shrink-0 bg-gradient-to-r from-[#E8C77A] via-[#C9A44A] to-[#8FAF6A] hover:from-[#E8C77A]/90 hover:via-[#C9A44A]/90 hover:to-[#8FAF6A]/90 text-white border-0 disabled:opacity-50'
                            >
                                {isLoading ? (
                                    <Loader2 className='w-4 h-4 sm:w-5 sm:h-5 animate-spin' />
                                ) : (
                                    <Send className='w-4 h-4 sm:w-5 sm:h-5' />
                                )}
                            </Button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default ChatPage
