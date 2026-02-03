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
        { role: 'model', text: "Hello! I am Warrior Bot, and I'm ready to help you explore academic programs at Winona State University.\n\nYou can ask me things like:\n- \"What majors does WSU have for biology?\"\n- \"Tell me about the Nursing program.\"\n- \"I like art and computers, what should I study?\"\n\nHow can I help you today?\n\nPlease remember to connect with an official WSU academic advisor for the most accurate and personalized guidance." }
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

        // Scroll to the user's new message, but don't force scroll for AI response
        setTimeout(() => scrollToBottom('smooth'), 100);

        const chatHistoryForApi = [...messages, userMessage].map(msg => ({
            role: msg.role,
            parts: [{ text: msg.text }]
        }));

        try {
            const responseText = await getAdvisorResponse(chatHistoryForApi, query);
            const modelMessage: ChatMessage = { role: 'model', text: responseText };
            setMessages(prev => [...prev, modelMessage]);
        } catch (error) {
            const errorMessage: ChatMessage = { role: 'model', text: "I'm sorry, I encountered an error. Please try again." };
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
                <div className="w-full flex-1 min-h-0 flex flex-col bg-gray-950/80 backdrop-blur-xl sm:rounded-xl border sm:border border-white/10 overflow-hidden shadow-2xl relative">
                    <div ref={scrollContainerRef} onScroll={handleScroll} className="flex-1 min-h-0 p-4 sm:p-6 space-y-6 overflow-y-auto scroll-shadows">
                        {messages.map((msg, index) => (
                            <div key={index} className={`flex gap-3 message-bubble-animation ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                {msg.role === 'model' && (
                                    <div className="w-10 h-10 rounded-full bg-primary-600 flex-shrink-0 flex items-center justify-center">
                                        <Bot className="text-white" size={24} />
                                    </div>
                                )}
                                <div className={`p-3 rounded-2xl ${msg.role === 'user' ? 'bg-primary-600 text-white rounded-br-none max-w-lg' : 'bg-gray-800 text-white rounded-bl-none max-w-xl'}`}>
                                    <p className="text-sm leading-relaxed whitespace-pre-wrap font-body">{msg.text}</p>
                                </div>
                                {msg.role === 'user' && (
                                    <div className="w-10 h-10 rounded-full bg-gray-700 flex-shrink-0 flex items-center justify-center">
                                        <User className="text-gray-300" size={24} />
                                    </div>
                                )}
                            </div>
                        ))}
                        <div ref={messagesEndRef} />
                    </div>

                    {isLoading && (
                        <div className="flex-shrink-0 px-4 sm:px-6 pt-4">
                            <div className="flex gap-3 justify-start">
                                <div className="w-10 h-10 rounded-full bg-primary-600 flex-shrink-0 flex items-center justify-center">
                                    <Bot className="text-white" size={24} />
                                </div>
                                <div className="max-w-lg p-3 rounded-2xl bg-gray-800 text-white rounded-bl-none">
                                    <div className="flex items-center gap-2">
                                        <span className="h-2 w-2 bg-primary-400 rounded-full animate-bounce [animation-delay:-0.3s]"></span>
                                        <span className="h-2 w-2 bg-primary-400 rounded-full animate-bounce [animation-delay:-0.15s]"></span>
                                        <span className="h-2 w-2 bg-primary-400 rounded-full animate-bounce"></span>
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

                    <div className="flex-shrink-0 p-4 bg-black/30 border-t border-white/10">
                        <div className="flex items-center gap-3">
                            <input
                                type="text"
                                value={input}
                                onChange={e => setInput(e.target.value)}
                                onKeyPress={e => e.key === 'Enter' && handleSend()}
                                placeholder="Ask about majors, careers, or college life..."
                                className="font-body flex-1 w-full px-4 py-2 bg-gray-800 rounded-full border border-gray-700 focus:ring-2 focus:ring-primary-500 focus:outline-none transition"
                                disabled={isLoading}
                            />
                            <button onClick={() => handleSend()} disabled={isLoading || !input.trim()} className="w-10 h-10 flex-shrink-0 rounded-full bg-primary-600 text-white flex items-center justify-center hover:bg-primary-700 disabled:bg-gray-700 disabled:cursor-not-allowed transition">
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