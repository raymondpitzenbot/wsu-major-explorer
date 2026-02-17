import React, { useState, useRef, useLayoutEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { getAdvisorResponse } from '../services/advisorService';
import { Send, Bot, User, ChevronDown } from 'lucide-react';
import { useCompare } from '../contexts/CompareContext';
import DynamicBackground from '../components/DynamicBackground';

interface ChatMessage {
    role: 'user' | 'model';
    text: string;
}

const AdvisorPage: React.FC = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const { compareList } = useCompare();

    const [messages, setMessages] = useState<ChatMessage[]>([
        { role: 'model', text: "Hello! I am your AI Advisor, and I'm ready to help you explore academic programs at Winona State University.\n\nYou can ask me things like:\n- \"What majors does WSU have for biology?\"\n- \"Tell me about the Nursing program.\"\n- \"I like art and computers, what should I study?\"\n\nHow can I help you today?\n\nPlease remember to connect with an official WSU academic advisor for the most accurate and personalized guidance." }
    ]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isScrolledUp, setIsScrolledUp] = useState(false);

    const messagesEndRef = useRef<HTMLDivElement>(null);
    const scrollContainerRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = (behavior: 'smooth' | 'auto' = 'smooth') => {
        if (scrollContainerRef.current) {
            const { scrollHeight, clientHeight } = scrollContainerRef.current;
            scrollContainerRef.current.scrollTo({
                top: scrollHeight - clientHeight,
                behavior
            });
        }
    };

    const handleScroll = () => {
        const container = scrollContainerRef.current;
        if (container) {
            const threshold = 30;
            const isAtBottom = container.scrollHeight - container.scrollTop - container.clientHeight < threshold;
            setIsScrolledUp(!isAtBottom);
        }
    };

    const handleSend = async (prefilledPrompt?: string) => {
        const query = prefilledPrompt || input;
        if (!query.trim()) return;

        const userMessage: ChatMessage = { role: 'user', text: query };
        setMessages(prev => [...prev, userMessage]);
        setInput('');
        setIsLoading(true);


        setTimeout(() => scrollToBottom('smooth'), 100);

        const chatHistoryForApi = [...messages, userMessage].slice(-8).map(msg => ({
            role: msg.role,
            parts: [{ text: msg.text }]
        }));

        try {
            const responseText = await getAdvisorResponse(chatHistoryForApi, query);
            const modelMessage: ChatMessage = { role: 'model', text: responseText };
            setMessages(prev => [...prev, modelMessage]);
        } catch (error) {
            console.error("Advisor Error:", error);
            // Show the specific error message to help with debugging
            const errorMessageText = error instanceof Error ? error.message : "I'm sorry, I encountered an unexpected error.";
            const errorMessage: ChatMessage = { role: 'model', text: `Debug Error: ${errorMessageText}` };
            setMessages(prev => [...prev, errorMessage]);
        } finally {
            setIsLoading(false);
        }
    };

    useLayoutEffect(() => {
        const searchParams = new URLSearchParams(location.search);
        const prompt = searchParams.get('prompt');
        if (prompt) {
            handleSend(prompt);
            navigate(location.pathname, { replace: true });
        }
    }, [location.search]);

    return (
        <div className={`relative flex flex-col h-[100dvh] min-h-0 overflow-hidden ${compareList.length > 0 ? 'pb-20 sm:pb-0' : ''}`}>
            <DynamicBackground className="absolute inset-0" />
            <div className="relative z-10 w-full max-w-4xl mx-auto flex-1 min-h-0 flex flex-col p-4 sm:py-12 sm:px-8">
                <div className="w-full flex-1 min-h-0 flex flex-col bg-white/90 backdrop-blur-xl sm:rounded-xl border sm:border border-gray-200 overflow-hidden shadow-sm relative">
                    <div ref={scrollContainerRef} onScroll={handleScroll} className="flex-1 min-h-0 p-4 sm:p-6 space-y-6 overflow-y-auto scroll-shadows">
                        {messages.map((msg, index) => (
                            <div key={index} className={`flex gap-3 message-bubble-animation ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                {msg.role === 'model' && (
                                    <div className="w-10 h-10 rounded-full bg-gray-100 border border-gray-200 flex-shrink-0 flex items-center justify-center">
                                        <Bot className="text-gray-700" size={24} />
                                    </div>
                                )}
                                <div className={`p-4 rounded-2xl shadow-sm ${msg.role === 'user' ? 'bg-primary-600 text-white rounded-br-none max-w-lg' : 'bg-gray-100 text-gray-900 rounded-bl-none max-w-xl border border-gray-200'}`}>
                                    <p className="text-sm leading-relaxed whitespace-pre-wrap font-body">{msg.text}</p>
                                </div>
                                {msg.role === 'user' && (
                                    <div className="w-10 h-10 rounded-full bg-primary-100 flex-shrink-0 flex items-center justify-center">
                                        <User className="text-primary-600" size={24} />
                                    </div>
                                )}
                            </div>
                        ))}
                        <div ref={messagesEndRef} />
                    </div>

                    {isLoading && (
                        <div className="flex-shrink-0 px-4 sm:px-6 pt-4">
                            <div className="flex gap-3 justify-start">
                                <div className="w-10 h-10 rounded-full bg-gray-100 border border-gray-200 flex-shrink-0 flex items-center justify-center">
                                    <Bot className="text-gray-700" size={24} />
                                </div>
                                <div className="max-w-lg p-4 rounded-2xl bg-gray-100 text-gray-900 rounded-bl-none border border-gray-200">
                                    <div className="flex items-center gap-2">
                                        <span className="h-2 w-2 bg-gray-400 rounded-full animate-bounce [animation-delay:-0.3s]"></span>
                                        <span className="h-2 w-2 bg-gray-400 rounded-full animate-bounce [animation-delay:-0.15s]"></span>
                                        <span className="h-2 w-2 bg-gray-400 rounded-full animate-bounce"></span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {isScrolledUp && (
                        <button
                            onClick={() => scrollToBottom()}
                            className="absolute bottom-24 right-6 z-20 bg-primary-600 text-white rounded-full p-2 shadow-lg hover:bg-primary-500 transition-opacity animate-fade-in"
                            aria-label="Scroll to latest messages"
                        >
                            <ChevronDown size={24} />
                        </button>
                    )}

                    <div className="flex-shrink-0 p-4 bg-gray-50 border-t border-gray-200">
                        <div className="relative flex items-center gap-3">
                            <div className="flex-1 relative">
                                <input
                                    type="text"
                                    value={input}
                                    maxLength={1000}
                                    onChange={e => setInput(e.target.value)}
                                    onKeyPress={e => e.key === 'Enter' && handleSend()}
                                    placeholder="Ask about majors, careers, or college life..."
                                    className="font-body w-full px-4 py-3 pr-12 bg-white rounded-full border border-gray-200 focus:ring-2 focus:ring-primary-500 focus:outline-none transition text-gray-900 placeholder-gray-500 shadow-sm"
                                    disabled={isLoading}
                                />
                                <span className={`absolute right-4 top-1/2 -translate-y-1/2 text-[10px] font-mono ${input.length >= 900 ? 'text-rose-500' : 'text-gray-500'}`}>
                                    {input.length}/1000
                                </span>
                            </div>
                            <button onClick={() => handleSend()} disabled={isLoading || !input.trim()} className="w-11 h-11 flex-shrink-0 rounded-full bg-primary-600 text-white flex items-center justify-center hover:bg-primary-700 disabled:bg-gray-200 disabled:text-gray-500 disabled:cursor-not-allowed transition shadow-sm hover:shadow-md">
                                <Send size={20} />
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AdvisorPage;