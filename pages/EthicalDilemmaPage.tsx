import React, { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import Spinner from '../components/common/Spinner';
import { EthicalDilemmaIcon, PaperAirplaneIcon } from '../components/icons';
import { Chat } from '@google/genai';
import * as geminiService from '../services/geminiService';
import { ChatMessage } from '../types';
import MathRenderer from '../components/common/MathRenderer';

const DILEMMA_TOPICS = ["General", "Technology & AI", "Medicine & Biology", "History & Society"];

const EthicalDilemmaPage: React.FC = () => {
    const [step, setStep] = useState<'setup' | 'chatting'>('setup');
    const [topic, setTopic] = useState(DILEMMA_TOPICS[0]);
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

    const handleStart = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setIsLoading(true);
        try {
            const session = geminiService.createDilemmaChatSession(topic);
            const initialMessage = await session.sendMessage({ message: "Present a challenging ethical dilemma for my topic." });
            setChatSession(session);
            setChatHistory([{ role: 'model', text: initialMessage.text }]);
            setStep('chatting');
        } catch (err) { handleApiError(err); } finally { setIsLoading(false); }
    };

    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!userMessage.trim() || !chatSession || isLoading) return;
        const msg = userMessage;
        setChatHistory(prev => [...prev, { role: 'user', text: msg }]);
        setUserMessage('');
        setIsLoading(true);
        try {
            const stream = await geminiService.sendMessageStream(chatSession, msg);
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
        } catch (e) { handleApiError(e); } finally { setIsLoading(false); }
    };

    return step === 'setup' ? (
        <Card variant="light" className="max-w-2xl mx-auto text-center">
            <EthicalDilemmaIcon className="w-20 h-20 mx-auto text-violet-500" />
            <h1 className="text-3xl font-bold mt-4">Ethical Dilemma Simulator</h1>
             <form onSubmit={handleStart} className="mt-8 space-y-4">
                <select value={topic} onChange={e => setTopic(e.target.value)} className="w-full p-3 bg-white/60 border border-slate-400 rounded-md">
                    {DILEMMA_TOPICS.map(f => <option key={f} value={f}>{f}</option>)}
                </select>
                <Button type="submit" size="lg" className="w-full" disabled={isLoading}>{isLoading ? <Spinner colorClass="bg-white" /> : 'Generate Dilemma'}</Button>
            </form>
        </Card>
    ) : (
        <Card variant="light" className="max-w-3xl mx-auto flex flex-col h-[70vh]">
            <div ref={chatContainerRef} className="flex-grow p-4 space-y-4 overflow-y-auto">
                {chatHistory.map((msg, i) => (
                    <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-[80%] p-4 rounded-2xl ${msg.role === 'user' ? 'bg-violet-600 text-white' : 'bg-slate-100 text-slate-800'}`}>
                            <MathRenderer text={msg.text} isChat />
                        </div>
                    </div>
                ))}
                {isLoading && <Spinner />}
            </div>
            <form onSubmit={handleSendMessage} className="p-4 border-t flex gap-2">
                <input value={userMessage} onChange={e => setUserMessage(e.target.value)} placeholder="What would you do?" className="flex-grow p-2 border rounded-lg outline-none" />
                <Button type="submit" disabled={isLoading || !userMessage.trim()}><PaperAirplaneIcon className="w-5 h-5"/></Button>
            </form>
        </Card>
    );
};

export default EthicalDilemmaPage;
