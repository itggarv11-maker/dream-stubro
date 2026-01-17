
import React, { useState } from 'react';
import { QuizQuestion } from '../../types';
import Button from '../common/Button';
import Card from '../common/Card';
import { 
    CheckCircleIcon, XCircleIcon, SparklesIcon, 
    // Fix: TrophyIcon is defined locally at the bottom of this file, removing from import to resolve error in line 8
    RocketLaunchIcon, BoltIcon, StarIcon 
} from '../icons';
import MathRenderer from '../common/MathRenderer';
import { motion, AnimatePresence } from 'framer-motion';
import DiagramRenderer from './DiagramRenderer';
import { useTheme } from '../../contexts/ThemeContext';

interface QuizProps {
    questions: QuizQuestion[];
    onFinish: () => void;
}

const QuizComponent: React.FC<QuizProps> = ({ questions, onFinish }) => {
    const { theme } = useTheme();
    const [idx, setIdx] = useState(0);
    const [selectedOption, setSelectedOption] = useState<string | null>(null);
    const [isAnswered, setIsAnswered] = useState(false);
    const [score, setScore] = useState(0);
    const [showResults, setShowResults] = useState(false);
    const [streak, setStreak] = useState(0);

    const q = questions[idx];
    const isLast = idx === questions.length - 1;

    const handleAnswer = (option: string) => {
        if (isAnswered) return;
        setSelectedOption(option);
        setIsAnswered(true);
        const correct = option === q.correctAnswer;
        if (correct) {
            setScore(prev => prev + 1);
            setStreak(prev => prev + 1);
        } else {
            setStreak(0);
        }
    };

    const nextQuestion = () => {
        if (isLast) {
            setShowResults(true);
        } else {
            setIdx(prev => prev + 1);
            setIsAnswered(false);
            setSelectedOption(null);
        }
    };

    if (showResults) {
        const percentage = Math.round((score / questions.length) * 100);
        return (
            <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="max-w-4xl mx-auto text-center space-y-12 py-10">
                <div className="relative inline-block">
                    <div className={`absolute inset-0 blur-[100px] opacity-40 animate-pulse ${theme === 'dark' ? 'bg-violet-600' : 'bg-amber-400'}`}></div>
                    <Card variant="dark" className="!p-16 !rounded-[5rem] border-white/10 relative z-10 shadow-2xl">
                        <TrophyIcon className={`w-24 h-24 mx-auto mb-8 ${theme === 'dark' ? 'text-cyan-400' : 'text-amber-500'}`} />
                        <h2 className="text-6xl font-black italic tracking-tightest uppercase mb-4">ASCENSION COMPLETE</h2>
                        <div className="flex justify-center items-end gap-2 mb-8">
                            <span className={`text-9xl font-black italic leading-none ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>{percentage}</span>
                            <span className="text-4xl font-black text-slate-500 mb-4">% SYNC</span>
                        </div>
                        <p className="text-slate-500 font-bold uppercase tracking-[0.4em] text-xs">Final Cognitive Score: {score} / {questions.length}</p>
                    </Card>
                </div>

                <div className="flex gap-6 justify-center">
                    <Button onClick={() => window.location.reload()} size="lg" className="h-24 px-16 !text-2xl !font-black !rounded-full shadow-2xl hover:scale-105 transition-all">RE-TRY MISSION</Button>
                    <Button onClick={onFinish} variant="outline" className="h-24 px-16 !text-2xl !font-black !rounded-full border-white/10 italic">CLOSE ARENA</Button>
                </div>
            </motion.div>
        );
    }

    return (
        <div className="max-w-5xl mx-auto space-y-12 pb-40">
            {/* Header Status */}
            <div className="flex justify-between items-end border-b border-white/5 pb-10">
                <div>
                    <h2 className={`text-[10px] font-black uppercase tracking-[1em] mb-4 italic ${theme === 'dark' ? 'text-violet-500' : 'text-amber-600'}`}>Logic Battle Phase</h2>
                    <p className="text-4xl font-black italic tracking-tighter uppercase leading-none">GATE {idx + 1} <span className="opacity-20">/ {questions.length}</span></p>
                </div>
                <div className="flex items-center gap-6">
                    <div className="text-right hidden md:block">
                        <p className="text-[9px] font-black text-slate-600 uppercase tracking-widest mb-1">Current Streak</p>
                        <p className={`text-2xl font-black italic ${streak > 0 ? 'text-orange-500 animate-bounce' : 'text-slate-800'}`}>🔥 {streak}</p>
                    </div>
                    <div className="w-40 h-2 bg-white/5 rounded-full overflow-hidden">
                        <motion.div animate={{ width: `${((idx + 1) / questions.length) * 100}%` }} className={`h-full shadow-[0_0_15px_rgba(34,211,238,0.5)] ${theme === 'dark' ? 'bg-cyan-400' : 'bg-amber-500'}`} />
                    </div>
                </div>
            </div>

            {/* Question Card */}
            <motion.div key={idx} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-10">
                <Card variant="dark" className="!p-16 md:!p-24 !rounded-[4rem] border-white/5 shadow-[0_40px_100px_rgba(0,0,0,0.8)] relative overflow-hidden">
                    <div className={`absolute top-0 left-0 w-2 h-full ${theme === 'dark' ? 'bg-violet-600' : 'bg-amber-500'}`}></div>
                    <div className="space-y-12">
                        <MathRenderer text={q.question} className="text-4xl md:text-6xl font-black tracking-tightest leading-[1.1] italic text-white" />
                        {q.diagram_spec && <DiagramRenderer spec={q.diagram_spec} />}
                    </div>
                </Card>

                {/* Options Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {q.options?.map((opt, i) => {
                        const isSelected = selectedOption === opt;
                        const isCorrect = opt === q.correctAnswer;
                        const showCorrect = isAnswered && isCorrect;
                        const showWrong = isAnswered && isSelected && !isCorrect;

                        return (
                            <button 
                                key={i} 
                                onClick={() => handleAnswer(opt)}
                                disabled={isAnswered}
                                className={`p-10 rounded-[3rem] text-left border-2 transition-all relative overflow-hidden group ${
                                    showCorrect ? 'bg-emerald-500/20 border-emerald-500 shadow-[0_0_40px_rgba(16,185,129,0.3)]' :
                                    showWrong ? 'bg-red-500/20 border-red-500 shadow-[0_0_40px_rgba(239,68,68,0.3)]' :
                                    isSelected ? (theme === 'dark' ? 'bg-violet-600/40 border-violet-500' : 'bg-amber-100 border-amber-500') :
                                    'bg-slate-900/40 border-white/5 hover:border-violet-500/30 hover:bg-slate-900/60'
                                }`}
                            >
                                <div className="flex items-center gap-8">
                                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-black text-lg transition-colors ${
                                        showCorrect || showWrong ? 'bg-white text-black' : 
                                        isSelected ? 'bg-white text-black' : 'bg-black/60 text-slate-500 group-hover:bg-white group-hover:text-black'
                                    }`}>
                                        {String.fromCharCode(65 + i)}
                                    </div>
                                    <MathRenderer text={opt} className={`text-xl md:text-2xl font-black tracking-tight ${
                                        showCorrect ? 'text-emerald-400' : showWrong ? 'text-red-400' : 'text-slate-300 group-hover:text-white'
                                    }`} />
                                </div>
                            </button>
                        );
                    })}
                </div>
            </motion.div>

            {/* Explanation Modal-like Feedback */}
            <AnimatePresence>
                {isAnswered && (
                    <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} className="space-y-8 pt-10">
                        <div className={`p-10 rounded-[3.5rem] border-2 backdrop-blur-2xl ${selectedOption === q.correctAnswer ? 'bg-emerald-500/5 border-emerald-500/20' : 'bg-red-500/5 border-red-500/20'}`}>
                            <div className="flex items-center gap-4 mb-6">
                                {selectedOption === q.correctAnswer ? <CheckCircleIcon className="w-8 h-8 text-emerald-500" /> : <XCircleIcon className="w-8 h-8 text-red-500" />}
                                <h4 className={`text-sm font-black uppercase tracking-widest ${selectedOption === q.correctAnswer ? 'text-emerald-500' : 'text-red-500'}`}>
                                    {selectedOption === q.correctAnswer ? 'LOGIC VERIFIED' : 'CALIBRATION ERROR'}
                                </h4>
                            </div>
                            <div className="space-y-6">
                                <p className="text-xl md:text-2xl font-medium text-slate-300 leading-relaxed italic"><MathRenderer text={q.explanation} /></p>
                            </div>
                        </div>
                        
                        <Button onClick={nextQuestion} size="lg" className={`w-full h-24 !text-3xl !font-black !rounded-full italic shadow-2xl transition-all hover:scale-105 ${theme === 'dark' ? 'bg-white text-black' : 'bg-slate-950 text-white'}`}>
                            {isLast ? 'FINISH SYNTHESIS' : 'NEXT LOGIC GATE'} &rarr;
                        </Button>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

const TrophyIcon = (props: any) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 18.75h-9m9 0a3 3 0 0 1 3 3h-15a3 3 0 0 1 3-3m9 0v-3.375c0-.621-.503-1.125-1.125-1.125h-.871M7.5 18.75v-3.375c0-.621.504-1.125 1.125-1.125h.872m5.007 0H9.497m5.007 0a7.454 7.454 0 0 1-.982-3.172M9.497 14.25a7.454 7.454 0 0 0 .981-3.172M5.25 4.236c-.982.143-1.954.317-2.916.52A6.003 6.003 0 0 0 7.73 9.728M5.25 4.236V4.5c0 2.108.966 3.99 2.48 5.228M5.25 4.236V2.721C7.456 2.41 9.71 2.25 12 2.25s4.544.16 6.75.471v1.515m0 0c.982.143 1.954.317 2.916.52a6.003 6.003 0 0 1-5.397 4.972m5.397-5.492V4.5c0 2.108-.966 3.99-2.48 5.228m-6.898 7.5c.347-.354.743-.655 1.18-.897m5.008-5.507A6.68 6.68 0 0 1 12 15c-1.181 0-2.292-.305-3.254-.839m10.152-6.161a6.68 6.68 0 0 0-3.254-.839" />
    </svg>
);

export default QuizComponent;
