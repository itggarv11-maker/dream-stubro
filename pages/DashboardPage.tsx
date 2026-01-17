
import React, { useState, useMemo, useRef, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useContent } from '../contexts/ContentContext';
import { useAuth } from '../contexts/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import {
    AcademicCapIcon, BrainCircuitIcon, ChatBubbleIcon,
    DocumentDuplicateIcon, LightBulbIcon, 
    RocketLaunchIcon, BeakerIcon, SparklesIcon, ScaleIcon,
    CalendarDaysIcon, UsersIcon, MicrophoneIcon, 
    VideoCameraIcon, DocumentTextIcon, 
    PoetryProseIcon, ConceptAnalogyIcon, EthicalDilemmaIcon, 
    HistoricalChatIcon, WhatIfHistoryIcon, 
    AILabAssistantIcon, CameraIcon,
    // Fixed: Added missing CheckBadgeIcon to the imports
    StopIcon, PaperAirplaneIcon, XMarkIcon, ChatBubbleLeftRightIcon, SearchIcon, UploadIcon, QuestIcon, RectangleStackIcon, CheckBadgeIcon
} from '../components/icons';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import Spinner from '../components/common/Spinner';
import * as geminiService from '../services/geminiService';
import SmartSummaryComponent from '../components/app/SmartSummaryComponent';
import DiagramRenderer from '../components/app/DiagramRenderer';
import MathRenderer from '../components/common/MathRenderer';
import { Subject, ChatMessage } from '../types';
import { Chat } from '@google/genai';

const toolCategories = [
    {
        name: 'The Omega Core (Essential)',
        tools: [
            { id: 'summary', icon: DocumentDuplicateIcon, title: 'Neural Summary', tag: '01. SYNTHESIS', description: 'Compress entire chapters into core logic points.', color: 'text-cyan-400', path: null, subjects: 'all' },
            { id: 'mindmap', icon: BrainCircuitIcon, title: 'Recursive Map', tag: '02. VISUALIZE', description: '3D Knowledge hierarchy for spatial memory.', color: 'text-indigo-400', path: '/mind-map', subjects: 'all' },
            { id: 'quiz', icon: CheckBadgeIcon, title: 'Validation Quiz', tag: '03. VALIDATE', description: 'Real-time accuracy check with adaptive logic.', color: 'text-emerald-400', path: null, subjects: 'all' },
            { id: 'chat', icon: ChatBubbleIcon, title: 'Logic Dialogue', tag: '04. DEEP DIVE', description: 'Deep conceptual conversation with context-aware AI.', color: 'text-violet-500', path: null, subjects: 'all' },
        ]
    },
    {
        name: 'Immersive Mastery',
        tools: [
            { id: 'gameverse', icon: QuestIcon, title: 'Gameverse', tag: 'LIVE MISSION', description: 'Play your chapter as an immersive 3D mission.', color: 'text-violet-400', path: '/chapter-conquest', subjects: 'all' },
            { id: 'math', icon: ScaleIcon, title: 'Brahmastra Solver', tag: '101% LOGIC', description: 'Step-by-step proofs for complex geometry & calculus.', color: 'text-amber-400', path: null, subjects: [Subject.Math, Subject.Physics, Subject.Chemistry, Subject.Science] },
            { id: 'visual', icon: VideoCameraIcon, title: 'Drishya Narrator', tag: 'CINEMATIC', description: 'AI video summaries that explain like a documentary.', color: 'text-rose-400', path: '/visual-explanation', subjects: 'all' },
        ]
    },
    {
        name: 'Tactical Assessment',
        tools: [
            { id: 'pvp', icon: UsersIcon, title: 'Arena Battle', tag: 'MULTI-PLAYER', description: 'Real-time PVP quiz combat with cross-level ranking.', color: 'text-pink-400', path: '/group-quiz', subjects: 'all' },
            { id: 'paper', icon: DocumentTextIcon, title: 'Mock Paper', tag: 'BOARD PREP', description: 'Simulate official exams with AI-graded feedback.', color: 'text-blue-400', path: '/question-paper', subjects: 'all' },
            { id: 'viva', icon: MicrophoneIcon, title: 'Viva Master', tag: 'ORAL SKILLS', description: 'Practice oral exams with real-time voice analysis.', color: 'text-teal-400', path: '/viva', subjects: 'all' },
        ]
    }
];

const DashboardPage: React.FC = () => {
    const navigate = useNavigate();
    const { extractedText, subject, classLevel, searchStatus, hasSessionStarted } = useContent();
    const { userName } = useAuth();
    
    const [activeTool, setActiveTool] = useState<string>('none');
    const [isLoading, setIsLoading] = useState(false);
    const [resultData, setResultData] = useState<any>(null);
    const [error, setError] = useState<string | null>(null);

    // Common Tool States
    const [showMathInput, setShowMathInput] = useState(false);
    
    // Chat States
    const [chatSession, setChatSession] = useState<Chat | null>(null);
    const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
    const [chatInput, setChatInput] = useState('');
    const [isChatThinking, setIsChatThinking] = useState(false);
    const chatScrollRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!hasSessionStarted && searchStatus === 'idle') {
            navigate('/new-session', { replace: true });
        }
    }, [hasSessionStarted, searchStatus, navigate]);

    const filteredCategories = useMemo(() => {
        return toolCategories.map(cat => ({
            ...cat,
            tools: cat.tools.filter(t => t.subjects === 'all' || (subject && t.subjects.includes(subject)))
        })).filter(cat => cat.tools.length > 0);
    }, [subject]);

    useEffect(() => {
        if (chatScrollRef.current) chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight;
    }, [chatHistory]);

    const handleToolClick = async (tool: any) => {
        if (tool.id === 'math') { setShowMathInput(true); return; }
        if (tool.path) { navigate(tool.path); return; }
        if (!extractedText) { navigate('/new-session'); return; }

        setIsLoading(true);
        setActiveTool(tool.id);
        setResultData(null);
        setError(null);

        try {
            switch(tool.id) {
                case 'summary':
                    const s = await geminiService.generateSmartSummary(subject!, classLevel, extractedText);
                    setResultData(s);
                    break;
                case 'quiz':
                    const q = await geminiService.generateQuiz(subject!, classLevel, extractedText, 5);
                    setResultData(q);
                    break;
                case 'chat':
                    const session = geminiService.createGeneralChat(extractedText);
                    setChatSession(session);
                    setChatHistory([{ role: 'model', text: "Neural link stable. I've analyzed your content. What would you like to explore?" }]);
                    break;
                default:
                    throw new Error("Target module not initialized.");
            }
        } catch (e: any) {
            setError(e.message || "Logic sync failure.");
            setActiveTool('none');
        } finally {
            setIsLoading(false);
        }
    };
    
    const handleSendChatMessage = async () => {
        if (!chatInput.trim() || !chatSession || isChatThinking) return;
        const msg = chatInput;
        setChatInput('');
        setChatHistory(prev => [...prev, { role: 'user', text: msg }]);
        setIsChatThinking(true);
        try {
            const stream = await geminiService.sendMessageStream(chatSession, msg);
            let modelText = '';
            setChatHistory(prev => [...prev, { role: 'model', text: '' }]);
            for await (const chunk of stream) {
                modelText += chunk.text;
                setChatHistory(prev => {
                    const next = [...prev];
                    next[next.length - 1].text = modelText;
                    return next;
                });
            }
        } catch (e) { console.error(e); } finally { setIsChatThinking(false); }
    };
    
    const resetAllState = () => {
        setActiveTool('none');
        setResultData(null);
        setError(null);
        setChatHistory([]);
        setChatSession(null);
        setChatInput('');
    };

    const renderToolResult = () => {
        if (error) return <Card variant="dark" className="text-center p-12"><p className="text-red-500 font-black">{error}</p></Card>;
        
        switch(activeTool) {
            case 'summary': return resultData && <SmartSummaryComponent summary={resultData} />;
            case 'quiz': return resultData && <div className="max-w-4xl mx-auto"><Card variant="dark" className="!p-12"><p className="text-center italic text-slate-500 mb-8 uppercase tracking-widest text-[10px]">Neural Diagnostic Active</p>{resultData.map((q: any, i: number) => <div key={i} className="mb-10 p-8 bg-white/5 rounded-3xl border border-white/5"><MathRenderer text={q.question} className="text-xl font-bold mb-4" /><div className="space-y-3">{q.options.map((opt: string, j: number) => <div key={j} className="p-4 bg-black/40 rounded-xl border border-white/5 text-slate-400">{opt}</div>)}</div></div>)}</Card></div>;
            case 'chat':
                return (
                    <Card variant="dark" className="!p-0 border-white/5 bg-slate-950/60 rounded-3xl md:rounded-[4rem] overflow-hidden flex flex-col h-[70vh] md:h-[80vh] shadow-2xl">
                        <div ref={chatScrollRef} className="flex-grow overflow-y-auto p-6 md:p-12 space-y-8 scrollbar-hide">
                            {chatHistory.map((msg, i) => (
                                <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                    <div className={`max-w-[90%] md:max-w-[85%] p-6 md:p-10 rounded-2xl md:rounded-[3rem] shadow-2xl ${msg.role === 'user' ? 'bg-violet-600 text-white font-black italic shadow-violet-600/20' : 'bg-slate-900/80 text-slate-200 border border-white/10'}`}>
                                        <MathRenderer text={msg.text} isChat />
                                    </div>
                                </div>
                            ))}
                            {isChatThinking && <div className="flex justify-start px-6"><Spinner colorClass="bg-violet-500" className="w-8 h-8"/></div>}
                        </div>
                        <form onSubmit={(e) => { e.preventDefault(); handleSendChatMessage(); }} className="p-6 md:p-10 bg-black/60 border-t border-white/10 flex gap-4">
                            <input value={chatInput} onChange={e => setChatInput(e.target.value)} placeholder="> Ask about the content..." className="flex-grow bg-slate-950 border border-white/10 p-5 md:p-8 rounded-full text-white outline-none focus:border-violet-500 font-mono-code"/>
                            <button type="submit" disabled={!chatInput.trim() || isChatThinking} className="w-16 h-16 md:w-24 md:h-24 rounded-full bg-violet-600 flex items-center justify-center hover:scale-105 active:scale-95 transition-all shadow-2xl">
                                <PaperAirplaneIcon className="w-6 h-6 md:w-10 md:h-10 text-white" />
                            </button>
                        </form>
                    </Card>
                );
            default: return null;
        }
    };

    return (
        <div className="max-w-[1800px] mx-auto px-4 md:px-10 space-y-12 pb-40 transition-colors duration-500">
            {activeTool === 'none' ? (
                 <>
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col lg:flex-row justify-between items-start lg:items-end gap-10 border-b border-white/5 pb-16 pt-10">
                        <div>
                            <h1 className="text-[11px] font-black text-violet-400 uppercase tracking-[1em] mb-4 italic">Mission Status</h1>
                            <div className="flex items-center gap-4">
                                <div className="p-3 bg-white/5 rounded-2xl border border-white/10"><SparklesIcon className="w-6 h-6 text-amber-400"/></div>
                                <h2 className="text-4xl md:text-7xl font-black tracking-tightest uppercase italic leading-none">{subject || "ROOT_NODE"} <span className="opacity-20 italic">| {classLevel}</span></h2>
                            </div>
                        </div>
                        <div className="flex items-center gap-6">
                             <div className="text-right">
                                <p className="text-[9px] font-black text-slate-600 uppercase tracking-widest mb-1">Dossier: Stable</p>
                                <p className="text-2xl font-black italic">SYNCED: {userName?.split(' ')[0].toUpperCase() || "AGENT"}</p>
                             </div>
                             <Link to="/new-session"><Button variant="outline" className="h-16 !px-10 !text-[10px] !font-black uppercase tracking-widest">RELOAD CONTENT</Button></Link>
                        </div>
                    </motion.div>
                    
                    <div className="space-y-32">
                        {filteredCategories.map((cat) => (
                            <div key={cat.name} className="space-y-12">
                                <h3 className="text-xl md:text-3xl font-black text-white/20 uppercase tracking-[1em] italic">{cat.name}</h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8">
                                    {cat.tools.map((tool) => (
                                        <motion.div key={tool.id} whileHover={{ y: -15, scale: 1.02 }} className="group cursor-pointer" onClick={() => handleToolClick(tool)}>
                                            <Card variant="dark" className="!p-10 border-white/5 group-hover:border-violet-500/30 group-hover:shadow-[0_40px_100px_rgba(0,0,0,0.9)] transition-all relative overflow-hidden h-full flex flex-col !rounded-[3.5rem] bg-slate-900/40 backdrop-blur-xl">
                                                <div className="absolute top-0 right-0 p-8 opacity-[0.03] group-hover:opacity-[0.1] transition-opacity"><tool.icon className="w-32 h-32" /></div>
                                                <div className="flex justify-between items-start mb-10">
                                                    <div className={`p-4 rounded-2xl bg-black/40 border border-white/5 group-hover:scale-110 transition-transform ${tool.color}`}><tool.icon className="w-8 h-8"/></div>
                                                    <span className="text-[9px] font-black opacity-30 group-hover:opacity-100 bg-white/5 px-4 py-1.5 rounded-full border border-white/5 tracking-widest">{tool.tag}</span>
                                                </div>
                                                <h4 className="text-3xl md:text-4xl font-black uppercase italic mb-4 leading-none group-hover:text-cyan-400 transition-colors">{tool.title}</h4>
                                                <p className="text-sm text-slate-500 font-medium group-hover:text-slate-300 transition-colors leading-relaxed italic">{tool.description}</p>
                                                <div className="mt-auto pt-8 flex items-center gap-2 text-violet-500 text-[10px] font-black uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-all">ENGAGE LINK &rarr;</div>
                                            </Card>
                                        </motion.div>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                 </>
            ) : (
                <div className="animate-in fade-in duration-700">
                    <button onClick={resetAllState} className="group flex items-center gap-6 text-slate-500 hover:text-white mb-16 transition-colors text-[10px] font-black uppercase tracking-[0.5em] italic">
                        <div className="p-4 bg-slate-900 rounded-2xl group-hover:bg-violet-600 transition-all shadow-xl">&larr; ABORT MISSION</div>
                    </button>
                    {isLoading ? (
                        <div className="py-60 flex flex-col items-center gap-12 text-center">
                            <div className="relative">
                                <div className="absolute inset-0 bg-violet-600 blur-[150px] opacity-30 animate-pulse"></div>
                                <Spinner className="w-40 h-40 relative z-10" colorClass="bg-violet-500"/>
                            </div>
                            <p className="text-5xl font-black uppercase tracking-tighter text-white animate-pulse italic">CALIBRATING LOGIC CORES...</p>
                        </div>
                    ) : renderToolResult()}
                </div>
            )}
        </div>
    );
};

export default DashboardPage;
