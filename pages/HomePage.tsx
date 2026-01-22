
import React from 'react';
import { Link } from 'react-router-dom';
import { motion, useScroll, useTransform, useSpring } from 'framer-motion';
import Button from '../components/common/Button';
import Card from '../components/common/Card';
import { 
    UsersIcon, BrainCircuitIcon, ScaleIcon, SparklesIcon, RocketLaunchIcon, BoltIcon, CheckBadgeIcon
} from '../components/icons';
import { useTheme } from '../contexts/ThemeContext';

const HomePage: React.FC = () => {
    const { theme } = useTheme();
    const { scrollYProgress } = useScroll();
    const scale = useTransform(scrollYProgress, [0, 0.2], [1, 0.8]);
    const rotate = useTransform(scrollYProgress, [0, 0.2], [0, -5]);
    const opacity = useTransform(scrollYProgress, [0, 0.15], [1, 0]);
    
    const springScale = useSpring(scale, { stiffness: 100, damping: 30 });

    return (
        <div className="relative min-h-screen bg-[#010204] overflow-x-hidden">
            {/* MEGA-HERO SECTION */}
            <section className="relative min-h-screen flex flex-col items-center justify-center px-6 md:px-12 pt-20 overflow-hidden">
                <motion.div 
                    style={{ scale: springScale, rotate, opacity }}
                    className="relative z-10 text-center space-y-8 w-full max-w-7xl mx-auto"
                >
                    <motion.div 
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="inline-flex items-center gap-3 px-6 py-2 rounded-full bg-white/5 border border-white/10 backdrop-blur-3xl mx-auto shadow-2xl"
                    >
                        <div className="w-2 h-2 rounded-full bg-violet-500 animate-pulse"></div>
                        <span className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-400">The Future of Indian Education is Here</span>
                    </motion.div>

                    <motion.h1 
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.8, ease: "easeOut" }}
                        className="text-6xl sm:text-8xl md:text-[10rem] lg:text-[13rem] font-black tracking-tighter leading-[0.85] uppercase italic select-none break-words"
                    >
                        <span className="block opacity-10">STUDY</span>
                        <span className={theme === 'dark' ? 'cyber-text' : 'legendary-text'}>SMARTER.</span>
                    </motion.h1>

                    <motion.p 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.4 }}
                        className="text-lg sm:text-xl md:text-3xl text-slate-400 max-w-5xl mx-auto font-medium italic leading-tight px-4 text-balance"
                    >
                        Elite AI logic for Class 6-12 students. <br className="hidden md:block"/>
                        Engineered for <span className={theme === 'dark' ? 'text-white' : 'text-slate-900 font-bold'}>100% Exam Clarity.</span>
                    </motion.p>

                    <motion.div 
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.6 }}
                        className="flex flex-col sm:flex-row items-center justify-center gap-6 pt-12"
                    >
                        <Link to="/app" className="w-full sm:w-auto">
                            <Button className={`w-full sm:w-80 h-20 md:h-24 !text-xl md:!text-2xl !font-black !rounded-full italic shadow-[0_0_50px_rgba(139,92,246,0.3)] transition-all hover:scale-105 active:scale-95 ${theme === 'dark' ? 'bg-white text-black' : 'bg-slate-900 text-white'}`}>
                                GET STARTED FREE &rarr;
                            </Button>
                        </Link>
                        <Link to="/premium" className="w-full sm:w-auto">
                             <Button variant="outline" className="w-full sm:w-80 h-20 md:h-24 !text-xl md:!text-2xl !font-black !rounded-full italic border-white/10 hover:bg-white/5">
                                VIEW PREMIUM
                            </Button>
                        </Link>
                    </motion.div>
                </motion.div>
                
                {/* AMBIENT BACKGROUND GLOW */}
                <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[150vw] h-[150vh] rounded-full blur-[150px] opacity-[0.1] pointer-events-none transition-all duration-1000 ${theme === 'dark' ? 'bg-violet-600' : 'bg-amber-400'}`}></div>
                
                {/* DECORATIVE ELEMENTS */}
                <div className="absolute bottom-10 left-1/2 -translate-x-1/2 animate-bounce opacity-20">
                    <div className="w-6 h-10 border-2 border-white rounded-full flex justify-center p-1">
                        <div className="w-1 h-2 bg-white rounded-full"></div>
                    </div>
                </div>
            </section>

            {/* BENTO TOOLS GRID */}
            <section className="py-32 md:py-56 px-6 max-w-[1400px] mx-auto">
                <div className="text-center mb-24 md:mb-40">
                    <h2 className="text-xs font-black uppercase tracking-[1em] mb-6 text-violet-500 italic">Advanced Academic Tools</h2>
                    <p className="text-5xl sm:text-7xl md:text-9xl font-black italic tracking-tighter uppercase leading-none">EVERYTHING YOU NEED.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-12 gap-6 md:gap-8">
                    <div className="md:col-span-8">
                        <FeatureNode 
                            title="Math & Logic Solver" 
                            sub="BRAHMASTRA" 
                            desc="Solve complex calculus, algebra, and geometry problems instantly with step-by-step reasoning." 
                            icon={<ScaleIcon/>} 
                            color="from-cyan-500/20" 
                            accent="text-cyan-400" 
                        />
                    </div>
                    <div className="md:col-span-4">
                        <FeatureNode 
                            title="3D Learning World" 
                            sub="GAMEVERSE" 
                            desc="Interact with your syllabus in an immersive 3D simulation environment." 
                            icon={<BrainCircuitIcon/>} 
                            color="from-violet-500/20" 
                            accent="text-violet-400" 
                        />
                    </div>
                    <div className="md:col-span-4">
                        <FeatureNode 
                            title="Group Quiz" 
                            sub="ARENA" 
                            desc="Challenge your friends in real-time logic battles and climb the global leaderboard." 
                            icon={<UsersIcon/>} 
                            color="from-pink-500/20" 
                            accent="text-pink-400" 
                        />
                    </div>
                    <div className="md:col-span-8">
                        <FeatureNode 
                            title="Smart Summaries" 
                            sub="SYNTHESIS" 
                            desc="Turn massive chapters into easy-to-digest visual summaries and core concept maps in seconds." 
                            icon={<SparklesIcon/>} 
                            color="from-amber-500/20" 
                            accent="text-amber-400" 
                        />
                    </div>
                </div>
            </section>

            {/* TRUST & QUALITY SECTION */}
            <section className="py-20 md:py-40 bg-white/5 border-y border-white/5">
                <div className="max-w-7xl mx-auto px-10">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-20">
                        <div className="space-y-6">
                            <RocketLaunchIcon className="w-12 h-12 text-violet-500" />
                            <h3 className="text-3xl font-black italic uppercase">Super Speed</h3>
                            <p className="text-slate-400 leading-relaxed italic">Built on Gemini 3.0 models for near-instant response times and deep academic reasoning.</p>
                        </div>
                        <div className="space-y-6">
                            <BoltIcon className="w-12 h-12 text-cyan-400" />
                            <h3 className="text-3xl font-black italic uppercase">Visual Logic</h3>
                            <p className="text-slate-400 leading-relaxed italic">Every explanation is accompanied by diagrams or 3D visuals to help you memorize faster.</p>
                        </div>
                        <div className="space-y-6">
                            <CheckBadgeIcon className="w-12 h-12 text-emerald-400" />
                            <h3 className="text-3xl font-black italic uppercase">Board Accurate</h3>
                            <p className="text-slate-400 leading-relaxed italic">Our AI is trained specifically on NCERT and state board patterns to ensure exam success.</p>
                        </div>
                    </div>
                </div>
            </section>

            {/* FINAL CTA */}
            <section className="py-40 px-10 text-center relative overflow-hidden">
                <div className="absolute inset-0 bg-violet-600/10 blur-[100px]"></div>
                <div className="relative z-10 space-y-10">
                    <h2 className="text-5xl md:text-8xl font-black italic tracking-tighter uppercase leading-none">READY TO DOMINATE?</h2>
                    <Link to="/signup">
                        <Button size="lg" className="h-28 px-20 !text-3xl !font-black !rounded-full italic bg-violet-600 shadow-[0_0_100px_rgba(139,92,246,0.5)]">
                            JOIN STUBRO AI NOW
                        </Button>
                    </Link>
                </div>
            </section>
        </div>
    );
};

const FeatureNode = ({ title, sub, desc, icon, color, accent }: any) => (
    <motion.div whileHover={{ y: -8 }} className="group h-full">
        <Card variant="dark" className={`p-10 md:p-14 !rounded-[3rem] md:!rounded-[4rem] bg-gradient-to-br ${color} to-transparent border-white/5 relative overflow-hidden h-full flex flex-col shadow-2xl`}>
            <div className="w-16 h-16 md:w-20 md:h-20 rounded-3xl bg-black/60 border border-white/10 flex items-center justify-center text-white mb-12 group-hover:scale-110 transition-transform shadow-inner">
                {icon}
            </div>
            <h3 className={`text-[10px] font-black uppercase tracking-[0.4em] mb-4 ${accent}`}>{sub}</h3>
            <h4 className="text-4xl md:text-5xl font-black uppercase italic mb-8 text-white leading-[0.9] tracking-tighter">{title}</h4>
            <p className="text-slate-400 text-lg md:text-xl font-medium italic leading-relaxed text-balance opacity-80 group-hover:opacity-100 transition-opacity">{desc}</p>
            <div className="mt-auto pt-16 flex items-center gap-4 text-white/20 group-hover:text-violet-400 transition-colors text-[10px] font-black uppercase tracking-widest italic">
                Launch Module &rarr;
            </div>
        </Card>
    </motion.div>
);

export default HomePage;
