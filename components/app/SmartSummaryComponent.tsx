import React from 'react';
import { SmartSummary } from '../../types';
import Card from '../common/Card';
import MathRenderer from '../common/MathRenderer';
import { LightBulbIcon, BookOpenIcon, SparklesIcon, HeartIcon } from '../icons';
import { motion } from 'framer-motion';

interface SmartSummaryComponentProps {
    summary: SmartSummary;
}

const SmartSummaryComponent: React.FC<SmartSummaryComponentProps> = ({ summary }) => {
    // Stage 1: Critical Null Check
    if (!summary) return null;

    // Stage 2: Neural Normalization
    // Heals broken data structures from AI before rendering
    const safeSummary = {
        title: summary.title || "Study Synthesis",
        coreConcepts: Array.isArray(summary.coreConcepts) ? summary.coreConcepts : [],
        examSpotlight: Array.isArray(summary.examSpotlight) ? summary.examSpotlight : [],
        stuBroTip: summary.stuBroTip || "Logic synthesis complete. Focus on high-recall nodes.",
        visualAnalogy: (typeof summary.visualAnalogy === 'object' && summary.visualAnalogy !== null) 
            ? { 
                analogy: summary.visualAnalogy.analogy || "No analogy mapped.", 
                explanation: summary.visualAnalogy.explanation || "" 
              }
            : { 
                analogy: typeof summary.visualAnalogy === 'string' ? summary.visualAnalogy : "Concept visualized.",
                explanation: "" 
              }
    };

    return (
        <div className="w-full space-y-12 pb-20">
            {/* Header Synthesis */}
            <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-center"
            >
                <h1 className="text-4xl md:text-6xl font-black text-white tracking-tighter uppercase leading-tight">
                    {safeSummary.title}
                </h1>
                <p className="text-slate-500 font-mono-tech mt-4 tracking-[0.4em] uppercase text-xs">
                    NEURAL KNOWLEDGE SYNTHESIS COMPLETE
                </p>
            </motion.div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Concepts Core */}
                <motion.div 
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.1 }}
                    className="lg:col-span-2 space-y-8"
                >
                    <div className="flex items-center gap-4 mb-6">
                        <div className="p-3 bg-violet-600 rounded-xl">
                            <BookOpenIcon className="w-6 h-6 text-white"/>
                        </div>
                        <h2 className="text-2xl font-black tracking-widest uppercase text-white/80">Neural Core</h2>
                        <div className="h-px flex-grow bg-white/5"></div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {safeSummary.coreConcepts.map((concept, index) => (
                            <Card key={index} variant="glass" className="!p-8 border-l-4 border-l-violet-500 group relative overflow-hidden">
                                <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                                    <LightBulbIcon className="w-12 h-12" />
                                </div>
                                <dt className="font-black text-xl text-white group-hover:text-violet-400 transition-colors uppercase tracking-tight">
                                    <MathRenderer text={concept?.term ?? "Concept Node"} />
                                </dt>
                                <dd className="text-sm text-slate-400 mt-4 leading-relaxed font-medium">
                                    <MathRenderer text={concept?.definition ?? "Definition awaiting parameters."} />
                                </dd>
                            </Card>
                        ))}
                    </div>
                </motion.div>

                {/* Exam Target & Analogy */}
                <motion.div 
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.2 }}
                    className="space-y-8"
                >
                    <div className="flex items-center gap-4 mb-6">
                        <div className="p-3 bg-pink-600 rounded-xl">
                            <SparklesIcon className="w-6 h-6 text-white"/>
                        </div>
                        <h2 className="text-2xl font-black tracking-widest uppercase text-white/80">Target Nodes</h2>
                    </div>
                    <div className="space-y-4">
                        {safeSummary.examSpotlight.map((point, index) => (
                            <div key={index} className="p-6 rounded-3xl bg-pink-500/5 border border-pink-500/10 relative overflow-hidden group hover:bg-pink-500/10 transition-all">
                                <div className="absolute top-0 left-0 w-1 h-full bg-pink-500 group-hover:w-2 transition-all"></div>
                                <p className="text-sm text-slate-300 font-bold leading-relaxed">
                                    <MathRenderer text={point ?? "Exam-critical parameter."} />
                                </p>
                            </div>
                        ))}
                    </div>
                    
                    {safeSummary.visualAnalogy.analogy && (
                        <Card variant="glass" className="!p-8 border-cyan-500/20 bg-cyan-500/5 relative group">
                            <div className="absolute -top-4 -right-4 w-12 h-12 bg-cyan-500 rounded-full blur-2xl opacity-20"></div>
                            <div className="flex items-center gap-3 mb-6">
                                <LightBulbIcon className="w-6 h-6 text-cyan-400"/>
                                <h3 className="font-black uppercase tracking-[0.2em] text-cyan-400 text-[10px]">Guru Logic</h3>
                            </div>
                            <p className="font-black text-white italic text-xl leading-tight group-hover:text-cyan-300 transition-colors">
                                "{safeSummary.visualAnalogy.analogy}"
                            </p>
                            {safeSummary.visualAnalogy.explanation && (
                                <p className="text-xs text-slate-400 mt-5 leading-relaxed font-medium">
                                    {safeSummary.visualAnalogy.explanation}
                                </p>
                            )}
                        </Card>
                    )}
                </motion.div>
            </div>
            
            {/* Neural Memo */}
            <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.4 }}
                className="max-w-3xl mx-auto text-center p-12 rounded-[3rem] bg-slate-900/40 border border-white/5"
            >
                 <div className="flex items-center justify-center gap-3 mb-6">
                    <div className="w-10 h-10 rounded-2xl bg-violet-600/20 flex items-center justify-center">
                        <HeartIcon className="w-5 h-5 text-violet-500"/>
                    </div>
                    <span className="font-black text-violet-400 text-xs tracking-[0.4em] uppercase">StuBro Neural Memo</span>
                 </div>
                 <p className="text-2xl text-slate-300 italic font-light leading-relaxed">
                    "{safeSummary.stuBroTip}"
                 </p>
            </motion.div>
        </div>
    );
};

export default SmartSummaryComponent;
