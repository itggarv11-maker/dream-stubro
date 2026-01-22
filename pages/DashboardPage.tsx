
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
    PaperAirplaneIcon, BoltIcon, StarIcon, ShieldCheckIcon
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

const coreTools = [
    { id: 'summary', icon: DocumentDuplicateIcon, title: 'Omega Summary', tag: '01', desc: 'Neural synthesis of entire chapters.', color: 'text-cyan-400', requiresContent: true },
    { id: 'flashcards', icon: RectangleStackIcon, title: 'Recall Engine', tag: '02', desc: 'Atomic data points for active recall.', color: 'text-pink-400', requiresContent: true },
    { id: 'quiz', icon: CheckBadgeIcon, title: 'Zenith Arena', tag: '03', desc: 'High-stakes curriculum validation.', color: 'text-emerald-400', requiresContent: true },
    { id: 'chat', icon: ChatBubbleIcon, title: 'Expert Terminal', tag: '04', desc: 'Direct uplink to curriculum logic.', color: 'text-violet-400', requiresContent: true },
];

const DashboardPage: React.FC = () => {
    const navigate = useNavigate();
    const { theme } = useTheme();
    const { extractedText, subject, tokens } = useContent() as any;
    const { userName } = useAuth();
    
    const [activeTool, setActiveTool] = useState<string>('none');
    const [isLoading, setIsLoading] = useState(false);
    const [resultData, setResultData] = useState<any>(null);
    const [error, setError] = useState<string | null>(null);
    const [showSyncModal, setShowSyncModal] = useState(false);

    // Chat Logic
    const [chatSession, setChatSession] = useState<Chat | null>(null);
    const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
    const [chatInput, setChatInput] = useState('');
    const [isChatThinking, setIsChatThinking] = useState(false);
    const chatScrollRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (chatScrollRef.current) chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight;
    }, [chatHistory]);

    const handleToolClick = async (toolId: string, requiresContent: boolean) => {
        if (requiresContent && !extractedText) {
            setShowSyncModal(true);
            return;
        }

        setIsLoading(true);
        setActiveTool(toolId);
        setResultData(null);
        setError(null);

        try {
            switch(toolId) {
                case 'summary':
                    const s = await geminiService.generateSmartSummary(subject || Subject.Science, "Class 10", extractedText!);
                    setResultData(s);
                    break;
                case 'flashcards':
                    setResultData([{ term: "Conceptual Integrity", definition: "Consistency across logic nodes." }]);
                    break;
                case 'quiz':
                    const q = await geminiService.generateQuiz(subject || Subject.Science, "Class 10", extractedText!, 5);
                    setResultData(q);
                    break;
                case 'chat':
                    const session = geminiService.createGeneralChat(extractedText!);
                    setChatSession(session);
                    setChatHistory([{ role: 'model', text: "Uplink stable. Core ready." }]);
                    break;
                default: throw new Error("Target node offline.");
            }
        } catch (e: any) {
            setError(e.message || "Logic failure.");
            setActiveTool('none');
        } finally { setIsLoading(false); }
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
    };

    if (activeTool !== 'none') {
        return (
            <div className="max-w-[1600px] mx-auto px-6 md:px-12 pb-40 animate-in fade-in duration-500">
                <button onClick={resetAllState} className="flex items-center gap-4 text-[10px] font-black text-slate-500 hover:text-white mb-16 uppercase tracking-widest group">
                    <div className="p-4 bg-slate-900 rounded-2xl group-hover:bg-violet-600 transition-all shadow-lg">&larr; ABORT MISSION</div>
                </button>
                {isLoading ? (
                    <div className="py-60 flex flex-col items-center gap-10">
                        <Spinner className="w-40 h-40" colorClass="bg-violet-500" />
                        <p className="text-4xl font-black italic tracking-tightest text-white uppercase animate-pulse">Syncing Neural Cores...</p>
                    </div>
                ) : (
                    <>
                        {activeTool === 'summary' && resultData && <SmartSummaryComponent summary={resultData} />}
                        {activeTool === 'flashcards' && resultData && <FlashcardComponent flashcards={resultData} />}
                        {activeTool === 'quiz' && resultData && <QuizComponent questions={resultData} onFinish={resetAllState} />}
                        {activeTool === 'chat' && (
                             <Card variant="dark" className="!p-0 border-white/5 bg-slate-950/60 rounded-[4rem] overflow-hidden flex flex-col h-[75vh] shadow-2xl">
                                <div ref={chatScrollRef} className="flex-grow overflow-y-auto p-10 space-y-10 scrollbar-hide">
                                    {chatHistory.map((msg, i) => (
                                        <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                            <div className={`max-w-[80%] p-10 rounded-[3rem] shadow-2xl ${msg.role === 'user' ? 'bg-violet-600 text-white font-black italic shadow-violet-600/30' : 'bg-slate-900 border border-white/5 text-slate-200'}`}>
                                                <MathRenderer text={msg.text} isChat />
                                            </div>
                                        </div>
                                    ))}
                                    {isChatThinking && <div className="ml-10"><Spinner colorClass="bg-violet-500" /></div>}
                                </div>
                                <form onSubmit={(e) => { e.preventDefault(); handleSendChatMessage(); }} className="p-10 bg-black/60 border-t border-white/5 flex gap-6">
                                    <input value={chatInput} onChange={e => setChatInput(e.target.value)} placeholder="Type Logic Signal..." className="flex-grow bg-slate-950 border border-white/10 p-10 rounded-full text-white outline-none focus:border-violet-500 font-mono italic"/>
                                    <button type="submit" disabled={!chatInput.trim() || isChatThinking} className="w-24 h-24 rounded-full bg-violet-600 flex items-center justify-center hover:scale-110 active:scale-95 transition-all shadow-2xl">
                                        <PaperAirplaneIcon className="w-10 h-10 text-white" />
                                    </button>
                                </form>
                            </Card>
                        )}
                    </>
                )}
            </div>
        );
    }

    return (
        <div className="max-w-[1800px] mx-auto px-6 md:px-12 pb-40 space-y-20">
            {/* APEX COMMAND HEADER */}
            <header className="flex flex-col lg:flex-row justify-between items-start lg:items-end gap-10 border-b border-white/5 pb-16 pt-10 relative overflow-hidden">
                <div className="relative z-10">
                    <h1 className={`text-[11px] font-black uppercase tracking-[1em] mb-4 italic ${theme === 'dark' ? 'text-cyan-400' : 'text-amber-600'}`}>Operational HQ</h1>
                    <div className="flex items-center gap-6">
                        <div className="p-5 bg-white/5 rounded-3xl border border-white/10 shadow-2xl"><RocketLaunchIcon className={`w-12 h-12 ${theme === 'dark' ? 'text-violet-400' : 'text-amber-500'}`}/></div>
                        <h2 className="text-6xl md:text-[10rem] font-black tracking-tightest uppercase italic leading-none">{subject || "IDLE"}</h2>
                    </div>
                </div>
                
                <div className="flex flex-col md:flex-row items-end md:items-center gap-10 relative z-10">
                    <div className="text-right">
                        <p className="text-[10px] font-black text-slate-600 uppercase tracking-widest mb-1 italic">Agent Class: Apex Student</p>
                        <p className="text-4xl font-black italic tracking-tighter uppercase">{userName?.split(' ')[0] || "USER"}</p>
                    </div>
                    <div className="p-8 bg-white/5 rounded-[2.5rem] border border-white/5 backdrop-blur-3xl space-y-3 min-w-[280px]">
                        <div className="flex justify-between items-center text-[9px] font-black text-slate-500 uppercase tracking-widest">
                            <span>Neural Energy</span>
                            <span className="text-violet-400">{tokens ?? '99'}%</span>
                        </div>
                        <div className="w-full h-1.5 bg-black rounded-full overflow-hidden shadow-inner">
                            <motion.div initial={{ width: 0 }} animate={{ width: `${(tokens || 100) / 10}%` }} className="h-full bg-violet-600 shadow-[0_0_15px_#8b5cf6]"/>
                        </div>
                    </div>
                </div>
            </header>

            {/* STRATEGIC BENTO GRID */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
                
                <div className="lg:col-span-4 space-y-10">
                    <div className="space-y-6">
                        <h3 className="text-[10px] font-black text-white/20 uppercase tracking-[1em] italic">01. Neural Core</h3>
                        <div className="grid grid-cols-1 gap-4">
                            {coreTools.map(tool => (
                                <motion.div 
                                    key={tool.id} 
                                    whileHover={{ x: 10 }} 
                                    onClick={() => handleToolClick(tool.id, tool.requiresContent)}
                                    className="p-8 bg-slate-900/40 hover:bg-slate-900/80 border border-white/5 hover:border-violet-500/30 rounded-[2.5rem] flex items-center justify-between cursor-pointer transition-all group"
                                >
                                    <div className="flex items-center gap-6">
                                        <div className={`p-4 rounded-2xl bg-black/60 border border-white/5 transition-all group-hover:scale-110 ${tool.color}`}><tool.icon className="w-8 h-8"/></div>
                                        <div>
                                            <h4 className="text-2xl font-black uppercase italic text-white leading-none mb-1">{tool.title}</h4>
                                            <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">{tool.desc}</p>
                                        </div>
                                    </div>
                                    <span className="text-[10px] font-black opacity-10 group-hover:opacity-100 group-hover:text-violet-500 transition-all italic">READY</span>
                                </motion.div>
                            ))}
                        </div>
                    </div>

                    <Card variant="dark" className="!p-10 !rounded-[3.5rem] border-white/5 relative overflow-hidden bg-gradient-to-br from-violet-600/10 to-transparent group cursor-pointer" onClick={() => navigate('/career-guidance')}>
                        <div className="absolute top-0 right-0 p-8 opacity-[0.03] group-hover:rotate-12 transition-transform duration-700"><RocketLaunchIcon className="w-32 h-32"/></div>
                        <h4 className="text-xs font-black text-violet-500 uppercase tracking-[0.5em] mb-4">Apex Pathway</h4>
                        <h3 className="text-4xl font-black text-white uppercase italic tracking-tightest leading-none mb-6">DESTINY TREE</h3>
                        <p className="text-slate-500 text-sm font-medium italic leading-relaxed">Visual skill-roadmaps for your specific professional ambition.</p>
                    </Card>
                </div>

                <div className="lg:col-span-8 space-y-10">
                    
                    {/* ARENA FLAGSHIP CARD */}
                    <div className="relative group cursor-pointer" onClick={() => navigate('/group-quiz')}>
                         <div className="absolute -inset-1 bg-gradient-to-r from-cyan-600 via-violet-600 to-pink-600 rounded-[4.5rem] blur opacity-20 group-hover:opacity-60 transition duration-1000"></div>
                         <Card variant="dark" className="relative !p-16 md:!p-20 !rounded-[4rem] border-white/10 bg-[#020408] overflow-hidden flex flex-col md:flex-row items-center gap-16">
                            <div className="absolute top-0 right-0 p-16 opacity-[0.03] group-hover:scale-125 transition-transform duration-1000"><UsersIcon className="w-[600px] h-[600px]"/></div>
                            <div className="flex-grow space-y-8 text-center md:text-left">
                                <div className="inline-flex items-center gap-3 px-6 py-2 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 shadow-inner">
                                    <div className="w-2 h-2 rounded-full bg-cyan-400 animate-ping"></div>
                                    <span className="text-[10px] font-black uppercase tracking-widest italic">Live Arena Active</span>
                                </div>
                                <h3 className="text-7xl md:text-[10rem] font-black text-white italic tracking-tightest uppercase leading-none">THE ARENA</h3>
                                <p className="text-xl md:text-2xl text-slate-400 font-medium italic leading-relaxed max-w-xl">Real-time competitive logic battles. Cross-level matchmaking optimized for 99th percentile dominance. Prove your rank.</p>
                                <Button size="lg" className="h-24 px-16 !text-2xl !font-black !rounded-full !bg-white !text-black shadow-2xl hover:scale-105 transition-all italic">ENTER ARENA &rarr;</Button>
                            </div>
                         </Card>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                        <Card variant="dark" className="!p-12 !rounded-[4rem] border-white/5 hover:border-pink-500/30 transition-all cursor-pointer bg-slate-900/30 group" onClick={() => navigate('/study-planner')}>
                             <div className="flex items-center gap-6 mb-8">
                                <div className="p-4 bg-pink-500/10 rounded-2xl border border-pink-500/20 text-pink-500 group-hover:scale-110 transition-transform"><CalendarDaysIcon className="w-10 h-10"/></div>
                                <h3 className="text-4xl font-black text-white italic tracking-tighter uppercase leading-none">WAR ROOM</h3>
                             </div>
                             <p className="text-slate-500 text-base font-medium italic leading-relaxed">Constraint-based tactical study scheduling. Peak focus optimization.</p>
                        </Card>

                        <Card variant="dark" className="!p-12 !rounded-[4rem] border-white/5 hover:border-violet-500/30 transition-all cursor-pointer bg-slate-900/30 group" onClick={() => handleToolClick('quiz', true)}>
                             <div className="flex items-center gap-6 mb-8">
                                <div className="p-4 bg-violet-500/10 rounded-2xl border border-violet-500/20 text-violet-500 group-hover:scale-110 transition-transform"><QuestIcon className="w-10 h-10"/></div>
                                <h3 className="text-4xl font-black text-white italic tracking-tighter uppercase leading-none">GAMEVERSE</h3>
                             </div>
                             <p className="text-slate-500 text-base font-medium italic leading-relaxed">Play your curriculum as a high-fidelity 3D mission. Knowledge is your XP.</p>
                        </Card>
                    </div>
                </div>
            </div>

            {/* SYNC MODAL */}
            <AnimatePresence>
                {showSyncModal && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[200] bg-black/95 backdrop-blur-4xl flex items-center justify-center p-8">
                         <Card variant="dark" className="max-w-3xl !p-20 !rounded-[5rem] border-violet-500/20 text-center space-y-12 relative overflow-hidden shadow-[0_60px_150px_rgba(0,0,0,1)]">
                             <div className="absolute top-0 left-0 w-full h-2 bg-violet-600"></div>
                             <div className="w-32 h-32 rounded-[2.5rem] bg-violet-600/10 border border-violet-500/20 mx-auto flex items-center justify-center shadow-2xl">
                                <BoltIcon className="w-16 h-16 text-violet-500" />
                             </div>
                             <h3 className="text-6xl font-black italic tracking-tightest uppercase text-white leading-none">NEURAL SYNC <br/> REQUIRED</h3>
                             <p className="text-2xl text-slate-400 font-medium italic leading-relaxed">This operational module requires chapter data to synthesize results. Synergize your notes or curriculum content to proceed.</p>
                             <div className="flex flex-col md:flex-row gap-6 justify-center">
                                 <Link to="/new-session" className="flex-grow"><Button size="lg" className="w-full h-24 !text-2xl !font-black !rounded-full !bg-white !text-black shadow-2xl hover:scale-105 transition-all">SYNC CONTENT NOW &rarr;</Button></Link>
                                 <Button onClick={() => setShowSyncModal(false)} variant="outline" className="h-24 px-12 !text-xl !font-black !rounded-full border-white/10 italic">CLOSE NODE</Button>
                             </div>
                         </Card>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default DashboardPage;
