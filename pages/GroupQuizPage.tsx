
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
  UsersIcon, StarIcon, CheckCircleIcon, XCircleIcon, ClipboardIcon, BoltIcon
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
                correctOptionIndex: Number(qData.correctOptionIndex) || 0, // FORCE NUMBER
                explanation: qData.explanation || "Logic verification complete."
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

  const handleAnswerSubmit = async (optionIndex: number) => {
    if (hasAnswered || timer <= 0 || !currentQuestion) return;
    setSelectedOption(optionIndex);
    
    // OMNI-FIX: ABSOLUTE STRICT NUMERICAL COMPARISON
    const isCorrect = Number(optionIndex) === Number(currentQuestion.correctOptionIndex);
    const startTs = room?.questionStartTime?.toMillis() || Date.now();
    const stats = await liveQuizService.submitLiveAnswer(roomId!, isCorrect, startTs);
    setLastRoundStats(stats);
  };

  const renderEntry = () => (
    <div className="max-w-4xl mx-auto space-y-12 pb-20 px-4 md:px-10">
      <div className="text-center space-y-6">
        <UsersIcon className="w-14 h-14 md:w-20 text-cyan-400 mx-auto animate-pulse" />
        <h1 className="text-4xl sm:text-6xl md:text-8xl font-black text-white italic tracking-tightest uppercase leading-none">THE ARENA</h1>
        <p className="text-slate-500 font-bold uppercase tracking-[0.3em] text-[10px]">Real-time Logic Combat Engine</p>
      </div>

      <div className="grid md:grid-cols-2 gap-8 md:gap-12">
            <Card variant="dark" className="!p-8 md:!p-12 border-white/5 space-y-10 !rounded-[2.5rem] md:!rounded-[3.5rem] relative shadow-2xl overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-1 bg-cyan-400 shadow-[0_0_20px_#22d3ee]"></div>
                <div className="space-y-6">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block">Identity Verification</label>
                    <input value={playerName} onChange={e => setPlayerName(e.target.value.toUpperCase())} placeholder="CALLSIGN..." className="w-full bg-slate-950 border border-white/10 p-6 md:p-8 rounded-3xl text-2xl md:text-4xl font-black text-center text-white outline-none focus:border-cyan-500 transition-all uppercase italic" maxLength={12}/>
                </div>
            </Card>

            <div className="space-y-6 flex flex-col justify-center">
                {urlRoomCode ? (
                    <Button onClick={() => {
                        const code = roomCodeInput.trim().toUpperCase();
                        liveQuizService.findRoomByCode(code).then(rid => {
                            if(rid) { setRoomId(rid); liveQuizService.joinLiveQuizRoom(rid, playerName); }
                            else setError("Arena connection failed.");
                        });
                    }} disabled={isLoading || !playerName.trim()} className="w-full h-20 md:h-28 !text-2xl md:!text-4xl !font-black !bg-white !text-black !rounded-[2rem] md:!rounded-[3rem] shadow-2xl italic hover:scale-105 transition-all">JOIN BATTLE &rarr;</Button>
                ) : (
                    <>
                        <Button onClick={async () => {
                            if(!playerName.trim() || !extractedText) return setError("Module sync required.");
                            setIsLoading(true);
                            try {
                                const qs = await geminiService.generateLiveQuizQuestions(extractedText.substring(0, 4500), 5);
                                const rid = await liveQuizService.createLiveQuizRoom(playerName, "Apex Combat", globalSubject || "Logic", qs, true);
                                setRoomId(rid);
                            } catch (e) { setError("AI Overheat. Retry."); } finally { setIsLoading(false); }
                        }} disabled={isLoading || !extractedText} className="w-full h-20 md:h-28 !text-2xl md:!text-4xl !font-black !bg-cyan-500 !text-black !rounded-[2rem] md:!rounded-[3rem] shadow-[0_0_50px_rgba(34,211,238,0.3)] italic group overflow-hidden transition-all">
                            <span className="relative z-10">{isLoading ? <Spinner colorClass="bg-black" /> : 'CREATE ARENA'}</span>
                        </Button>
                        <div className="p-6 md:p-8 bg-slate-900/40 rounded-[2.5rem] border border-white/5 space-y-6 shadow-inner">
                            <input value={roomCodeInput} onChange={e => setRoomCodeInput(e.target.value.toUpperCase())} placeholder="SECURITY CODE" className="w-full bg-slate-950 border border-white/10 p-4 rounded-xl text-lg font-black text-center text-white outline-none focus:border-violet-500 uppercase font-mono"/>
                            <Button onClick={async () => {
                                const rid = await liveQuizService.findRoomByCode(roomCodeInput);
                                if(rid) { setRoomId(rid); await liveQuizService.joinLiveQuizRoom(rid, playerName); }
                                else setError("Invalid Uplink Code.");
                            }} variant="outline" className="w-full h-12 !text-[10px] font-black tracking-widest uppercase !rounded-xl">UPLINK TO NODE</Button>
                        </div>
                    </>
                )}
            </div>
            {error && <p className="col-span-full text-red-500 text-center font-black uppercase text-[10px] tracking-widest animate-pulse">{error}</p>}
      </div>
    </div>
  );

  const renderLobby = () => (
    <div className="max-w-4xl mx-auto space-y-10 pb-40 px-6 pt-10">
      <div className="text-center space-y-4">
        <div className="inline-flex items-center gap-3 px-6 py-2 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-400">
          <div className="w-2 h-2 rounded-full bg-cyan-400 animate-ping"></div>
          <span className="text-[10px] font-black uppercase tracking-widest italic">Neural Connection Stable</span>
        </div>
        <h1 className="text-4xl sm:text-6xl md:text-8xl font-black text-white italic uppercase tracking-tightest leading-none drop-shadow-2xl">WAR ROOM</h1>
      </div>

      <div className="grid md:grid-cols-2 gap-8 md:gap-12">
        <Card variant="dark" className="!p-10 border-white/5 space-y-10 relative overflow-hidden !rounded-[3rem] md:!rounded-[4rem] shadow-2xl bg-gradient-to-b from-slate-900 to-black">
          <div className="absolute top-0 left-0 w-full h-1.5 bg-violet-600"></div>
          <div className="space-y-4">
            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Arena Access Cipher</p>
            <div className="flex items-center gap-6">
              <p className="text-5xl md:text-7xl font-black text-white tracking-tighter font-mono italic">{room?.roomCode}</p>
              <button 
                onClick={() => {
                  if (room?.roomCode) {
                    navigator.clipboard.writeText(`${window.location.origin}/#/live/${room.roomCode}`);
                    setCopySuccess(true);
                    setTimeout(() => setCopySuccess(false), 2000);
                  }
                }}
                className={`p-5 rounded-2xl transition-all shadow-xl ${copySuccess ? 'bg-emerald-500 text-black scale-110' : 'bg-white/5 hover:bg-white/10 text-slate-400'}`}
              >
                {copySuccess ? <CheckCircleIcon className="w-8 h-8"/> : <ClipboardIcon className="w-8 h-8"/>}
              </button>
            </div>
          </div>
          
          <div className="pt-8 border-t border-white/5">
            {room?.hostUid === currentUser?.uid ? (
              <Button onClick={() => liveQuizService.startLiveQuiz(roomId!)} className="w-full h-16 md:h-24 !text-xl md:!text-3xl !font-black !bg-white !text-black !rounded-3xl shadow-[0_20px_50px_rgba(255,255,255,0.2)] hover:scale-105 active:scale-95 transition-all italic">
                INITIALIZE COMBAT &rarr;
              </Button>
            ) : (
              <div className="text-center py-10 bg-slate-950 rounded-3xl border border-white/5 flex flex-col items-center gap-4">
                <Spinner colorClass="bg-violet-500" className="w-8 h-8" />
                <p className="text-[10px] font-black text-slate-600 uppercase tracking-[0.5em] animate-pulse italic">Awaiting Host Authorization...</p>
              </div>
            )}
          </div>
        </Card>

        <div className="space-y-6">
          <div className="flex items-center gap-4 px-4">
            <UsersIcon className="w-6 h-6 text-violet-500" />
            <h3 className="text-lg md:text-xl font-black text-white uppercase tracking-widest italic">Synchronized Agents ({players.length})</h3>
          </div>
          <div className="grid grid-cols-1 gap-4 max-h-[450px] overflow-y-auto pr-4 scrollbar-hide">
            {players.map(p => (
              <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} key={p.uid} className="p-6 bg-slate-900/60 border border-white/5 rounded-[2rem] flex items-center justify-between group hover:border-violet-500/30 transition-all shadow-lg">
                <div className="flex items-center gap-5">
                  <div className={`w-3.5 h-3.5 rounded-full ${p.isAi ? 'bg-violet-500' : 'bg-emerald-500'} shadow-[0_0_15px_currentColor]`}></div>
                  <span className="text-xl font-black text-white uppercase italic tracking-tight">{p.name}</span>
                </div>
                {p.isAi && <span className="text-[9px] font-black text-violet-400 uppercase tracking-widest bg-violet-500/10 px-3 py-1.5 rounded-lg border border-violet-500/20">Neural Engine</span>}
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );

  const renderLive = () => (
    <div className="max-w-5xl mx-auto space-y-6 md:space-y-10 pb-40 px-4 md:px-10 pt-4">
      <AnimatePresence>
        {showInsight && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[150] bg-black/98 backdrop-blur-3xl flex items-center justify-center p-6">
                <Card variant="dark" className="max-w-4xl w-full !p-8 md:!p-24 border-violet-500/20 relative !rounded-[4rem] md:!rounded-[6rem] shadow-[0_0_150px_rgba(139,92,246,0.2)] text-center">
                    <div className="absolute top-0 left-0 w-full h-2 bg-violet-600 overflow-hidden">
                        <motion.div initial={{ width: '100%' }} animate={{ width: '0%' }} transition={{ duration: 5, ease: 'linear' }} className="h-full bg-cyan-400 shadow-[0_0_20px_#22d3ee]" />
                    </div>
                    {lastRoundStats && (
                        <div className="mb-10 md:mb-16 flex gap-6 md:gap-12 justify-center">
                             <div className="p-8 md:p-12 bg-white/5 rounded-[3rem] border border-white/10 flex-grow max-w-[280px] shadow-2xl">
                                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-4 italic">Round XP Yield</p>
                                <p className={`text-6xl md:text-8xl font-black italic tracking-tighter ${lastRoundStats.isCorrect ? 'text-emerald-400 drop-shadow-[0_0_20px_#10b981]' : 'text-red-500'}`}>+{lastRoundStats.earnedPoints}</p>
                             </div>
                        </div>
                    )}
                    <div className="max-h-[35vh] overflow-y-auto pr-4 scrollbar-hide">
                        <MathRenderer text={currentQuestion?.explanation} className="!text-white text-xl md:!text-4xl font-medium leading-relaxed italic" />
                    </div>
                    <p className="mt-12 text-[10px] md:text-xs font-black text-slate-700 uppercase tracking-[1em] animate-pulse italic">Syncing Next Decision Gate...</p>
                </Card>
            </motion.div>
        )}
      </AnimatePresence>

      <div className="flex flex-col md:flex-row justify-between items-center gap-6 bg-slate-950 p-6 md:p-12 rounded-[3rem] md:rounded-[4rem] border border-white/10 shadow-[0_40px_100px_rgba(0,0,0,0.8)]">
        <div className="flex items-center gap-6">
          <div className={`w-16 h-16 md:w-20 md:h-20 rounded-[1.5rem] md:rounded-[2rem] flex items-center justify-center text-3xl md:text-4xl font-black italic transition-all duration-300 shadow-2xl ${timer < 5 ? 'bg-red-500 animate-pulse scale-110 shadow-red-500/20' : 'bg-violet-600 shadow-violet-600/20'}`}>{timer}</div>
          <div className="hidden sm:block">
            <p className="text-[10px] font-black text-slate-600 uppercase tracking-widest mb-2">Time Flux</p>
            <div className="w-48 h-2 bg-white/5 rounded-full overflow-hidden shadow-inner"><motion.div animate={{ width: `${(timer/15)*100}%` }} className="h-full bg-cyan-400 shadow-[0_0_15px_#22d3ee]"/></div>
          </div>
        </div>
        <div className="text-center px-4">
            <p className="text-xs md:text-sm font-black text-cyan-400 uppercase tracking-[0.6em] italic mb-1">DECISION NODE {room!.currentQuestionIndex + 1}</p>
            <p className="text-3xl md:text-5xl font-black text-white uppercase italic tracking-tightest leading-none drop-shadow-2xl">ARENA LIVE</p>
        </div>
        <div className="text-right">
            <p className="text-[10px] font-black text-slate-600 uppercase tracking-widest mb-1 italic">Agent XP</p>
            <p className="text-4xl md:text-6xl font-black text-emerald-400 italic leading-none drop-shadow-[0_0_20px_#10b981]">{players.find(p => p.uid === currentUser?.uid)?.score || 0}</p>
        </div>
      </div>

      <motion.div key={room?.currentQuestionIndex} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-8 md:space-y-12">
          <Card variant="dark" className="!p-10 md:!p-24 border-white/5 text-center relative overflow-hidden !rounded-[3rem] md:!rounded-[5rem] min-h-[250px] md:min-h-[400px] flex flex-col justify-center shadow-[0_60px_150px_rgba(0,0,0,1)] bg-[#03050a]">
             <div className="absolute top-0 left-0 w-2 md:w-3 h-full bg-violet-600 shadow-2xl"></div>
             <MathRenderer text={currentQuestion?.questionText} className="!text-white text-3xl md:!text-7xl font-black italic tracking-tightest leading-tight md:leading-none drop-shadow-2xl" />
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-8">
            {currentQuestion?.options.map((opt, i) => (
              <button 
                key={i} 
                onClick={() => handleAnswerSubmit(i)} 
                disabled={hasAnswered || timer <= 0} 
                className={`p-8 md:p-12 rounded-[2rem] md:rounded-[4rem] border-2 text-left transition-all relative group overflow-hidden ${
                    selectedOption === i 
                        ? 'bg-violet-600 border-violet-400 shadow-[0_0_60px_rgba(139,92,246,0.4)] scale-[1.02] z-10' 
                        : (hasAnswered ? 'opacity-20 grayscale pointer-events-none' : 'bg-slate-900 border-white/5 hover:border-violet-500/40 hover:bg-slate-800 shadow-xl')
                }`}
              >
                 <div className="flex items-center gap-6 md:gap-10 relative z-10">
                    <div className={`w-12 h-12 md:w-16 md:h-16 rounded-[1.2rem] md:rounded-[2rem] bg-slate-950 flex items-center justify-center font-black text-xl md:text-2xl transition-colors ${selectedOption === i ? 'bg-white text-black' : 'text-slate-700 group-hover:bg-white group-hover:text-black'}`}>{String.fromCharCode(65 + i)}</div>
                    <MathRenderer text={opt} className="text-xl md:!text-4xl !font-bold text-white tracking-tight leading-tight" />
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
      <div className="max-w-5xl mx-auto space-y-16 md:space-y-24 pb-40 px-6 pt-10">
        <div className="text-center space-y-6">
          <StarIcon className="w-16 h-16 md:w-32 text-amber-500 animate-pulse mx-auto drop-shadow-[0_0_50px_rgba(245,158,11,0.5)]" />
          <h1 className="text-5xl md:text-[clamp(4rem,10vw,12rem)] font-black text-white italic tracking-tightest uppercase leading-[0.8] select-none break-words">ZENITH<br/>CONQUERED</h1>
          <p className="text-slate-500 uppercase tracking-[1em] text-[10px] md:text-sm font-black italic">Arena Standings Finalized</p>
        </div>

        <div className="space-y-4 max-w-4xl mx-auto">
            {sortedPlayers.map((p, i) => (
                <div key={p.uid} className={`flex items-center justify-between p-8 border !rounded-[2.5rem] md:!rounded-[4rem] shadow-2xl transition-all duration-700 ${p.uid === currentUser?.uid ? 'bg-cyan-500/10 border-cyan-500/30' : 'bg-slate-950 border-white/5'}`}>
                    <div className="flex items-center gap-6 md:gap-12">
                        <span className={`text-3xl md:text-5xl font-black italic transition-colors ${i === 0 ? 'text-amber-400' : 'text-slate-800'}`}>#{i+1}</span>
                        <div>
                            <p className="text-2xl md:text-4xl font-black text-white uppercase italic tracking-tighter truncate max-w-[150px] md:max-w-none">{p.name}</p>
                            <p className="text-[9px] md:text-[11px] text-slate-600 font-bold uppercase italic tracking-widest mt-1">{p.isAi ? 'Neural Core Engine' : 'Apex Human Operator'}</p>
                        </div>
                    </div>
                    <p className="text-4xl md:text-7xl font-black text-cyan-400 italic tracking-tighter">{p.score}</p>
                </div>
            ))}
        </div>

        <div className="flex flex-col sm:flex-row gap-6 md:gap-10 justify-center items-center pt-20 border-t border-white/5">
           <Button onClick={() => window.location.reload()} size="lg" className="w-full sm:w-80 h-20 md:h-28 !text-2xl md:!text-3xl !font-black !rounded-full !bg-white !text-black italic hover:scale-110 active:scale-95 transition-all shadow-[0_20px_60px_rgba(255,255,255,0.2)]">RE-TRY BATTLE &rarr;</Button>
           <Button onClick={() => navigate('/app')} variant="outline" className="w-full sm:w-80 h-16 md:h-24 !text-lg md:!text-xl !font-black !rounded-full border-white/10 text-slate-600 uppercase tracking-widest hover:text-white transition-colors italic">EXIT COMMAND</Button>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-[#010208] relative overflow-hidden selection:bg-cyan-500/30">
      {/* GLOBAL DYNAMIC ATMOSPHERE */}
      <div className="fixed inset-0 z-0 pointer-events-none opacity-[0.08]">
        <div className="absolute top-[-10%] left-[-10%] w-[120%] h-[120%] bg-violet-600/30 blur-[280px]"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[120%] h-[120%] bg-cyan-600/30 blur-[280px]"></div>
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
