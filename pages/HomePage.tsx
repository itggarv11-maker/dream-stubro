
import React from 'react';
import { Link } from 'react-router-dom';
import { motion, useScroll, useTransform } from 'framer-motion';
import Button from '../components/common/Button';
import Card from '../components/common/Card';
import { 
    SparklesIcon, RocketLaunchIcon, BoltIcon, StarIcon,
    UsersIcon, BeakerIcon, BrainCircuitIcon, VideoCameraIcon,
    ScaleIcon, DocumentDuplicateIcon, CheckBadgeIcon, ShieldCheckIcon
} from '../components/icons';
import { useTheme } from '../contexts/ThemeContext';

const HomePage: React.FC = () => {
    const { theme } = useTheme();
    const { scrollY } = useScroll();
    const textY = useTransform(scrollY, [0, 500], [0, 100]);

    return (
        <div className="relative min-h-screen">
            {/* HERO SECTION */}
            <section className="relative pt-40 pb-20 px-6 md:px-12 flex flex-col items-center overflow-hidden">
                <div className={`absolute top-0 left-1/2 -translate-x-1/2 w-[1600px] h-[800px] rounded-full blur-[180px] opacity-30 transition-all duration-1000 ${theme === 'dark' ? 'bg-violet-600/20' : 'bg-amber-400/20'}`}></div>
                
                <motion.div style={{ y: textY }} className="max-w-7xl mx-auto text-center space-y-12 relative z-10">
                    <div className="inline-flex items-center gap-4 px-6 py-2 rounded-full bg-white/5 border border-white/10 backdrop-blur-xl">
                        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                        <span className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-500">Titan Engine Activated v11.0</span>
                    </div>

                    <h1 className="text-6xl md:text-[11rem] font-black tracking-tightest leading-[0.8] uppercase italic">
                        ONE AI. <span className={theme === 'dark' ? 'text-cyan-400' : 'legendary-text'}>EVERY CLASS.</span><br/>
                        <span className="opacity-40">EVERY SUBJECT.</span>
                    </h1>

                    <p className="text-xl md:text-4xl text-slate-500 max-w-4xl mx-auto font-medium italic leading-relaxed">
                        Don't just study. <span className={theme === 'dark' ? 'text-white' : 'text-slate-900 font-black'}>Dominate your curriculum.</span> <br className="hidden md:block" />
                        The world's first Cross-Level 3D Learning Arena.
                    </p>

                    <div className="flex flex-col sm:flex-row items-center justify-center gap-8 pt-10">
                        <Link to="/app">
                            <Button className={`w-80 h-24 !text-2xl !font-black !rounded-full italic transition-all hover:scale-105 ${theme === 'dark' ? 'bg-white text-black' : 'bg-slate-950 text-white shadow-2xl'}`}>
                                ENTER COMMAND &rarr;
                            </Button>
                        </Link>
                        <Link to="/premium">
                            <Button variant="outline" className={`w-80 h-24 !text-xl !font-black !rounded-full border-2 italic ${theme === 'dark' ? 'border-violet-500/20 text-violet-400 hover:bg-violet-500/10' : 'border-amber-500/30 text-amber-600 hover:bg-amber-500/5'}`}>
                                GO PREMIUM
                            </Button>
                        </Link>
                    </div>
                </motion.div>
            </section>

            {/* COMMAND ARSENAL SECTION */}
            <section className="py-40 px-6 md:px-12 bg-white/[0.02] border-y border-white/5">
                <div className="max-w-7xl mx-auto text-center mb-24">
                    <h2 className={`text-[11px] font-black uppercase tracking-[0.8em] mb-4 ${theme === 'dark' ? 'text-violet-500' : 'text-amber-600'}`}>The Strategic Modules</h2>
                    <p className="text-5xl md:text-8xl font-black italic tracking-tighter uppercase">THE TITAN ARSENAL</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-[1600px] mx-auto">
                    <FeatureCard 
                        icon={<ScaleIcon/>} 
                        title="BRAHMASTRA SOLVER" 
                        desc="Advanced logic engine for geometry, calculus, and step-by-step physics proofs." 
                        tag="101% ACCURACY" 
                        color="border-amber-500/20"
                    />
                    <FeatureCard 
                        icon={<BrainCircuitIcon/>} 
                        title="GAMEVERSE SIM" 
                        desc="Play your chapter as an immersive 3D mission. Progression is tied to knowledge." 
                        tag="3D IMMERSION" 
                        color="border-violet-500/20"
                    />
                    <FeatureCard 
                        icon={<CheckBadgeIcon/>} 
                        title="MOCK PREDICTOR" 
                        desc="AI generates Board-level papers and grades your handwritten answers instantly." 
                        tag="EXAM READY" 
                        color="border-cyan-500/20"
                    />
                </div>
            </section>

            {/* WHY STUBRO SECTION */}
            <section className="py-60 px-6 md:px-12 max-w-7xl mx-auto">
                <div className="grid lg:grid-cols-2 gap-32 items-center">
                    <div className="space-y-10">
                        <h2 className={`text-[10px] font-black uppercase tracking-[1em] italic ${theme === 'dark' ? 'text-cyan-400' : 'text-amber-500'}`}>Protocol: Intelligence Parity</h2>
                        <p className="text-6xl md:text-9xl font-black italic tracking-tightest uppercase leading-none">FAIR. <br/> <span className="opacity-20">UNLIKE REALITY.</span></p>
                        <p className="text-slate-500 text-2xl font-medium italic leading-relaxed">
                            Stubro normalizes difficulty. A Class 6 student can battle a Class 12 senior fairly using our <span className="text-white">Neural Skill Index.</span>
                        </p>
                        <ul className="space-y-6">
                            <li className="flex items-center gap-6 group">
                                <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20"><ShieldCheckIcon className="w-6 h-6 text-emerald-500"/></div>
                                <span className="text-xl font-black italic uppercase text-slate-300">Personalized Difficulty (Not Static)</span>
                            </li>
                            <li className="flex items-center gap-6 group">
                                <div className="p-3 rounded-xl bg-violet-500/10 border border-violet-500/20"><BoltIcon className="w-6 h-6 text-violet-400"/></div>
                                <span className="text-xl font-black italic uppercase text-slate-300">Real-time Competitive Data Sync</span>
                            </li>
                        </ul>
                    </div>
                    <div className="relative">
                        <div className={`absolute inset-0 blur-[100px] opacity-40 transition-all ${theme === 'dark' ? 'bg-violet-600' : 'bg-amber-400'}`}></div>
                        <Card variant="dark" className="!p-16 !rounded-[4rem] border-white/10 relative overflow-hidden shadow-2xl">
                             <div className="space-y-8">
                                <LeaderRow name="Agent Garv (Cl. 10)" val="98.2" sub="Science" color="bg-cyan-500" />
                                <LeaderRow name="User Delta (Cl. 6)" val="97.1" sub="Maths" color="bg-violet-600" />
                                <LeaderRow name="AI Bot Alpha" val="94.5" sub="History" color="bg-slate-700" />
                             </div>
                             <p className="text-center text-[9px] font-black text-slate-600 uppercase tracking-widest mt-12 animate-pulse italic">Skill Normalization: ACTIVE</p>
                        </Card>
                    </div>
                </div>
            </section>

            {/* CTA FINALE */}
            <section className="py-60 px-6 text-center">
                <h3 className="text-7xl md:text-[14rem] font-black italic tracking-tighter uppercase leading-[0.75] opacity-10 select-none">BEYOND STUDY</h3>
                <div className="max-w-4xl mx-auto -mt-10 md:-mt-20">
                    <p className="text-4xl md:text-8xl font-black italic uppercase leading-none mb-12">DOMINATE THE <span className={theme === 'dark' ? 'text-cyan-400' : 'legendary-text'}>SCOREBOARD.</span></p>
                    <Link to="/signup">
                        <Button size="lg" className={`h-32 px-24 !text-4xl !font-black !rounded-full shadow-2xl hover:scale-110 transition-all italic ${theme === 'dark' ? 'bg-white text-black' : 'bg-slate-950 text-white'}`}>
                            SYNC IDENTITY
                        </Button>
                    </Link>
                </div>
            </section>
        </div>
    );
};

const FeatureCard = ({ icon, title, desc, tag, color }: any) => (
    <motion.div whileHover={{ y: -15 }}>
        <Card variant="dark" className={`!p-12 border ${color} !rounded-[4rem] h-full flex flex-col relative overflow-hidden group`}>
            <div className="absolute top-0 right-0 p-8 opacity-[0.03] group-hover:opacity-[0.1] transition-opacity">{icon}</div>
            <div className="flex justify-between items-start mb-16">
                <div className="w-16 h-16 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-white">{icon}</div>
                <span className="text-[10px] font-black text-slate-600 bg-white/5 px-4 py-1.5 rounded-full tracking-widest uppercase">{tag}</span>
            </div>
            <h4 className="text-3xl font-black uppercase italic mb-6">{title}</h4>
            <p className="text-slate-500 text-lg font-medium leading-relaxed italic">{desc}</p>
        </Card>
    </motion.div>
);

const LeaderRow = ({ name, val, sub, color }: any) => (
    <div className="flex items-center justify-between p-8 bg-white/5 rounded-3xl border border-white/5">
        <div className="flex items-center gap-6">
            <div className={`w-12 h-12 ${color} rounded-full flex items-center justify-center font-black text-white`}>{name[0]}</div>
            <div>
                <p className="font-black text-white text-lg">{name}</p>
                <p className="text-[9px] font-black text-slate-600 uppercase">{sub}</p>
            </div>
        </div>
        <p className="text-4xl font-black italic tracking-tighter text-cyan-400">{val}</p>
    </div>
);

export default HomePage;
