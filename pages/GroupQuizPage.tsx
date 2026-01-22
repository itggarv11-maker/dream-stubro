
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
  CheckCircleIcon, XCircleIcon, SparklesIcon, ClipboardIcon,
  BoltIcon, ShieldCheckIcon, UploadIcon
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
        const q = await liveQuizService.getQuestion(roomId!, room.currentQuestionIndex);
        setCurrentQuestion(q);
        setSelectedOption(null);
        setShowInsight(false);
        setLastRoundStats(null);
        startTimer();
      };
      loadQ();
    }
  }, [uiState, room?.currentQuestionIndex]);

  useEffect(() => {
    if (uiState === 'live' && room?.hostUid === currentUser?.uid) {
      const allHumansAnswered = players.filter(p => !p.isAi).every(p => p.hasAnswered);
      if (timer === 0 || allHumansAnswered) {
        if (!insightTimeoutRef.current) {
            insightTimeoutRef.current = window.setTimeout(async () => {
                const qCount = (await liveQuizService.getAllQuestions(roomId!)).length;
                await liveQuizService.nextLiveQuestion(roomId!, room.currentQuestionIndex + 1, qCount);
                insightTimeoutRef.current = null;
            }, 4000);
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
    if (!playerName.trim()) return setError("Mission requires a Callsign.");
    if (!extractedText) return setError("Protocol Error: Neural stream offline. Sync content first.");
    
    setIsLoading(true);
    try {
      const qs = await geminiService.generateLiveQuizQuestions(extractedText.substring(0, 5000), 7);
      const rid = await liveQuizService.createLiveQuizRoom(playerName, globalSubject || "Apex Arena", globalSubject || "Science", qs, true);
      setRoomId(rid);
    } catch (e: any) {
      setError("AI Core Overheated. Try again or use a shorter chapter.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleJoinArena = async () => {
    if (!playerName.trim()) return setError("Mission requires a Callsign.");
    if (roomCodeInput.length < 5) return setError("Invalid Security Code.");
    setIsLoading(true);
    try {
      const rid = await liveQuizService.findRoomByCode(roomCodeInput);
      if (!rid) throw new Error("Arena not found or combat ended.");
      await liveQuizService.joinLiveQuizRoom(rid, playerName);
      setRoomId(rid);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAnswerSubmit = async (optionIndex: number) => {
    if (hasAnswered || timer <= 0 || !currentQuestion) return;
    setSelectedOption(optionIndex);
    const isCorrect = optionIndex === currentQuestion.correctOptionIndex;
    const startTs = room?.questionStartTime?.toMillis() || Date.now();
    const stats = await liveQuizService.submitLiveAnswer(roomId!, isCorrect, startTs);
    setLastRoundStats(stats);
  };

  const renderEntry = () => (
    <div className="max-w-4xl mx-auto space-y-12 pb-40">
      <div className="text-center space-y-6">
        <UsersIcon className="w-24 h-24 text-cyan-400 mx-auto animate-pulse" />
        <h1 className="text-8xl font-black text-white italic tracking-tightest uppercase leading-none">THE ARENA</h1>
        <p className="text-slate-500 font-bold uppercase tracking-[0.5em] text-[10px]">Real-time Cross-Level Combat Engine</p>
      </div>

      <div className="grid md:grid-cols-2 gap-10">
            <Card variant="dark" className="!p-10 border-white/5 space-y-10 !rounded-[3rem] relative overflow-hidden shadow-2xl">
                <div className="absolute top-0 left-0 w-full h-1 bg-cyan-400 shadow-[0_0_20px_#22d3ee]"></div>
                <div className="space-y-8">
                    <div>
                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-4 block">Identity Verification</label>
                        <input 
                            value={playerName} 
                            onChange={e => setPlayerName(e.target.value.toUpperCase())} 
                            placeholder="CALLSIGN..." 
                            className="w-full bg-slate-950 border border-white/10 p-8 rounded-3xl text-4xl font-black text-center text-white focus:border-cyan-500 outline-none uppercase italic"
                            maxLength={12}
                        />
                    </div>
                </div>
            </Card>

            <div className="space-y-8">
                {urlRoomCode ? (
                    <Button onClick={handleJoinArena} disabled={isLoading || !playerName.trim()} className="w-full h-32 !text-4xl !font-black !bg-white !text-black !rounded-[3rem] shadow-2xl italic hover:scale-105 transition-all">JOIN COMBAT &rarr;</Button>
                ) : (
                    <>
                        <Button onClick={handleCreateArena} disabled={isLoading || !extractedText} className="w-full h-32 !text-4xl !font-black !bg-cyan-500 !text-black !rounded-[3rem] shadow-[0_0_50px_rgba(34,211,238,0.3)] group relative overflow-hidden italic hover:scale-105 transition-all">
                            <span className="relative z-10">{isLoading ? <Spinner colorClass="bg-black" /> : 'CREATE ARENA'}</span>
                        </Button>
                        <div className="p-8 bg-slate-950 rounded-[2.5rem] border border-white/5 space-y-6">
                            <input value={roomCodeInput} onChange={e => setRoomCodeInput(e.target.value.toUpperCase())} placeholder="INPUT SECURITY CODE" className="w-full bg-slate-900 border border-white/10 p-5 rounded-2xl text-xl font-black text-center text-white outline-none focus:border-violet-500 uppercase font-mono"/>
                            <Button onClick={handleJoinArena} variant="outline" className="w-full h-14 !text-xs !font-black uppercase tracking-[0.2em] !rounded-xl">UPLINK TO ROOM</Button>
                        </div>
                    </>
                )}
            </div>
            {error && <p className="col-span-full text-red-500 text-center font-black uppercase text-[10px] tracking-widest">{error}</p>}
      </div>
    </div>
  );

  const renderLobby = () => (
    <div className="max-w-5xl mx-auto space-y-12 pb-40">
      <div className="flex flex-col md:flex-row justify-between items-end gap-6 border-b border-white/5 pb-10">
        <div>
          <h2 className="text-6xl md:text-8xl font-black text-white italic tracking-tightest uppercase leading-none">WAR ROOM</h2>
          <div className="flex gap-4 mt-6">
              <span className="px-6 py-2 bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-[10px] font-black uppercase rounded-full tracking-widest shadow-inner">Code: {room?.roomCode}</span>
          </div>
        </div>
        <button onClick={() => { navigator.clipboard.writeText(`${window.location.origin}/#/live/${room?.roomCode}`); setCopySuccess(true); setTimeout(()=>setCopySuccess(false), 2000); }} className={`p-8 rounded-[2.5rem] border transition-all flex items-center gap-6 ${copySuccess ? 'bg-emerald-600 border-emerald-500 text-white' : 'bg-slate-900 border-white/10 text-slate-400 hover:text-white hover:bg-slate-800 shadow-2xl'}`}>
            <span className="font-black text-sm uppercase tracking-widest italic">{copySuccess ? 'Link Copied' : 'Invite Combatants'}</span>
            <ClipboardIcon className="w-8 h-8"/>
        </button>
      </div>

      <div className="grid lg:grid-cols-12 gap-10">
        <div className="lg:col-span-8 space-y-8">
          <p className="text-white/40 uppercase font-black text-[11px] tracking-[0.5em] italic">Combatants Synchronized ({players.length})</p>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-6">
            {players.map((p) => (
              <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} key={p.uid} className={`p-10 border rounded-[3rem] text-center relative group overflow-hidden ${p.isAi ? 'bg-violet-600/5 border-violet-500/10' : 'bg-slate-900/60 border-white/5 shadow-xl'}`}>
                <div className={`w-24 h-24 rounded-[2rem] mx-auto mb-6 flex items-center justify-center text-5xl font-black text-white shadow-2xl ${p.isAi ? 'bg-violet-600 shadow-violet-600/20' : 'bg-slate-950 border border-white/5'}`}>{p.name[0]}</div>
                <p className="font-black text-white text-xl uppercase tracking-tighter truncate">{p.name}</p>
                <p className="text-[9px] font-bold text-slate-600 uppercase mt-2 tracking-widest italic">{p.isAi ? 'Neural Bot' : 'Human Operator'}</p>
              </motion.div>
            ))}
          </div>
        </div>
        <div className="lg:col-span-4">
          <Card variant="dark" className="!p-12 border-white/5 text-center space-y-10 !rounded-[4rem] shadow-[0_40px_100px_rgba(0,0,0,1)] relative overflow-hidden bg-gradient-to-b from-slate-900 to-black">
            <div className="absolute top-0 left-0 w-full h-1 bg-violet-600"></div>
            <UsersIcon className="w-16 h-16 text-violet-500 mx-auto" />
            <p className="text-slate-400 text-lg font-medium italic leading-relaxed">System ready for deployment. Battle results will determine global logic ranking.</p>
            {room?.hostUid === currentUser?.uid ? (
              <Button onClick={() => liveQuizService.startLiveQuiz(roomId!)} size="lg" className="w-full h-24 !text-3xl !font-black !bg-white !text-black !rounded-3xl shadow-2xl hover:scale-105 transition-all italic">ENGAGE ENGINE &rarr;</Button>
            ) : (
              <div className="py-12 bg-slate-950 rounded-3xl border border-white/5 text-xs font-black uppercase tracking-[0.4em] text-slate-600 animate-pulse italic">Awaiting Authorization...</div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );

  const renderLive = () => (
    <div className="max-w-5xl mx-auto space-y-10 pb-40">
      <AnimatePresence>
        {showInsight && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-4xl flex items-center justify-center p-6">
                <Card variant="dark" className="max-w-4xl w-full !p-16 md:!p-24 border-violet-500/20 relative overflow-hidden !rounded-[5rem] shadow-[0_80px_200px_rgba(0,0,0,1)] text-center">
                    <div className="absolute top-0 left-0 w-full h-2 bg-violet-600 overflow-hidden">
                        <motion.div initial={{ width: '100%' }} animate={{ width: '0%' }} transition={{ duration: 4, ease: 'linear' }} className="h-full bg-cyan-400 shadow-[0_0_20px_#22d3ee]" />
                    </div>
                    {lastRoundStats && (
                        <div className="mb-16 flex gap-12 justify-center">
                             <div className="p-12 bg-white/5 rounded-[3rem] border border-white/10 flex-grow max-w-[280px]">
                                <p className="text-[11px] font-black text-slate-500 uppercase tracking-widest mb-4">Round Points</p>
                                <p className={`text-8xl font-black italic ${lastRoundStats.isCorrect ? 'text-emerald-400' : 'text-red-500'}`}>+{lastRoundStats.earnedPoints}</p>
                             </div>
                             <div className="p-12 bg-white/5 rounded-[3rem] border border-white/10 flex-grow max-w-[280px]">
                                <p className="text-[11px] font-black text-slate-500 uppercase tracking-widest mb-4">Arena Rank</p>
                                <p className="text-8xl font-black text-cyan-400 italic">#{players.findIndex(p => p.uid === currentUser?.uid) + 1}</p>
                             </div>
                        </div>
                    )}
                    <MathRenderer text={currentQuestion?.explanation} className="!text-white !text-3xl md:!text-4xl font-medium leading-relaxed italic" />
                    <p className="mt-16 text-[11px] font-black text-slate-700 uppercase tracking-[1em] animate-pulse italic">Syncing Next Node...</p>
                </Card>
            </motion.div>
        )}
      </AnimatePresence>

      <div className="flex justify-between items-center bg-slate-900/90 p-12 rounded-[4rem] border border-white/10 backdrop-blur-3xl shadow-2xl">
        <div className="flex items-center gap-10">
          <div className={`w-20 h-20 rounded-[2rem] flex items-center justify-center text-4xl font-black italic transition-all ${timer < 5 ? 'bg-red-500 animate-pulse' : 'bg-violet-600 shadow-[0_0_40px_rgba(124,58,237,0.5)]'}`}>{timer}</div>
          <div>
            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3">Time Remaining</p>
            <div className="w-56 h-2 bg-white/5 rounded-full overflow-hidden shadow-inner"><motion.div animate={{ width: `${(timer/15)*100}%` }} className="h-full bg-cyan-400 shadow-[0_0_20px_#22d3ee]"/></div>
          </div>
        </div>
        <div className="text-center">
            <p className="text-sm font-black text-cyan-400 uppercase tracking-[0.6em] italic mb-2">Gate {room!.currentQuestionIndex + 1}</p>
            <p className="text-4xl font-black text-white uppercase italic tracking-tightest">ARENA LIVE</p>
        </div>
        <div className="text-right">
            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Current XP</p>
            <p className="text-5xl font-black text-emerald-400 italic leading-none">{players.find(p => p.uid === currentUser?.uid)?.score || 0}</p>
        </div>
      </div>

      <motion.div key={room?.currentQuestionIndex} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="space-y-12">
          <Card variant="dark" className="!p-20 border-white/5 text-center relative overflow-hidden shadow-[0_60px_150px_rgba(0,0,0,1)] !rounded-[5rem] min-h-[400px] flex flex-col justify-center">
             <div className="absolute top-0 left-0 w-3 h-full bg-violet-600"></div>
             <MathRenderer text={currentQuestion?.questionText} className="!text-white !text-5xl md:!text-7xl font-black italic tracking-tightest leading-[1.05]" />
          </Card>

          <div className="grid md:grid-cols-2 gap-8">
            {currentQuestion?.options.map((opt, i) => (
              <button 
                key={i} 
                onClick={() => handleAnswerSubmit(i)}
                disabled={hasAnswered || timer <= 0}
                className={`p-12 rounded-[4rem] border-2 text-left transition-all relative overflow-hidden group ${
                  selectedOption === i 
                    ? 'bg-violet-600 border-violet-400 shadow-[0_0_60px_rgba(124,58,237,0.4)]'
                    : (hasAnswered ? 'opacity-20 grayscale pointer-events-none' : 'bg-slate-900/60 border-white/5 hover:border-violet-500/40 hover:bg-slate-800 shadow-xl')
                }`}
              >
                 <div className="flex items-center gap-10">
                    <div className={`w-16 h-16 rounded-[2rem] bg-slate-950 flex items-center justify-center font-black text-2xl ${selectedOption === i ? 'bg-white text-black scale-110 shadow-2xl' : 'text-slate-700 group-hover:bg-white group-hover:text-black'}`}>{String.fromCharCode(65 + i)}</div>
                    <MathRenderer text={opt} className="!text-2xl md:!text-4xl !font-bold text-white tracking-tight" />
                 </div>
              </button>
            ))}
          </div>
      </motion.div>
    </div>
  );

  const renderFinished = () => {
    const sortedPlayers = [...players].sort((a, b) => b.score - a.score);
    const podium = sortedPlayers.slice(0, 3);
    return (
      <div className="max-w-6xl mx-auto space-y-24 pb-40 px-4">
        <div className="text-center space-y-6">
          <StarIcon className="w-32 h-32 mx-auto text-amber-500 animate-pulse drop-shadow-[0_0_50px_rgba(245,158,11,0.6)]" />
          <h1 className="text-8xl md:text-[14rem] font-black text-white italic tracking-tightest uppercase leading-[0.7] select-none">ZENITH<br/>CONQUERED</h1>
          <p className="text-slate-500 uppercase tracking-[2em] text-sm font-black italic">Rankings Finalized</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-12 items-end">
           {podium[1] && (
             <Card variant="dark" className="!p-12 border-white/5 text-center space-y-6 !rounded-[4rem] scale-95 opacity-80 shadow-2xl bg-slate-900/40">
                <p className="text-7xl font-black text-slate-800 italic mb-4 uppercase">II</p>
                <p className="text-3xl font-black text-white uppercase truncate tracking-tight">{podium[1].name}</p>
                <p className="text-6xl font-black text-slate-400 italic">{podium[1].score}</p>
             </Card>
           )}
           {podium[0] && (
             <Card variant="dark" className="!p-20 border-amber-500/40 text-center space-y-10 !rounded-[5rem] shadow-[0_0_150px_rgba(245,158,11,0.3)] bg-amber-500/5 relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-2 bg-amber-500 shadow-2xl"></div>
                <div className="w-40 h-40 bg-amber-500 text-black rounded-[3rem] mx-auto flex items-center justify-center text-9xl font-black italic rotate-3 shadow-2xl border-8 border-white/20">1</div>
                <p className="text-5xl font-black text-white uppercase tracking-tightest truncate drop-shadow-2xl">{podium[0].name}</p>
                <p className="text-9xl font-black text-amber-400 italic tracking-tightest leading-none drop-shadow-[0_0_50px_rgba(245,158,11,0.5)]">{podium[0].score}</p>
                <p className="text-[12px] font-black text-amber-600 uppercase tracking-[1em] italic">Apex Intelligence</p>
             </Card>
           )}
           {podium[2] && (
             <Card variant="dark" className="!p-12 border-white/5 text-center space-y-6 !rounded-[4rem] scale-90 opacity-60 shadow-2xl bg-slate-900/40">
                <p className="text-7xl font-black text-slate-800 italic mb-4 uppercase">III</p>
                <p className="text-3xl font-black text-white uppercase truncate tracking-tight">{podium[2].name}</p>
                <p className="text-6xl font-black text-slate-400 italic">{podium[2].score}</p>
             </Card>
           )}
        </div>

        <div className="space-y-6 max-w-4xl mx-auto">
             <div className="flex items-center gap-10 justify-center opacity-30 mb-20">
                <div className="h-px flex-grow bg-gradient-to-r from-transparent to-white"></div>
                <h4 className="text-[11px] font-black text-white uppercase tracking-[2em] italic whitespace-nowrap">Arena History Dossier</h4>
                <div className="h-px flex-grow bg-gradient-to-l from-transparent to-white"></div>
             </div>
             <div className="space-y-6">
                {sortedPlayers.map((p, i) => (
                  <motion.div initial={{ x: -20, opacity: 0 }} whileInView={{ x: 0, opacity: 1 }} key={p.uid} className={`flex items-center justify-between p-12 border rounded-[3.5rem] group transition-all duration-700 ${p.uid === currentUser?.uid ? 'bg-cyan-500/10 border-cyan-500/30' : 'bg-slate-900/40 border-white/5 hover:border-violet-500/30'}`}>
                     <div className="flex items-center gap-12">
                       <span className="text-4xl font-black text-slate-800 italic group-hover:text-violet-500 transition-all">#{i+1}</span>
                       <div>
                          <p className="text-3xl font-black text-white uppercase tracking-widest">{p.name}</p>
                          <p className="text-[10px] font-bold text-slate-600 uppercase tracking-[0.4em] mt-2 italic">{p.isAi ? 'AI Engine' : 'Human Operator'}</p>
                       </div>
                     </div>
                     <p className="text-6xl font-black text-cyan-400 italic group-hover:scale-110 transition-transform">{p.score}</p>
                  </motion.div>
                ))}
             </div>
        </div>

        <div className="flex flex-col md:flex-row gap-10 justify-center items-center pt-24 border-t border-white/5">
           <Button onClick={() => window.location.reload()} size="lg" className="h-32 px-24 !text-4xl !font-black !rounded-full !bg-white !text-black shadow-2xl italic hover:scale-105 transition-all group">
              RE-TRY ARENA
              <RocketLaunchIcon className="w-10 h-10 group-hover:translate-x-3 transition-transform ml-4"/>
           </Button>
           <Button onClick={() => navigate('/app')} variant="outline" className="h-32 px-16 !text-2xl !font-black !rounded-full italic border-white/10 hover:border-white/30 text-slate-600">EXIT HQ</Button>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-[#010208] px-4 py-24 relative overflow-hidden">
      <div className="fixed inset-0 z-0 pointer-events-none opacity-30">
        <div className="absolute top-[-20%] left-[-10%] w-[70%] h-[70%] bg-violet-600/20 blur-[300px] animate-pulse"></div>
        <div className="absolute bottom-[-20%] right-[-10%] w-[70%] h-[70%] bg-cyan-600/20 blur-[300px] animate-pulse"></div>
      </div>
      <div className="relative z-10">
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
