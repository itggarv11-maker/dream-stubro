import React, { useState } from 'react';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import Spinner from '../components/common/Spinner';
import { CalendarDaysIcon, ClockIcon, AcademicCapIcon } from '../components/icons';

const StudyPlannerPage: React.FC = () => {
    const [goal, setGoal] = useState('');
    const [tuitionTimes, setTuitionTimes] = useState('');
    const [isGenerating, setIsGenerating] = useState(false);
    const [plan, setPlan] = useState<any | null>(null);

    const handleGenerate = () => {
        setIsGenerating(true);
        setTimeout(() => {
            setPlan({
                title: "Astra War Plan: Mission Success",
                schedule: [
                    { time: "05:00 - 07:00", task: "Deep Concept Learning", sub: "Physics", priority: "CRITICAL" },
                    { time: "07:00 - 08:30", task: "Board Formula Mastery", sub: "Math", priority: "HIGH" },
                    { time: "16:00 - 18:00", task: "Tuition Sync Buffer", sub: "General", priority: "NORMAL" },
                    { time: "20:00 - 22:00", task: "Tapasya Revision Session", sub: "Chemistry", priority: "CRITICAL" },
                ]
            });
            setIsGenerating(false);
        }, 2000);
    };

    return (
        <div className="max-w-6xl mx-auto px-6 py-20">
            {!plan ? (
                <Card variant="dark" className="max-w-2xl mx-auto !p-12 border-slate-800">
                    <div className="text-center mb-12">
                        <CalendarDaysIcon className="w-16 h-16 mx-auto text-pink-500 mb-6" />
                        <h1 className="text-4xl font-black text-white uppercase tracking-tighter">War Plan Protocol</h1>
                        <p className="text-slate-500 uppercase tracking-widest text-[10px] mt-2">Constraint-Based Scheduling Engine</p>
                    </div>

                    <div className="space-y-8">
                        <div>
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 block">Primary Goal</label>
                            <input value={goal} onChange={e => setGoal(e.target.value)} placeholder="e.g. 95% in Class 12 Chemistry Finals" className="w-full bg-slate-950 border border-slate-800 p-5 rounded-2xl text-white outline-none focus:ring-2 focus:ring-pink-500 transition-all"/>
                        </div>
                        <div>
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 block">Tuition & School Constraints</label>
                            <input value={tuitionTimes} onChange={e => setTuitionTimes(e.target.value)} placeholder="e.g. School 8-2, Math Tuition 4-6" className="w-full bg-slate-950 border border-slate-800 p-5 rounded-2xl text-white outline-none focus:ring-2 focus:ring-pink-500 transition-all"/>
                        </div>
                        <Button onClick={handleGenerate} disabled={isGenerating} className="w-full h-18 text-xl font-black !bg-pink-600 shadow-[0_0_40px_rgba(236,72,153,0.3)]">
                            {isGenerating ? <Spinner /> : 'CALCULATE WAR PLAN'}
                        </Button>
                    </div>
                </Card>
            ) : (
                <div className="space-y-12">
                    <div className="text-center">
                        <h2 className="text-6xl font-black text-white tracking-tighter uppercase mb-2">{plan.title}</h2>
                        <div className="inline-block px-4 py-1 bg-pink-500/10 border border-pink-500/20 text-pink-500 text-[10px] font-black uppercase rounded-full tracking-widest">Optimized for Max Recall</div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        {(plan.schedule || []).map((item: any, i: number) => (
                            <Card key={i} variant="glass" className="!p-8 border-white/5 hover:border-pink-500/30 transition-all group">
                                <div className="flex justify-between items-start mb-6">
                                    <div className="w-10 h-10 rounded-xl bg-slate-950 border border-white/10 flex items-center justify-center group-hover:scale-110 transition-transform"><ClockIcon className="w-5 h-5 text-pink-400"/></div>
                                    <span className={`text-[8px] font-black px-2 py-0.5 rounded border ${item.priority === 'CRITICAL' ? 'bg-red-500/20 border-red-500/40 text-red-400' : 'bg-white/5 border-white/10 text-slate-500'} tracking-[0.2em]`}>{item.priority}</span>
                                </div>
                                <p className="text-xs font-black text-slate-500 uppercase tracking-widest mb-1">{item.time}</p>
                                <p className="text-2xl font-black text-white mb-4 leading-none uppercase">{item.task}</p>
                                <div className="flex items-center gap-2 text-pink-400 text-[10px] font-black uppercase tracking-widest">
                                    <AcademicCapIcon className="w-4 h-4"/> {item.sub} Module
                                </div>
                            </Card>
                        ))}
                    </div>
                    <div className="text-center"><Button onClick={() => setPlan(null)} variant="outline">Reset Protocol</Button></div>
                </div>
            )}
        </div>
    );
};

export default StudyPlannerPage;
