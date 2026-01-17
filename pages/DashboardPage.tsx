
import React, { useState, useMemo, useRef, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useContent } from '../contexts/ContentContext';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { motion, AnimatePresence } from 'framer-motion';
import {
    AcademicCapIcon, BrainCircuitIcon, ChatBubbleIcon,
    DocumentDuplicateIcon, LightBulbIcon, 
    RocketLaunchIcon, BeakerIcon, SparklesIcon, ScaleIcon,
    CalendarDaysIcon, UsersIcon, MicrophoneIcon, 
    VideoCameraIcon, DocumentTextIcon, 
    RectangleStackIcon, CheckBadgeIcon, QuestIcon,
    PaperAirplaneIcon, XMarkIcon, SearchIcon, UploadIcon
} from '../components/icons';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import Spinner from '../components/common/Spinner';
import * as geminiService from '../services/geminiService';
import SmartSummaryComponent from '../components/app/SmartSummaryComponent';
import MathRenderer from '../components/common/MathRenderer';
import FlashcardComponent from '../components/app/FlashcardComponent';
import QuizComponent from '../components/app/QuizComponent';
import { Subject, ChatMessage } from '../types';
import { Chat } from '@google/genai';

const toolCategories = [
    {
        name: 'Neural Intake (Mandatory First Steps)',
        tools: [
            { id: 'summary', icon: DocumentDuplicateIcon, title: 'Omega Summary', tag: 'STEP 01', description: 'Compress entire chapters into logic points.', color: 'text-cyan-400', path: null, subjects: 'all' },
            { id: 'flashcards', icon: RectangleStackIcon, title: 'Recall Cards', tag: 'STEP 02', description: 'Active recall engine for facts and terms.', color: 'text-pink-400', path: null, subjects: 'all' },
            { id: 'quiz', icon: CheckBadgeIcon, title: 'Zenith Quiz', tag: 'STEP 03', description: 'Validate understanding in the high-stakes logic arena.', color: 'text-emerald-400', path: null, subjects: 'all' },
            { id: 'chat', icon: ChatBubbleIcon, title: 'Doubt Terminal', tag: 'STEP 04', description: 'Deep conceptual conversation with AI.', color: 'text-violet-400', path: null, subjects: 'all' },
        ]
    },
    {
        name: 'Strategic Simulations',
        tools: [
            { id: 'gameverse', icon: QuestIcon, title: 'Gameverse', tag: 'IMMERSIVE', description: 'Play your chapter as a 3D mission.', color: 'text-violet-500', path: '/chapter-conquest', subjects: 'all' },
            { id: 'math', icon: ScaleIcon, title: 'Brahmastra', tag: '101% ACCURACY', description: 'Flawless math proofs and step solutions.', color: 'text-amber-500', path: null, subjects: [Subject.Math, Subject.Physics, Subject.Science] },
            { id: 'paper', icon: DocumentTextIcon, title: 'Mock Paper', tag: 'EXAM PREP', description: 'Generate and grade board-level papers.', color: 'text-blue-400', path: '/question-paper', subjects: 'all' },
        ]
    }
];

const DashboardPage: React.FC = () => {
    const navigate = useNavigate();
    const { theme } = useTheme();
    const { extractedText, subject, classLevel, searchStatus, hasSessionStarted } = useContent();
    const { userName } = useAuth();
    
    const [activeTool, setActiveTool] = useState<string>('none');
    const [isLoading, setIsLoading] = useState(false);
    const [resultData, setResultData] = useState<any>(null);
    const [error, setError] = useState<string | null>(null);

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
        if (tool.id === 'math') { navigate('/app'); return; }
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
                case 'flashcards':
                    const f = [{ term: "Concept Extraction", definition: "Compressing dense text into atomic nodes." }, { term: "Logic Loop", definition: "A recurring cycle of query and verification." }];
                    setResultData(f);
                    break;
                case 'quiz':
                    const q = await geminiService.generateQuiz(subject!, classLevel, extractedText, 5);
                    setResultData(q);
                    break;
                case 'chat':
                    const session = geminiService.createGeneralChat(extractedText);
                    setChatSession(session);
                    setChatHistory([{ role: 'model', text: "Neural link stable. I've analyzed your chapter data. What would you like to discuss?" }]);
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
            case 'flashcards': return resultData && <FlashcardComponent flashcards={resultData} />;
            case 'quiz': return resultData && <QuizComponent questions={resultData} onFinish={resetAllState} />;
            case 'chat':
                return (
                    <Card variant="dark" className="!p-0 border-white/5 bg-slate-950/60 rounded-[3rem] overflow-hidden flex flex-col h-[75vh] shadow-2xl">
                        <div ref={chatScrollRef} className="flex-grow overflow-y-auto p-8 space-y-8 scrollbar-hide">
                            {chatHistory.map((msg, i) => (
                                <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                    <div className={`max-w-[85%] p-6 md:p-10 rounded-[2.5rem] shadow-2xl ${msg.role === 'user' ? (theme === 'dark' ? 'bg-violet-600 text-white' : 'bg-slate-900 text-white') : 'bg-white/5 text-slate-200 border border-white/10'}`}>
                                        <MathRenderer text={msg.text} isChat />
                                    </div>
                                </div>
                            ))}
                            {isChatThinking && <div className="flex justify-start px-8"><Spinner colorClass="bg-violet-500" className="w-8 h-8"/></div>}
                        </div>
                        <form onSubmit={(e) => { e.preventDefault(); handleSendChatMessage(); }} className="p-6 md:p-10 bg-black/60 border-t border-white/5 flex gap-4">
                            <input value={chatInput} onChange={e => setChatInput(e.target.value)} placeholder="> Signal inquiry..." className="flex-grow bg-slate-950 border border-white/10 p-5 md:p-8 rounded-full text-white outline-none focus:border-violet-500 font-mono-code italic"/>
                            <button type="submit" disabled={!chatInput.trim() || isChatThinking} className={`w-16 h-16 md:w-24 md:h-24 rounded-full flex items-center justify-center hover:scale-105 active:scale-95 transition-all shadow-2xl ${theme === 'dark' ? 'bg-cyan-500' : 'bg-amber-500'}`}>
                                <PaperAirplaneIcon className="w-6 h-6 md:w-10 md:h-10 text-black" />
                            </button>
                        </form>
                    </Card>
                );
            default: return null;
        }
    };

    return (
        <div className="max-w-[1800px] mx-auto px-6 md:px-12 space-y-12 pb-40">
            {activeTool === 'none' ? (
                 <>
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col lg:flex-row justify-between items-start lg:items-end gap-10 border-b border-white/5 pb-16 pt-10">
                        <div>
                            <h1 className={`text-[10px] font-black uppercase tracking-[1em] mb-4 italic ${theme === 'dark' ? 'text-cyan-400' : 'text-amber-600'}`}>Operational HQ</h1>
                            <div className="flex items-center gap-6">
                                <div className="p-4 bg-white/5 rounded-[2rem] border border-white/10 shadow-2xl"><RocketLaunchIcon className={`w-10 h-10 ${theme === 'dark' ? 'text-violet-400' : 'text-amber-500'}`}/></div>
                                <h2 className="text-5xl md:text-8xl font-black tracking-tightest uppercase italic leading-none">{subject || "SYNC_PENDING"}</h2>
                            </div>
                        </div>
                        <div className="flex items-center gap-8">
                             <div className="text-right">
                                <p className="text-[10px] font-black text-slate-600 uppercase tracking-widest mb-1 italic">Protocol: Secure</p>
                                <p className="text-3xl font-black italic">AGENT: {userName?.split(' ')[0].toUpperCase() || "UNKNWN"}</p>
                             </div>
                             <Link to="/new-session"><Button variant="outline" className="h-20 !px-12 !text-[11px] !font-black uppercase tracking-widest italic !rounded-[2rem]">RELOAD CORE</Button></Link>
                        </div>
                    </motion.div>
                    
                    <div className="space-y-40">
                        {filteredCategories.map((cat) => (
                            <div key={cat.name} className="space-y-16">
                                <h3 className="text-xl md:text-4xl font-black text-white/10 uppercase tracking-[1em] italic">{cat.name}</h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 md:gap-12">
                                    {cat.tools.map((tool) => (
                                        <motion.div key={tool.id} whileHover={{ y: -20, scale: 1.02 }} className="group cursor-pointer" onClick={() => handleToolClick(tool)}>
                                            <Card variant="dark" className="!p-12 border-white/5 group-hover:border-violet-500/30 group-hover:shadow-[0_40px_120px_rgba(0,0,0,0.8)] transition-all relative overflow-hidden h-full flex flex-col !rounded-[4.5rem]">
                                                <div className="absolute top-0 right-0 p-10 opacity-[0.03] group-hover:opacity-[0.12] transition-opacity"><tool.icon className="w-32 h-32" /></div>
                                                <div className="flex justify-between items-start mb-12">
                                                    <div className={`p-5 rounded-[2rem] bg-black/60 border border-white/10 group-hover:scale-110 transition-transform ${tool.color}`}><tool.icon className="w-8 h-8"/></div>
                                                    <span className="text-[10px] font-black opacity-30 group-hover:opacity-100 bg-white/5 px-6 py-2 rounded-full border border-white/5 tracking-widest italic">{tool.tag}</span>
                                                </div>
                                                <h4 className="text-3xl md:text-5xl font-black uppercase italic mb-6 leading-none group-hover:text-cyan-400 transition-colors">{tool.title}</h4>
                                                <p className="text-lg text-slate-500 font-medium group-hover:text-slate-300 transition-colors leading-relaxed italic">{tool.description}</p>
                                                <div className="mt-auto pt-10 flex items-center gap-2 text-violet-500 text-[10px] font-black uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-all duration-500 italic">INITIALIZE MODULE &rarr;</div>
                                            </Card>
                                        </motion.div>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                 </>
            ) : (
                <div className="animate-in fade-in duration-1000">
                    <button onClick={resetAllState} className="group flex items-center gap-8 text-slate-500 hover:text-white mb-20 transition-all text-[11px] font-black uppercase tracking-[0.6em] italic">
                        <div className="p-5 bg-slate-900 rounded-3xl group-hover:bg-violet-600 transition-all shadow-2xl">&larr; ABORT COMMAND</div>
                    </button>
                    {isLoading ? (
                        <div className="py-60 flex flex-col items-center gap-16 text-center">
                            <div className="relative">
                                <div className={`absolute inset-0 blur-[150px] opacity-20 animate-pulse ${theme === 'dark' ? 'bg-cyan-400' : 'bg-amber-500'}`}></div>
                                <Spinner className="w-48 h-48 relative z-10" colorClass={theme === 'dark' ? 'bg-cyan-400' : 'bg-amber-500'}/>
                            </div>
                            <p className="text-6xl font-black uppercase tracking-tightest text-white animate-pulse italic">Engaging Logical Cores...</p>
                        </div>
                    ) : renderToolResult()}
                </div>
            )}
        </div>
    );
};

export default DashboardPage;
