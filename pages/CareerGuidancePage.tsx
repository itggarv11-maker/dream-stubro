
import React, { useState } from 'react';
import { CareerRoadmap } from '../types';
import * as geminiService from '../services/geminiService';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import Spinner from '../components/common/Spinner';
import { RocketLaunchIcon, ArrowRightIcon, SparklesIcon, BoltIcon, StarIcon, ShieldCheckIcon } from '../components/icons';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from '../contexts/ThemeContext';

const CareerGuidancePage: React.FC = () => {
    const { theme } = useTheme();
    const [step, setStep] = useState(1);
    const [formData, setFormData] = useState({ interests: '', finances: '', ambition: '', currentClass: 'Class 10' });
    const [roadmap, setRoadmap] = useState<CareerRoadmap | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async () => {
        setIsLoading(true);
        try {
            const result = await geminiService.generateCareerDivination(formData);
            setRoadmap(result);
        } catch (e) { console.error(e); } finally { setIsLoading(false); }
    };

    if (isLoading) return (
        <div className="py-60 flex flex-col items-center gap-12 text-center">
            <div className="relative">
                <div className={`absolute inset-0 blur-[150px] opacity-30 animate-pulse ${theme === 'dark' ? 'bg-violet-600' : 'bg-amber-400'}`}></div>
                <Spinner className="w-40 h-40 relative z-10" colorClass={theme === 'dark' ? 'bg-violet-500' : 'bg-amber-500'}/>
            </div>
            <p className="text-6xl font-black uppercase tracking-tightest text-white italic animate-pulse">DIVINING YOUR FUTURE NODE...</p>
        </div>
    );

    if (roadmap) {
        return (
            <div className="max-w-[1800px] mx-auto px-6 md:px-12 pb-40 space-y-20">
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center border-b border-white/5 pb-16">
                    <h1 className="text-6xl md:text-[10rem] font-black tracking-tightest uppercase leading-none italic select-none opacity-10 absolute inset-x-0 top-20">DESTINY TREE</h1>
                    <h2 className="text-5xl md:text-8xl font-black tracking-tighter uppercase relative z-10">{roadmap.title}</h2>
                    <p className="text-2xl text-slate-500 italic mt-6 max-w-4xl mx-auto leading-relaxed">"{roadmap.vision}"</p>
                </motion.div>

                <div className="grid lg:grid-cols-12 gap-12 items-start">
                    {/* LEFT FLANK: VITAL STATS */}
                    <div className="lg:col-span-4 space-y-8">
                        <Card variant="dark" className="!p-12 !rounded-[4rem] border-violet-500/20 bg-violet-600/5 relative overflow-hidden">
                            <div className="absolute top-0 left-0 w-1.5 h-full bg-violet-600 shadow-[0_0_20px_#8b5cf6]"></div>
                            <h3 className="text-xs font-black text-violet-400 uppercase tracking-[0.6em] mb-10 italic">Financial Milestones</h3>
                            <div className="space-y-8">
                                {roadmap.financialMilestones?.map((m, i) => (
                                    <div key={i} className="flex gap-6 group">
                                        <div className="w-1.5 h-1.5 rounded-full bg-violet-500 mt-2 flex-shrink-0 group-hover:scale-150 transition-transform"></div>
                                        <p className="text-lg text-slate-300 font-medium italic group-hover:text-white transition-colors">{m}</p>
                                    </div>
                                ))}
                            </div>
                        </Card>

                        <Card variant="dark" className="!p-12 !rounded-[4rem] border-cyan-500/20 bg-cyan-600/5">
                             <h3 className="text-xs font-black text-cyan-400 uppercase tracking-[0.6em] mb-10 italic">Apex Occupations</h3>
                             <div className="space-y-10">
                                {roadmap.jobOccupations?.map((job, i) => (
                                    <div key={i} className="space-y-3 group cursor-default">
                                        <div className="flex justify-between items-center">
                                            <p className="text-2xl font-black text-white uppercase italic group-hover:text-cyan-400 transition-colors">{job.title}</p>
                                            <span className="text-[10px] font-black text-cyan-600 uppercase tracking-widest">{job.salaryRange}</span>
                                        </div>
                                        <p className="text-sm text-slate-500 italic leading-relaxed">{job.scope}</p>
                                    </div>
                                ))}
                             </div>
                        </Card>
                    </div>

                    {/* MAIN NODE TREE */}
                    <div className="lg:col-span-8">
                        <div className="relative space-y-16 pl-12 md:pl-24 border-l-2 border-white/5">
                            {roadmap.classByClassRoadmap?.map((item, i) => (
                                <motion.div 
                                    key={i} 
                                    initial={{ opacity: 0, x: 30 }} 
                                    whileInView={{ opacity: 1, x: 0 }}
                                    className="relative"
                                >
                                    <div className="absolute -left-[54px] md:-left-[106px] top-10 flex items-center gap-4">
                                        <div className={`w-12 h-12 md:w-20 md:h-20 rounded-full flex items-center justify-center border-4 border-slate-900 shadow-2xl relative overflow-hidden transition-all ${theme === 'dark' ? 'bg-white text-black' : 'bg-slate-950 text-white'}`}>
                                            <span className="text-2xl md:text-4xl font-black italic">{i + 1}</span>
                                        </div>
                                        <div className="h-px w-8 md:w-20 bg-white/10"></div>
                                    </div>

                                    <Card variant="dark" className="!p-12 md:!p-16 !rounded-[5rem] group hover:border-violet-500/40 transition-all shadow-[0_40px_100px_rgba(0,0,0,0.8)]">
                                        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-12 border-b border-white/5 pb-8">
                                            <h4 className="text-4xl md:text-6xl font-black text-white uppercase italic tracking-tightest group-hover:text-violet-400 transition-colors">{item.grade}</h4>
                                            <span className="px-6 py-2 rounded-full bg-white/5 border border-white/10 text-[10px] font-black uppercase tracking-widest italic text-slate-500">Milestone Phase</span>
                                        </div>

                                        <div className="grid md:grid-cols-2 gap-16">
                                            <div className="space-y-6">
                                                <p className="text-[10px] font-black text-slate-600 uppercase tracking-widest flex items-center gap-3">
                                                    <BoltIcon className="w-4 h-4 text-amber-500"/> Core Concentration
                                                </p>
                                                <ul className="space-y-4">
                                                    {item.focus?.map((f, j) => (
                                                        <li key={j} className="text-xl font-bold text-slate-300 italic flex items-center gap-3 group/li">
                                                            <div className="w-2 h-2 rounded-full bg-violet-600 group-hover/li:scale-150 transition-all"></div>
                                                            {f}
                                                        </li>
                                                    ))}
                                                </ul>
                                            </div>
                                            <div className="space-y-8">
                                                <div>
                                                    <p className="text-[10px] font-black text-slate-600 uppercase tracking-widest mb-4">Tactical Target Exams</p>
                                                    <div className="flex flex-wrap gap-3">
                                                        {item.exams?.map((e, j) => (
                                                            <span key={j} className="px-5 py-2 bg-slate-950 border border-white/10 rounded-2xl text-xs font-black uppercase italic text-cyan-400 shadow-inner">{e}</span>
                                                        ))}
                                                    </div>
                                                </div>
                                                <Card variant="glass" className="!p-6 !rounded-3xl border-white/5 bg-white/5">
                                                     <p className="text-[9px] font-black text-amber-500 uppercase tracking-widest mb-2 flex items-center gap-2">
                                                        <SparklesIcon className="w-3 h-3"/> Neural Pro-Tip
                                                     </p>
                                                     <p className="text-sm text-slate-400 italic font-medium leading-relaxed">{item.coachingRecommendation}</p>
                                                </Card>
                                            </div>
                                        </div>
                                    </Card>
                                </motion.div>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="text-center pt-20 border-t border-white/5">
                    <Button onClick={() => setRoadmap(null)} size="lg" variant="outline" className="h-28 px-20 !text-2xl !font-black !rounded-full italic border-white/10 hover:border-white/20">
                        RE-DIVINE DESTINY &rarr;
                    </Button>
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto px-6 py-20">
            <Card variant="dark" className="!p-16 !rounded-[5rem] border-white/5 relative overflow-hidden shadow-[0_60px_150px_rgba(0,0,0,1)]">
                <div className="absolute top-0 right-0 p-16 opacity-[0.03] rotate-12"><RocketLaunchIcon className="w-80 h-80" /></div>
                
                <div className="relative z-10 space-y-16">
                    <div className="text-center space-y-4">
                        <h1 className="text-6xl md:text-8xl font-black text-white tracking-tightest uppercase italic leading-none">Intake Node</h1>
                        <p className="text-slate-500 font-mono-tech uppercase tracking-[0.5em] text-xs">Phase 0{step} / Strategic Alignment Active</p>
                    </div>

                    <AnimatePresence mode="wait">
                        {step === 1 && (
                            <motion.div key="s1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-10">
                                <div>
                                    <label className="text-[11px] font-black text-slate-500 uppercase tracking-widest mb-6 block">What fuels your neural network? (Interests)</label>
                                    <textarea value={formData.interests} onChange={e => setFormData({...formData, interests: e.target.value})} placeholder="e.g., Solving complex logic, architecting systems, space flight, writing..." className="w-full h-40 bg-slate-950/60 border-2 border-white/5 p-10 rounded-[3rem] text-2xl font-bold text-white focus:border-violet-500 outline-none transition-all shadow-inner italic" />
                                </div>
                                <Button onClick={() => setStep(2)} className="w-full h-24 !text-3xl !font-black !rounded-full !bg-white !text-black shadow-2xl">CONTINUE MISSION &rarr;</Button>
                            </motion.div>
                        )}
                        {step === 2 && (
                            <motion.div key="s2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-10">
                                <div>
                                    <label className="text-[11px] font-black text-slate-500 uppercase tracking-widest mb-10 block text-center">Economic Resource Buffer (Finance)</label>
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                        {['Humble', 'Stable', 'Strong'].map(f => (
                                            <button key={f} onClick={() => setFormData({...formData, finances: f})} className={`h-32 rounded-[2.5rem] border-2 transition-all flex flex-col items-center justify-center gap-2 ${formData.finances === f ? (theme === 'dark' ? 'bg-violet-600 border-violet-500 text-white shadow-2xl scale-105' : 'bg-slate-950 border-slate-900 text-white') : 'bg-slate-950/40 border-white/5 text-slate-500 hover:border-white/10'}`}>
                                                <span className="font-black uppercase tracking-widest text-lg">{f}</span>
                                                <span className="text-[8px] font-bold opacity-40 uppercase">Resource Level</span>
                                            </button>
                                        ))}
                                    </div>
                                </div>
                                <Button onClick={() => setStep(3)} className="w-full h-24 !text-3xl !font-black !rounded-full !bg-white !text-black shadow-2xl">CONTINUE MISSION &rarr;</Button>
                            </motion.div>
                        )}
                        {step === 3 && (
                            <motion.div key="s3" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-10">
                                <div>
                                    <label className="text-[11px] font-black text-slate-500 uppercase tracking-widest mb-6 block">The Ultimate Apex Goal</label>
                                    <input value={formData.ambition} onChange={e => setFormData({...formData, ambition: e.target.value})} placeholder="e.g. IAS Officer, AI Engineer, Neurosurgeon..." className="w-full bg-slate-950/60 border-2 border-white/5 p-10 rounded-full text-3xl font-black text-white focus:border-cyan-500 outline-none transition-all shadow-inner text-center italic" />
                                </div>
                                <Button onClick={handleSubmit} className="w-full h-32 !text-4xl !font-black !rounded-full !bg-violet-600 text-white shadow-[0_0_100px_rgba(139,92,246,0.4)] hover:scale-105 transition-all">DIVINE FUTURE NOW &rarr;</Button>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </Card>
        </div>
    );
};

export default CareerGuidancePage;
