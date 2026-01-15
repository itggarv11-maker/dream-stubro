import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { Chat } from '@google/genai';
import * as geminiService from '../services/geminiService';
import * as ttsService from '../services/ttsService';
import { DebateTurn, DebateScorecard } from '../types';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import Spinner from '../components/common/Spinner';
import { GavelIcon } from '../components/icons/GavelIcon';
import { MicrophoneIcon } from '../components/icons/MicrophoneIcon';
import { PaperAirplaneIcon } from '../components/icons/PaperAirplaneIcon';
import { useContent } from '../contexts/ContentContext';
import { StopIcon } from '../components/icons/StopIcon';
import { PlayIcon } from '../components/icons/PlayIcon';
import { PauseIcon } from '../components/icons/PauseIcon';

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

const LiveDebatePage: React.FC = () => {
    const [step, setStep] = useState<'setup' | 'debating' | 'evaluating' | 'results'>('setup');
    const [topic, setTopic] = useState('');
    
    const { extractedText } = useContent();
    const [suggestedTopics, setSuggestedTopics] = useState<string[]>([]);
    const [isGeneratingTopics, setIsGeneratingTopics] = useState(false);

    const [debateHistory, setDebateHistory] = useState<DebateTurn[]>([]);
    const [chatSession, setChatSession] = useState<Chat | null>(null);
    const [userInput, setUserInput] = useState('');
    const [isAiThinking, setIsAiThinking] = useState(true);
    const [scorecard, setScorecard] = useState<DebateScorecard | null>(null);
    
    const [readAloud, setReadAloud] = useState(true);
    const [availableVoices, setAvailableVoices] = useState<SpeechSynthesisVoice[]>([]);
    const [currentVoiceURI, setCurrentVoiceURI] = useState('');
    const [isTTSSpeaking, setIsTTSSpeaking] = useState(false);

    const [isRecording, setIsRecording] = useState(false);
    const [recordedAudioBlob, setRecordedAudioBlob] = useState<Blob | null>(null);
    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const audioChunksRef = useRef<Blob[]>([]);

    const [isLoading, setIsLoading] = useState(false);
    const [loadingMessage, setLoadingMessage] = useState('');
    const [error, setError] = useState<React.ReactNode | null>(null);
    const chatContainerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (chatContainerRef.current) {
            chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
        }
    }, [debateHistory]);

    useEffect(() => {
        const updateVoices = () => {
            const voices = ttsService.getVoices();
            setAvailableVoices(voices);
            const selected = ttsService.getSelectedVoice();
            if (selected) {
                setCurrentVoiceURI(selected.voiceURI);
            }
        };
        updateVoices();
        window.addEventListener('voicesloaded', updateVoices);
        return () => window.removeEventListener('voicesloaded', updateVoices);
    }, []);

    useEffect(() => {
        if (extractedText && step === 'setup') {
            const getTopics = async () => {
                setIsGeneratingTopics(true);
                setError(null);
                try {
                    const topics = await geminiService.generateDebateTopics(extractedText);
                    setSuggestedTopics(topics);
                } catch(err) {
                    console.error("Could not fetch debate topics", err);
                } finally {
                    setIsGeneratingTopics(false);
                }
            };
            getTopics();
        }
    }, [extractedText, step]);

    const handlePlayPauseSpeech = () => {
        if (ttsService.isSpeaking() && !ttsService.isPaused()) {
            ttsService.pause();
            setIsTTSSpeaking(false);
        } else if (ttsService.isPaused()) {
            ttsService.resume();
            setIsTTSSpeaking(true);
        }
    };

    const handleStartDebate = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setIsLoading(true);
        setLoadingMessage('Waking up your opponent...');
        try {
            const session = geminiService.startDebateSession(topic);
            setChatSession(session);
            
            const openingStatement = await geminiService.sendDebateArgument(session, "Begin the debate with your opening statement.");
            
            setDebateHistory([{ speaker: 'critico', text: openingStatement }]);
            if (readAloud) {
                ttsService.speak(openingStatement, { onStart: () => setIsTTSSpeaking(true), onEnd: () => setIsTTSSpeaking(false) });
            }
            setStep('debating');
            setIsAiThinking(false);
        } catch (err) {
            handleApiError(err);
        } finally {
            setIsLoading(false);
        }
    };

    const handleSendTextArgument = async (argument: string) => {
        if (!argument.trim() || isAiThinking) return;

        ttsService.cancel();
        setIsTTSSpeaking(false);
        const newHistory: DebateTurn[] = [...debateHistory, { speaker: 'user', text: argument }];
        setDebateHistory(newHistory);
        setUserInput('');
        setIsAiThinking(true);
        setError(null);

        try {
            const aiResponse = await geminiService.sendDebateArgument(chatSession!, argument);
            setDebateHistory([...newHistory, { speaker: 'critico', text: aiResponse }]);
            if (readAloud) {
                 ttsService.speak(aiResponse, { onStart: () => setIsTTSSpeaking(true), onEnd: () => setIsTTSSpeaking(false) });
            }
        } catch (err) {
            handleApiError(err);
        } finally {
            setIsAiThinking(false);
        }
    };
    
    const handleSendAudioArgument = async () => {
        if (!recordedAudioBlob || isAiThinking) return;
        
        ttsService.cancel();
        setIsTTSSpeaking(false);
        setIsAiThinking(true);
        const audioBlobToSend = recordedAudioBlob;
        setRecordedAudioBlob(null);
        
        try {
            const base64Audio = await blobToBase64(audioBlobToSend);
            const audioPart = { inlineData: { mimeType: audioBlobToSend.type, data: base64Audio } };
            
            const { transcription, rebuttal } = await geminiService.getDebateResponseToAudio(chatSession!, audioPart);

            const newHistory: DebateTurn[] = [
                ...debateHistory,
                { speaker: 'user', text: transcription },
                { speaker: 'critico', text: rebuttal },
            ];
            setDebateHistory(newHistory);
            if (readAloud) {
                ttsService.speak(rebuttal, { onStart: () => setIsTTSSpeaking(true), onEnd: () => setIsTTSSpeaking(false) });
            }

        } catch (err) {
            handleApiError(err);
        } finally {
            setIsAiThinking(false);
        }
    };

    const handleSubmitArgument = () => {
        if (userInput.trim()) {
            handleSendTextArgument(userInput);
        } else if (recordedAudioBlob) {
            handleSendAudioArgument();
        }
    };

    const startRecording = async () => {
        if (isAiThinking || isRecording) return;
        setUserInput('');
        setRecordedAudioBlob(null);
        setError(null);
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            mediaRecorderRef.current = new MediaRecorder(stream, { mimeType: 'audio/webm' });
            audioChunksRef.current = [];
            mediaRecorderRef.current.ondataavailable = (event) => {
                if (event.data.size > 0) audioChunksRef.current.push(event.data);
            };
            mediaRecorderRef.current.onstop = () => {
                stream.getTracks().forEach(track => track.stop());
                const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
                setRecordedAudioBlob(audioBlob);
            };
            mediaRecorderRef.current.start();
            setIsRecording(true);
        } catch (err) {
            setError("Microphone permission denied. Please allow microphone access in your browser settings.");
        }
    };

    const stopRecording = () => {
        if (mediaRecorderRef.current?.state === 'recording') {
            mediaRecorderRef.current.stop();
        }
        setIsRecording(false);
    };

    const handleEvaluate = async () => {
        ttsService.cancel();
        setIsTTSSpeaking(false);
        setStep('evaluating');
        setLoadingMessage('The judge is reviewing the transcript...');
        setError(null);
        try {
            const result = await geminiService.evaluateDebate(debateHistory);
            setScorecard(result);
            setStep('results');
            if (readAloud) {
                ttsService.speak(`The debate has concluded. Here is your evaluation. You scored ${result.overallScore} out of 100.`);
            }
        } catch (err) {
            handleApiError(err);
            setStep('debating');
        }
    };
    
    const handleApiError = (err: unknown) => {
        if (err instanceof Error) {
            if (err.message.includes("Insufficient tokens")) {
                setError(<span>You're out of tokens! Please <Link to="/premium" className="font-bold underline text-violet-600">upgrade to Premium</Link> for unlimited access.</span>);
            } else {
                setError(err.message);
            }
        } else {
            setError("An unknown error occurred.");
        }
    };

    const renderSetup = () => (
        <Card variant="light" className="max-w-2xl mx-auto">
            <div className="text-center mb-8">
                <GavelIcon className="w-16 h-16 mx-auto text-violet-600" />
                <h1 className="text-3xl font-bold text-slate-800 mt-4">AI Live Debate Arena</h1>
                <p className="mt-2 text-slate-600">Hone your critical thinking. Challenge an AI. Master your arguments.</p>
            </div>
            <form onSubmit={handleStartDebate} className="space-y-6">
                <div>
                    <label htmlFor="topic" className="block text-sm font-medium text-slate-700">Enter the motion for the debate:</label>
                    <input type="text" id="topic" value={topic} onChange={e => setTopic(e.target.value)} required placeholder="e.g., 'Was the Industrial Revolution beneficial for society?'" className="mt-1 block w-full px-3 py-2 bg-white/60 border border-slate-400 rounded-md shadow-sm focus:outline-none focus:ring-violet-500 focus:border-violet-500 text-slate-900"/>
                </div>
                
                {isGeneratingTopics && (
                    <div className="flex items-center justify-center gap-2 text-slate-500 text-sm">
                        <Spinner className="w-4 h-4" />
                        <span>Generating topic ideas from your content...</span>
                    </div>
                )}
                {suggestedTopics.length > 0 && !isGeneratingTopics && (
                    <div>
                        <p className="text-sm font-medium text-slate-700 mb-2">Or pick a suggested topic:</p>
                        <div className="flex flex-wrap gap-2">
                            {suggestedTopics.map((t, i) => (
                                <button
                                    key={i}
                                    type="button"
                                    onClick={() => setTopic(t)}
                                    className="px-3 py-1.5 bg-violet-100 text-violet-700 rounded-full text-sm hover:bg-violet-200 transition"
                                >
                                    {t}
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                {error && <p className="text-red-600 text-center font-semibold">{error}</p>}
                <div className="text-center pt-2">
                    <Button type="submit" size="lg" disabled={isLoading || !topic}>
                        {isLoading ? <Spinner colorClass="bg-white" /> : "Enter the Arena"}
                    </Button>
                </div>
            </form>
        </Card>
    );

    const renderDebating = () => (
        <Card variant="light" className="max-w-4xl mx-auto">
            <div className="flex flex-col h-[75vh]">
                <div className="p-4 border-b border-slate-300 text-center space-y-2">
                    <h2 className="text-xl font-bold text-slate-800">Debate Topic: "{topic}"</h2>
                    <div className="flex items-center justify-center gap-4 flex-wrap">
                        <Button onClick={handleEvaluate} variant="secondary" size="sm">End & Evaluate Debate</Button>
                        <div className="flex items-center gap-2">
                            <input type="checkbox" id="readAloud" checked={readAloud} onChange={() => setReadAloud(!readAloud)} className="h-4 w-4 rounded border-gray-300 text-violet-600 focus:ring-violet-500"/>
                            <label htmlFor="readAloud" className="text-sm font-medium text-slate-600">Read AI responses aloud</label>
                        </div>
                        {readAloud && (
                            <div className="flex items-center gap-2">
                                <select value={currentVoiceURI} onChange={e => {
                                    const newURI = e.target.value;
                                    ttsService.setSelectedVoice(newURI);
                                    setCurrentVoiceURI(newURI);
                                }} className="text-xs p-1 bg-white border border-slate-300 rounded-md">
                                    {availableVoices.map(voice => <option key={voice.voiceURI} value={voice.voiceURI}>{voice.name} ({voice.lang})</option>)}
                                </select>
                                <Button onClick={handlePlayPauseSpeech} size="sm" variant="ghost" disabled={!ttsService.isSpeaking()}>
                                    {isTTSSpeaking ? <PauseIcon className="w-5 h-5" /> : <PlayIcon className="w-5 h-5"/>}
                                </Button>
                            </div>
                        )}
                    </div>
                </div>

                <div ref={chatContainerRef} className="flex-grow p-4 space-y-6 overflow-y-auto">
                    {debateHistory.map((turn, index) => (
                        <div key={index} className={`flex items-start gap-3 ${turn.speaker === 'user' ? 'justify-end' : ''}`}>
                            {turn.speaker === 'critico' && <span className="flex-shrink-0 w-10 h-10 bg-slate-700 text-white rounded-full flex items-center justify-center font-bold text-lg shadow-md">C</span>}
                            <div className={`max-w-xl p-3 rounded-lg shadow-md ${turn.speaker === 'user' ? 'bg-violet-600 text-white' : 'bg-white text-slate-800 border border-slate-200'}`}>
                                <p>{turn.text}</p>
                            </div>
                            {turn.speaker === 'user' && <span className="flex-shrink-0 w-10 h-10 bg-violet-500 text-white rounded-full flex items-center justify-center font-bold text-lg shadow-md">You</span>}
                        </div>
                    ))}
                    {isAiThinking && (
                        <div className="flex items-start gap-3">
                            <span className="flex-shrink-0 w-10 h-10 bg-slate-700 text-white rounded-full flex items-center justify-center font-bold text-lg shadow-md">C</span>
                            <div className="max-w-xl p-3 rounded-lg shadow-md bg-white text-slate-800 border border-slate-200">
                                <Spinner colorClass="bg-violet-500" />
                            </div>
                        </div>
                    )}
                </div>

                <div className="p-4 border-t border-slate-300">
                    <div className="flex gap-4 items-center">
                         <div className="flex-grow relative">
                             <textarea 
                                value={userInput}
                                onChange={(e) => setUserInput(e.target.value)}
                                placeholder="State your argument..."
                                className="w-full p-4 bg-white border border-slate-300 rounded-2xl focus:ring-violet-500 outline-none resize-none h-20"
                             />
                             <div className="absolute bottom-2 right-2 flex gap-2">
                                <Button onClick={handleSubmitArgument} disabled={isAiThinking || (!userInput.trim() && !recordedAudioBlob)} size="sm">
                                    {isAiThinking ? <Spinner /> : <PaperAirplaneIcon className="w-5 h-5"/>}
                                </Button>
                             </div>
                         </div>
                         
                         <div className="flex flex-col gap-2">
                            <button 
                                onClick={isRecording ? stopRecording : startRecording} 
                                className={`w-16 h-16 rounded-full flex items-center justify-center transition-all ${isRecording ? 'bg-red-500 animate-pulse' : 'bg-violet-600 shadow-lg shadow-violet-600/20'}`}
                                disabled={isAiThinking}
                            >
                                {isRecording ? <StopIcon className="w-6 h-6 text-white"/> : <MicrophoneIcon className="w-6 h-6 text-white"/>}
                            </button>
                            {recordedAudioBlob && !isRecording && (
                                <div className="text-[10px] text-green-600 font-bold uppercase text-center">Audio Ready</div>
                            )}
                         </div>
                    </div>
                </div>
            </div>
        </Card>
    );

    const renderEvaluating = () => (
        <Card variant="dark" className="max-w-md mx-auto text-center !p-16 border-white/10">
            <div className="relative inline-block">
                <div className="absolute inset-0 bg-violet-600 blur-[80px] opacity-20 animate-pulse"></div>
                <Spinner className="w-24 h-24 relative z-10" colorClass="bg-violet-600"/>
            </div>
            <h2 className="text-4xl font-black text-white uppercase tracking-tighter mt-12 italic">JUDGING...</h2>
            <p className="text-slate-500 text-[10px] font-black uppercase tracking-[0.4em] mt-4">{loadingMessage}</p>
        </Card>
    );

    const renderResults = () => scorecard && (
        <Card variant="dark" className="max-w-5xl mx-auto !p-8 md:!p-16 border-white/10">
            <div className="text-center border-b border-white/5 pb-12">
                <h1 className="text-5xl md:text-7xl font-black text-white uppercase tracking-tighter italic">DEBATE SCORECARD</h1>
                <div className="mt-8 inline-flex items-center gap-6 px-10 py-5 bg-slate-950 rounded-full border border-white/5">
                    <span className="text-7xl font-black text-cyan-400 italic">{scorecard.overallScore}</span>
                    <div className="text-left">
                        <p className="text-slate-500 font-black text-[10px] uppercase tracking-widest">Overall Score</p>
                        <p className="text-2xl font-bold text-white">/ 100</p>
                    </div>
                </div>
            </div>
            
            <div className="grid md:grid-cols-3 gap-6 mt-12">
                {[
                    { label: 'Argument Strength', val: scorecard.argumentStrength },
                    { label: 'Rebuttal Skill', val: scorecard.rebuttalEffectiveness },
                    { label: 'Clarity', val: scorecard.clarity }
                ].map((stat, i) => (
                    <div key={i} className="p-6 bg-white/5 rounded-3xl border border-white/5 text-center">
                        <p className="text-3xl font-black text-white mb-2">{stat.val}/10</p>
                        <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{stat.label}</p>
                    </div>
                ))}
            </div>

            <div className="mt-12 space-y-6">
                <Card variant="glass" className="!p-8">
                    <h3 className="text-xl font-bold mb-4 text-cyan-400 uppercase tracking-widest">Strongest Argument</h3>
                    <p className="text-slate-300 italic">"{scorecard.strongestArgument}"</p>
                </Card>
                <Card variant="glass" className="!p-8">
                    <h3 className="text-xl font-bold mb-4 text-pink-400 uppercase tracking-widest">Improvement Suggestion</h3>
                    <p className="text-slate-300">{scorecard.improvementSuggestion}</p>
                </Card>
            </div>

            <div className="text-center mt-12">
                <Button onClick={() => setStep('setup')} size="lg">Start New Debate</Button>
            </div>
        </Card>
    );

    return (
        <div className="space-y-8">
            {step === 'setup' && renderSetup()}
            {step === 'debating' && renderDebating()}
            {step === 'evaluating' && renderEvaluating()}
            {step === 'results' && renderResults()}
        </div>
    );
};

export default LiveDebatePage;
