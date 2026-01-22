
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { auth } from '../services/firebase';
import { signInAnonymously } from 'firebase/auth';
import * as liveQuizService from '../services/liveQuizService';
import * as geminiService from '../services/geminiService';
import { LiveQuizRoom, LiveQuizPlayer, LiveQuizQuestion } from '../types';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import Spinner from '../components/common/Spinner';
import { 
  UsersIcon, StarIcon, RocketLaunchIcon, 
  CheckCircleIcon, XCircleIcon, ClipboardIcon,
  BoltIcon
} from '../components/icons';
import { useAuth } from '../contexts/AuthContext';
import { useContent } from '../contexts/ContentContext';
import MathRenderer from '../components/common/MathRenderer';

const GroupQuizPage: React.FC = () => {
  const { currentUser, userName: authUserName } = useAuth();
  const { extractedText, subject: globalSubject } = useContent();
  const { roomCode: urlRoomCode } = useParams();
  const navigate = useNavigate();

  const [uiState, setUiState] = useState<'entry' | 'lobby' | 'live' | 'finished'>('entry');
  const [roomId, setRoomId] = useState<string | null>(null);
  const [room, setRoom] = useState<any | null>(null);
  const [players, setPlayers] = useState<any[]>([]);
  const [currentQuestion, setCurrentQuestion] = useState<LiveQuizQuestion | null>(null);
  
  const [playerName, setPlayerName] = useState(authUserName || '');
  const [roomCodeInput, setRoomCodeInput] = useState(urlRoomCode || '');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [timer, setTimer] = useState(15);
  const [hasAnswered, setHasAnswered] = useState(false);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [showInsight, setShowInsight] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);
  const [lastRoundStats, setLastRoundStats] = useState<any>(null);

  const timerRef = useRef<number | null>(null);
  const insightTimeoutRef = useRef<number | null>(null);

  useEffect(() => {
    if (!currentUser) signInAnonymously(auth).catch(console.error);
  }, [currentUser]);

  useEffect(() => {
    if (!roomId) return;
    const unsubRoom = liveQuizService.listenToRoom(roomId, (updatedRoom) => {
      setRoom(updatedRoom);
      setUiState(updatedRoom.status);
    });
    const unsubPlayers = liveQuizService.listenToPlayers(roomId, (updatedPlayers) => {
      setPlayers(updatedPlayers);
      const me = updatedPlayers.find(p => p.uid === currentUser?.uid);
      if (me) setHasAnswered(me.hasAnswered);
    });
    return () => { unsubRoom(); unsubPlayers(); };
  }, [roomId, currentUser]);

  useEffect(() => {
    if (uiState === 'live' && room) {
      const loadQ = async () => {
        const qData = await liveQuizService.getQuestion(roomId!, room.currentQuestionIndex);
        if (qData) {
            const q: LiveQuizQuestion = {
                questionText: qData.questionText || qData.question || qData.text || "Synchronizing Node...",
                options: qData.options || [],
                correctOptionIndex: Number(qData.correctOptionIndex) ?? 0,
                explanation: qData.explanation || "System Alignment Verified."
            };
            setCurrentQuestion(q);
            setSelectedOption(null);
            setShowInsight(false);
            setLastRoundStats(null);
            startTimer();
        }
      };
      loadQ();
    }
  }, [uiState, room?.currentQuestionIndex]);

  useEffect(() => {
    if (uiState === 'live' && room?.hostUid === currentUser?.uid) {
      const allHumansAnswered = players.filter(p => !p.isAi).every(p => p.hasAnswered);
      if (timer === 0 || (allHumansAnswered && players.filter(p => !p.isAi).length > 0)) {
        if (!insightTimeoutRef.current) {
            insightTimeoutRef.current = window.setTimeout(async () => {
                const qCount = (await liveQuizService.getAllQuestions(roomId!)).length;
                await liveQuizService.nextLiveQuestion(roomId!, room.currentQuestionIndex + 1, qCount);
                insightTimeoutRef.current = null;
            }, 5000);
        }
      }
    }
    if (uiState === 'live' && (hasAnswered || timer === 0)) setShowInsight(true);
  }, [timer, players, uiState, hasAnswered]);

  const startTimer = () => {
    if (timerRef.current) window.clearInterval(timerRef.current);
    setTimer(15);
    timerRef.current = window.setInterval(() => {
      setTimer((t) => t <= 1 ? 0 : t - 1);
    }, 1000);
  };

  const handleCreateArena = async () => {
    if (!playerName.trim()) return setError(" मिशन requires a Callsign.");
    if (!extractedText) return setError("Protocol Error: Study content required.");
    
    setIsLoading(true);
    try {
      const qs = await geminiService.generateLiveQuizQuestions(extractedText.substring(0, 5000), 7);
      const rid = await liveQuizService.createLiveQuizRoom(playerName, "Arena Combat", globalSubject || "Science", qs, true);
      setRoomId(rid);
    } catch (e: any) {
      setError("AI Engine Overheated. Try again.");
    } finally { setIsLoading(false); }
  };

  const handleJoinArena = async () => {
    if (!playerName.trim()) return setError("Identity missing.");
    const code = roomCodeInput.trim().toUpperCase();
    if (code.length < 5) return setError("Invalid Security Code.");
    setIsLoading(true);
    try {
      const rid = await liveQuizService.findRoomByCode(code);
      if (!rid) throw new Error("Arena not found.");
      await liveQuizService.joinLiveQuizRoom(rid, playerName);
      setRoomId(rid);
    } catch (e: any) { setError(e.message); } finally { setIsLoading(false); }
  };

  const handleAnswerSubmit = async (optionIndex: number) => {
    if (hasAnswered || timer <= 0 || !currentQuestion) return;
    setSelectedOption(optionIndex);
    // CRITICAL: Ensure property matching for correctness
    const isCorrect = optionIndex === currentQuestion.correctOptionIndex;
    const startTs = room?.questionStartTime?.toMillis() || Date.now();
    const stats = await liveQuizService.submitLiveAnswer(roomId!, isCorrect, startTs);
    setLastRoundStats(stats);
  };

  const renderEntry = () => (
    <div className="max-w-4xl mx-auto space-y-12 pb-20 px-6">
      <div className="text-center space-y-6">
        <UsersIcon className="w-16 md:w-24 h-16 md:h-24 text-cyan-400 mx-auto animate-pulse" />
        <h1 className="text-5xl md:text-[clamp(3.5rem,10vw,8rem)] font-black text-white italic tracking-tightest uppercase leading-none">THE ARENA</h1>
        <p className="text-slate-500 font-bold uppercase tracking-[0.4em] text-[10px]">Strategic Logic Combat Engine</p>
      </div>

      <div className="grid md:grid-cols-2 gap-8 md:gap-12">
            <Card variant="dark" className="!p-8 md:!p-12 border-white/5 space-y-10 !rounded-[3rem] relative shadow-2xl">
                <div className="absolute top-0 left-0 w-full h-1 bg-cyan-400"></div>
                <div className="space-y-6">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block">Identity Confirmation</label>
                    <input value={playerName} onChange={e => setPlayerName(e.target.value.toUpperCase())} placeholder="CALLSIGN..." className="w-full bg-slate-950 border border-white/10 p-6 md:p-8 rounded-[2rem] text-3xl md:text-4xl font-black text-center text-white outline-none italic" maxLength={12}/>
                </div>
            </Card>

            <div className="space-y-6 flex flex-col justify-center">
                {urlRoomCode ? (
                    <Button onClick={handleJoinArena} disabled={isLoading || !playerName.trim()} className="w-full h-24 md:h-32 !text-3xl md:!text-5xl !font-black !bg-white !text-black !rounded-[3rem] shadow-2xl italic">JOIN ARENA &rarr;</Button>
                ) : (
                    <>
                        <Button onClick={handleCreateArena} disabled={isLoading || !extractedText} className="w-full h-24 md:h-32 !text-3xl md:!text-5xl !font-black !bg-cyan-500 !text-black !rounded-[3rem] shadow-2xl italic">
                            {isLoading ? <Spinner colorClass="bg-black" /> : 'CREATE ARENA'}
                        </Button>
                        <div className="p-6 md:p-8 bg-slate-900/40 rounded-[2.5rem] border border-white/5 space-y-6">
                            <input value={roomCodeInput} onChange={e => setRoomCodeInput(e.target.value.toUpperCase())} placeholder="SECURITY CODE" className="w-full bg-slate-950 border border-white/10 p-4 rounded-xl text-lg font-black text-center text-white outline-none uppercase font-mono"/>
                            <Button onClick={handleJoinArena} variant="outline" className="w-full h-12 !text-[10px] font-black !rounded-xl">UPLINK TO ROOM</Button>
                        </div>
                    </>
                )}
            </div>
            {error && <p className="col-span-full text-red-500 text-center font-black uppercase text-[10px]">{error}</p>}
      </div>
    </div>
  );

  const renderLobby = () => (
    <div className="max-w-5xl mx-auto space-y-12 pb-40 px-6">
      <div className="flex flex-col md:flex-row justify-between items-end gap-6 border-b border-white/5 pb-10">
        <div>
          <h2 className="text-5xl md:text-8xl font-black text-white italic tracking-tightest uppercase leading-none">WAR ROOM</h2>
          <span className="inline-block mt-6 px-6 py-2 bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-[10px] font-black uppercase rounded-full">Arena Code: {room?.roomCode}</span>
        </div>
        <button onClick={() => { navigator.clipboard.writeText(`${window.location.origin}/#/live/${room?.roomCode}`); setCopySuccess(true); setTimeout(()=>setCopySuccess(false), 2000); }} className={`p-8 rounded-[2.5rem] border transition-all flex items-center gap-6 ${copySuccess ? 'bg-emerald-600 border-emerald-500 text-white' : 'bg-slate-950 border-white/10 text-slate-400 shadow-2xl'}`}>
            <span className="font-black text-sm uppercase italic">{copySuccess ? 'Link Copied' : 'Invite Ops'}</span>
            <ClipboardIcon className="w-8 h-8"/>
        </button>
      </div>

      <div className="grid lg:grid-cols-12 gap-10">
        <div className="lg:col-span-8 space-y-8">
          <p className="text-white/40 uppercase font-black text-[10px] tracking-widest italic">Synchronized Agents ({players.length})</p>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-6">
            {players.map((p) => (
              <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} key={p.uid} className={`p-8 md:p-10 border rounded-[3rem] text-center relative ${p.isAi ? 'bg-violet-600/5 border-violet-500/10' : 'bg-slate-900 border-white/5'}`}>
                <div className="w-16 h-16 md:w-20 md:h-20 rounded-[1.5rem] mx-auto mb-6 flex items-center justify-center text-4xl font-black text-white bg-slate-950 border border-white/5">{p.name[0]}</div>
                <p className="font-black text-white text-base md:text-xl uppercase truncate">{p.name}</p>
              </motion.div>
            ))}
          </div>
        </div>
        <div className="lg:col-span-4">
          <Card variant="dark" className="!p-10 md:!p-12 border-white/5 text-center space-y-10 !rounded-[4rem] shadow-2xl">
            <p className="text-slate-400 text-lg font-medium italic">Ready for deployment. Logic determine global ranking.</p>
            {room?.hostUid === currentUser?.uid ? (
              <Button onClick={() => liveQuizService.startLiveQuiz(roomId!)} size="lg" className="w-full h-20 md:h-24 !text-2xl md:!text-3xl !font-black !bg-white !text-black !rounded-3xl shadow-2xl italic">ENGAGE ENGINE &rarr;</Button>
            ) : (
              <div className="py-12 bg-slate-950 rounded-3xl border border-white/5 text-[10px] font-black uppercase tracking-widest text-slate-600 animate-pulse">Awaiting Authentication...</div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );

  const renderLive = () => (
    <div className="max-w-5xl mx-auto space-y-8 md:space-y-10 pb-40 px-4">
      <AnimatePresence>
        {showInsight && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[100] bg-black/98 backdrop-blur-4xl flex items-center justify-center p-6">
                <Card variant="dark" className="max-w-4xl w-full !p-10 md:!p-24 border-violet-500/20 relative overflow-hidden !rounded-[4rem] md:!rounded-[5rem] shadow-2xl text-center">
                    <div className="absolute top-0 left-0 w-full h-2 bg-violet-600">
                        <motion.div initial={{ width: '100%' }} animate={{ width: '0%' }} transition={{ duration: 5, ease: 'linear' }} className="h-full bg-cyan-400" />
                    </div>
                    {lastRoundStats && (
                        <div className="mb-10 md:mb-16 flex gap-6 md:gap-12 justify-center">
                             <div className="p-8 md:p-12 bg-white/5 rounded-[2.5rem] border border-white/10 flex-grow max-w-[280px]">
                                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-4">Round XP</p>
                                <p className={`text-6xl md:text-8xl font-black italic ${lastRoundStats.isCorrect ? 'text-emerald-400' : 'text-red-500'}`}>+{lastRoundStats.earnedPoints}</p>
                             </div>
                        </div>
                    )}
                    <MathRenderer text={currentQuestion?.explanation} className="!text-white text-xl md:!text-4xl font-medium leading-relaxed italic" />
                    <p className="mt-12 text-[10px] font-black text-slate-700 uppercase tracking-widest animate-pulse italic">Syncing Next Node...</p>
                </Card>
            </motion.div>
        )}
      </AnimatePresence>

      <div className="flex flex-col md:flex-row justify-between items-center gap-6 bg-slate-950 p-8 md:p-12 rounded-[3rem] md:rounded-[4rem] border border-white/10 shadow-2xl">
        <div className="flex items-center gap-6">
          <div className="w-16 h-16 md:w-20 md:h-20 rounded-2xl flex items-center justify-center text-3xl md:text-4xl font-black italic bg-violet-600">{timer}</div>
          <div className="hidden sm:block">
            <p className="text-[9px] font-black text-slate-600 uppercase tracking-widest mb-3">Time Stream</p>
            <div className="w-48 h-1.5 bg-white/5 rounded-full overflow-hidden shadow-inner"><motion.div animate={{ width: `${(timer/15)*100}%` }} className="h-full bg-cyan-400 shadow-[0_0_20px_#22d3ee]"/></div>
          </div>
        </div>
        <div className="text-center">
            <p className="text-xs md:text-sm font-black text-cyan-400 uppercase tracking-widest italic mb-1">NODE {room!.currentQuestionIndex + 1}</p>
            <p className="text-2xl md:text-4xl font-black text-white uppercase italic tracking-tightest">ARENA LIVE</p>
        </div>
        <div className="text-right">
            <p className="text-[9px] font-black text-slate-600 uppercase tracking-widest">Score</p>
            <p className="text-3xl md:text-5xl font-black text-emerald-400 italic leading-none">{players.find(p => p.uid === currentUser?.uid)?.score || 0}</p>
        </div>
      </div>

      <motion.div key={room?.currentQuestionIndex} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-8 md:space-y-12">
          <Card variant="dark" className="!p-10 md:!p-24 border-white/5 text-center relative overflow-hidden !rounded-[3rem] md:!rounded-[5rem] min-h-[300px] flex flex-col justify-center">
             <div className="absolute top-0 left-0 w-2 h-full bg-violet-600"></div>
             <MathRenderer text={currentQuestion?.questionText} className="!text-white text-2xl md:!text-7xl font-black italic tracking-tightest leading-tight" />
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-8">
            {currentQuestion?.options.map((opt, i) => (
              <button key={i} onClick={() => handleAnswerSubmit(i)} disabled={hasAnswered || timer <= 0} className={`p-8 md:p-12 rounded-[2rem] md:rounded-[4rem] border-2 text-left transition-all relative overflow-hidden group ${selectedOption === i ? 'bg-violet-600 border-violet-400 shadow-2xl scale-[1.02]' : (hasAnswered ? 'opacity-20 grayscale pointer-events-none' : 'bg-slate-900 border-white/5 hover:border-violet-500/40 hover:bg-slate-800')}`}>
                 <div className="flex items-center gap-6">
                    <div className={`w-12 h-12 md:w-16 md:h-16 rounded-xl md:rounded-[2rem] bg-slate-950 flex items-center justify-center font-black text-xl ${selectedOption === i ? 'bg-white text-black' : 'text-slate-700'}`}>{String.fromCharCode(65 + i)}</div>
                    <MathRenderer text={opt} className="text-xl md:!text-4xl !font-bold text-white tracking-tight" />
                 </div>
              </button>
            ))}
          </div>
      </motion.div>
    </div>
  );

  const renderFinished = () => {
    const sortedPlayers = [...players].sort((a, b) => b.score - a.score);
    return (
      <div className="max-w-5xl mx-auto space-y-12 md:space-y-24 pb-40 px-6 pt-10">
        <div className="text-center space-y-6">
          <StarIcon className="w-16 md:w-32 h-16 md:h-32 mx-auto text-amber-500 animate-pulse" />
          <h1 className="text-5xl md:text-[clamp(3rem,12vw,12rem)] font-black text-white italic tracking-tightest uppercase leading-[0.8] select-none">ZENITH<br/>CONQUERED</h1>
          <p className="text-slate-500 uppercase tracking-widest text-[10px] md:text-sm font-black italic">Arena Standings Finalized</p>
        </div>

        <div className="space-y-4 max-w-3xl mx-auto">
            {sortedPlayers.map((p, i) => (
                <div key={p.uid} className={`flex items-center justify-between p-8 border rounded-[2.5rem] md:rounded-[3.5rem] ${p.uid === currentUser?.uid ? 'bg-cyan-500/10 border-cyan-500/30' : 'bg-slate-950 border-white/5'}`}>
                    <div className="flex items-center gap-6">
                        <span className="text-2xl md:text-4xl font-black text-slate-800 italic">#{i+1}</span>
                        <div>
                            <p className="text-xl md:text-3xl font-black text-white uppercase">{p.name}</p>
                            <p className="text-[9px] text-slate-600 font-bold uppercase italic mt-1">{p.isAi ? 'Neural Engine' : 'Agent'}</p>
                        </div>
                    </div>
                    <p className="text-4xl md:text-6xl font-black text-cyan-400 italic">{p.score}</p>
                </div>
            ))}
        </div>

        <div className="flex flex-col md:flex-row gap-6 justify-center items-center pt-16 border-t border-white/5">
           <Button onClick={() => window.location.reload()} size="lg" className="h-24 md:h-32 px-12 md:px-24 !text-3xl md:!text-4xl !font-black !rounded-full !bg-white !text-black italic hover:scale-105 transition-all">RE-TRY &rarr;</Button>
           <Button onClick={() => navigate('/app')} variant="outline" className="h-20 md:h-32 px-8 md:px-16 !text-lg md:!text-2xl !font-black !rounded-full border-white/10 text-slate-600">EXIT ARENA</Button>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-[#010208] relative overflow-hidden">
      <div className="fixed inset-0 z-0 pointer-events-none opacity-20">
        <div className="absolute top-[-5%] left-[-10%] w-[90%] h-[90%] bg-violet-600/30 blur-[250px]"></div>
        <div className="absolute bottom-[-5%] right-[-10%] w-[90%] h-[90%] bg-cyan-600/30 blur-[250px]"></div>
      </div>
      <div className="relative z-10 pt-10 md:pt-20">
        <AnimatePresence mode="wait">
          {uiState === 'entry' && renderEntry()}
          {uiState === 'lobby' && renderLobby()}
          {uiState === 'live' && renderLive()}
          {uiState === 'finished' && renderFinished()}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default GroupQuizPage;
