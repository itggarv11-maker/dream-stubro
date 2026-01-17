
import React from 'react';
import { Link } from 'react-router-dom';
import { motion, useScroll, useTransform } from 'framer-motion';
import Button from '../components/common/Button';
import Card from '../components/common/Card';
import { 
    SparklesIcon, RocketLaunchIcon, BoltIcon, StarIcon,
    UsersIcon, BeakerIcon, BrainCircuitIcon, VideoCameraIcon,
    ScaleIcon, DocumentDuplicateIcon
} from '../components/icons';
import { useTheme } from '../contexts/ThemeContext';

const HomePage: React.FC = () => {
    const { scrollY } = useScroll();
    const heroY = useTransform(scrollY, [0, 500], [0, 150]);
    const { theme } = useTheme();

    return (
        <div className="relative min-h-screen overflow-x-hidden">
            {/* Ambient Background */}
            <div className="fixed inset-0 z-0 pointer-events-none">
                <div className={`absolute top-0 left-1/2 -translate-x-1/2 w-[1400px] h-[800px] rounded-full blur-[160px] opacity-40 transition-colors duration-1000 ${theme === 'dark' ? 'bg-violet-600/10' : 'bg-amber-400/10'}`}></div>
                <div className={`absolute bottom-0 right-0 w-[1000px] h-[1000px] rounded-full blur-[200px] opacity-30 transition-colors duration-1000 ${theme === 'dark' ? 'bg-cyan-500/5' : 'bg-orange-300/5'}`}></div>
            </div>

            {/* HERO: OMEGA ELITE */}
            <section className="relative z-10 pt-48 pb-32 px-6 max-w-7xl mx-auto flex flex-col items-center text-center">
                <motion.div style={{ y: heroY }} className="space-y-16">
                    <div className="inline-flex items-center gap-3 px-8 py-3 rounded-full bg-white/5 border border-white/10 backdrop-blur-2xl shadow-2xl">
                        <StarIcon className="w-5 h-5 text-amber-500 animate-pulse" />
                        <span className="text-[11px] font-black uppercase tracking-[0.5em] text-slate-400">Omega Intelligence Core v10.0</span>
                    </div>

                    <h1 className="text-7xl md:text-[13rem] font-black tracking-tightest leading-[0.75] uppercase italic drop-shadow-[0_20px_100px_rgba(0,0,0,0.5)]">
                        <span className="block mb-4">STOP <span className="text-transparent bg-clip-text bg-gradient-to-r from-white to-slate-500">STUDYING.</span></span>
                        <span className="legendary-gradient block">START MASTERING.</span>
                    </h1>

                    <p className="text-slate-400 text-2xl md:text-4xl max-w-5xl mx-auto font-medium leading-relaxed italic">
                        The ultimate AI study engine for India. <br className="hidden md:block" /> 
                        Built to turn complex chapters into <span className="text-white border-b-4 border-amber-500">Neural Muscle Memory.</span>
                    </p>

                    <div className="flex flex-col sm:flex-row items-center justify-center gap-10 pt-12">
                        <Link to="/app">
                            <Button size="lg" className="w-96 h-28 !text-3xl !font-black !rounded-full !bg-white !text-black shadow-[0_30px_100px_rgba(255,255,255,0.2)] hover:scale-110 transition-all italic group">
                                ENTER ARENA &rarr;
                            </Button>
                        </Link>
                        <Link to="/premium">
                            <Button variant="outline" className="w-96 h-28 !text-2xl !font-black !rounded-full border-amber-500/20 hover:!bg-amber-500/10 italic text-amber-500">
                                GO PREMIUM
                            </Button>
                        </Link>
                    </div>
                </motion.div>
            </section>

            {/* THE WORLD STANDARD */}
            <section className="relative z-10 py-60 px-6 max-w-7xl mx-auto">
                <div className="grid lg:grid-cols-2 gap-32 items-center">
                    <div className="space-y-12">
                        <h2 className="text-amber-500 font-black uppercase tracking-[1em] text-xs italic">Astra Cross-Level Engine</h2>
                        <p className="text-6xl md:text-9xl font-black italic tracking-tighter uppercase leading-none">THE END OF <br/><span className="text-cyan-400">FAIR PLAY.</span></p>
                        <p className="text-slate-500 text-2xl font-medium leading-relaxed italic">
                            A Class 6 student in Hindi vs a Class 12 student in Chemistry. Our AI normalizes every question into a unified <span className="text-white">Skill Score</span>. Challenge anyone, anywhere.
                        </p>
                    </div>
                    <div className="relative group">
                        <div className="absolute inset-0 bg-amber-500/20 blur-[120px] rounded-full group-hover:opacity-100 opacity-50 transition-opacity"></div>
                        <Card variant="dark" className="!p-16 border-white/5 !rounded-[5rem] shadow-2xl relative overflow-hidden">
                             <div className="space-y-10">
                                <LeaderboardRow name="Arjun (Cl. 6)" topic="SST" score="98.2" color="bg-cyan-500" />
                                <LeaderboardRow name="Mehak (Cl. 10)" topic="Science" score="96.5" color="bg-violet-600" />
                                <LeaderboardRow name="Rahul (Cl. 12)" topic="Phy" score="94.1" color="bg-amber-500" />
                             </div>
                             <p className="text-center text-[10px] font-black text-slate-600 uppercase tracking-widest mt-12 animate-pulse">Neural Normalization Active</p>
                        </Card>
                    </div>
                </div>
            </section>

            {/* THE ARSENAL */}
            <section className="relative z-10 py-40 px-6 max-w-[1800px] mx-auto">
                <div className="text-center mb-32 space-y-4">
                    <h2 className="text-violet-500 font-black uppercase tracking-[1em] text-[10px] italic">Strategic Tactical Units</h2>
                    <p className="text-6xl md:text-[10rem] font-black italic tracking-tightest uppercase leading-none">THE STUBRO OMEGA</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10">
                    <ToolCard icon={<DocumentDuplicateIcon/>} title="Summary" desc="Atomic level concept compression." tag="RECALL" />
                    <ToolCard icon={<BrainCircuitIcon/>} title="Recall" desc="Spaced repetition engine." tag="MEMORY" />
                    <ToolCard icon={<UsersIcon/>} title="Arena" desc="Real-time Cross-Level PVP." tag="BATTLE" />
                    <ToolCard icon={<ScaleIcon/>} title="Proofs" desc="110% Error-free math logic." tag="LOGIC" />
                </div>
            </section>

            {/* FINAL CTAs */}
            <section className="relative z-10 py-60 px-6 text-center space-y-20">
                <h2 className="text-6xl md:text-[15rem] font-black italic tracking-tighter uppercase leading-none opacity-10 select-none">LIMITLESS</h2>
                <div className="max-w-4xl mx-auto">
                    <h3 className="text-5xl md:text-9xl font-black italic uppercase tracking-tightest leading-none mb-10">EVERY CLASS.<br/><span className="text-amber-500">EVERY SUBJECT.</span></h3>
                    <Link to="/signup"><Button className="h-32 px-24 !text-4xl !font-black !rounded-full shadow-2xl">LAUNCH ENGINE</Button></Link>
                </div>
            </section>
        </div>
    );
};

const LeaderboardRow = ({ name, topic, score, color }: any) => (
    <div className="flex items-center justify-between p-8 bg-white/5 rounded-3xl border border-white/5 group hover:bg-white/10 transition-all">
        <div className="flex items-center gap-6">
            <div className={`w-12 h-12 ${color} rounded-full flex items-center justify-center font-black text-white`}>{name[0]}</div>
            <div>
                <p className="font-black text-white text-lg">{name}</p>
                <p className="text-[10px] text-slate-500 uppercase font-black">{topic}</p>
            </div>
        </div>
        <p className="text-4xl font-black italic legendary-gradient">{score}</p>
    </div>
);

const ToolCard = ({ icon, title, desc, tag }: any) => (
    <motion.div whileHover={{ y: -20 }} className="group cursor-default">
        <Card variant="dark" className="!p-12 border-white/5 h-full flex flex-col group-hover:border-amber-500/20 transition-all !rounded-[4rem]">
            <div className="flex justify-between items-start mb-16">
                <div className="w-16 h-16 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-white group-hover:bg-amber-500 group-hover:text-black transition-all">{icon}</div>
                <span className="text-[10px] font-black text-slate-600 bg-white/5 px-4 py-1.5 rounded-full tracking-widest group-hover:text-amber-500">{tag}</span>
            </div>
            <h4 className="text-4xl font-black uppercase italic mb-4">{title}</h4>
            <p className="text-slate-500 text-lg font-medium italic leading-relaxed">{desc}</p>
        </Card>
    </motion.div>
);

export default HomePage;
