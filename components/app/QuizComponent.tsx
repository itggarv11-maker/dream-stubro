import React, { useState, useRef } from 'react';
import { QuizQuestion, AssessmentMode } from '../../types';
import Button from '../common/Button';
import Spinner from '../common/Spinner';
import Card from '../common/Card';
import { MicrophoneIcon, UploadIcon, PencilSquareIcon, CheckCircleIcon, XCircleIcon, SparklesIcon } from '../icons';
import MathRenderer from '../common/MathRenderer';
import { motion, AnimatePresence } from 'framer-motion';
import DiagramRenderer from './DiagramRenderer';

interface QuizProps {
    questions: QuizQuestion[];
    onFinish: (results: any) => void;
}

const QuizComponent: React.FC<QuizProps> = ({ questions, onFinish }) => {
    const [idx, setIdx] = useState(0);
    const [mode, setMode] = useState<AssessmentMode>('type');
    const [answers, setAnswers] = useState<any[]>([]);
    const [userInput, setUserInput] = useState('');
    const [isRecording, setIsRecording] = useState(false);
    const [showFeedback, setShowFeedback] = useState(false);

    const q = questions[idx];

    const handleNext = () => {
        if (idx < questions.length - 1) {
            setIdx(idx + 1);
            setShowFeedback(false);
            setUserInput('');
        } else {
            onFinish(answers);
        }
    };

    return (
        <div className="space-y-12">
            <div className="w-full bg-white/5 h-2 rounded-full overflow-hidden">
                <motion.div initial={{ width: 0 }} animate={{ width: `${((idx + 1) / questions.length) * 100}%` }} className="h-full bg-violet-600 shadow-[0_0_20px_rgba(124,58,237,0.8)]"/>
            </div>

            <Card variant="dark" className="!p-12 border-slate-800 relative overflow-hidden">
                <div className="absolute top-0 left-0 w-1 h-full bg-violet-600"></div>
                <div className="flex justify-between items-start mb-12">
                    <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.4em]">BRAHMASTRA QUESTION {idx + 1}/{questions.length}</h3>
                    <div className="flex gap-2 bg-slate-950 p-1.5 rounded-2xl border border-white/5 shadow-inner">
                        {(['type', 'speak', 'upload'] as AssessmentMode[]).map(m => (
                            <button key={m} onClick={() => setMode(m)} className={`p-3 rounded-xl transition-all ${mode === m ? 'bg-violet-600 text-white shadow-xl' : 'text-slate-600 hover:text-slate-400'}`}>
                                {m === 'type' && <PencilSquareIcon className="w-5 h-5"/>}
                                {m === 'speak' && <MicrophoneIcon className="w-5 h-5"/>}
                                {m === 'upload' && <UploadIcon className="w-5 h-5"/>}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="space-y-10">
                    <div className="text-4xl font-black text-white leading-tight tracking-tight">
                        <MathRenderer text={q.question} />
                    </div>

                    {q.diagram_spec && <DiagramRenderer spec={q.diagram_spec} />}

                    <div className="space-y-6">
                        {q.type === 'mcq' ? (
                            <div className="grid md:grid-cols-2 gap-4">
                                {q.options?.map((opt, i) => (
                                    <button key={i} onClick={() => setUserInput(opt)} className={`p-6 rounded-[2rem] text-left border-2 transition-all font-bold ${userInput === opt ? 'bg-violet-600 border-violet-500 text-white shadow-2xl' : 'bg-slate-950 border-slate-800 text-slate-500 hover:border-slate-700'}`}>
                                        <MathRenderer text={opt}/>
                                    </button>
                                ))}
                            </div>
                        ) : (
                            <div className="relative">
                                {mode === 'type' && <textarea value={userInput} onChange={e => setUserInput(e.target.value)} placeholder="Enter full neural explanation..." className="w-full h-64 bg-slate-950 border-2 border-slate-800 p-8 rounded-[3rem] text-white font-medium focus:border-violet-500 outline-none transition-all shadow-inner"/>}
                                {mode === 'speak' && (
                                    <div className="h-64 flex flex-col items-center justify-center bg-slate-950 border-2 border-slate-800 rounded-[3rem] gap-6">
                                        <button onClick={() => setIsRecording(!isRecording)} className={`w-24 h-24 rounded-full flex items-center justify-center transition-all ${isRecording ? 'bg-red-500 animate-pulse scale-110' : 'bg-violet-600 hover:bg-violet-500 shadow-2xl shadow-violet-600/30'}`}><MicrophoneIcon className="w-10 h-10 text-white"/></button>
                                        <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest">{isRecording ? 'Capturing neural audio...' : 'Begin Voice Transcription'}</p>
                                    </div>
                                )}
                                {mode === 'upload' && (
                                    <div className="h-64 flex flex-col items-center justify-center bg-slate-950 border-2 border-slate-800 rounded-[3rem] gap-6">
                                        <label className="w-24 h-24 rounded-full bg-cyan-600 flex items-center justify-center cursor-pointer hover:bg-cyan-500 shadow-2xl transition-all"><UploadIcon className="w-10 h-10 text-white"/><input type="file" className="hidden" /></label>
                                        <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest">Upload Handwritten Answer Sheet</p>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>

                <AnimatePresence>
                    {showFeedback && (
                        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mt-12 p-8 rounded-[2.5rem] bg-indigo-500/10 border border-indigo-500/20 relative overflow-hidden">
                             <div className="absolute top-0 right-0 p-6 opacity-10"><SparklesIcon className="w-20 h-20" /></div>
                             <h4 className="text-indigo-400 font-black text-[10px] uppercase tracking-widest mb-4 flex items-center gap-2">
                                <CheckCircleIcon className="w-4 h-4"/> Neural Correction Matrix
                             </h4>
                             <p className="text-slate-300 leading-relaxed font-medium"><MathRenderer text={q.explanation}/></p>
                        </motion.div>
                    )}
                </AnimatePresence>

                <div className="mt-12 flex justify-end">
                    {!showFeedback ? (
                        <Button onClick={() => setShowFeedback(true)} size="lg" className="px-16 h-20 !rounded-[2rem] !text-xl !font-black uppercase tracking-widest">LOCK ANSWER</Button>
                    ) : (
                        <Button onClick={handleNext} size="lg" className="px-16 h-20 !rounded-[2rem] !text-xl !font-black uppercase tracking-widest !bg-white !text-slate-950">
                            {idx < questions.length - 1 ? 'NEXT GATE' : 'FINISH ASCENSION'}
                        </Button>
                    )}
                </div>
            </Card>
        </div>
    );
};

export default QuizComponent;