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
    StopIcon, PaperAirplaneIcon, XMarkIcon, ChatBubbleLeftRightIcon, SearchIcon, UploadIcon
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
    const { extractedText, subject, classLevel, searchStatus, searchMessage, hasSessionStarted } = useContent();
    const { userName, tokens } = useAuth();
    
    const [activeTool, setActiveTool] = useState<string>('none');
    const [isLoading, setIsLoading] = useState(false);
    const [resultData, setResultData] = useState<any>(null);
    const [error, setError] = useState<string | null>(null);

    // Math Solver State
    const [mathInputMode, setMathInputMode] = useState<'type' | 'upload' | 'speak'>('type');
    const [mathProblem, setMathProblem] = useState('');
    const [mathImage, setMathImage] = useState<string | null>(null);
    const [showMathInput, setShowMathInput] = useState(false);
    const [isRecording, setIsRecording] = useState(false);
    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const audioChunksRef = useRef<Blob[]>([]);
    
    // Math Doubt Chat State
    const [doubtChat, setDoubtChat] = useState<Chat | null>(null);
    const [doubtHistory, setDoubtHistory] = useState<ChatMessage[]>([]);
    const [doubtInput, setDoubtInput] = useState('');
    const [isDoubtThinking, setIsDoubtThinking] = useState(false);
    const doubtScrollRef = useRef<HTMLDivElement>(null);
    
    // General Chat State
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
        if (doubtScrollRef.current) doubtScrollRef.current.scrollTop = doubtScrollRef.current.scrollHeight;
    }, [doubtHistory]);
    
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
                case 'chat':
                    const session = geminiService.createGeneralChat(extractedText);
                    setChatSession(session);
                    setChatHistory([{ role: 'model', text: "I have read the document. What would you like to discuss?" }]);
                    break;
                default:
                    throw new Error("Tool not initialized.");
            }
        } catch (e: any) {
            setError(e.message);
            setActiveTool('none');
        } finally {
            setIsLoading(false);
        }
    };
    
    const handleMathSolve = async () => {
        setIsLoading(true);
        setShowMathInput(false);
        setActiveTool('math');
        setResultData(null);
        setError(null);
        try {
            let imagePart = null;
            if (mathImage) {
                imagePart = { inlineData: { mimeType: 'image/jpeg', data: mathImage.split(',')[1] } };
            }
            const m = await geminiService.solveMathsBrahmastra(mathProblem, classLevel, imagePart);
            setResultData(m);
            const session = geminiService.startMathDoubtChat(m);
            setDoubtChat(session);
        } catch (e: any) {
            setError(e.message);
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
        } catch (e) { console.error(e); } finally { setIsDoubtThinking(false); }
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
    
    const startRecording = async () => {
        setIsRecording(true);
        setError(null);
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            mediaRecorderRef.current = new MediaRecorder(stream);
            audioChunksRef.current = [];
            mediaRecorderRef.current.ondataavailable = (e) => audioChunksRef.current.push(e.data);
            mediaRecorderRef.current.onstop = () => {
                const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
                // Note: Logic for transcription would go here if using audio for math solver
            };
            mediaRecorderRef.current.start();
        } catch (e) { setIsRecording(false); }
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
    
    const resetAllState = () => {
        setActiveTool('none');
        setResultData(null);
        setError(null);
        setChatHistory([]);
        setChatSession(null);
        setChatInput('');
        setDoubtHistory([]);
        setDoubtChat(null);
        setDoubtInput('');
        setMathProblem('');
        setMathImage(null);
    };

    const renderToolResult = () => {
        if (error) {
            return (
                <div className="flex flex-col items-center justify-center gap-4 py-16 text-center">
                    <div className="w-20 h-20 bg-red-500/10 rounded-full flex items-center justify-center border border-red-500/20">
                        <XMarkIcon className="w-10 h-10 text-red-500" />
                    </div>
                    <h2 className="text-3xl font-black text-red-500 uppercase tracking-tighter">GENERATION FAILED</h2>
                    <p className="text-slate-400 max-w-xl">{error}</p>
                </div>
            );
        }
        
        switch(activeTool) {
            case 'math':
                return resultData && (
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
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </Card>
                        <div className="space-y-8 md:space-y-12">
                            <div className="flex items-center gap-4 md:gap-6">
                                <div className="p-3 md:p-5 bg-amber-500 rounded-xl md:rounded-[1.5rem] shadow-[0_0_40px_rgba(245,158,11,0.4)]"><ChatBubbleLeftRightIcon className="w-6 h-6 md:w-8 md:h-8 text-black"/></div>
                                <h3 className="text-xl md:text-3xl font-black uppercase tracking-[0.2em] md:tracking-[0.4em] text-white/50 italic">Doubt Terminal</h3>
                                <div className="h-px flex-grow bg-white/5"></div>
                            </div>
                            <Card variant="dark" className="!p-0 border-white/5 bg-slate-950/60 rounded-3xl md:rounded-[4rem] overflow-hidden flex flex-col h-[600px] md:h-[750px] shadow-[0_60px_150px_rgba(0,0,0,0.9)] border-t-4 border-t-amber-500/50">
                                <div ref={doubtScrollRef} className="flex-grow overflow-y-auto p-6 md:p-12 space-y-8 md:space-y-12 scrollbar-hide">
                                    {doubtHistory.map((msg, i) => (
                                        <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                            <div className={`max-w-[90%] md:max-w-[85%] p-6 md:p-10 rounded-2xl md:rounded-[3rem] relative shadow-2xl ${msg.role === 'user' ? 'bg-amber-500 text-black font-black italic text-lg md:text-2xl shadow-amber-500/20' : 'bg-slate-900/80 text-slate-200 border border-white/10 leading-relaxed shadow-black/80'}`}>
                                                <MathRenderer text={msg.text} isChat />
                                            </div>
                                        </div>
                                    ))}
                                    {isDoubtThinking && <div className="flex justify-start px-6 md:px-12"><Spinner colorClass="bg-amber-500" className="w-8 h-8 md:w-12 md:h-12"/></div>}
                                </div>
                                <form onSubmit={(e) => { e.preventDefault(); handleSendDoubt(); }} className="p-6 md:p-10 bg-black/60 border-t border-white/10 flex gap-4 md:gap-6">
                                    <input value={doubtInput} onChange={e => setDoubtInput(e.target.value)} placeholder="> Query parameters..." className="flex-grow bg-slate-950 border border-white/10 p-5 md:p-8 rounded-2xl md:rounded-[2.5rem] text-white outline-none focus:border-amber-500 transition-all font-mono-code text-sm md:text-lg shadow-inner"/>
                                    <button type="submit" disabled={!doubtInput.trim() || isDoubtThinking} className="w-16 h-16 md:w-24 md:h-24 rounded-2xl md:rounded-[2rem] bg-amber-500 flex items-center justify-center hover:scale-105 active:scale-95 transition-all shadow-[0_0_50px_rgba(245,158,11,0.4)] disabled:opacity-30 disabled:grayscale">
                                        <PaperAirplaneIcon className="w-6 h-6 md:w-10 md:h-10 text-black" />
                                    </button>
                                </form>
                            </Card>
                        </div>
                    </>
                );
            case 'summary':
                return resultData && <SmartSummaryComponent summary={resultData} />;
            case 'chat':
                return (
                    <Card variant="dark" className="!p-0 border-white/5 bg-slate-950/60 rounded-3xl md:rounded-[4rem] overflow-hidden flex flex-col h-[70vh] md:h-[80vh] shadow-[0_60px_150px_rgba(0,0,0,0.9)] border-t-4 border-t-violet-500/50">
                        <div ref={chatScrollRef} className="flex-grow overflow-y-auto p-6 md:p-12 space-y-8 md:space-y-12 scrollbar-hide">
                            {chatHistory.map((msg, i) => (
                                <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                    <div className={`max-w-[90%] md:max-w-[85%] p-6 md:p-10 rounded-2xl md:rounded-[3rem] relative shadow-2xl ${msg.role === 'user' ? 'bg-violet-600 text-white font-black italic text-lg md:text-2xl shadow-violet-600/20' : 'bg-slate-900/80 text-slate-200 border border-white/10 leading-relaxed shadow-black/80'}`}>
                                        <MathRenderer text={msg.text} isChat />
                                    </div>
                                </div>
                            ))}
                            {isChatThinking && <div className="flex justify-start px-6 md:px-12"><Spinner colorClass="bg-violet-500" className="w-8 h-8 md:w-12 md:h-12"/></div>}
                        </div>
                        <form onSubmit={(e) => { e.preventDefault(); handleSendChatMessage(); }} className="p-6 md:p-10 bg-black/60 border-t border-white/10 flex gap-4 md:gap-6">
                            <input value={chatInput} onChange={e => setChatInput(e.target.value)} placeholder="> Ask about the content..." className="flex-grow bg-slate-950 border border-white/10 p-5 md:p-8 rounded-2xl md:rounded-[2.5rem] text-white outline-none focus:border-violet-500 transition-all font-mono-code text-sm md:text-lg shadow-inner"/>
                            <button type="submit" disabled={!chatInput.trim() || isChatThinking} className="w-16 h-16 md:w-24 md:h-24 rounded-2xl md:rounded-[2rem] bg-violet-600 flex items-center justify-center hover:scale-105 active:scale-95 transition-all shadow-[0_0_50px_rgba(124,58,237,0.4)] disabled:opacity-30 disabled:grayscale">
                                <PaperAirplaneIcon className="w-6 h-6 md:w-10 md:h-10 text-white" />
                            </button>
                        </form>
                    </Card>
                );
            default:
                return null;
        }
    };

    if (!hasSessionStarted && searchStatus === 'idle') return null;

    return (
        <div className="max-w-[1800px] mx-auto px-4 md:px-10 space-y-12 md:space-y-24 pb-40">
            <AnimatePresence>
                {showMathInput && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[200] bg-slate-950/95 backdrop-blur-3xl flex items-center justify-center p-4 md:p-6">
                         <Card variant="dark" className="max-w-3xl w-full !p-10 border-white/10 relative">
                            <button onClick={() => setShowMathInput(false)} className="absolute top-6 right-6 text-slate-500 hover:text-white transition-colors"><XMarkIcon className="w-8 h-8"/></button>
                            <h2 className="text-4xl font-black text-amber-400 italic mb-8 uppercase tracking-tighter">BRAHMASTRA CALIBRATION</h2>
                            <div className="space-y-10">
                                <div className="flex bg-slate-950 p-1.5 rounded-full border border-white/5 w-fit mx-auto">
                                    {['type', 'upload', 'speak'].map(m => (
                                        <button key={m} onClick={() => setMathInputMode(m as any)} className={`px-8 py-2.5 rounded-full text-[10px] font-black uppercase tracking-widest transition-all ${mathInputMode === m ? 'bg-amber-500 text-black shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}>{m}</button>
                                    ))}
                                </div>
                                {mathInputMode === 'type' && <textarea value={mathProblem} onChange={e => setMathProblem(e.target.value)} placeholder="> Input logic variables or equation parameters..." className="w-full h-40 bg-slate-900/50 border border-white/10 p-6 rounded-3xl text-white font-mono-code focus:border-amber-500 outline-none resize-none shadow-inner text-lg"/>}
                                {mathInputMode === 'upload' && (
                                    <div className="flex flex-col items-center gap-6">
                                        <label className="w-24 h-24 rounded-full bg-amber-500/20 border-2 border-amber-500/40 border-dashed flex items-center justify-center cursor-pointer hover:bg-amber-500/30 transition-all">
                                            <CameraIcon className="w-10 h-10 text-amber-500" />
                                            <input type="file" className="hidden" accept="image/*" onChange={handleImageUpload} />
                                        </label>
                                        <p className="text-[10px] font-black uppercase text-slate-500 tracking-[0.3em]">Capture Neural Geometry</p>
                                        {mathImage && <img src={mathImage} className="h-32 rounded-xl border border-white/10" alt="Captured logic" />}
                                    </div>
                                )}
                                {mathInputMode === 'speak' && (
                                    <div className="flex flex-col items-center gap-6">
                                        <button onClick={isRecording ? stopRecording : startRecording} className={`w-24 h-24 rounded-full flex items-center justify-center transition-all ${isRecording ? 'bg-red-500 animate-pulse scale-110 shadow-[0_0_50px_rgba(239,68,68,0.5)]' : 'bg-amber-500 shadow-[0_0_50px_rgba(245,158,11,0.3)]'}`}>
                                            {isRecording ? <StopIcon className="w-10 h-10 text-white" /> : <MicrophoneIcon className="w-10 h-10 text-black" />}
                                        </button>
                                        <p className="text-[10px] font-black uppercase text-slate-500 tracking-[0.3em]">{isRecording ? "Capturing Audio Signal..." : "Initialize Voice Logic"}</p>
                                    </div>
                                )}
                                <Button onClick={handleMathSolve} className="w-full h-20 !text-2xl !font-black !bg-white !text-black !rounded-3xl shadow-2xl italic">ENGAGE BRAHMASTRA →</Button>
                            </div>
                         </Card>
                    </motion.div>
                )}
            </AnimatePresence>

            {activeTool === 'none' ? (
                 <>
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col lg:flex-row justify-between items-start lg:items-end gap-10 border-b border-white/5 pb-12 md:pb-20 pt-10">
                        <div>
                            <h1 className="text-[11px] font-black text-violet-400 uppercase tracking-[1em] mb-4 italic">Mission Briefing</h1>
                            <div className="flex items-center gap-4">
                                <div className="p-3 bg-white/5 rounded-2xl border border-white/10"><SparklesIcon className="w-6 h-6 text-cyan-400"/></div>
                                <h2 className="text-4xl md:text-7xl font-black tracking-tightest uppercase italic leading-none">{subject || "ROOT_NODE"} <span className="text-slate-600 italic">| {classLevel}</span></h2>
                            </div>
                        </div>
                        <div className="flex items-center gap-6">
                             <div className="text-right">
                                <p className="text-[9px] font-black text-slate-600 uppercase tracking-widest mb-1">Status: Operational</p>
                                <p className="text-2xl font-black text-white italic">HELLO, {userName?.split(' ')[0] || "STUDENT"}</p>
                             </div>
                             <Link to="/new-session"><Button variant="outline" className="h-16 !px-10 !text-[10px] !font-black uppercase tracking-widest hover:!bg-white hover:!text-black">RELOAD CORE</Button></Link>
                        </div>
                    </motion.div>
                    <div className="space-y-24 md:space-y-40">
                        {filteredCategories.map((cat) => (
                            <div key={cat.name} className="space-y-10 md:space-y-16">
                                <h3 className="text-xl md:text-3xl font-black text-white/20 uppercase tracking-[0.6em] md:tracking-[1em] italic">{cat.name}</h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 md:gap-12">
                                    {cat.tools.map((tool) => (
                                        <motion.div key={tool.id} whileHover={{ y: -15, scale: 1.02 }} className="group cursor-pointer" onClick={() => handleToolClick(tool)}>
                                            <Card variant="dark" className="!p-10 border-white/5 group-hover:border-violet-500/30 group-hover:shadow-[0_40px_100px_rgba(0,0,0,0.9)] transition-all relative overflow-hidden h-full flex flex-col !rounded-[3.5rem]">
                                                <div className="absolute top-0 right-0 p-8 opacity-[0.03] group-hover:opacity-[0.08] transition-opacity"><tool.icon className="w-32 h-32" /></div>
                                                <div className="flex justify-between items-start mb-10">
                                                    <div className={`p-4 rounded-2xl bg-slate-950 border border-white/5 group-hover:scale-110 transition-transform ${tool.color}`}><tool.icon className="w-8 h-8"/></div>
                                                    <span className="text-[9px] font-black text-slate-500 bg-white/5 px-4 py-1.5 rounded-full border border-white/5 tracking-widest">{tool.tag}</span>
                                                </div>
                                                <h4 className="text-2xl md:text-4xl font-black text-white uppercase italic mb-4 leading-none group-hover:text-cyan-400 transition-colors">{tool.title}</h4>
                                                <p className="text-sm md:text-base text-slate-500 font-medium group-hover:text-slate-300 transition-colors">{tool.description}</p>
                                                <div className="mt-auto pt-8 flex items-center gap-2 text-violet-500 text-[10px] font-black uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity">INITIALIZE LINK &rarr;</div>
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
                    <button onClick={resetAllState} className="group flex items-center gap-4 md:gap-6 text-slate-400 hover:text-white mb-10 md:mb-20 transition-colors text-[10px] md:text-sm font-black uppercase tracking-[0.3em] md:tracking-[0.5em] italic">
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
                           {renderToolResult()}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default DashboardPage;