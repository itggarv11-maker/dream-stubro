
import React from 'react';
import { Link } from 'react-router-dom';
import { motion, useScroll, useTransform } from 'framer-motion';
import Button from '../components/common/Button';
import Card from '../components/common/Card';
import { 
    UsersIcon, BrainCircuitIcon, ScaleIcon, CheckBadgeIcon
} from '../components/icons';
import { useTheme } from '../contexts/ThemeContext';

const HomePage: React.FC = () => {
    const { theme } = useTheme();
    const { scrollY } = useScroll();
    
    const heroOpacity = useTransform(scrollY, [0, 400], [1, 0]);
    const heroScale = useTransform(scrollY, [0, 400], [1, 0.95]);

    return (
        <div className="relative min-h-screen bg-[#010204]">
            {/* HERO SECTION - Critical Mobile Fix */}
            <section className="relative min-h-[90vh] flex flex-col items-center justify-center overflow-hidden px-4 md:px-10 pt-16">
                <motion.div style={{ opacity: heroOpacity, scale: heroScale }} className="relative z-10 text-center space-y-6 md:space-y-12 w-full max-w-6xl">
                    <div className="inline-flex items-center gap-2 md:gap-3 px-4 py-1.5 rounded-full bg-white/5 border border-white/10 backdrop-blur-3xl mx-auto">
                        <div className="w-1.5 h-1.5 rounded-full bg-cyan-500 animate-ping"></div>
                        <span className="text-[8px] md:text-[10px] font-black uppercase tracking-[0.3em] text-slate-500">Aethelgard Flux v18.0</span>
                    </div>

                    <h1 className="text-4xl sm:text-6xl md:text-[clamp(4rem,12vw,12rem)] font-black tracking-tightest leading-[0.9] uppercase italic select-none break-words text-balance">
                        <span className="block opacity-30">MASTER</span>
                        <span className={theme === 'dark' ? 'cyber-text' : 'legendary-text'}>EVERYTHING.</span>
                    </h1>

                    <p className="text-sm md:text-3xl text-slate-500 max-w-3xl mx-auto font-medium italic leading-relaxed px-4 text-balance">
                        The definitive AI toolkit for the Indian student elite. <br className="hidden md:block"/>
                        Built for <span className={theme === 'dark' ? 'text-white' : 'text-slate-950 font-black'}>Apex Performance.</span>
                    </p>

                    <div className="flex flex-col sm:flex-row items-center justify-center gap-4 md:gap-8 pt-4 md:pt-10">
                        <Link to="/app" className="w-full sm:w-auto px-4 md:px-0">
                            <Button className={`w-full sm:w-80 h-16 md:h-24 !text-lg md:!text-2xl !font-black !rounded-full italic shadow-2xl transition-all hover:scale-105 ${theme === 'dark' ? 'bg-white text-black' : 'bg-slate-950 text-white'}`}>
                                LAUNCH ARENA &rarr;
                            </Button>
                        </Link>
                    </div>
                </motion.div>
                
                <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[200vw] md:w-[150vw] h-[100vh] rounded-full blur-[100px] md:blur-[150px] opacity-10 pointer-events-none ${theme === 'dark' ? 'bg-violet-600' : 'bg-amber-400'}`}></div>
            </section>

            {/* STRATEGIC TOOLS */}
            <section className="py-12 md:py-40 px-6 max-w-7xl mx-auto">
                <div className="text-center mb-10 md:mb-24">
                    <h2 className="text-[9px] font-black uppercase tracking-[0.6em] mb-3 text-violet-500 italic">Universal Arsenal</h2>
                    <p className="text-3xl md:text-8xl font-black italic tracking-tightest uppercase leading-none">THE TOOLS.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-10">
                    <FeatureCard title="Logic" sub="BRAHMASTRA" desc="Atomic level calculus and geometric precision with zero friction." icon={<ScaleIcon/>} color="from-cyan-500/10" accent="text-cyan-400" />
                    <FeatureCard title="3D Sim" sub="GAMEVERSE" desc="Experience your curriculum as high-fidelity missions." icon={<BrainCircuitIcon/>} color="from-violet-500/10" accent="text-violet-400" />
                    <FeatureCard title="Arena" sub="LIVE BATTLES" desc="Social combat engine for synchronized curriculum testing." icon={<UsersIcon/>} color="from-pink-500/10" accent="text-pink-400" />
                </div>
            </section>
        </div>
    );
};

const FeatureCard = ({ title, sub, desc, icon, color, accent }: any) => (
    <motion.div whileHover={{ y: -5 }}>
        <Card variant="dark" className={`!p-8 md:!p-12 !rounded-[2.5rem] md:!rounded-[3rem] bg-gradient-to-br ${color} to-transparent border-white/5 relative overflow-hidden h-full`}>
            <div className="w-12 h-12 md:w-16 md:h-16 rounded-xl md:rounded-2xl bg-black/60 border border-white/10 flex items-center justify-center text-white mb-6 md:mb-10 shadow-xl">{icon}</div>
            <h3 className={`text-[8px] md:text-[9px] font-black uppercase tracking-widest mb-2 ${accent}`}>{sub}</h3>
            <h4 className="text-2xl md:text-4xl font-black uppercase italic mb-3 md:mb-4 text-white leading-none">{title}</h4>
            <p className="text-slate-500 text-sm md:text-lg font-medium italic leading-relaxed text-balance">{desc}</p>
        </Card>
    </motion.div>
);

export default HomePage;
