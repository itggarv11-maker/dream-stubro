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
    StopIcon, PaperAirplaneIcon, XMarkIcon, ChatBubbleLeftRightIcon, SearchIcon
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
        name: 'Brahmastra Core',
        tools: [
            { id: 'math', icon: ScaleIcon, title: 'Maths Solver', tag: '110% ERROR-FREE', description: 'Legendary geometry & logic proofs.', color: 'text-amber-400', path: null, subjects: [Subject.Math, Subject.Physics, Subject.Chemistry, Subject.Science] },
            { id: 'summary', icon: DocumentDuplicateIcon, title: 'Neural Summary', tag: 'RECALL', description: 'High-quality concept synthesis.', color: 'text-cyan-400', path: null, subjects: 'all' },
            { id: 'chat', icon: ChatBubbleIcon, title: 'Gyan Samvaad', tag: 'AI CHAT', description: 'Dialogue with your books.', color: 'text-violet-400', path: null, subjects: 'all' },
        ]
    },
    {
        name: 'Assessment Arena',
        tools: [
            { id: 'paper', icon: DocumentTextIcon, title: 'Mock Paper', tag: 'EXAM PREP', description: 'Generate & Grade mock papers.', color: 'text-blue-400', path: '/question-paper', subjects: 'all' },
            { id: 'viva', icon: MicrophoneIcon, title: 'Viva Prep', tag: 'ORAL EXAM', description: 'Master voice assessments.', color: 'text-emerald-400', path: '/viva', subjects: 'all' },
            { id: 'pvp', icon: UsersIcon, title: 'Astral Arena', tag: 'BATTLE', description: 'Realtime PVP quiz combat.', color: 'text-fuchsia-400', path: '/group-quiz', subjects: 'all' },
        ]
    },
    {
        name: 'Knowledge Synth',
        tools: [
            { id: 'mindmap', icon: BrainCircuitIcon, title: 'Mind Map', tag: 'VISUAL', description: 'Recursive concept mapping.', color: 'text-indigo-400', path: '/mind-map', subjects: 'all' },
            { id: 'analogies', icon: ConceptAnalogyIcon, title: 'Guru Intuition', tag: 'ANALOGY', description: 'Understand complex logic.', color: 'text-amber-300', path: '/concept-analogy', subjects: 'all' },
            { id: 'visual', icon: VideoCameraIcon, title: 'Drishya Narrator', tag: 'VIDEO', description: 'Cinematic chapter summaries.', color: 'text-rose-400', path: '/visual-explanation', subjects: [Subject.History, Subject.Science, Subject.Biology, Subject.SST] },
        ]
    },
    {
        name: 'Humanities & Labs',
        tools: [
            { id: 'lab', icon: AILabAssistantIcon, title: 'AI Lab Asst', tag: 'EXPERIMENT', description: 'Safety & Procedure design.', color: 'text-cyan-500', path: '/ai-lab-assistant', subjects: [Subject.Physics, Subject.Chemistry, Subject.Science, Subject.Biology] },
            { id: 'poetry', icon: PoetryProseIcon, title: 'Literary Analyst', tag: 'EN/HI', description: 'Deep prose analysis.', color: 'text-violet-300', path: '/poetry-prose-analysis', subjects: [Subject.English, Subject.History] },
            { id: 'history', icon: HistoricalChatIcon, title: 'Historical Chat', tag: 'ROLEPLAY', description: 'Dialogue with legends.', color: 'text-amber-600', path: '/historical-chat', subjects: [Subject.History, Subject.SST] },
            { id: 'whatif', icon: WhatIfHistoryIcon, title: 'What If?', tag: 'TIMELINES', description: 'Explore alternate history.', color: 'text-red-400', path: '/what-if-history', subjects: [Subject.History, Subject.Geography] },
        ]
    }
];

const DashboardPage: React.FC = () => {
    const navigate = useNavigate();
    const { extractedText, subject, classLevel, searchStatus, searchMessage } = useContent();
    const { userName, tokens } = useAuth();
    const [activeTool, setActiveTool] = useState<string>('none');
    const [isLoading, setIsLoading] = useState(false);
    const [resultData, setResultData] = useState<any>(null);
    
    const [mathInputMode, setMathInputMode] = useState<'type' | 'upload' | 'speak'>('type');
    const [mathProblem, setMathProblem] = useState('');
    const [mathImage, setMathImage] = useState<string | null>(null);
    const [isRecording, setIsRecording] = useState(false);
    const [showMathInput, setShowMathInput] = useState(false);
    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    
    const [doubtChat, setDoubtChat] = useState<Chat | null>(null);
    const [doubtHistory, setDoubtHistory] = useState<ChatMessage[]>([]);
    const [doubtInput, setDoubtInput] = useState('');
    const [isDoubtThinking, setIsDoubtThinking] = useState(false);
    const doubtScrollRef = useRef<HTMLDivElement>(null);

    const filteredCategories = useMemo(() => {
        return toolCategories.map(cat => ({
            ...cat,
            tools: cat.tools.filter(t => t.subjects === 'all' || (subject && t.subjects.includes(subject)))
        })).filter(cat => cat.tools.length > 0);
    }, [subject]);

    useEffect(() => {
        if (doubtScrollRef.current) {
            doubtScrollRef.current.scrollTop = doubtScrollRef.current.scrollHeight;
        }
    }, [doubtHistory]);

    const handleMathSolve = async () => {
        setIsLoading(true);
        setShowMathInput(false);
        setActiveTool('math');
        try {
            let imagePart = null;
            if (mathImage) {
                imagePart = { inlineData: { mimeType: 'image/jpeg', data: mathImage.split(',')[1] } };
            }
            const m = await geminiService.solveMathsBrahmastra(mathProblem, classLevel, imagePart);
            setResultData(m);
            const session = geminiService.startMathDoubtChat(m);
            setDoubtChat(session);
        } catch (e) {
            console.error(e);
            setActiveTool('none');
        } finally {
            setIsLoading(false);
        }
    };

    const handleSendDoubt = async () => {
        if (!doubtInput.trim() || !doubtChat || isDoubtThinking) return;
        const msg = doubtInput;
        setDoubtInput('');
        setDoubtHistory(prev => [...prev, { role: 'user', text: msg }]);
        setIsDoubtThinking(true);
        try {
            const stream = await geminiService.sendMessageStream(doubtChat, msg);
            let modelText = '';
            setDoubtHistory(prev => [...prev, { role: 'model', text: '' }]);
            for await (const chunk of stream) {
                modelText += chunk.text;
                setDoubtHistory(prev => {
                    const next = [...prev];
                    next[next.length - 1].text = modelText;
                    return next;
                });
            }
        } catch (e) {
            console.error(e);
        } finally {
            setIsDoubtThinking(false);
        }
    };

    const startRecording = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            const recorder = new MediaRecorder(stream);
            mediaRecorderRef.current = recorder;
            recorder.start();
            setIsRecording(true);
            setTimeout(() => {
                setMathProblem("Analyze the provided input and solve with 100% precision.");
                stopRecording();
            }, 3000);
        } catch (err) { console.error(err); }
    };

    const stopRecording = () => {
        if (mediaRecorderRef.current) mediaRecorderRef.current.stop();
        setIsRecording(false);
    };

    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => setMathImage(reader.result as string);
            reader.readAsDataURL(file);
        }
    };

    const handleToolClick = async (tool: any) => {
        if (tool.id === 'math') { setShowMathInput(true); return; }
        if (tool.path) { navigate(tool.path); return; }
        
        if (!extractedText) { navigate('/new-session'); return; }
        setIsLoading(true);
        setActiveTool(tool.id);
        try {
            switch(tool.id) {
                case 'summary':
                    const s = await geminiService.generateSmartSummary(subject!, classLevel, extractedText);
                    setResultData(s);
                    break;
                default: break;
            }
        } catch (e) { console.error(e); setActiveTool('none'); } finally { setIsLoading(false); }
    };

    // FIX: Show high-visibility loading overlay if a background webcrawl is in progress
    if (searchStatus === 'searching') {
        return (
            <div className="min-h-[80vh] flex flex-col items-center justify-center p-10 text-center space-y-12">
                <div className="relative">
                    <div className="absolute inset-0 bg-cyan-500 blur-[100px] opacity-20 neon-glow"></div>
                    <div className="p-10 rounded-[3rem] bg-slate-900/50 border border-cyan-500/30 backdrop-blur-2xl relative z-10">
                        <SearchIcon className="w-20 h-20 text-cyan-400 mx-auto animate-pulse mb-6" />
                        <h2 className="text-4xl md:text-6xl font-black text-white uppercase tracking-tighter italic">CRAWLING WEB...</h2>
                    </div>
                </div>
                <div className="space-y-4 max-w-xl">
                    <p className="text-cyan-400 font-mono-tech text-sm tracking-[0.5em] uppercase font-black">Neural Interface Synchronizing</p>
                    <p className="text-slate-500 text-lg md:text-xl font-medium leading-relaxed italic">"{searchMessage || 'Acquiring chapter data from cloud nodes...'}"</p>
                </div>
                <Spinner className="w-12 h-12" colorClass="bg-cyan-500" />
            </div>
        );
    }

    return (
        <div className="max-w-[1800px] mx-auto px-4 md:px-10 space-y-12 md:space-y-24 pb-40">
            {/* Math Input Modal */}
            <AnimatePresence>
                {showMathInput && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[200] bg-slate-950/95 backdrop-blur-3xl flex items-center justify-center p-4 md:p-6">
                        <Card variant="dark" className="max-w-5xl w-full !p-6 md:!p-16 border-violet-500/30 shadow-[0_0_150px_rgba(139,92,246,0.25)] !rounded-3xl md:!rounded-[4rem] overflow-y-auto max-h-[90vh]">
                            <div className="flex justify-between items-center mb-8 md:mb-12">
                                <h2 className="text-2xl md:text-5xl font-black text-amber-400 uppercase tracking-tighter italic">NEURAL DATA INTAKE</h2>
                                <button onClick={() => setShowMathInput(false)} className="p-2 md:p-4 hover:bg-white/10 rounded-full transition-colors"><XMarkIcon className="w-6 h-6 md:w-8 md:h-8"/></button>
                            </div>

                            <div className="flex gap-2 md:gap-4 mb-6 md:mb-10 bg-black/40 p-2 md:p-3 rounded-2xl md:rounded-[2rem] border border-white/5">
                                {['type', 'upload', 'speak'].map(mode => (
                                    <button 
                                        key={mode} 
                                        onClick={() => setMathInputMode(mode as any)} 
                                        className={`flex-grow py-3 md:py-5 rounded-xl md:rounded-2xl text-[8px] md:text-[11px] font-black uppercase tracking-[0.2em] md:tracking-[0.4em] transition-all ${mathInputMode === mode ? 'bg-amber-500 text-black shadow-2xl' : 'text-slate-500 hover:text-white'}`}
                                    >
                                        {mode}
                                    </button>
                                ))}
                            </div>

                            <div className="min-h-[200px] md:min-h-[350px] mb-8 md:mb-12">
                                {mathInputMode === 'type' && (
                                    <textarea 
                                        value={mathProblem}
                                        onChange={e => setMathProblem(e.target.value)}
                                        placeholder="> Input question parameters or logic theorem..." 
                                        className="w-full h-48 md:h-72 bg-black/50 border border-white/10 p-6 md:p-10 rounded-2xl md:rounded-[3rem] text-white font-mono-code text-base md:text-xl focus:border-amber-400 outline-none resize-none shadow-inner leading-relaxed"
                                    />
                                )}
                                {mathInputMode === 'upload' && (
                                    <div className="h-48 md:h-72 border-4 border-dashed border-white/10 rounded-2xl md:rounded-[4rem] flex flex-col items-center justify-center gap-4 md:gap-8 group hover:border-amber-500/40 transition-all cursor-pointer">
                                        {mathImage ? (
                                            <div className="relative h-full w-full p-4">
                                                <img src={mathImage} className="h-full w-full object-contain rounded-xl" alt="Neural Scan" />
                                                <button onClick={() => setMathImage(null)} className="absolute top-4 right-4 bg-red-500 p-2 rounded-full shadow-2xl"><XMarkIcon className="w-4 h-4"/></button>
                                            </div>
                                        ) : (
                                            <label className="cursor-pointer flex flex-col items-center gap-4">
                                                <div className="p-6 md:p-10 bg-amber-500/10 rounded-full group-hover:scale-110 transition-transform"><CameraIcon className="w-10 h-10 md:w-16 md:h-16 text-amber-500"/></div>
                                                <span className="text-slate-500 font-black uppercase tracking-[0.2em] md:tracking-[0.3em] text-[10px] md:text-xs italic">Awaiting Visual Signature</span>
                                                <input type="file" className="hidden" accept="image/*" onChange={handleImageUpload} />
                                            </label>
                                        )}
                                    </div>
                                )}
                                {mathInputMode === 'speak' && (
                                    <div className="h-48 md:h-72 flex flex-col items-center justify-center gap-6 md:gap-10">
                                        <button onClick={isRecording ? stopRecording : startRecording} className={`w-24 h-24 md:w-36 md:h-36 rounded-full flex items-center justify-center transition-all ${isRecording ? 'bg-red-500 animate-pulse scale-110 shadow-[0_0_80px_rgba(239,68,68,0.4)]' : 'bg-amber-500 hover:bg-amber-400 shadow-[0_0_80px_rgba(245,158,11,0.4)]'}`}>
                                            {isRecording ? <StopIcon className="w-10 h-10 md:w-16 md:h-16 text-white"/> : <MicrophoneIcon className="w-10 h-10 md:w-16 md:h-16 text-black"/>}
                                        </button>
                                        <p className="text-slate-400 font-bold italic text-base md:text-xl text-center px-4">"{mathProblem || 'Neural Voice Recognition Active...'}"</p>
                                    </div>
                                )}
                            </div>

                            <Button onClick={handleMathSolve} className="w-full h-16 md:h-24 !bg-amber-500 shadow-[0_20px_60px_rgba(245,158,11,0.2)] !text-black !text-lg md:!text-3xl !font-black !rounded-2xl md:!rounded-[3rem] italic tracking-tighter">
                                INITIALIZE BRAHMASTRA →
                            </Button>
                        </Card>
                    </motion.div>
                )}
            </AnimatePresence>

            {activeTool === 'none' ? (
                <>
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col lg:flex-row justify-between items-start lg:items-end gap-10 border-b border-white/5 pb-12 md:pb-20 pt-10">
                        <div className="w-full">
                            <div className="flex flex-col md:flex-row items-start md:items-center gap-6 md:gap-8 mb-4 md:mb-8">
                                <div className="p-4 md:p-6 bg-violet-600 rounded-2xl md:rounded-[2.5rem] shadow-[0_0_159px_rgba(139,92,246,0.5)] border border-violet-400/30">
                                    <AcademicCapIcon className="w-8 h-8 md:w-12 md:h-12 text-white" />
                                </div>
                                <div>
                                    <h1 className="text-5xl md:text-8xl lg:text-9xl font-black tracking-tighter uppercase leading-none italic">COMMAND <span className="text-violet-500">HQ</span></h1>
                                    <div className="flex flex-wrap items-center gap-4 md:gap-10 mt-4 md:mt-6 font-tech text-[8px] md:text-xs text-slate-500 uppercase tracking-[0.2em] md:tracking-[0.5em] font-bold">
                                        <span className="text-white">OPERATOR: {userName}</span>
                                        <div className="hidden md:block w-1.5 h-1.5 bg-slate-800 rounded-full"></div>
                                        <span className="text-cyan-400">UNIT: {subject?.toUpperCase() || 'GENERAL'}</span>
                                        <div className="hidden md:block w-1.5 h-1.5 bg-slate-800 rounded-full"></div>
                                        <span className="text-pink-500 font-black">TOKENS: {tokens}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <Link to="/new-session" className="w-full lg:w-auto">
                            <Button size="lg" className="w-full md:h-28 px-10 md:px-20 !bg-white !text-slate-950 !text-xl md:!text-3xl !font-black shadow-[0_20px_80px_rgba(255,255,255,0.15)] hover:scale-105 active:scale-95 transition-transform uppercase italic !rounded-2xl md:!rounded-[2.5rem]">NEW MISSION</Button>
                        </Link>
                    </motion.div>

                    <div className="space-y-24 md:space-y-40">
                        {filteredCategories.map((cat) => (
                            <div key={cat.name} className="space-y-10 md:space-y-16">
                                <div className="flex items-center gap-6 md:gap-10">
                                    <h2 className="text-[10px] md:text-sm font-black text-slate-400 uppercase tracking-[0.5em] md:tracking-[1em] italic whitespace-nowrap">{cat.name}</h2>
                                    <div className="h-px flex-grow bg-gradient-to-r from-white/10 to-transparent"></div>
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-12">
                                    {cat.tools.map(tool => (
                                        <motion.div key={tool.id} whileHover={{ y: -10, scale: 1.01 }} onClick={() => handleToolClick(tool)} className="cursor-pointer">
                                            <Card variant="dark" className="h-full !p-8 md:!p-14 border-white/5 hover:border-violet-500/40 transition-all !rounded-3xl md:!rounded-[5rem] relative overflow-hidden group shadow-[0_40px_100px_rgba(0,0,0,0.5)]">
                                                <div className="absolute -top-12 md:-top-24 -right-12 md:-right-24 p-6 md:p-10 opacity-[0.03] group-hover:opacity-[0.08] transition-opacity duration-700">
                                                    <tool.icon className="w-48 h-48 md:w-96 md:h-96 rotate-12" />
                                                </div>
                                                <div className="flex justify-between items-start mb-12 md:mb-20">
                                                    <div className={`p-5 md:p-8 rounded-2xl md:rounded-[3rem] bg-slate-950 border border-white/10 ${tool.color} group-hover:scale-110 transition-transform shadow-[0_20px_50px_rgba(0,0,0,0.8)]`}>
                                                        <tool.icon className="w-8 h-8 md:w-14 md:h-14"/>
                                                    </div>
                                                    <span className="font-black text-[7px] md:text-[10px] text-slate-500 uppercase tracking-[0.2em] md:tracking-[0.4em] bg-white/5 px-4 md:px-6 py-1.5 md:py-2.5 rounded-full border border-white/10 italic">{tool.tag}</span>
                                                </div>
                                                <h3 className="text-3xl md:text-5xl font-black text-white mb-4 md:mb-8 uppercase tracking-tighter group-hover:text-cyan-400 transition-colors leading-none italic">{tool.title}</h3>
                                                <p className="text-slate-400 text-base md:text-xl leading-relaxed font-medium group-hover:text-slate-300 transition-colors">{tool.description}</p>
                                            </Card>
                                        </motion.div>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                </>
            ) : (
                <div className="animate-in fade-in duration-1000 px-2">
                    <button onClick={() => { setActiveTool('none'); setResultData(null); }} className="group flex items-center gap-4 md:gap-6 text-slate-400 hover:text-white mb-10 md:mb-20 transition-colors text-[10px] md:text-sm font-black uppercase tracking-[0.3em] md:tracking-[0.5em] italic">
                        <div className="p-3 md:p-5 bg-slate-900 rounded-xl md:rounded-2xl group-hover:bg-violet-600 transition-all shadow-xl">&larr; ABORT MISSION</div>
                    </button>
                    {isLoading ? (
                        <div className="py-40 md:py-60 flex flex-col items-center gap-8 md:gap-12">
                            <div className="relative">
                                <div className="absolute inset-0 bg-violet-600 blur-[100px] md:blur-[150px] opacity-30 animate-pulse"></div>
                                <Spinner className="w-24 h-24 md:w-40 md:h-40 relative z-10" colorClass="bg-violet-500"/>
                            </div>
                            <p className="text-3xl md:text-6xl font-black uppercase tracking-tighter text-white animate-pulse italic text-center">Engaging Logic Cores...</p>
                        </div>
                    ) : (
                        <div className="max-w-[2000px] mx-auto pb-40 space-y-16 md:space-y-24">
                            {activeTool === 'math' && resultData && (
                                <>
                                    <Card variant="dark" className="!p-6 md:!p-20 border-slate-800 space-y-12 md:space-y-20 !rounded-3xl md:!rounded-[5rem] shadow-[0_60px_150px_rgba(0,0,0,0.8)] relative overflow-hidden">
                                        <div className="absolute top-0 left-0 w-1.5 md:w-2 h-full bg-amber-500 opacity-50 shadow-[0_0_40px_rgba(245,158,11,0.5)]"></div>
                                        <div className="border-b border-white/5 pb-8 md:pb-12">
                                            <h2 className="text-4xl md:text-7xl font-black text-amber-400 uppercase tracking-tighter mb-4 md:mb-6 italic">BRAHMASTRA BLUEPRINT</h2>
                                            <MathRenderer text={resultData.concept} className="!text-xl md:!text-3xl text-slate-300 italic opacity-80" />
                                        </div>
                                        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 md:gap-24">
                                            <div className="lg:col-span-7 space-y-10 md:space-y-16">
                                                {(resultData.steps || []).map((step: any, i: number) => (
                                                    <div key={i} className="flex gap-4 md:gap-10 items-start group">
                                                        <div className="w-12 h-12 md:w-20 md:h-20 rounded-xl md:rounded-[2rem] bg-violet-600/10 border border-violet-500/20 flex items-center justify-center flex-shrink-0 text-violet-400 font-black text-xl md:text-3xl group-hover:bg-violet-600 group-hover:text-white transition-all shadow-2xl">{i+1}</div>
                                                        <div className="space-y-4 md:space-y-6 flex-grow overflow-hidden">
                                                            <MathRenderer text={step.action || ''} className="!text-white !text-2xl md:!text-4xl !font-black tracking-tight" />
                                                            <div className="p-6 md:p-12 bg-black/50 rounded-2xl md:rounded-[3rem] border border-white/5 font-mono-code text-cyan-300 text-lg md:text-2xl shadow-inner relative overflow-hidden group-hover:border-cyan-500/30 transition-all">
                                                                <div className="absolute top-0 left-0 w-1 md:w-1.5 h-full bg-cyan-500/40"></div>
                                                                <MathRenderer text={step.result || ''} />
                                                            </div>
                                                            <div className="text-[9px] md:text-[11px] text-slate-500 uppercase tracking-[0.3em] md:tracking-[0.5em] font-black italic flex items-center gap-2 md:gap-3">
                                                                <div className="w-1.5 h-1.5 md:w-2 md:h-2 rounded-full bg-violet-500 animate-ping"></div>
                                                                LOGIC: <MathRenderer text={step.reason || 'N/A'} isChat />
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                            <div className="lg:col-span-5 space-y-8 md:space-y-12">
                                                {resultData.diagram_spec && (
                                                    <div className="sticky top-12">
                                                        <DiagramRenderer spec={resultData.diagram_spec} />
                                                        <div className="p-8 md:p-16 rounded-3xl md:rounded-[4rem] bg-gradient-to-br from-emerald-600/20 to-teal-600/20 border border-emerald-500/30 text-center shadow-[0_40px_100px_rgba(16,185,129,0.2)] mt-8 md:mt-12">
                                                            <h4 className="text-[9px] md:text-[11px] font-black text-emerald-400 uppercase tracking-[0.4em] md:tracking-[0.6em] mb-6 md:mb-10 italic">FINAL SYNTHESIS</h4>
                                                            <div className="text-3xl md:text-6xl font-black text-white tracking-tighter drop-shadow-2xl leading-tight italic">
                                                                <MathRenderer text={resultData.finalAnswer || ''} />
                                                            </div>
                                                            <div className="mt-8 md:mt-12 text-xs md:text-sm text-slate-500 font-medium italic border-t border-white/10 pt-6 md:pt-8 max-w-sm mx-auto">
                                                                <MathRenderer text={resultData.recap} isChat />
                                                            </div>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </Card>

                                    {/* Neural Doubt Link Section */}
                                    <div className="space-y-8 md:space-y-12">
                                        <div className="flex items-center gap-4 md:gap-6">
                                            <div className="p-3 md:p-5 bg-amber-500 rounded-xl md:rounded-[1.5rem] shadow-[0_0_40px_rgba(245,158,11,0.4)]"><ChatBubbleLeftRightIcon className="w-6 h-6 md:w-8 md:h-8 text-black"/></div>
                                            <h3 className="text-xl md:text-3xl font-black uppercase tracking-[0.2em] md:tracking-[0.4em] text-white/50 italic">Doubt Terminal</h3>
                                            <div className="h-px flex-grow bg-white/5"></div>
                                        </div>
                                        <Card variant="dark" className="!p-0 border-white/5 bg-slate-950/60 rounded-3xl md:rounded-[4rem] overflow-hidden flex flex-col h-[600px] md:h-[750px] shadow-[0_60px_150px_rgba(0,0,0,0.9)] border-t-4 border-t-amber-500/50">
                                            <div ref={doubtScrollRef} className="flex-grow overflow-y-auto p-6 md:p-12 space-y-8 md:space-y-12 scrollbar-hide">
                                                {doubtHistory.length === 0 && (
                                                    <div className="h-full flex flex-col items-center justify-center text-center p-10 md:p-20 opacity-30">
                                                        <SparklesIcon className="w-12 h-12 md:w-20 md:h-20 text-slate-700 mb-6 md:mb-8"/>
                                                        <p className="text-slate-500 font-black uppercase tracking-[0.3em] md:tracking-[0.4em] text-[10px] md:text-sm italic">Initialize query node...</p>
                                                    </div>
                                                )}
                                                {doubtHistory.map((msg, i) => (
                                                    <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                                        <div className={`max-w-[90%] md:max-w-[85%] p-6 md:p-10 rounded-2xl md:rounded-[3rem] relative shadow-2xl ${msg.role === 'user' ? 'bg-amber-500 text-black font-black italic text-lg md:text-2xl shadow-amber-500/20' : 'bg-slate-900/80 text-slate-200 border border-white/10 leading-relaxed shadow-black/80'}`}>
                                                            {msg.role === 'model' && <div className="absolute -top-3 -left-3 p-1.5 bg-violet-600 rounded-lg text-[7px] font-black uppercase tracking-widest text-white border border-violet-400">STUBRO_CORE</div>}
                                                            <MathRenderer text={msg.text} isChat />
                                                        </div>
                                                    </div>
                                                ))}
                                                {isDoubtThinking && <div className="flex justify-start px-6 md:px-12"><Spinner colorClass="bg-amber-500" className="w-8 h-8 md:w-12 md:h-12"/></div>}
                                            </div>
                                            <form onSubmit={(e) => { e.preventDefault(); handleSendDoubt(); }} className="p-6 md:p-10 bg-black/60 border-t border-white/10 flex gap-4 md:gap-6">
                                                <input 
                                                    value={doubtInput} 
                                                    onChange={e => setDoubtInput(e.target.value)} 
                                                    placeholder="> Query parameters..." 
                                                    className="flex-grow bg-slate-950 border border-white/10 p-5 md:p-8 rounded-2xl md:rounded-[2.5rem] text-white outline-none focus:border-amber-500 transition-all font-mono-code text-sm md:text-lg shadow-inner"
                                                />
                                                <button type="submit" disabled={!doubtInput.trim() || isDoubtThinking} className="w-16 h-16 md:w-24 md:h-24 rounded-2xl md:rounded-[2rem] bg-amber-500 flex items-center justify-center hover:scale-105 active:scale-95 transition-all shadow-[0_0_50px_rgba(245,158,11,0.4)] disabled:opacity-30 disabled:grayscale">
                                                    <PaperAirplaneIcon className="w-6 h-6 md:w-10 md:h-10 text-black" />
                                                </button>
                                            </form>
                                        </Card>
                                    </div>
                                </>
                            )}
                            {activeTool === 'summary' && resultData && <SmartSummaryComponent summary={resultData} />}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default DashboardPage;