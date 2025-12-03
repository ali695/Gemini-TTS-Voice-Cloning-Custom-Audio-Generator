
import React, { useState, useRef, useEffect } from 'react';
import { Chat, GenerateContentResponse } from "@google/genai";
import { createChatSession } from '../services/geminiService';
import { SendIcon } from './icons/SendIcon';
import { BotIcon } from './icons/BotIcon';
import { UserIcon } from './icons/UserIcon';

interface Message {
    id: string;
    role: 'user' | 'model';
    text: string;
    isStreaming?: boolean;
}

export const ChatInterface: React.FC = () => {
    const [chatSession, setChatSession] = useState<Chat | null>(null);
    const [messages, setMessages] = useState<Message[]>([
        { id: 'welcome', role: 'model', text: "Hello! I'm your VoiceGen Assistant. I can help you write scripts, suggest voice settings, or give you tips on how to create specific emotional performances. What are you working on today?" }
    ]);
    const [inputText, setInputText] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        // Initialize chat session
        const session = createChatSession();
        setChatSession(session);
    }, []);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const handleSendMessage = async () => {
        if (!inputText.trim() || !chatSession || isLoading) return;

        const userMsg: Message = { id: Date.now().toString(), role: 'user', text: inputText };
        setMessages(prev => [...prev, userMsg]);
        setInputText('');
        setIsLoading(true);

        try {
            const streamResult = await chatSession.sendMessageStream({ message: userMsg.text });
            
            const botMsgId = (Date.now() + 1).toString();
            setMessages(prev => [...prev, { id: botMsgId, role: 'model', text: '', isStreaming: true }]);

            let fullText = '';
            for await (const chunk of streamResult) {
                const c = chunk as GenerateContentResponse;
                const chunkText = c.text || '';
                fullText += chunkText;
                
                setMessages(prev => prev.map(m => 
                    m.id === botMsgId ? { ...m, text: fullText } : m
                ));
            }
            
             setMessages(prev => prev.map(m => 
                    m.id === botMsgId ? { ...m, isStreaming: false } : m
            ));

        } catch (error) {
            console.error("Chat error:", error);
            setMessages(prev => [...prev, { id: Date.now().toString(), role: 'model', text: "I'm sorry, I encountered an error processing your request." }]);
        } finally {
            setIsLoading(false);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSendMessage();
        }
    };

    return (
        <div className="flex flex-col h-full max-h-[calc(100vh-180px)]">
            <div className="flex-grow overflow-y-auto p-6 space-y-6 custom-scrollbar">
                {messages.map((msg) => (
                    <div key={msg.id} className={`flex items-start gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${msg.role === 'user' ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20' : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300'}`}>
                            {msg.role === 'user' ? <UserIcon className="w-5 h-5" /> : <BotIcon className="w-5 h-5" />}
                        </div>
                        <div className={`max-w-[80%] rounded-2xl px-5 py-3.5 text-sm leading-relaxed shadow-sm whitespace-pre-wrap ${
                            msg.role === 'user' 
                                ? 'bg-blue-600 text-white rounded-tr-none' 
                                : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 rounded-tl-none'
                        }`}>
                            {msg.text}
                            {msg.isStreaming && <span className="inline-block w-1.5 h-4 ml-1 bg-current opacity-50 animate-pulse align-middle"></span>}
                        </div>
                    </div>
                ))}
                <div ref={messagesEndRef} />
            </div>

            <div className="flex-shrink-0 p-4 border-t border-slate-200 dark:border-white/5 bg-white/50 dark:bg-black/20 backdrop-blur-md">
                <div className="relative flex items-center max-w-4xl mx-auto">
                    <textarea
                        value={inputText}
                        onChange={(e) => setInputText(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder="Ask for script ideas, technical help, or voice suggestions..."
                        rows={1}
                        className="w-full bg-white dark:bg-slate-800 rounded-full border border-slate-300 dark:border-slate-700 focus:ring-2 focus:ring-blue-500 dark:focus:ring-cyan-400/50 focus:border-blue-500 dark:focus:border-cyan-400 transition-all text-sm py-3.5 pl-6 pr-14 shadow-sm resize-none overflow-hidden custom-scrollbar"
                        style={{ minHeight: '48px' }}
                    />
                    <button
                        onClick={handleSendMessage}
                        disabled={!inputText.trim() || isLoading}
                        className="absolute right-2 p-2 rounded-full bg-blue-600 hover:bg-blue-500 dark:bg-cyan-500 dark:hover:bg-cyan-400 text-white dark:text-black shadow-md transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                    >
                        <SendIcon className="w-5 h-5" />
                    </button>
                </div>
                 <div className="text-center mt-2">
                    <p className="text-[10px] text-slate-400 dark:text-slate-500">AI can make mistakes. Check important info.</p>
                </div>
            </div>
        </div>
    );
};
