import React, { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import Spinner from '../components/common/Spinner';
import { HistoricalChatIcon } from '../components/icons';
import { Chat } from '@google/genai';
import * as geminiService from '../services/geminiService';
import { ChatMessage } from '../types';
import MathRenderer from '../components/common/MathRenderer';

const HISTORICAL_FIGURES = [
    "Albert Einstein", "Mahatma Gandhi", "Isaac Newton", "Marie Curie", 
    "Leonardo da Vinci", "William Shakespeare", "Chanakya", "Aryabhata"
];

const HistoricalChatPage: React.FC = () => {
    const [step, setStep] = useState<'setup' | 'chatting'>('setup');
    const [figure, setFigure] = useState(HISTORICAL_FIGURES[0]);
    
    const [chatSession, setChatSession] = useState<Chat | null>(null);
    const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
    const [userMessage, setUserMessage] = useState('');

    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<React.ReactNode | null>(null);
    const chatContainerRef = useRef<HTMLDivElement>(null);

     useEffect(() => {
        if (chatContainerRef.current) {
            chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
        }
    }, [chatHistory]);

    const handleApiError = (err: unknown) => {
        const message = err instanceof Error ? err.message : "An unknown error occurred.";
        setError(message.includes("Insufficient tokens")
            ? <span>You're out of tokens! Please <Link to="/premium" className="font-bold underline text-violet-600">upgrade to Premium</Link>.</span>
            : message);
        setIsLoading(false);
    };

    const handleStartChat = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setIsLoading(true);
        try {
            const session = geminiService.createHistoricalChatSession(figure);
            const initialMessage = await session.sendMessage({ message: "Please introduce yourself briefly in character." });
            
            setChatSession(session);
            setChatHistory([{ role: 'model', text: initialMessage.text }]);
            setStep('chatting');
        } catch (err) {
            handleApiError(err);
        } finally {
            setIsLoading(false);
        }
    };

    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!userMessage.trim() || !chatSession || isLoading) return;

        const newUserMessage: ChatMessage = { role: 'user', text: userMessage };
        setChatHistory(prev => [...prev, newUserMessage]);
        setUserMessage('');
        setIsLoading(true);
        setError(null);
        
        try {
            const stream = await geminiService.sendMessageStream(chatSession, userMessage);
            let modelResponse = '';
            setChatHistory(prev => [...prev, { role: 'model', text: '' }]);
            
            for await (const chunk of stream) {
                modelResponse += chunk.text;
                setChatHistory(prev => {
                    const newHistory = [...prev];
                    newHistory[newHistory.length - 1].text = modelResponse;
                    return newHistory;
                });
            }
        } catch (e) {
            handleApiError(e);
            setChatHistory(prev => prev.slice(0, -1));
        } finally {
            setIsLoading(false);
        }
    };

    const renderSetup = () => (
        <Card variant="light" className="text-center max-w-2xl mx-auto">
            <HistoricalChatIcon className="w-20 h-20 mx-auto text-violet-500" />
            <h1 className="text-3xl font-bold text-slate-800 mt-4">Historical Figure Chat</h1>
            <p className="mt-2 text-slate-600">
                Have a conversation with historical figures to understand their perspectives and learn about their lives.
            </p>
             <form onSubmit={handleStartChat} className="mt-8 space-y-4">
                <div>
                    <label htmlFor="figure" className="block text-sm font-medium text-slate-700">Choose a figure to chat with:</label>
                    <select id="figure" value={figure} onChange={e => setFigure(e.target.value)} className="mt-1 block w-full px-3 py-2 bg-white/60 border border-slate-400 rounded-md shadow-sm">
                        {HISTORICAL_FIGURES.map(f => <option key={f} value={f}>{f}</option>)}
                    </select>
                </div>
                {error && <p className="text-red-500 text-center font-semibold">{error}</p>}
                <Button type="submit" size="lg" disabled={isLoading}>
                    {isLoading ? <Spinner colorClass="bg-white" /> : 'Start Conversation'}
                </Button>
            </form>
        </Card>
    );

    const renderChat = () => (
        <Card variant="light" className="max-w-3xl mx-auto">
             <div className="flex flex-col h-[70vh]">
                <div className="text-center p-4 border-b border-slate-300">
                    <h2 className="text-xl font-bold text-slate-800">Chatting with {figure}</h2>
                     <Button variant="outline" size="sm" onClick={() => setStep('setup')} className="!mt-2 !text-xs">
                        Chat with Someone Else
                    </Button>
                </div>

                <div ref={chatContainerRef} className="flex-grow p-4 space-y-4 overflow-y-auto">
                    {chatHistory.map((msg, index) => (
                    <div key={index} className={`flex items-start gap-3 ${msg.role === 'user' ? 'justify-end' : ''}`}>
                        {msg.role === 'model' && <span className="flex-shrink-0 w-8 h-8 bg-slate-700 text-white rounded-full flex items-center justify-center font-bold text-sm shadow">AI</span>}
                        <div className={`max-w-xl p-3 rounded-lg shadow-sm ${msg.role === 'user' ? 'bg-violet-600 text-white' : 'bg-white text-slate-800 border border-slate-200'}`}>
                           <MathRenderer text={msg.text} isChat />
                        </div>
                        {msg.role === 'user' && <span className="flex-shrink-0 w-8 h-8 bg-slate-400 text-white rounded-full flex items-center justify-center font-bold text-sm shadow">You</span>}
                    </div>
                    ))}
                    {isLoading && <div className="flex justify-start"><Spinner colorClass="bg-slate-600" /></div>}
                </div>
                <form onSubmit={handleSendMessage} className="p-4 border-t border-slate-300 bg-slate-100/50 rounded-b-lg flex gap-2">
                    <input
                    type="text"
                    value={userMessage}
                    onChange={(e) => setUserMessage(e.target.value)}
                    placeholder={`Ask ${figure} a question...`}
                    className="w-full p-2 bg-white border border-slate-300 rounded-lg focus:ring-violet-500 focus:border-violet-500 text-slate-900"
                    />
                    <Button type="submit" disabled={isLoading || !userMessage.trim()}>Send</Button>
                </form>
            </div>
        </Card>
    );

    return step === 'setup' ? renderSetup() : renderChat();
};

export default HistoricalChatPage;