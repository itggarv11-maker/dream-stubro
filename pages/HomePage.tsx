
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
    
    const heroOpacity = useTransform(scrollY, [0, 300], [1, 0]);
    const heroScale = useTransform(scrollY, [0, 300], [1, 0.9]);

    return (
        <div className="relative min-h-screen bg-[var(--bg-deep)]">
            {/* CINEMATIC HERO */}
            <section className="relative h-screen flex flex-col items-center justify-center overflow-hidden px-6">
                <motion.div style={{ opacity: heroOpacity, scale: heroScale }} className="relative z-10 text-center space-y-12">
                    <div className="inline-flex items-center gap-3 px-6 py-2 rounded-full bg-white/5 border border-white/10 backdrop-blur-3xl">
                        <div className="w-2 h-2 rounded-full bg-cyan-500 animate-ping"></div>
                        <span className="text-[10px] font-black uppercase tracking-[0.5em] text-slate-500">Aethelgard Engine v13.0 Active</span>
                    </div>

                    <h1 className="text-7xl md:text-[14rem] font-black tracking-tightest leading-[0.75] uppercase italic select-none">
                        <span className="block opacity-40">MASTER</span>
                        <span className={theme === 'dark' ? 'cyber-text' : 'legendary-text'}>EVERYTHING.</span>
                    </h1>

                    <p className="text-xl md:text-5xl text-slate-500 max-w-5xl mx-auto font-medium italic leading-none">
                        The ultimate AI weapon for the Indian student. <br/>
                        Built for <span className={theme === 'dark' ? 'text-white' : 'text-slate-950 font-black'}>Top 1% Dominance.</span>
                    </p>

                    <div className="flex flex-col sm:flex-row items-center justify-center gap-10 pt-10">
                        <Link to="/app">
                            <Button className={`w-96 h-28 !text-3xl !font-black !rounded-full italic transition-all hover:scale-110 active:scale-95 ${theme === 'dark' ? 'bg-white text-black shadow-[0_20px_80px_rgba(255,255,255,0.2)]' : 'bg-slate-950 text-white shadow-2xl'}`}>
                                LAUNCH ARENA &rarr;
                            </Button>
                        </Link>
                    </div>
                </motion.div>
                
                {/* AMBIENT BACKGROUND ELEMENTS */}
                <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[1800px] h-[1000px] rounded-full blur-[180px] opacity-20 pointer-events-none transition-all duration-1000 ${theme === 'dark' ? 'bg-violet-600' : 'bg-amber-400'}`}></div>
                <div className="absolute bottom-10 left-1/2 -translate-x-1/2 animate-bounce opacity-20">
                    <div className="w-px h-20 bg-gradient-to-b from-white to-transparent"></div>
                </div>
            </section>

            {/* FEATURES: THE TRIAD OF DOMINANCE */}
            <section className="py-60 px-6 md:px-12 max-w-[1800px] mx-auto">
                <div className="text-center mb-32">
                    <h2 className={`text-[11px] font-black uppercase tracking-[1em] mb-4 ${theme === 'dark' ? 'text-violet-500' : 'text-amber-600'}`}>The Strategic Arsenal</h2>
                    <p className="text-6xl md:text-[10rem] font-black italic tracking-tightest uppercase leading-none">GOD-LEVEL TOOLS.</p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
                    <ArenaCard 
                        title="Brahmastra" 
                        sub="THE LOGIC SOLVER" 
                        desc="Perfect geometric proofs and calculus solutions with zero room for error."
                        icon={<ScaleIcon/>}
                        color="from-cyan-500/20 to-blue-500/0"
                        accent="text-cyan-400"
                    />
                    <ArenaCard 
                        title="Gameverse" 
                        sub="3D IMMERSION" 
                        desc="Play your curriculum as a high-fidelity 3D mission. Knowledge is your XP."
                        icon={<BrainCircuitIcon/>}
                        color="from-violet-500/20 to-fuchsia-500/0"
                        accent="text-violet-400"
                    />
                    <ArenaCard 
                        title="Dossier" 
                        sub="PREDICTIVE PREP" 
                        desc="AI predicts Board-level questions before they appear. Stay 3 steps ahead."
                        icon={<CheckBadgeIcon/>}
                        color="from-emerald-500/20 to-teal-500/0"
                        accent="text-emerald-400"
                    />
                </div>
            </section>

            {/* THE ASTRA SHOWCASE: CAREER & PLANNING */}
            <section className="py-60 px-6 bg-white/[0.01] border-y border-white/5 relative overflow-hidden">
                <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-32 items-center">
                    <div className="space-y-12">
                        <h3 className={`text-[10px] font-black uppercase tracking-[1em] ${theme === 'dark' ? 'text-pink-500' : 'text-amber-500'}`}>Astra Protocol: Visionary</h3>
                        <p className="text-6xl md:text-9xl font-black italic uppercase leading-none tracking-tightest">DIVINE YOUR <br/> <span className={theme === 'dark' ? 'text-white' : 'text-slate-900'}>FUTURE.</span></p>
                        <p className="text-slate-500 text-2xl font-medium leading-relaxed italic">
                            Our Career and Study planners aren't just lists. They are <span className="text-white">Neural Pathfinders</span> that adapt to your financial, intellectual, and temporal reality.
                        </p>
                        <div className="flex gap-6">
                            <Link to="/app"><Button variant="outline" className="h-20 px-12 !font-black !rounded-full">SEE ROADMAPS</Button></Link>
                        </div>
                    </div>
                    <div className="relative group">
                         <div className={`absolute inset-0 blur-[120px] opacity-30 group-hover:opacity-50 transition-all ${theme === 'dark' ? 'bg-pink-600' : 'bg-amber-400'}`}></div>
                         <Card variant="dark" className="!p-16 !rounded-[5rem] border-white/10 relative shadow-2xl overflow-hidden">
                             <div className="space-y-10">
                                 <div className="h-2 w-1/2 bg-white/10 rounded-full"></div>
                                 <div className="flex items-center gap-6">
                                     <div className="w-16 h-16 rounded-2xl bg-pink-600 shadow-[0_0_30px_rgba(236,72,153,0.4)]"></div>
                                     <div className="space-y-2">
                                         <div className="h-4 w-48 bg-white/20 rounded-full"></div>
                                         <div className="h-3 w-32 bg-white/10 rounded-full"></div>
                                     </div>
                                 </div>
                                 <div className="grid grid-cols-3 gap-4">
                                     <div className="h-20 rounded-3xl bg-white/5 border border-white/5"></div>
                                     <div className="h-20 rounded-3xl bg-white/5 border border-white/5"></div>
                                     <div className="h-20 rounded-3xl bg-white/5 border border-white/5"></div>
                                 </div>
                             </div>
                         </Card>
                    </div>
                </div>
            </section>

            {/* BEYOND PARITY */}
            <section className="py-60 px-6 text-center space-y-20">
                <h2 className="text-8xl md:text-[18rem] font-black italic tracking-tighter uppercase leading-[0.7] opacity-5 select-none">UNBEATABLE</h2>
                <div className="max-w-5xl mx-auto -mt-20 md:-mt-40">
                    <p className="text-5xl md:text-9xl font-black italic uppercase leading-none mb-16">JOIN THE <span className={theme === 'dark' ? 'cyber-text' : 'legendary-text'}>ELITE.</span></p>
                    <Link to="/signup">
                        <Button size="lg" className="h-32 px-24 !text-4xl !font-black !rounded-full shadow-2xl hover:scale-110 transition-all italic">
                            CLAIM IDENTITY
                        </Button>
                    </Link>
                </div>
            </section>
        </div>
    );
};

const ArenaCard = ({ title, sub, desc, icon, color, accent }: any) => (
    <motion.div whileHover={{ y: -20 }} className="group">
        <Card variant="dark" className={`!p-16 !rounded-[5rem] border-white/5 bg-gradient-to-br ${color} h-full relative overflow-hidden transition-all duration-500 group-hover:border-white/10 shadow-2xl`}>
            <div className="absolute top-0 right-0 p-10 opacity-[0.02] group-hover:opacity-[0.08] transition-opacity">{icon}</div>
            <div className="flex flex-col h-full">
                <div className="w-20 h-20 rounded-3xl bg-black/60 border border-white/10 flex items-center justify-center text-white mb-16 group-hover:scale-110 transition-transform shadow-2xl">{icon}</div>
                <h3 className={`text-[10px] font-black uppercase tracking-[0.6em] mb-4 ${accent}`}>{sub}</h3>
                <h4 className="text-5xl font-black uppercase italic mb-8 text-white">{title}</h4>
                <p className="text-slate-500 text-xl font-medium italic leading-relaxed">{desc}</p>
                <div className="mt-auto pt-16 flex items-center gap-3 text-white/20 group-hover:text-white transition-colors text-[11px] font-black uppercase tracking-widest italic">
                    Explore Module &rarr;
                </div>
            </div>
        </Card>
    </motion.div>
);

export default HomePage;
