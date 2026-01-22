
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
            {/* HERO SECTION - Optimized for mobile scaling */}
            <section className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden px-6 pt-20">
                <motion.div style={{ opacity: heroOpacity, scale: heroScale }} className="relative z-10 text-center space-y-8 md:space-y-12 w-full max-w-6xl">
                    <div className="inline-flex items-center gap-3 px-5 py-2 rounded-full bg-white/5 border border-white/10 backdrop-blur-3xl mx-auto">
                        <div className="w-1.5 h-1.5 rounded-full bg-cyan-500 animate-ping"></div>
                        <span className="text-[9px] font-black uppercase tracking-[0.4em] text-slate-500">Aethelgard Nexus v17.0</span>
                    </div>

                    <h1 className="text-[clamp(2.8rem,12vw,12rem)] font-black tracking-tightest leading-[0.85] uppercase italic select-none">
                        <span className="block opacity-30">MASTER</span>
                        <span className={theme === 'dark' ? 'cyber-text' : 'legendary-text'}>EVERYTHING.</span>
                    </h1>

                    <p className="text-base md:text-4xl text-slate-500 max-w-4xl mx-auto font-medium italic leading-tight px-2">
                        Precision AI for the Indian Elite. <br className="hidden md:block"/>
                        Engineered for <span className={theme === 'dark' ? 'text-white' : 'text-slate-950 font-black'}>Top Tier Dominance.</span>
                    </p>

                    <div className="flex flex-col sm:flex-row items-center justify-center gap-6 pt-6 md:pt-10">
                        <Link to="/app" className="w-full sm:w-auto">
                            <Button className={`w-full sm:w-80 h-20 md:h-24 !text-xl md:!text-2xl !font-black !rounded-full italic shadow-2xl transition-all hover:scale-105 ${theme === 'dark' ? 'bg-white text-black' : 'bg-slate-950 text-white'}`}>
                                LAUNCH HQ &rarr;
                            </Button>
                        </Link>
                    </div>
                </motion.div>
                
                <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[180vw] h-[100vh] rounded-full blur-[150px] opacity-15 pointer-events-none ${theme === 'dark' ? 'bg-violet-600' : 'bg-amber-400'}`}></div>
            </section>

            {/* STRATEGIC TOOLS */}
            <section className="py-20 md:py-40 px-6 max-w-7xl mx-auto">
                <div className="text-center mb-16 md:mb-24">
                    <h2 className="text-[10px] font-black uppercase tracking-[0.8em] mb-4 text-violet-500 italic">Strategic Core</h2>
                    <p className="text-4xl md:text-8xl font-black italic tracking-tightest uppercase leading-none">THE ARSENAL.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-10">
                    <FeatureCard title="Logic Core" sub="BRAHMASTRA" desc="Calculus and geometric precision with zero logical friction." icon={<ScaleIcon/>} color="from-cyan-500/10" accent="text-cyan-400" />
                    <FeatureCard title="Gameverse" sub="3D MISSIONS" desc="Convert chapters into playable missions. Knowledge is your XP." icon={<BrainCircuitIcon/>} color="from-violet-500/10" accent="text-violet-400" />
                    <FeatureCard title="The Arena" sub="BATTLE NODES" desc="Synchronized logic battles with global matchmaking." icon={<UsersIcon/>} color="from-pink-500/10" accent="text-pink-400" />
                </div>
            </section>
        </div>
    );
};

const FeatureCard = ({ title, sub, desc, icon, color, accent }: any) => (
    <motion.div whileHover={{ y: -8 }}>
        <Card variant="dark" className={`!p-10 md:!p-12 !rounded-[3rem] bg-gradient-to-br ${color} to-transparent border-white/5 relative overflow-hidden h-full`}>
            <div className="w-14 h-14 md:w-16 md:h-16 rounded-2xl bg-black/60 border border-white/10 flex items-center justify-center text-white mb-10 shadow-2xl">{icon}</div>
            <h3 className={`text-[9px] font-black uppercase tracking-widest mb-2 ${accent}`}>{sub}</h3>
            <h4 className="text-3xl md:text-4xl font-black uppercase italic mb-4 text-white leading-none">{title}</h4>
            <p className="text-slate-500 text-base md:text-lg font-medium italic leading-relaxed">{desc}</p>
        </Card>
    </motion.div>
);

export default HomePage;
