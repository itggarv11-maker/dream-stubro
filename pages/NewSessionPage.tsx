
import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Subject, ClassLevel } from '../types';
import { SUBJECTS, CLASS_LEVELS } from '../constants';
import * as geminiService from '../services/geminiService';
import Button from '../components/common/Button';
import Spinner from '../components/common/Spinner';
import Card from '../components/common/Card';
import { 
    UploadIcon, YouTubeIcon, ClipboardIcon, SearchIcon, 
    RocketLaunchIcon, BoltIcon, SparklesIcon, ShieldCheckIcon
} from '../components/icons';
import * as pdfjs from 'pdfjs-dist';
import * as mammoth from 'mammoth';
import { useContent, SessionIntent } from '../contexts/ContentContext';
import { motion, AnimatePresence } from 'framer-motion';

pdfjs.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

type ContentSource = 'paste' | 'file' | 'youtube' | 'search';

const NewSessionPage: React.FC = () => {
    const navigate = useNavigate();
    const { setSubject: setGlobalSubject, setClassLevel: setGlobalClassLevel, setIntent: setGlobalIntent, startSessionWithContent } = useContent();
    
    const [step, setStep] = useState<'mission' | 'source'>('mission');
    const [subject, setSubject] = useState<Subject | null>(null);
    const [classLevel, setClassLevel] = useState<ClassLevel>('Class 10');
    const [intent, setIntent] = useState<SessionIntent>('learn');
    const [contentSource, setContentSource] = useState<ContentSource>('paste');
    
    const [pastedText, setPastedText] = useState('');
    const [mediaUrl, setMediaUrl] = useState(''); 
    const [chapterInfo, setChapterInfo] = useState('');
    const [chapterDetails, setChapterDetails] = useState('');
    const [fileContent, setFileContent] = useState('');
    const [fileName, setFileName] = useState('');
    
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
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
        } catch (err) { setError('Sync Error: File corrupted.'); } finally { setIsLoading(false); }
    };

    const handleStartSession = async () => {
        if (!subject) return setError("Please select a subject.");
        setIsLoading(true);
        setError(null);
        try {
            let finalContent = '';
            if (contentSource === 'search') {
                finalContent = await geminiService.fetchChapterContent(classLevel, subject!, chapterInfo, chapterDetails);
            } else if (contentSource === 'paste') finalContent = pastedText;
            else if (contentSource === 'file') finalContent = fileContent;
            else if (contentSource === 'youtube') finalContent = await geminiService.fetchYouTubeTranscript(mediaUrl);

            if (finalContent.length < 50) throw new Error("The content provided is too short.");
            
            setGlobalSubject(subject);
            setGlobalClassLevel(classLevel);
            setGlobalIntent(intent);
            startSessionWithContent(finalContent);
            navigate('/app');
        } catch (err: any) {
            setError(err.message);
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#010204] text-white flex items-center justify-center p-6 md:p-12 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-full opacity-20 pointer-events-none">
                <div className="absolute top-[-10%] right-[-10%] w-1/2 h-1/2 bg-violet-600 blur-[300px]"></div>
                <div className="absolute bottom-[-10%] left-[-10%] w-1/2 h-1/2 bg-cyan-600 blur-[300px]"></div>
            </div>

            <div className="max-w-5xl w-full relative z-10">
                <AnimatePresence mode="wait">
                    {step === 'mission' ? (
                        <motion.div key="m" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="space-y-12">
                            <div className="text-center space-y-4">
                                <h1 className="text-6xl md:text-8xl font-black italic tracking-tightest uppercase leading-none">CHOOSE YOUR <br/> FOCUS</h1>
                                <p className="text-slate-500 font-black uppercase tracking-[0.5em] text-[10px]">What is your goal for this study session?</p>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                <MissionCard 
                                    title="LEARN" 
                                    desc="Master new concepts with deep AI analysis." 
                                    icon={<SparklesIcon className="w-8 h-8 text-cyan-400"/>} 
                                    active={intent === 'learn'}
                                    onClick={() => setIntent('learn')}
                                />
                                <MissionCard 
                                    title="REVISE" 
                                    desc="Active recall and rapid memory sync." 
                                    icon={<BoltIcon className="w-8 h-8 text-violet-400"/>} 
                                    active={intent === 'revise'}
                                    onClick={() => setIntent('revise')}
                                />
                                <MissionCard 
                                    title="SOLVE" 
                                    desc="Practice problems and exam prep." 
                                    icon={<ShieldCheckIcon className="w-8 h-8 text-emerald-400"/>} 
                                    active={intent === 'solve'}
                                    onClick={() => setIntent('solve')}
                                />
                            </div>

                            <div className="flex flex-col md:flex-row gap-6 items-center justify-center">
                                <Button onClick={() => setStep('source')} className="w-full md:w-96 h-20 !text-2xl !font-black !rounded-full !bg-white !text-black shadow-2xl">CONTINUE &rarr;</Button>
                                <button onClick={() => navigate('/app')} className="text-[11px] font-black uppercase tracking-widest text-slate-500 hover:text-white transition-colors italic">Skip to Dashboard &rarr;</button>
                            </div>
                        </motion.div>
                    ) : (
                        <motion.div key="s" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="grid grid-cols-1 lg:grid-cols-12 gap-10">
                            <div className="lg:col-span-4 space-y-6">
                                <Card variant="dark" className="!p-8 border-white/5 !rounded-[3rem]">
                                     <h3 className="text-[10px] font-black text-slate-600 uppercase tracking-widest mb-8">Subject Profile</h3>
                                     <div className="space-y-6">
                                        <div>
                                            <label className="text-[8px] font-black text-slate-700 uppercase tracking-widest block mb-2">Subject</label>
                                            <div className="grid grid-cols-2 gap-2">
                                                {SUBJECTS.map(s => (
                                                    <button key={s.name} onClick={() => setSubject(s.name)} className={`p-4 rounded-xl border transition-all text-center ${subject === s.name ? 'bg-violet-600 border-violet-400 text-white' : 'bg-slate-950 border-white/5 text-slate-600'}`}>
                                                        <span className="text-[9px] font-black uppercase tracking-tighter">{s.name}</span>
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                     </div>
                                </Card>
                            </div>

                            <Card variant="dark" className="lg:col-span-8 !p-10 border-white/5 !rounded-[4rem] flex flex-col h-[600px] relative">
                                <div className="flex gap-4 mb-8 overflow-x-auto pb-4 scrollbar-hide">
                                    {[
                                        { id: 'paste', label: 'PASTE TEXT', icon: ClipboardIcon },
                                        { id: 'file', label: 'UPLOAD FILE', icon: UploadIcon },
                                        { id: 'youtube', label: 'YOUTUBE LINK', icon: YouTubeIcon },
                                        { id: 'search', label: 'WEB SEARCH', icon: SearchIcon }
                                    ].map(tab => (
                                        <button key={tab.id} onClick={() => setContentSource(tab.id as any)} className={`px-6 py-3 rounded-full text-[9px] font-black uppercase tracking-widest transition-all border ${contentSource === tab.id ? 'bg-white text-black border-white' : 'bg-slate-950 text-slate-600 border-white/5'}`}>{tab.label}</button>
                                    ))}
                                </div>
                                
                                <div className="flex-grow">
                                    {contentSource === 'paste' && <textarea value={pastedText} onChange={e => setPastedText(e.target.value)} placeholder="Paste your chapter notes or textbook text here..." className="w-full h-full bg-black/40 p-8 rounded-[2.5rem] border border-white/5 text-slate-300 outline-none resize-none font-sans text-base" />}
                                    {contentSource === 'file' && (
                                        <label className="w-full h-full border-4 border-dashed border-white/5 rounded-[3rem] flex flex-col items-center justify-center cursor-pointer hover:border-violet-500/30 transition-all bg-black/20">
                                            <UploadIcon className="w-16 h-16 text-slate-700 mb-4" />
                                            <p className="text-slate-500 font-black text-xs uppercase tracking-widest">{fileName || 'SELECT PDF OR DOCX'}</p>
                                            <input type="file" className="hidden" onChange={handleFileChange} />
                                        </label>
                                    )}
                                    {contentSource === 'search' && (
                                        <div className="space-y-6 pt-10">
                                            <input value={chapterInfo} onChange={e => setChapterInfo(e.target.value)} placeholder="ENTER TOPIC (e.g. Photosynthesis)..." className="w-full bg-slate-950 border-b border-white/10 p-6 text-4xl font-black text-white outline-none uppercase italic" />
                                            <input value={chapterDetails} onChange={e => setChapterDetails(e.target.value)} placeholder="ADDITIONAL DETAILS (OPTIONAL)" className="w-full bg-transparent p-6 text-xs font-black text-slate-600 outline-none uppercase tracking-widest" />
                                        </div>
                                    )}
                                </div>

                                {error && <p className="text-red-500 text-center font-black uppercase text-[10px] mt-4">{error}</p>}
                                <div className="pt-8">
                                    <Button onClick={handleStartSession} disabled={isLoading} className="w-full h-24 !text-4xl !font-black !rounded-[3rem] !bg-violet-600 shadow-2xl shadow-violet-600/20 italic">{isLoading ? <Spinner colorClass="bg-white" /> : 'START SESSION'}</Button>
                                </div>
                            </Card>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
};

const MissionCard = ({ title, desc, icon, active, onClick }: any) => (
    <div onClick={onClick} className={`p-8 rounded-[3rem] border-2 transition-all cursor-pointer group flex flex-col gap-6 ${active ? 'bg-white/5 border-white shadow-[0_0_50px_rgba(255,255,255,0.05)]' : 'bg-slate-900/40 border-white/5 hover:border-white/20'}`}>
        <div className={`w-16 h-16 rounded-2xl flex items-center justify-center border transition-all ${active ? 'bg-white text-black' : 'bg-black/60 border-white/10'}`}>{icon}</div>
        <div className="space-y-2">
            <h3 className={`text-3xl font-black uppercase italic ${active ? 'text-white' : 'text-slate-600'}`}>{title}</h3>
            <p className="text-xs text-slate-500 font-medium italic leading-relaxed">{desc}</p>
        </div>
    </div>
);

export default NewSessionPage;
