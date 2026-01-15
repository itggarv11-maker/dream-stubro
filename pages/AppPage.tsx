import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Subject, QuizQuestion, ChatMessage, ClassLevel, Flashcard, MindMapNode, QuizDifficulty, SmartSummary } from '../types';
import * as geminiService from '../services/geminiService';
import Button from '../components/common/Button';
import Spinner from '../components/common/Spinner';
import Card from '../components/common/Card';
import { Chat } from '@google/genai';
import QuizComponent from '../components/app/QuizComponent';
import * as pdfjs from 'pdfjs-dist';
import FlashcardComponent from '../components/app/FlashcardComponent';
import MindMap from '../components/app/MindMap';
import { useContent } from '../contexts/ContentContext';

// Using version-matched CDN for stable worker resolution in Vite environments
pdfjs.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

type ActiveTool = 'chat' | 'quiz' | 'summary' | 'flashcards' | 'mindmap' | 'none';

const AppPage: React.FC = () => {
    const navigate = useNavigate();
    const { 
        extractedText,
        subject, 
        classLevel, 
        hasSessionStarted,
    } = useContent();
    
    const [activeTool, setActiveTool] = useState<ActiveTool>('none');
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [loadingMessage, setLoadingMessage] = useState('Processing...');
    const [error, setError] = useState<React.ReactNode | null>(null);

    const [quiz, setQuiz] = useState<QuizQuestion[] | null>(null);
    const [smartSummary, setSmartSummary] = useState<SmartSummary | null>(null);
    const [flashcards, setFlashcards] = useState<Flashcard[] | null>(null);
    const [mindMapData, setMindMapData] = useState<MindMapNode | null>(null);
    const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
    const [chatSession, setChatSession] = useState<Chat | null>(null);
    const [userMessage, setUserMessage] = useState('');

    const chatContainerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (chatContainerRef.current) {
            chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
        }
    }, [chatHistory]);
    
    const handleApiError = (err: unknown) => {
        if (err instanceof Error) {
            if (err.message.includes("Insufficient tokens")) {
                setError(<span>You're out of tokens! Upgrade for more.</span>);
            } else {
                setError(err.message);
            }
        } else {
            setError("An unknown error occurred.");
        }
    };

    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!userMessage.trim() || !chatSession || isLoading) return;
        const newUserMessage: ChatMessage = { role: 'user', text: userMessage };
        setChatHistory(prev => [...prev, newUserMessage]);
        setUserMessage('');
        setIsLoading(true);
        try {
            const stream = await geminiService.sendMessageStream(chatSession, userMessage);
            let modelResponse = '';
            setChatHistory(prev => [...prev, { role: 'model', text: '' }]);
            for await (const chunk of stream) {
                modelResponse += chunk.text;
                setChatHistory(prev => { const newHistory = [...prev]; newHistory[newHistory.length - 1].text = modelResponse; return newHistory; });
            }
        } catch (e) { handleApiError(e); setChatHistory(prev => prev.slice(0, -1)); } finally { setIsLoading(false); }
    };

    const handleGoBackToTools = () => { setActiveTool('none'); setQuiz(null); setError(null); };

    const renderDashboard = () => (
         <div>
            {activeTool === 'none' && (
                <div className="text-center"><h2 className="text-2xl text-white">Choose a Tool</h2></div>
            )}
            {activeTool !== 'none' && renderToolUI()}
        </div>
    );

    const renderToolUI = () => {
        if (isLoading) return <div className="flex justify-center p-10"><Spinner colorClass="bg-white"/></div>;
        switch(activeTool) {
            case 'chat': return <Card className="h-[60vh] flex flex-col"><div className="flex-grow overflow-y-auto p-4 space-y-4">{chatHistory.map((msg, i) => <div key={i} className={msg.role === 'user' ? 'text-right text-white' : 'text-left text-slate-300'}>{msg.text}</div>)}</div><form onSubmit={handleSendMessage} className="p-4 bg-slate-800/50 flex gap-2"><input value={userMessage} onChange={e=>setUserMessage(e.target.value)} className="flex-grow bg-slate-900 text-white p-2 rounded" /><Button type="submit">Send</Button></form></Card>;
            case 'quiz': return quiz ? <QuizComponent questions={quiz} onFinish={handleGoBackToTools} /> : null;
            case 'summary': return smartSummary && <Card><div className="prose prose-invert"><h3>{smartSummary.title}</h3><p>{smartSummary.stuBroTip}</p></div></Card>;
            case 'flashcards': return flashcards && <FlashcardComponent flashcards={flashcards} />;
            case 'mindmap': return mindMapData && <div className="space-y-4"><h3 className="text-center text-white text-xl">Mind Map</h3><MindMap data={mindMapData}/></div>;
            default: return null;
        }
    };

    if (!hasSessionStarted) return null; 

    return <div className="space-y-8">{renderDashboard()}</div>;
};

export default AppPage;