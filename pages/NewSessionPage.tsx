import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Subject, ClassLevel } from '../types';
import { SUBJECTS, CLASS_LEVELS } from '../constants';
import * as geminiService from '../services/geminiService';
import Button from '../components/common/Button';
import Spinner from '../components/common/Spinner';
import Card from '../components/common/Card';
import { 
    UploadIcon, YouTubeIcon, ClipboardIcon, SearchIcon, 
    DocumentDuplicateIcon, BookOpenIcon, SparklesIcon, 
    AcademicCapIcon
} from '../components/icons';
import * as pdfjs from 'pdfjs-dist';
import * as mammoth from 'mammoth';
import { useContent, SessionIntent } from '../contexts/ContentContext';
import { motion, AnimatePresence } from 'framer-motion';

// Using version-matched CDN for stable worker resolution in Vite environments
pdfjs.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

type ContentSource = 'paste' | 'file' | 'youtube' | 'search';

const NewSessionPage: React.FC = () => {
    const navigate = useNavigate();
    const { setSubject: setGlobalSubject, setClassLevel: setGlobalClassLevel, setIntent: setGlobalIntent, startBackgroundSearch, startSessionWithContent } = useContent();
    
    const [subject, setSubject] = useState<Subject | null>(null);
    const [classLevel, setClassLevel] = useState<ClassLevel>('Class 10');
    const [intent, setIntent] = useState<SessionIntent>('any');
    const [contentSource, setContentSource] = useState<ContentSource>('paste');
    
    const [pastedText, setPastedText] = useState('');
    const [mediaUrl, setMediaUrl] = useState(''); 
    const [chapterInfo, setChapterInfo] = useState('');
    const [chapterDetails, setChapterDetails] = useState('');
    
    const [fileContent, setFileContent] = useState('');
    const [fileName, setFileName] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [syncProgress, setSyncProgress] = useState(0);
    const [error, setError] = useState<string | null>(null);

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setError(null);
        setIsLoading(true);
        setFileName(file.name);
        try {
            let text = '';
            if (file.type === 'application/pdf') {
                const arrayBuffer = await file.arrayBuffer();
                const pdf = await pdfjs.getDocument(arrayBuffer).promise;
                for (let i = 1; i <= pdf.numPages; i++) {
                    const page = await pdf.getPage(i);
                    const content = await page.getTextContent();
                    text += content.items.map((item: any) => item.str).join(' ');
                }
            } else if (file.type.includes('wordprocessingml')) { 
                const arrayBuffer = await file.arrayBuffer();
                const result = await mammoth.extractRawText({ arrayBuffer });
                text = result.value;
            } else { 
                text = await file.text();
            }
            setFileContent(text);
        } catch (err) {
            setError('Failed to extract data from file.');
            setFileName('');
        } finally {
            setIsLoading(false);
        }
    };

    const handleStartSession = async () => {
        if (!subject) return setError("Protocol Error: Select a subject module.");
        
        setIsLoading(true);
        setError(null);
        setSyncProgress(10);

        try {
            if (contentSource === 'search') {
                if (!chapterInfo.trim()) throw new Error("Please specify the Topic Name.");
                
                setSyncProgress(30);
                const fetchedContent = await geminiService.fetchChapterContent(classLevel, subject!, chapterInfo, chapterDetails);
                
                if (!fetchedContent || fetchedContent.length < 200) {
                    throw new Error("Neural Web Crawler could not find high-density data for this topic. Try adding board name (e.g. CBSE) in filters.");
                }

                setSyncProgress(80);
                setGlobalSubject(subject);
                setGlobalClassLevel(classLevel);
                setGlobalIntent(intent);
                startSessionWithContent(fetchedContent);
                setSyncProgress(100);
                setTimeout(() => navigate('/app'), 800);
                return;
            }

            let finalContent = '';
            if (contentSource === 'paste') {
                finalContent = pastedText;
            } else if (contentSource === 'file') {
                finalContent = fileContent;
                if (!finalContent) throw new Error("No file data detected. Upload a PDF/DOCX.");
            } else if (contentSource === 'youtube') {
                if (!mediaUrl) throw new Error("Enter a Media Link.");
                setSyncProgress(50);
                finalContent = await geminiService.fetchYouTubeTranscript(mediaUrl);
            }

            if (finalContent.trim().length < 50) throw new Error("Content too short to initialize Master session.");
            
            setSyncProgress(90);
            setGlobalSubject(subject);
            setGlobalClassLevel(classLevel);
            setGlobalIntent(intent);
            startSessionWithContent(finalContent);
            setSyncProgress(100);
            setTimeout(() => navigate('/app'), 800);
        } catch (err: any) {
            setError(err.message);
            setIsLoading(false);
            setSyncProgress(0);
        }
    };

    if (isLoading && contentSource === 'search') {
        return (
            <div className="min-h-screen bg-[#010208] flex flex-col items-center justify-center p-10 text-center space-y-12">
                <div className="relative">
                    <div className="absolute inset-0 bg-cyan-500 blur-[100px] opacity-20 neon-glow"></div>
                    <div className="p-10 rounded-[3rem] bg-slate-900/50 border border-cyan-500/30 backdrop-blur-2xl relative z-10">
                        <SearchIcon className="w-20 h-20 text-cyan-400 mx-auto animate-pulse mb-6" />
                        <h2 className="text-4xl md:text-6xl font-black text-white uppercase tracking-tighter italic">NEURAL SYNC...</h2>
                    </div>
                </div>
                <div className="w-full max-w-2xl space-y-6">
                    <div className="w-full h-2 bg-white/5 rounded-full overflow-hidden">
                        <motion.div initial={{ width: 0 }} animate={{ width: `${syncProgress}%` }} className="h-full bg-cyan-500 shadow-[0_0_20px_rgba(34,211,238,0.8)]"/>
                    </div>
                    <p className="text-cyan-400 font-mono-tech text-sm tracking-[0.5em] uppercase font-black">Crawler Node Active: Phase {syncProgress}%</p>
                    <p className="text-slate-500 text-lg md:text-xl font-medium leading-relaxed italic">"Gathering high-precision NCERT data from the global knowledge graph..."</p>
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-[1600px] mx-auto p-4 md:p-12 pb-40">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 md:gap-12">
                {/* 01. ASTRA TARGET */}
                <div className="lg:col-span-4 space-y-6 md:space-y-8">
                    <Card variant="dark" className="!p-6 md:!p-10 border-white/5 bg-slate-900/70 backdrop-blur-3xl shadow-2xl !rounded-3xl md:!rounded-[3rem]">
                        <h2 className="text-[10px] font-black text-white/40 uppercase tracking-[0.4em] mb-8 md:mb-10">01. Astra Target</h2>
                        <div className="space-y-8 md:space-y-10">
                            <div>
                                <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-3 md:mb-4 block">Target Grade</label>
                                <select value={classLevel} onChange={e => setClassLevel(e.target.value as ClassLevel)} className="w-full bg-slate-950 border border-white/10 p-4 md:p-5 rounded-2xl text-white outline-none focus:ring-2 focus:ring-violet-500 transition-all font-black text-sm italic">
                                    {CLASS_LEVELS.map(l => <option key={l} value={l}>{l}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-3 md:mb-4 block">Subject Module</label>
                                <div className="grid grid-cols-2 gap-3">
                                    {SUBJECTS.map(s => (
                                        <button key={s.name} onClick={() => setSubject(s.name)} className={`p-4 md:p-5 rounded-2xl border transition-all flex flex-col items-center gap-2 md:gap-3 ${subject === s.name ? 'bg-violet-600 border-violet-400 shadow-[0_0_30px_rgba(124,58,237,0.4)] text-white' : 'bg-slate-950 border-white/5 text-slate-500 hover:border-white/20'}`}>
                                            <s.icon className="w-5 h-5 md:w-6 md:h-6" />
                                            <span className="text-[8px] md:text-[9px] font-black uppercase tracking-widest italic">{s.name}</span>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </Card>

                    {/* 02. MISSION INTENT */}
                    <Card variant="dark" className="!p-6 md:!p-10 border-white/5 bg-slate-900/70 backdrop-blur-3xl !rounded-3xl md:!rounded-[3rem]">
                        <h2 className="text-[10px] font-black text-white/40 uppercase tracking-[0.4em] mb-8 md:mb-10">02. Mission Intent</h2>
                        <div className="grid grid-cols-1 gap-3 md:gap-4">
                            {[
                                { id: 'learn', label: 'Fresh Insight', sub: 'New chapter acquisition', icon: BookOpenIcon, color: 'text-cyan-400' },
                                { id: 'revise', label: 'Tapasya Core', sub: 'Exam-ready optimization', icon: SparklesIcon, color: 'text-pink-400' },
                                { id: 'any', label: 'Omni Study', sub: 'General assistance', icon: AcademicCapIcon, color: 'text-violet-400' },
                            ].map(opt => (
                                <button key={opt.id} onClick={() => setIntent(opt.id as SessionIntent)} className={`p-4 md:p-6 rounded-2xl md:rounded-[2rem] border text-left transition-all group ${intent === opt.id ? 'bg-white/5 border-violet-500' : 'bg-slate-950 border-white/5 hover:border-white/10 shadow-inner'}`}>
                                    <div className="flex items-center gap-4 md:gap-5">
                                        <div className={`p-2.5 md:p-3 rounded-xl md:rounded-2xl bg-slate-900 ${opt.color} shadow-2xl border border-white/5`}><opt.icon className="w-5 h-5 md:w-6 md:h-6"/></div>
                                        <div>
                                            <p className={`text-[10px] md:text-xs font-black uppercase tracking-widest ${intent === opt.id ? 'text-white italic' : 'text-slate-500'}`}>{opt.label}</p>
                                            <p className="text-[8px] md:text-[9px] font-bold text-slate-700 uppercase tracking-tighter mt-0.5">{opt.sub}</p>
                                        </div>
                                    </div>
                                </button>
                            ))}
                        </div>
                    </Card>
                </div>

                {/* KNOWLEDGE CORE */}
                <div className="lg:col-span-8">
                    <Card variant="dark" className="!p-6 md:!p-12 min-h-[500px] md:min-h-[700px] flex flex-col bg-slate-900/40 relative overflow-hidden !rounded-3xl md:!rounded-[4rem] shadow-[0_40px_150px_rgba(0,0,0,0.8)]">
                        <div className="absolute top-0 right-0 p-10 md:p-20 opacity-[0.02] pointer-events-none">
                            <DocumentDuplicateIcon className="w-48 h-48 md:w-96 md:h-96" />
                        </div>
                        
                        <div className="flex items-center gap-4 md:gap-6 mb-8 md:mb-12 border-b border-white/5 pb-6 md:pb-10">
                             <div className="p-3 md:p-4 bg-violet-600 rounded-xl md:rounded-[1.5rem] shadow-[0_0_40px_rgba(124,58,237,0.3)]"><DocumentDuplicateIcon className="w-6 h-6 md:w-8 md:h-8 text-white"/></div>
                             <div>
                                <h2 className="text-2xl md:text-3xl font-black text-white uppercase tracking-tighter italic leading-none">Knowledge Core</h2>
                                <p className="text-[8px] md:text-[10px] font-bold text-slate-500 uppercase tracking-[0.4em] md:tracking-[0.6em] mt-2 md:mt-3">Astra Sync v8.5</p>
                             </div>
                        </div>

                        <div className="flex gap-2 md:gap-4 mb-8 md:mb-12 overflow-x-auto pb-4 scrollbar-hide snap-x">
                            {[
                                { id: 'paste', label: 'Neural Paste', icon: ClipboardIcon },
                                { id: 'file', label: 'Load Notes', icon: UploadIcon },
                                { id: 'youtube', label: 'Media Sync', icon: YouTubeIcon },
                                { id: 'search', label: 'Web Crawler', icon: SearchIcon }
                            ].map(tab => (
                                <button key={tab.id} onClick={() => setContentSource(tab.id as any)} className={`snap-center flex items-center gap-2 md:gap-3 py-3 md:py-4 px-5 md:px-8 rounded-full text-[8px] md:text-[10px] font-black uppercase tracking-[0.2em] transition-all whitespace-nowrap border ${contentSource === tab.id ? 'bg-white text-slate-950 border-white shadow-[0_0_30px_rgba(255,255,255,0.2)] scale-105' : 'bg-slate-950 text-slate-500 border-white/5 hover:border-white/10'}`}>
                                    <tab.icon className="w-4 h-4 md:w-5 md:h-5" /> {tab.label}
                                </button>
                            ))}
                        </div>

                        <div className="flex-grow flex flex-col">
                            <AnimatePresence mode="wait">
                                {contentSource === 'paste' && (
                                    <motion.div key="paste" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="flex-grow text-white">
                                        <textarea value={pastedText} onChange={e => setPastedText(e.target.value)} placeholder="> Initialize direct text-stream... (Paste here)" className="w-full h-full min-h-[300px] md:min-h-[450px] bg-slate-950/50 p-6 md:p-12 rounded-2xl md:rounded-[3.5rem] text-slate-300 font-mono-code text-sm md:text-base border border-white/10 focus:border-violet-500 outline-none resize-none shadow-inner leading-relaxed" />
                                    </motion.div>
                                )}

                                {contentSource === 'file' && (
                                    <motion.div key="file" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="flex-grow flex flex-col items-center justify-center border-4 border-dashed border-white/10 rounded-2xl md:rounded-[3.5rem] p-6 md:p-12 group hover:border-violet-500/40 transition-all bg-slate-950/30">
                                        {fileName ? (
                                            <div className="text-center space-y-4 md:space-y-6">
                                                <div className="p-6 md:p-8 bg-violet-600/20 rounded-full border border-violet-500/30 animate-bounce">
                                                    <DocumentDuplicateIcon className="w-12 h-12 md:w-20 md:h-20 text-violet-400" />
                                                </div>
                                                <p className="text-xl md:text-2xl font-black text-white italic">{fileName}</p>
                                                <button onClick={() => {setFileName(''); setFileContent('');}} className="text-pink-500 font-black uppercase text-[10px] tracking-widest hover:underline">&times; Eject Module</button>
                                            </div>
                                        ) : (
                                            <label className="cursor-pointer flex flex-col items-center gap-6 md:gap-8 group w-full h-full justify-center">
                                                <div className="p-8 md:p-12 bg-white/5 rounded-2xl md:rounded-[3.5rem] group-hover:scale-110 transition-transform group-hover:bg-white/10 border border-white/10 shadow-[0_0_50px_rgba(0,0,0,0.5)]">
                                                    <UploadIcon className="w-16 h-16 md:w-24 md:h-24 text-slate-500 group-hover:text-violet-400 transition-colors" />
                                                </div>
                                                <div className="text-center space-y-3 md:space-y-4">
                                                    <span className="text-slate-400 font-black uppercase tracking-[0.3em] md:tracking-[0.5em] text-[10px] md:text-xs block">Initialize Document Module</span>
                                                    <span className="text-slate-600 font-bold uppercase text-[8px] md:text-[10px] px-4 py-1 bg-white/5 rounded-full border border-white/5">PDF, DOCX, TXT</span>
                                                </div>
                                                <input type="file" className="hidden" accept=".pdf,.docx,.txt" onChange={handleFileChange} />
                                            </label>
                                        )}
                                    </motion.div>
                                )}

                                {contentSource === 'youtube' && (
                                    <motion.div key="youtube" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="flex-grow flex flex-col items-center justify-center p-4 md:p-12 space-y-8 md:space-y-12">
                                        <div className="flex gap-4 md:gap-10">
                                            <div className="p-5 md:p-8 bg-red-600/10 rounded-2xl border border-red-500/20 shadow-2xl"><YouTubeIcon className="w-10 h-10 md:w-16 md:h-16 text-red-500" /></div>
                                        </div>
                                        <div className="w-full max-w-3xl space-y-4 md:space-y-6 text-center">
                                            <div>
                                                <p className="text-[10px] md:text-[11px] font-black text-slate-500 uppercase tracking-[0.4em] md:tracking-[0.5em] mb-2">Universal Media Intake</p>
                                                <h3 className="text-lg md:text-xl font-black text-white uppercase italic">Input YouTube URL</h3>
                                            </div>
                                            <div className="relative group">
                                                <div className="absolute inset-0 bg-violet-600 blur-[30px] md:blur-[40px] opacity-10 group-hover:opacity-25 transition-opacity"></div>
                                                <input 
                                                    value={mediaUrl} 
                                                    onChange={e => setMediaUrl(e.target.value)} 
                                                    placeholder="> https://youtube.com/watch?v=..." 
                                                    className="w-full bg-slate-950 border border-white/10 p-6 md:p-10 rounded-2xl md:rounded-[2.5rem] text-white font-mono-code text-base md:text-xl outline-none focus:border-violet-500 relative z-10 shadow-inner placeholder:text-slate-800"
                                                />
                                            </div>
                                            <p className="text-[8px] md:text-[10px] font-bold text-slate-600 uppercase tracking-[0.2em] italic">Deep transcription will be applied automatically.</p>
                                        </div>
                                    </motion.div>
                                )}

                                {contentSource === 'search' && (
                                    <motion.div key="search" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="flex-grow space-y-6 md:space-y-8 max-w-2xl mx-auto pt-10 md:pt-16 px-2">
                                         <div className="p-8 md:p-12 bg-slate-950 rounded-3xl md:rounded-[4rem] border border-white/5 space-y-8 md:space-y-12 shadow-2xl relative overflow-hidden">
                                            <div className="absolute top-0 left-0 w-full h-1 bg-cyan-500/50"></div>
                                            <div>
                                                <label className="text-[10px] font-black text-slate-600 uppercase tracking-widest mb-3 md:mb-4 block">Topic Targeting</label>
                                                <input value={chapterInfo} onChange={e => setChapterInfo(e.target.value)} placeholder="TOPIC NAME" className="w-full bg-slate-900 border-b-2 border-white/10 p-4 md:p-8 text-xl md:text-3xl font-black text-white outline-none focus:border-violet-500 uppercase placeholder:text-slate-800 transition-all"/>
                                            </div>
                                            <div>
                                                <label className="text-[10px] font-black text-slate-600 uppercase tracking-widest mb-3 md:mb-4 block">Constraint Parameters</label>
                                                <input value={chapterDetails} onChange={e => setChapterDetails(e.target.value)} placeholder="FILTERS (YEAR, BOARD)" className="w-full bg-slate-900 border-b-2 border-white/10 p-4 md:p-8 text-[10px] md:text-sm font-bold text-slate-500 outline-none focus:border-cyan-500 uppercase placeholder:text-slate-800 transition-all"/>
                                            </div>
                                         </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>

                        {error && (
                            <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="mt-8 p-5 bg-red-600/10 border border-red-500/20 text-red-500 rounded-2xl text-center text-[10px] font-black uppercase tracking-widest">
                                ERROR: {error}
                            </motion.div>
                        )}

                        <div className="mt-8 md:mt-12">
                             <Button onClick={handleStartSession} disabled={isLoading} className="w-full h-20 md:h-32 !text-2xl md:!text-5xl !font-black !rounded-2xl md:!rounded-[3.5rem] shadow-[0_20px_60px_rgba(124,58,237,0.2)] md:shadow-[0_30px_100px_rgba(124,58,237,0.3)] bg-white !text-slate-950 group hover:scale-[1.02] active:scale-[0.98] transition-all italic">
                                {isLoading ? <Spinner colorClass="bg-slate-950" /> : 'LAUNCH MISSION'}
                             </Button>
                        </div>
                    </Card>
                </div>
            </div>
        </div>
    );
};

export default NewSessionPage;
