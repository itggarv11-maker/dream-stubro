import React, { useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import { ClassLevel, VivaQuestion } from '../types';
import { CLASS_LEVELS } from '../constants';
import * as geminiService from '../services/geminiService';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import Spinner from '../components/common/Spinner';
import { MicrophoneIcon } from '../components/icons/MicrophoneIcon';
import { StopIcon } from '../components/icons/StopIcon';
import { AcademicCapIcon } from '../components/icons/AcademicCapIcon';
import { CheckCircleIcon } from '../components/icons/CheckCircleIcon';

const blobToBase64 = (blob: Blob): Promise<string> => new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(blob);
    reader.onloadend = () => {
        if (typeof reader.result === 'string') {
            resolve(reader.result.split(',')[1]);
        } else {
            reject(new Error('Failed to convert blob to base64.'));
        }
    };
    reader.onerror = (error) => reject(error);
});

const VivaPage: React.FC = () => {
    const [step, setStep] = useState<'setup' | 'in_progress' | 'evaluating' | 'results'>('setup');
    
    const [topic, setTopic] = useState('');
    const [classLevel, setClassLevel] = useState<ClassLevel>('Class 10');
    const [numQuestions, setNumQuestions] = useState(5);

    const [questions, setQuestions] = useState<VivaQuestion[]>([]);
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);

    const [answerMode, setAnswerMode] = useState<'speak' | 'type'>('speak');
    const [typedAnswer, setTypedAnswer] = useState('');
    const [recordedAudioBlob, setRecordedAudioBlob] = useState<Blob | null>(null);
    
    const [isRecording, setIsRecording] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [evaluatingMessage, setEvaluatingMessage] = useState('');
    const [error, setError] = useState<React.ReactNode | null>(null);
    
    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const audioChunksRef = useRef<Blob[]>([]);
    
    const handleApiError = (err: unknown, customMessage?: string) => {
        if (err instanceof Error) {
            if (err.message.includes("Insufficient tokens")) {
                setError(
                    <span>
                        You're out of tokens! Please <Link to="/premium" className="font-bold underline text-violet-600">upgrade to Premium</Link> for unlimited access.
                    </span>
                );
            } else {
                setError(customMessage || err.message);
            }
        } else {
            setError(customMessage || "An unknown error occurred.");
        }
    };

    const handleStartSession = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setIsLoading(true);
        try {
            const generatedQuestions = await geminiService.generateVivaQuestions(topic, classLevel, numQuestions);
            const questionStates: VivaQuestion[] = generatedQuestions.map(q => ({
                questionText: typeof q === 'string' ? q : JSON.stringify(q),
                isAnswered: false
            }));
            setQuestions(questionStates);
            setStep('in_progress');
        } catch (err) {
            handleApiError(err);
        } finally {
            setIsLoading(false);
        }
    };

    const resetForNextQuestion = () => {
        setTypedAnswer('');
        setRecordedAudioBlob(null);
        setError(null);
    };
    
    const startRecording = async () => {
        setRecordedAudioBlob(null); 
        setError(null);
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            const recorder = new MediaRecorder(stream, { mimeType: 'audio/webm' });
            mediaRecorderRef.current = recorder;
            
            recorder.ondataavailable = (event) => {
                if (event.data.size > 0) audioChunksRef.current.push(event.data);
            };
            
            recorder.onstop = () => {
                stream.getTracks().forEach(track => track.stop());
                const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
                setRecordedAudioBlob(audioBlob);
                audioChunksRef.current = [];
            };

            recorder.start();
            setIsRecording(true);
        } catch (err) {
            setError('Microphone permission denied.');
        }
    };

    const stopRecording = () => {
        if (mediaRecorderRef.current?.state === 'recording') {
            mediaRecorderRef.current.stop();
        }
        setIsRecording(false);
    };
    
    const handleAnswerSubmission = () => {
        const currentQ = questions[currentQuestionIndex];
        let answeredQuestion: VivaQuestion;

        if (answerMode === 'speak') {
            if (!recordedAudioBlob) {
                setError("Please record your answer first.");
                return;
            }
            answeredQuestion = {
                ...currentQ,
                isAnswered: true,
                answerAudioBlob: recordedAudioBlob,
                answerPlaybackUrl: URL.createObjectURL(recordedAudioBlob),
            };
        } else {
            if (!typedAnswer.trim()) {
                setError("Please type your answer.");
                return;
            }
            answeredQuestion = {
                ...currentQ,
                isAnswered: true,
                answerText: typedAnswer,
            };
        }
        
        const updatedQuestions = [...questions];
        updatedQuestions[currentQuestionIndex] = answeredQuestion;
        setQuestions(updatedQuestions);

        if (currentQuestionIndex < questions.length - 1) {
            setCurrentQuestionIndex(prev => prev + 1);
            resetForNextQuestion();
        }
    };

    const handleStartEvaluation = async () => {
        setStep('evaluating');
        setError(null);
        const evaluatedQs: VivaQuestion[] = [];

        for (let i = 0; i < questions.length; i++) {
            setEvaluatingMessage(`Analyzing response ${i + 1}/${questions.length}...`);
            const q = questions[i];
            
            if (!q.isAnswered) {
                evaluatedQs.push({ ...q, marksAwarded: 0, feedback: "No answer submitted.", transcription: "N/A" });
                continue;
            }

            try {
                let result: any;
                if (q.answerAudioBlob) {
                    const base64Audio = await blobToBase64(q.answerAudioBlob);
                    const audioPart = { inlineData: { mimeType: q.answerAudioBlob.type, data: base64Audio } };
                    result = await geminiService.evaluateVivaAudioAnswer(q.questionText, audioPart);
                } else {
                    result = await geminiService.evaluateVivaTextAnswer(q.questionText, q.answerText!);
                }
                
                evaluatedQs.push({
                    ...q,
                    transcription: result.transcription,
                    feedback: result.feedback,
                    marksAwarded: result.marksAwarded,
                });

            } catch(err) {
                 handleApiError(err, `Evaluation error at question ${i+1}.`);
                setStep('in_progress');
                return;
            }
        }
        setQuestions(evaluatedQs);
        setStep('results');
    };

    const renderSetup = () => (
        <Card variant="dark" className="max-w-2xl mx-auto !p-8 md:!p-16 border-white/10 relative overflow-hidden shadow-2xl">
             <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-violet-600 to-cyan-500 shadow-lg"></div>
             <div className="text-center mb-12">
                <div className="p-5 bg-violet-600/10 border border-violet-500/20 rounded-3xl inline-block mb-6 shadow-2xl">
                    <AcademicCapIcon className="w-12 h-12 text-violet-400" />
                </div>
                <h1 className="text-4xl md:text-6xl font-black text-white uppercase tracking-tighter italic">VIVA MASTER</h1>
                <p className="mt-3 text-slate-500 font-bold uppercase tracking-[0.4em] text-[10px]">Astra Oral Assessment Protocol</p>
            </div>
            <form onSubmit={handleStartSession} className="space-y-8">
                 <div>
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4 block">Focus Topic</label>
                    <input type="text" value={topic} onChange={e => setTopic(e.target.value)} required placeholder="TOPIC PARAMETERS..." className="w-full bg-slate-950 border border-white/10 p-5 rounded-2xl text-white outline-none focus:border-violet-500 transition-all font-bold" />
                </div>
                 <div className="grid grid-cols-2 gap-6">
                     <div>
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4 block">Question Volume</label>
                        <input type="number" value={numQuestions} onChange={e => setNumQuestions(Math.min(10, Math.max(1, parseInt(e.target.value))))} className="w-full bg-slate-950 border border-white/10 p-5 rounded-2xl text-white font-bold"/>
                    </div>
                    <div>
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4 block">Module Level</label>
                        <select value={classLevel} onChange={e => setClassLevel(e.target.value as ClassLevel)} className="w-full bg-slate-950 border border-white/10 p-5 rounded-2xl text-white font-bold outline-none focus:border-violet-500">
                            {CLASS_LEVELS.map(level => <option key={level} value={level}>{level}</option>)}
                        </select>
                    </div>
                 </div>
                 {error && <p className="text-red-500 text-center font-black uppercase text-xs tracking-widest">{error}</p>}
                <Button type="submit" size="lg" disabled={isLoading || !topic} className="w-full h-20 !text-2xl !font-black !rounded-[2.5rem] bg-white !text-slate-950 shadow-[0_20px_50px_rgba(255,255,255,0.1)] hover:scale-105 active:scale-95 transition-all italic">
                    {isLoading ? <Spinner colorClass="bg-slate-950" /> : 'INITIALIZE VIVA →'}
                </Button>
            </form>
        </Card>
    );

    const renderInProgress = () => {
        const currentQ = questions[currentQuestionIndex];
        const isLastQuestion = currentQuestionIndex === questions.length - 1;

        return (
            <Card variant="dark" className="max-w-4xl mx-auto !p-8 md:!p-16 border-white/10 relative overflow-hidden">
                <div className="flex justify-between items-end mb-8 border-b border-white/5 pb-8">
                    <div>
                        <p className="text-[10px] font-black text-violet-400 uppercase tracking-widest mb-1">Active Query {currentQuestionIndex + 1}/{questions.length}</p>
                        <h2 className="text-xl md:text-2xl font-black text-slate-500 uppercase tracking-tight italic truncate max-w-md">{topic}</h2>
                    </div>
                    <div className="w-48 bg-white/5 rounded-full h-2 overflow-hidden shadow-inner mb-2">
                        <div className="bg-gradient-to-r from-violet-500 to-cyan-500 h-full transition-all duration-700 shadow-[0_0_10px_rgba(34,211,238,0.5)]" style={{ width: `${((currentQuestionIndex + 1) / questions.length) * 100}%` }}></div>
                    </div>
                </div>

                <div className="mb-12 text-center">
                    <p className="text-3xl md:text-5xl font-black text-white leading-tight italic tracking-tighter">"{currentQ.questionText}"</p>
                </div>

                <div className="space-y-8">
                     {!currentQ.isAnswered ? (
                        <>
                            <div className="flex bg-slate-950 p-1.5 rounded-full w-fit mx-auto border border-white/5">
                                <button onClick={() => setAnswerMode('speak')} className={`px-8 py-2 rounded-full text-[10px] font-black uppercase tracking-widest transition-all ${answerMode === 'speak' ? 'bg-violet-600 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}>Speak</button>
                                <button onClick={() => setAnswerMode('type')} className={`px-8 py-2 rounded-full text-[10px] font-black uppercase tracking-widest transition-all ${answerMode === 'type' ? 'bg-violet-600 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}>Type</button>
                            </div>
                            {answerMode === 'speak' ? (
                                <div className="text-center space-y-6">
                                    <button onClick={isRecording ? stopRecording : startRecording} className={`w-28 h-28 md:w-40 md:h-40 rounded-full transition-all flex items-center justify-center mx-auto shadow-2xl border-4 ${isRecording ? 'bg-red-500 border-red-400 animate-pulse scale-110 shadow-red-500/30' : 'bg-violet-600 border-violet-500 hover:bg-violet-500 shadow-violet-600/20'}`}>
                                        {isRecording ? <StopIcon className="w-12 h-12 text-white"/> : <MicrophoneIcon className="w-12 h-12 text-white" />}
                                    </button>
                                    <p className="text-xs font-black text-slate-500 uppercase tracking-widest">{isRecording ? "Capturing Response..." : (recordedAudioBlob ? "Signal Locked. Ready for Processing." : "Awaiting Voice Input")}</p>
                                    {recordedAudioBlob && !isRecording && (
                                        <div className="p-4 bg-slate-950 rounded-3xl border border-white/5 inline-block mx-auto">
                                            <audio src={URL.createObjectURL(recordedAudioBlob)} controls className="h-10 opacity-60 hover:opacity-100 transition-opacity"/>
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <textarea value={typedAnswer} onChange={e => setTypedAnswer(e.target.value)} placeholder="Type full response parameters..." rows={6} className="w-full p-8 bg-slate-950 border border-white/10 rounded-[3rem] text-white font-medium focus:border-violet-500 outline-none transition-all shadow-inner"/>
                            )}
                        </>
                    ) : (
                         <div className="p-10 bg-green-500/5 border border-green-500/20 rounded-[3rem] text-center shadow-inner group">
                           <CheckCircleIcon className="w-16 h-16 text-green-500 mx-auto mb-4 group-hover:scale-110 transition-transform"/>
                            <p className="font-black text-green-400 uppercase tracking-widest text-sm">Response Locked</p>
                            {currentQ.answerPlaybackUrl && <div className="mt-6"><audio src={currentQ.answerPlaybackUrl} controls className="mx-auto h-10 opacity-40"/></div>}
                            {currentQ.answerText && <p className="mt-4 text-slate-400 italic">"{currentQ.answerText}"</p>}
                        </div>
                    )}

                    {error && <p className="text-red-500 text-center font-black uppercase text-xs tracking-widest">{error}</p>}
                    <div className="text-center pt-8">
                        {currentQ.isAnswered ? (
                            isLastQuestion ? (
                                <Button onClick={handleStartEvaluation} size="lg" className="w-full md:w-80 h-20 !text-xl !font-black !rounded-3xl !bg-white !text-slate-950 italic">ANALYZE FULL VIVA →</Button>
                            ) : (
                                <Button onClick={handleAnswerSubmission} variant="outline" className="w-full md:w-80 h-20 !text-xl !font-black !rounded-3xl hover:bg-white/5 italic">NEXT QUERY &rarr;</Button>
                            )
                        ) : (
                             <Button onClick={handleAnswerSubmission} disabled={(answerMode === 'type' && !typedAnswer) || (answerMode === 'speak' && !recordedAudioBlob)} className="w-full md:w-80 h-20 !text-xl !font-black !rounded-3xl shadow-xl italic">
                                {isLastQuestion ? "SUBMIT FINAL" : "SUBMIT RESPONSE"}
                            </Button>
                        )}
                    </div>
                </div>
            </Card>
        );
    };
    
    const renderEvaluating = () => (
        <Card variant="dark" className="max-w-md mx-auto text-center !p-16 border-white/10">
            <div className="relative inline-block">
                <div className="absolute inset-0 bg-violet-600 blur-[80px] opacity-20 animate-pulse"></div>
                <Spinner className="w-24 h-24 relative z-10" colorClass="bg-violet-600"/>
            </div>
            <h2 className="text-4xl font-black text-white uppercase tracking-tighter mt-12 italic">SYNTHESIZING...</h2>
            <p className="text-slate-500 text-[10px] font-black uppercase tracking-[0.4em] mt-4">{evaluatingMessage}</p>
        </Card>
    );

    const renderResults = () => {
        const totalMarksAwarded = questions.reduce((sum, q) => sum + (q.marksAwarded || 0), 0);
        const totalPossibleMarks = questions.length * 10;
        return (
            <Card variant="dark" className="max-w-5xl mx-auto !p-8 md:!p-16 border-white/10">
                <div className="text-center border-b border-white/5 pb-12">
                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.5em] mb-4">Astra Evaluation Report</p>
                    <h1 className="text-5xl md:text-7xl font-black text-white uppercase tracking-tighter italic">VIVA DOSSIER</h1>
                    <div className="mt-8 inline-flex items-center gap-6 px-10 py-5 bg-slate-950 rounded-full border border-white/5 shadow-inner">
                        <span className="text-7xl font-black text-cyan-400 italic tracking-tighter">{totalMarksAwarded}</span>
                        <div className="text-left">
                            <p className="text-slate-500 font-black text-[10px] uppercase tracking-widest">Total Mastery</p>
                            <p className="text-2xl font-bold text-white tracking-tight">/ {totalPossibleMarks} Marks</p>
                        </div>
                    </div>
                </div>

                <div className="mt-12 space-y-8 max-h-[65vh] overflow-y-auto pr-4 scrollbar-hide">
                    {questions.map((q, index) => (
                        <div key={index} className="p-8 rounded-[3rem] bg-white/[0.02] border border-white/5 hover:border-violet-500/30 transition-all group">
                            <div className="flex justify-between items-start mb-6">
                                <div className="flex-grow">
                                    <p className="text-[9px] font-black text-violet-500 uppercase tracking-widest mb-2">Query Node {index + 1}</p>
                                    <h3 className="text-2xl font-black text-white tracking-tight italic leading-tight group-hover:text-cyan-400 transition-colors">"{q.questionText}"</h3>
                                </div>
                                <div className="flex-shrink-0 px-6 py-2 bg-slate-950 rounded-full border border-white/10 text-xl font-black italic text-cyan-400 shadow-xl ml-4">
                                    {q.marksAwarded || 0}/10
                                </div>
                            </div>
                            <div className="bg-black/40 p-6 rounded-2xl border border-white/5 text-sm mb-6 shadow-inner">
                                <p className="text-[9px] font-black text-slate-600 uppercase tracking-widest mb-3">Student Interpretation</p>
                                <p className="italic text-slate-300 font-medium leading-relaxed">"{q.transcription || q.answerText || 'No valid signal detected.'}"</p>
                            </div>
                            <div className="p-6 rounded-2xl bg-violet-600/5 border border-violet-500/10 group-hover:border-violet-500/20 transition-all">
                                <p className="text-[9px] font-black text-violet-400 uppercase tracking-widest mb-3 flex items-center gap-2"><div className="w-1 h-1 bg-violet-400 rounded-full animate-ping"></div> Neural Feedback</p>
                                <p className="text-slate-400 text-sm font-medium leading-relaxed">{q.feedback}</p>
                            </div>
                        </div>
                    ))}
                </div>
                <div className="text-center mt-12">
                    <Button onClick={() => { setStep('setup'); setQuestions([]); setCurrentQuestionIndex(0); resetForNextQuestion(); }} className="h-20 px-16 !text-xl !font-black !rounded-[2.5rem] bg-white !text-slate-950 shadow-2xl hover:scale-105 transition-all italic">
                        RE-INITIALIZE PROTOCOL →
                    </Button>
                </div>
            </Card>
        );
    }


    switch(step) {
        case 'setup': return renderSetup();
        case 'in_progress': return renderInProgress();
        case 'evaluating': return renderEvaluating();
        case 'results': return renderResults();
        default: return renderSetup();
    }
};

export default VivaPage;