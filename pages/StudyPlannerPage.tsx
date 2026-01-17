
import React, { useState } from 'react';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import Spinner from '../components/common/Spinner';
import { CalendarDaysIcon, ClockIcon, AcademicCapIcon, BoltIcon, SparklesIcon, ShieldCheckIcon } from '../components/icons';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from '../contexts/ThemeContext';

const StudyPlannerPage: React.FC = () => {
    const { theme } = useTheme();
    const [goal, setGoal] = useState('');
    const [tuitionTimes, setTuitionTimes] = useState('');
    const [isGenerating, setIsGenerating] = useState(false);
    const [plan, setPlan] = useState<any | null>(null);

    const handleGenerate = () => {
        setIsGenerating(true);
        setTimeout(() => {
            setPlan({
                title: "ASTRA COMBAT SCHEDULE",
                meta: "Neural Recovery: 22% | Focus Peak: 09:00",
                schedule: [
                    { time: "05:00 - 07:30", task: "Deep Neural Loading", sub: "Physics", priority: "CRITICAL", intensity: 95 },
                    { time: "07:30 - 08:30", task: "Flashcard Recalibration", sub: "Math", priority: "HIGH", intensity: 70 },
                    { time: "16:00 - 18:30", task: "Mission Revision Block", sub: "Chemistry", priority: "NORMAL", intensity: 60 },
                    { time: "20:00 - 22:00", task: "Zenith Arena Battle", sub: "General", priority: "CRITICAL", intensity: 85 },
                ]
            });
            setIsGenerating(false);
        }, 2500);
    };

    if (isGenerating) return (
        <div className="py-60 flex flex-col items-center gap-12 text-center">
            <div className="relative">
                <div className={`absolute inset-0 blur-[150px] opacity-30 animate-pulse ${theme === 'dark' ? 'bg-pink-600' : 'bg-amber-400'}`}></div>
                <Spinner className="w-40 h-40 relative z-10" colorClass={theme === 'dark' ? 'bg-pink-500' : 'bg-amber-500'}/>
            </div>
            <p className="text-6xl font-black uppercase tracking-tightest text-white italic animate-pulse">OPTIMIZING TIME NODES...</p>
        </div>
    );

    return (
        <div className="max-w-[1800px] mx-auto px-6 md:px-12 py-20 space-y-20">
            {!plan ? (
                <Card variant="dark" className="max-w-3xl mx-auto !p-16 !rounded-[5rem] border-white/5 shadow-[0_60px_150px_rgba(0,0,0,1)] relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-full h-2 bg-pink-600 shadow-[0_0_30px_#db2777]"></div>
                    <div className="text-center mb-16 space-y-6">
                        <div className="w-24 h-24 bg-pink-600/10 rounded-[2.5rem] border border-pink-500/30 mx-auto flex items-center justify-center shadow-2xl">
                             <CalendarDaysIcon className="w-12 h-12 text-pink-500" />
                        </div>
                        <h1 className="text-6xl font-black text-white uppercase tracking-tightest leading-none italic">WAR ROOM <br/> PLANNING</h1>
                        <p className="text-slate-500 uppercase tracking-[0.5em] text-[10px] font-black">Constraint-Based Scheduling Node</p>
                    </div>

                    <div className="space-y-12">
                        <div className="space-y-4">
                            <label className="text-[11px] font-black text-slate-500 uppercase tracking-widest block">Primary Mission Goal</label>
                            <input value={goal} onChange={e => setGoal(e.target.value)} placeholder="e.g. 98% in Class 12 Boards" className="w-full bg-slate-950/60 border-2 border-white/5 p-8 rounded-full text-2xl font-black text-white outline-none focus:border-pink-500 transition-all text-center italic shadow-inner"/>
                        </div>
                        <div className="space-y-4">
                            <label className="text-[11px] font-black text-slate-500 uppercase tracking-widest block">Neural Constraints (School/Tuition)</label>
                            <input value={tuitionTimes} onChange={e => setTuitionTimes(e.target.value)} placeholder="e.g. School 8-3, Physics 4-6" className="w-full bg-slate-950/60 border-2 border-white/5 p-8 rounded-full text-lg font-bold text-slate-400 outline-none focus:border-cyan-500 transition-all text-center shadow-inner"/>
                        </div>
                        <Button onClick={handleGenerate} className="w-full h-28 !text-3xl !font-black !rounded-full !bg-pink-600 text-white shadow-[0_0_80px_rgba(219,39,119,0.4)] hover:scale-105 active:scale-95 transition-all italic">
                            CALCULATE COMBAT PLAN &rarr;
                        </Button>
                    </div>
                </Card>
            ) : (
                <div className="space-y-16">
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center border-b border-white/5 pb-16">
                        <h2 className="text-6xl md:text-[10rem] font-black text-white tracking-tightest uppercase italic leading-none">{plan.title}</h2>
                        <div className="mt-8 flex justify-center gap-10">
                             <div className="flex items-center gap-3 text-[10px] font-black text-cyan-400 uppercase tracking-widest bg-cyan-500/5 px-6 py-2 rounded-full border border-cyan-500/20 shadow-inner">
                                <BoltIcon className="w-4 h-4"/> 110% Focus Intensity Model
                             </div>
                             <div className="flex items-center gap-3 text-[10px] font-black text-pink-400 uppercase tracking-widest bg-pink-500/5 px-6 py-2 rounded-full border border-pink-500/20 shadow-inner">
                                <ClockIcon className="w-4 h-4"/> Neural Drift Prevented
                             </div>
                        </div>
                    </motion.div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 max-w-7xl mx-auto">
                        {plan.schedule.map((item: any, i: number) => (
                            <motion.div 
                                key={i}
                                initial={{ opacity: 0, x: i % 2 === 0 ? -30 : 30 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: i * 0.1 }}
                            >
                                <Card variant="dark" className="!p-12 !rounded-[4rem] border-white/5 hover:border-pink-500/30 transition-all group relative overflow-hidden">
                                    <div className="absolute top-0 right-0 p-10 opacity-5 rotate-12 group-hover:scale-110 transition-transform"><BoltIcon className="w-40 h-40" /></div>
                                    <div className="flex justify-between items-start mb-10">
                                        <div className="space-y-1">
                                            <p className="text-4xl font-black text-white italic tracking-tighter">{item.time}</p>
                                            <p className={`text-[10px] font-black uppercase tracking-[0.4em] ${item.priority === 'CRITICAL' ? 'text-red-500' : 'text-slate-600'}`}>{item.priority} PHASE</p>
                                        </div>
                                        <div className="text-right">
                                             <div className="h-2 w-32 bg-white/5 rounded-full overflow-hidden mb-2 shadow-inner">
                                                <motion.div initial={{ width: 0 }} animate={{ width: `${item.intensity}%` }} className={`h-full ${item.intensity > 80 ? 'bg-red-500 shadow-[0_0_10px_#ef4444]' : 'bg-cyan-400'}`} />
                                             </div>
                                             <p className="text-[8px] font-black text-slate-700 uppercase tracking-widest">{item.intensity}% LOAD</p>
                                        </div>
                                    </div>
                                    <div className="space-y-6">
                                        <h3 className="text-4xl font-black text-white uppercase italic group-hover:text-pink-500 transition-colors leading-none">{item.task}</h3>
                                        <div className="flex items-center gap-4 text-slate-500 text-xs font-black uppercase tracking-widest italic">
                                            <div className="p-2 bg-slate-950 rounded-xl border border-white/10"><AcademicCapIcon className="w-5 h-5 text-violet-400" /></div>
                                            Astra Module: {item.sub}
                                        </div>
                                    </div>
                                </Card>
                            </motion.div>
                        ))}
                    </div>
                    
                    <div className="text-center pt-10">
                         <Button onClick={() => setPlan(null)} variant="outline" className="h-20 px-12 !font-black !rounded-full italic border-white/10 hover:border-white/20">RE-CALCULATE TIMELINE &rarr;</Button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default StudyPlannerPage;
