import React, { useState } from 'react';
import { CareerRoadmap } from '../types';
import * as geminiService from '../services/geminiService';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import Spinner from '../components/common/Spinner';
import { RocketLaunchIcon, ArrowRightIcon } from '../components/icons';
import { motion } from 'framer-motion';

const CareerGuidancePage: React.FC = () => {
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

    if (isLoading) return <div className="py-60 flex flex-col items-center gap-6"><Spinner className="w-16 h-16" colorClass="bg-violet-500"/><p className="text-xl font-black uppercase tracking-widest text-white">Calculating Your Destiny...</p></div>;

    if (roadmap) return (
        <div className="max-w-6xl mx-auto px-6 pb-40 space-y-12">
            <div className="text-center">
                <h1 className="text-6xl font-black tracking-tighter uppercase mb-4">{roadmap.title || "Your Career Roadmap"}</h1>
                <p className="text-xl text-slate-400 italic max-w-3xl mx-auto">"{roadmap.vision || "Your potential is limitless."}"</p>
            </div>

            <div className="grid lg:grid-cols-12 gap-10">
                <div className="lg:col-span-4 space-y-6">
                    <Card variant="dark" className="!p-8 border-slate-800 bg-violet-600/10 border-violet-500/20">
                        <h3 className="text-xs font-black text-violet-400 uppercase tracking-widest mb-6">Financial Strategy</h3>
                        <ul className="space-y-4">
                            {(roadmap.financialMilestones || []).map((m, i) => (
                                <li key={i} className="flex gap-3 text-sm text-slate-300 font-medium leading-relaxed">
                                    <div className="w-1.5 h-1.5 rounded-full bg-violet-500 mt-2 flex-shrink-0"></div>
                                    {m}
                                </li>
                            ))}
                        </ul>
                    </Card>
                    <Card variant="dark" className="!p-8 border-slate-800">
                        <h3 className="text-xs font-black text-cyan-400 uppercase tracking-widest mb-6">Future Occupations</h3>
                        <div className="space-y-6">
                            {(roadmap.jobOccupations || []).map((job, i) => (
                                <div key={i} className="border-b border-white/5 pb-4 last:border-0">
                                    <p className="text-white font-bold">{job.title}</p>
                                    <p className="text-[10px] text-slate-500 uppercase tracking-widest mb-2">{job.salaryRange}</p>
                                    <p className="text-xs text-slate-400">{job.scope}</p>
                                </div>
                            ))}
                        </div>
                    </Card>
                </div>

                <div className="lg:col-span-8">
                    <div className="space-y-8 relative">
                        <div className="absolute left-6 top-0 bottom-0 w-px bg-gradient-to-b from-violet-500 via-cyan-500 to-transparent opacity-30"></div>
                        {(roadmap.classByClassRoadmap || []).map((item, i) => (
                            <motion.div key={i} initial={{ opacity: 0, x: -20 }} whileInView={{ opacity: 1, x: 0 }} className="relative pl-20">
                                <div className="absolute left-3 top-0 w-6 h-6 rounded-full bg-slate-950 border-2 border-cyan-400 flex items-center justify-center shadow-[0_0_15px_rgba(34,211,238,0.5)]">
                                    <div className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse"></div>
                                </div>
                                <Card variant="glass" className="!p-8 hover:border-cyan-500/30 transition-all group">
                                    <h4 className="text-2xl font-black text-white uppercase tracking-widest mb-4 group-hover:text-cyan-400 transition-colors">{item.grade}</h4>
                                    <div className="grid md:grid-cols-2 gap-8">
                                        <div>
                                            <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-3">Academic Focus</p>
                                            <ul className="space-y-2">
                                                {(item.focus || []).map((f, j) => <li key={j} className="text-sm text-slate-300 font-medium">&bull; {f}</li>)}
                                            </ul>
                                        </div>
                                        <div>
                                            <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-3">Milestone Exams</p>
                                            <div className="flex flex-wrap gap-2">
                                                {(item.exams || []).map((e, j) => <span key={j} className="px-3 py-1 bg-white/5 border border-white/10 rounded-full text-[10px] font-black uppercase text-cyan-400">{e}</span>)}
                                            </div>
                                            <p className="mt-4 text-[10px] text-slate-500 italic">Guru Tip: {item.coachingRecommendation}</p>
                                        </div>
                                    </div>
                                </Card>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </div>
            <div className="text-center"><Button onClick={() => setRoadmap(null)} size="lg" variant="outline">Start New Divination</Button></div>
        </div>
    );

    return (
        <div className="max-w-3xl mx-auto px-6 py-20">
            <Card variant="dark" className="!p-16 border-slate-800 relative overflow-hidden">
                <div className="absolute top-0 right-0 p-12 opacity-10"><RocketLaunchIcon className="w-40 h-40" /></div>
                <div className="relative z-10">
                    <div className="mb-12">
                        <h1 className="text-5xl font-black text-white uppercase tracking-tighter mb-4">Destiny Intake</h1>
                        <p className="text-slate-500 font-mono-tech uppercase tracking-widest text-xs">Step {step} of 3 &bull; Neural Pathfinding Active</p>
                    </div>

                    <div className="space-y-12">
                        {step === 1 && (
                            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-8">
                                <div>
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4 block">What fuels your mind? (Interests)</label>
                                    <textarea value={formData.interests} onChange={e => setFormData({...formData, interests: e.target.value})} placeholder="e.g., Solving equations, space exploration, writing, logic puzzles..." className="w-full h-32 bg-slate-950 border border-slate-800 p-6 rounded-[2rem] focus:ring-2 focus:ring-violet-500 outline-none text-white font-medium" />
                                </div>
                                <Button onClick={() => setStep(2)} className="w-full h-18 text-xl font-black">CONTINUE &rarr;</Button>
                            </motion.div>
                        )}
                        {step === 2 && (
                            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-8">
                                <div>
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4 block">Economic Reality (Family Finance)</label>
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                        {['Humble', 'Stable', 'Strong'].map(f => (
                                            <button key={f} onClick={() => setFormData({...formData, finances: f})} className={`p-6 rounded-2xl border-2 transition-all font-black uppercase text-[10px] tracking-widest ${formData.finances === f ? 'bg-violet-600 border-violet-500 text-white' : 'bg-slate-950 border-slate-800 text-slate-500 hover:border-slate-700'}`}>{f}</button>
                                        ))}
                                    </div>
                                </div>
                                <Button onClick={() => setStep(3)} className="w-full h-18 text-xl font-black">CONTINUE &rarr;</Button>
                            </motion.div>
                        )}
                        {step === 3 && (
                            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-8">
                                <div>
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4 block">Ultimate Ambition</label>
                                    <input value={formData.ambition} onChange={e => setFormData({...formData, ambition: e.target.value})} placeholder="e.g. Become an IAS, IIT Engineer, or Neurosurgeon..." className="w-full bg-slate-950 border border-slate-800 p-6 rounded-[2rem] focus:ring-2 focus:ring-violet-500 outline-none text-white font-medium" />
                                </div>
                                <Button onClick={handleSubmit} className="w-full h-20 text-2xl font-black !bg-white !text-slate-950 shadow-[0_0_50px_rgba(255,255,255,0.2)]">GENERATE DESTINY</Button>
                            </motion.div>
                        )}
                    </div>
                </div>
            </Card>
        </div>
    );
};

export default CareerGuidancePage;
