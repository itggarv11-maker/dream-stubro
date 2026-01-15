import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, useScroll, useTransform } from 'framer-motion';
import Button from '../components/common/Button';
import { useAuth } from '../contexts/AuthContext';
import { 
    CheckBadgeIcon, SparklesIcon, ScaleIcon, RocketLaunchIcon, CalendarDaysIcon
} from '../components/icons';
import Spinner from '../components/common/Spinner';

const HomePage: React.FC = () => {
    const navigate = useNavigate();
    const { scrollY } = useScroll();
    
    const words = ["TOPS", "SPEED", "MASTERY"]; 
    const [wordIndex, setWordIndex] = useState(0);
    const [currentText, setCurrentText] = useState("");
    const [isDeleting, setIsDeleting] = useState(false);

    const heroY = useTransform(scrollY, [0, 500], [0, 100]);
    const heroOpacity = useTransform(scrollY, [0, 400], [1, 0]);

    useEffect(() => {
        let timer: number;
        const typingSpeed = isDeleting ? 30 : 60; 
        const targetWord = words[wordIndex];

        if (!isDeleting && currentText === targetWord) {
            timer = window.setTimeout(() => setIsDeleting(true), 2500);
        } else if (isDeleting && currentText === "") {
            setIsDeleting(false);
            setWordIndex((prev) => (prev + 1) % words.length);
        } else {
            timer = window.setTimeout(() => {
                setCurrentText(prev => isDeleting ? prev.substring(0, prev.length - 1) : targetWord.substring(0, prev.length + 1));
            }, typingSpeed);
        }
        return () => clearTimeout(timer);
    }, [currentText, isDeleting, wordIndex]);

    return (
        <div className="relative min-h-screen bg-[#010208] text-white selection:bg-cyan-500/30 overflow-x-hidden">
            {/* Background Grid */}
            <div className="fixed inset-0 z-0 pointer-events-none">
                <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff03_1px,transparent_1px),linear-gradient(to_bottom,#ffffff03_1px,transparent_1px)] bg-[size:40px_40px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)]"></div>
            </div>

            <header className="relative z-10 pt-32 pb-20 px-6 text-center lg:min-h-[90vh] flex flex-col justify-center items-center">
                <motion.div style={{ y: heroY, opacity: heroOpacity }} className="max-w-7xl">
                    <div className="flex flex-col items-center gap-6 mb-12">
                        <motion.div 
                            initial={{ opacity: 0, scale: 0.9 }} 
                            animate={{ opacity: 1, scale: 1 }} 
                            className="inline-flex items-center gap-3 bg-white/5 border border-white/10 rounded-full px-6 py-2 backdrop-blur-xl shadow-2xl"
                        >
                            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse"></span>
                            <span className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-300">Astra Engine v8.5 Active</span>
                        </motion.div>

                        <div className="flex items-center gap-8 md:gap-12 text-slate-500 font-black text-[10px] uppercase tracking-[0.3em] opacity-50">
                            <span className="flex items-center gap-2"><CheckBadgeIcon className="w-4 h-4 text-emerald-500"/> NCERT Verified</span>
                            <div className="w-1.5 h-1.5 bg-slate-800 rounded-full"></div>
                            <span className="flex items-center gap-2"><SparklesIcon className="w-4 h-4 text-amber-500"/> Board 2025 Optimized</span>
                        </div>
                    </div>

                    <h1 className="text-5xl sm:text-7xl md:text-8xl lg:text-9xl font-black tracking-tightest leading-[0.9] mb-12 uppercase drop-shadow-2xl">
                        STUDY AT THE <br/>
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-white via-slate-200 to-white/20">SPEED OF </span>
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-violet-500 to-fuchsia-600 italic drop-shadow-[0_0_30px_rgba(139,92,246,0.3)]">
                            {currentText}<span className="animate-pulse">_</span>
                        </span>
                    </h1>

                    <p className="text-slate-400 text-lg md:text-xl lg:text-2xl max-w-3xl mx-auto mb-16 font-medium leading-relaxed tracking-tight px-10">
                        The elite <span className="text-white">study infrastructure</span> used by India's top 1%. Transform notes into mastery with precision AI logic.
                    </p>

                    <div className="flex flex-col sm:flex-row items-center justify-center gap-6 md:gap-8">
                        <Link to="/app">
                            <Button size="lg" className="w-64 md:w-80 h-20 md:h-24 !text-xl md:!text-3xl !font-black uppercase tracking-tighter bg-white !text-slate-950 shadow-[0_40px_100px_rgba(255,255,255,0.15)] hover:scale-[1.03] transition-all !rounded-[2.5rem] italic">
                                INITIALIZE →
                            </Button>
                        </Link>
                        <Link to="/app" className="w-64 md:w-80 h-20 md:h-24 glass-card border-white/10 rounded-[2.5rem] flex items-center justify-center gap-6 hover:bg-white/5 transition-all group">
                            <span className="text-xl md:text-2xl font-black uppercase tracking-widest text-slate-500 group-hover:text-white transition-colors italic">OPEN HQ</span>
                        </Link>
                    </div>
                </motion.div>
            </header>

            <section className="relative z-10 py-20 bg-[#05070f] border-y border-white/5 backdrop-blur-3xl overflow-hidden">
                <div className="container mx-auto px-10 grid grid-cols-2 lg:grid-cols-4 gap-12 text-center">
                    <StatBox value="101%" label="Accuracy Rate" color="text-cyan-400" />
                    <StatBox value="0.18s" label="Response Speed" color="text-violet-400" />
                    <StatBox value="850K+" label="Problems Solved" color="text-pink-400" />
                    <StatBox value="Top 1%" label="User Results" color="text-emerald-400" />
                </div>
            </section>

            <section className="relative z-10 px-6 md:px-20 py-32 bg-[#010208]">
                <div className="max-w-7xl mx-auto">
                    <div className="flex flex-col lg:flex-row justify-between items-end mb-24 gap-12">
                        <div className="text-left">
                            <h2 className="text-[11px] font-black text-violet-400 uppercase tracking-[1.5em] mb-6 italic opacity-60">Mastery Suite</h2>
                            <p className="text-6xl md:text-8xl font-black tracking-tightest leading-none uppercase italic">COMMAND HQ</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-12 gap-10">
                        <BentoBox 
                            className="md:col-span-8 md:row-span-2 min-h-[550px]"
                            icon={<ScaleIcon className="w-24 h-24" />}
                            title="Brahmastra"
                            tag="PRECISION CORE"
                            desc="The world's most reliable mathematical logic engine. 101% error-free board solutions."
                            color="bg-amber-500"
                        />
                        <BentoBox 
                            className="md:col-span-4"
                            icon={<RocketLaunchIcon className="w-12 h-12" />}
                            title="Careers"
                            tag="ASTRA ROADMAP"
                            desc="Mapping your journey from grade 10 to world-class professional."
                            color="bg-violet-600"
                        />
                        <BentoBox 
                            className="md:col-span-4"
                            icon={<CalendarDaysIcon className="w-12 h-12" />}
                            title="War Plan"
                            tag="STRATEGY"
                            desc="Study schedules that adapt to your peak mental cycles."
                            color="bg-pink-600"
                        />
                    </div>
                </div>
            </section>
        </div>
    );
};

const StatBox = ({ value, label, color }: any) => (
    <div className="group cursor-default">
        <p className={`text-5xl md:text-8xl font-black tracking-tightest ${color} transition-all duration-700 group-hover:scale-110`}>{value}</p>
        <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.5em] mt-4 italic">{label}</p>
    </div>
);

const BentoBox = ({ className, icon, title, desc, color, tag }: any) => {
    const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
    const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
        const rect = e.currentTarget.getBoundingClientRect();
        setMousePos({ x: e.clientX - rect.left, y: e.clientY - rect.top });
    };

    return (
        <motion.div 
            onMouseMove={handleMouseMove}
            whileHover={{ scale: 1.015, y: -10 }}
            className={`glass-card group overflow-hidden relative border-white/5 cursor-pointer shadow-[0_50px_150px_rgba(0,0,0,0.8)] transition-all duration-[0.6s] ${className} !rounded-[4rem]`}
        >
            <div className="absolute inset-0 z-0 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-1000"
                style={{ background: `radial-gradient(1000px circle at ${mousePos.x}px ${mousePos.y}px, rgba(255,255,255,0.05), transparent 40%)` }}
            />
            <div className="relative z-10 p-12 md:p-16 h-full flex flex-col justify-end">
                <div className="mb-12 flex justify-between items-start">
                    <div className={`w-20 h-20 rounded-[2rem] ${color} bg-opacity-20 flex items-center justify-center text-white border border-white/10 group-hover:scale-110 transition-transform duration-700 shadow-2xl`}>
                        {icon}
                    </div>
                    {tag && (
                        <span className="text-[10px] font-black text-slate-500 bg-white/5 px-6 py-2.5 rounded-full border border-white/10 tracking-[0.4em] uppercase italic">{tag}</span>
                    )}
                </div>
                <h3 className="text-4xl md:text-7xl font-black text-white mb-8 uppercase tracking-tightest group-hover:text-cyan-400 transition-colors leading-[0.8] italic">{title}</h3>
                <p className="text-slate-400 text-xl md:text-2xl leading-relaxed font-medium group-hover:text-slate-200 transition-colors max-w-md">{desc}</p>
            </div>
        </motion.div>
    );
};

export default HomePage;