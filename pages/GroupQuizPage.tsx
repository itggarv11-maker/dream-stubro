
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
                questionText: qData.questionText || qData.question || qData.text || "Synchronizing...",
                options: qData.options || [],
                correctOptionIndex: parseInt(String(qData.correctOptionIndex)) || 0,
                explanation: qData.explanation || "Logic verified."
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

  const handleAnswerSubmit = async (optionIndex: number) => {
    if (hasAnswered || timer <= 0 || !currentQuestion) return;
    setSelectedOption(optionIndex);
    // ABSOLUTE COMPARISON FIX: Ensure index types match
    const isCorrect = Number(optionIndex) === Number(currentQuestion.correctOptionIndex);
    const startTs = room?.questionStartTime?.toMillis() || Date.now();
    const stats = await liveQuizService.submitLiveAnswer(roomId!, isCorrect, startTs);
    setLastRoundStats(stats);
  };

  const renderEntry = () => (
    <div className="max-w-4xl mx-auto space-y-8 pb-20 px-4">
      <div className="text-center space-y-4">
        <UsersIcon className="w-12 h-12 md:w-20 text-cyan-400 mx-auto animate-pulse" />
        <h1 className="text-4xl md:text-7xl font-black text-white italic uppercase leading-tight tracking-tightest">THE ARENA</h1>
        <p className="text-slate-500 font-bold uppercase tracking-[0.3em] text-[9px]">Universal Combat Node</p>
      </div>

      <div className="grid md:grid-cols-2 gap-6 md:gap-10">
            <Card variant="dark" className="!p-6 md:!p-10 border-white/5 space-y-6 !rounded-[2.5rem] relative">
                <div className="absolute top-0 left-0 w-full h-1 bg-cyan-400"></div>
                <div className="space-y-4">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block">Identity Confirmation</label>
                    <input value={playerName} onChange={e => setPlayerName(e.target.value.toUpperCase())} placeholder="CALLSIGN..." className="w-full bg-slate-950 border border-white/10 p-4 md:p-6 rounded-[1.5rem] text-2xl md:text-3xl font-black text-center text-white outline-none italic" maxLength={12}/>
                </div>
            </Card>

            <div className="space-y-4 flex flex-col justify-center">
                {urlRoomCode ? (
                    <Button onClick={() => {
                        const code = roomCodeInput.trim().toUpperCase();
                        liveQuizService.findRoomByCode(code).then(rid => {
                            if(rid) { setRoomId(rid); liveQuizService.joinLiveQuizRoom(rid, playerName); }
                            else setError("Arena not found.");
                        });
                    }} disabled={isLoading || !playerName.trim()} className="w-full h-16 md:h-24 !text-xl md:!text-3xl !font-black !bg-white !text-black !rounded-[2rem] shadow-2xl">JOIN COMBAT &rarr;</Button>
                ) : (
                    <>
                        <Button onClick={async () => {
                            if(!playerName.trim() || !extractedText) return;
                            setIsLoading(true);
                            try {
                                const qs = await geminiService.generateLiveQuizQuestions(extractedText.substring(0, 4000), 5);
                                const rid = await liveQuizService.createLiveQuizRoom(playerName, "Live Battle", globalSubject || "Science", qs, true);
                                setRoomId(rid);
                            } catch (e) { setError("AI Sync Failed."); } finally { setIsLoading(false); }
                        }} disabled={isLoading || !extractedText} className="w-full h-16 md:h-24 !text-xl md:!text-3xl !font-black !bg-cyan-500 !text-black !rounded-[2rem] shadow-2xl">
                            {isLoading ? <Spinner colorClass="bg-black" /> : 'CREATE ARENA'}
                        </Button>
                        <div className="p-4 md:p-6 bg-slate-900/40 rounded-[2rem] border border-white/5 space-y-4">
                            <input value={roomCodeInput} onChange={e => setRoomCodeInput(e.target.value.toUpperCase())} placeholder="CODE" className="w-full bg-slate-950 border border-white/10 p-3 rounded-lg text-lg font-black text-center text-white outline-none uppercase font-mono"/>
                            <Button onClick={async () => {
                                const rid = await liveQuizService.findRoomByCode(roomCodeInput);
                                if(rid) { setRoomId(rid); await liveQuizService.joinLiveQuizRoom(rid, playerName); }
                                else setError("Invalid Code.");
                            }} variant="outline" className="w-full h-10 !text-[10px] font-black">UPLINK NODE</Button>
                        </div>
                    </>
                )}
            </div>
            {error && <p className="col-span-full text-red-500 text-center font-black uppercase text-[10px] tracking-widest">{error}</p>}
      </div>
    </div>
  );

  // Added missing renderLobby function to fix compilation error.
  const renderLobby = () => (
    <div className="max-w-4xl mx-auto space-y-12 pb-20 px-4 pt-10">
      <div className="text-center space-y-4">
        <div className="inline-flex items-center gap-3 px-6 py-2 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-400">
          <div className="w-2 h-2 rounded-full bg-cyan-400 animate-ping"></div>
          <span className="text-[10px] font-black uppercase tracking-widest italic">Lobby Synchronized</span>
        </div>
        <h1 className="text-5xl md:text-8xl font-black text-white italic uppercase tracking-tightest leading-none">{room?.title || 'ARENA'}</h1>
      </div>

      <div className="grid md:grid-cols-2 gap-10">
        <Card variant="dark" className="!p-10 border-white/5 space-y-8 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-violet-600"></div>
          <div className="space-y-2">
            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Arena Access Code</p>
            <div className="flex items-center gap-4">
              <p className="text-5xl md:text-7xl font-black text-white tracking-tighter font-mono">{room?.roomCode}</p>
              <button 
                onClick={() => {
                  if (room?.roomCode) {
                    navigator.clipboard.writeText(room.roomCode);
                    setCopySuccess(true);
                    setTimeout(() => setCopySuccess(false), 2000);
                  }
                }}
                className={`p-4 rounded-2xl transition-all ${copySuccess ? 'bg-emerald-500 text-black' : 'bg-white/5 hover:bg-white/10 text-slate-400'}`}
              >
                {copySuccess ? <CheckCircleIcon className="w-6 h-6"/> : <ClipboardIcon className="w-6 h-6"/>}
              </button>
            </div>
          </div>
          
          <div className="pt-6 border-t border-white/5">
            {room?.hostUid === currentUser?.uid ? (
              <Button onClick={() => liveQuizService.startLiveQuiz(roomId!)} className="w-full h-16 md:h-20 !text-xl md:!text-2xl !font-black !bg-cyan-500 !text-black !rounded-[2rem] shadow-2xl">
                INITIALIZE COMBAT &rarr;
              </Button>
            ) : (
              <div className="text-center py-6 bg-slate-950 rounded-[2rem] border border-white/5">
                <Spinner colorClass="bg-violet-500" />
                <p className="mt-4 text-[10px] font-black text-slate-500 uppercase tracking-widest animate-pulse">Awaiting Host Command...</p>
              </div>
            )}
          </div>
        </Card>

        <div className="space-y-6">
          <div className="flex items-center gap-4">
            <UsersIcon className="w-6 h-6 text-violet-500" />
            <h3 className="text-xl font-black text-white uppercase tracking-widest italic">Linked Agents ({players.length})</h3>
          </div>
          <div className="grid grid-cols-1 gap-3 max-h-[400px] overflow-y-auto pr-2 scrollbar-hide">
            {players.map(p => (
              <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} key={p.uid} className="p-5 bg-slate-900/60 border border-white/5 rounded-2xl flex items-center justify-between group">
                <div className="flex items-center gap-4">
                  <div className={`w-3 h-3 rounded-full ${p.isAi ? 'bg-violet-500' : 'bg-emerald-500'} shadow-[0_0_10px_currentColor]`}></div>
                  <span className="text-lg font-black text-white uppercase italic">{p.name}</span>
                </div>
                {p.isAi && <span className="text-[8px] font-black text-violet-400 uppercase tracking-widest bg-violet-500/10 px-2 py-1 rounded">Neural Bot</span>}
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );

  const renderLive = () => (
    <div className="max-w-5xl mx-auto space-y-6 md:space-y-10 pb-40 px-4 pt-4">
      <AnimatePresence>
        {showInsight && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[100] bg-black/98 backdrop-blur-2xl flex items-center justify-center p-4">
                <Card variant="dark" className="max-w-3xl w-full !p-6 md:!p-16 border-violet-500/20 relative !rounded-[2.5rem] md:!rounded-[4rem] shadow-2xl text-center">
                    <div className="absolute top-0 left-0 w-full h-1 bg-violet-600">
                        <motion.div initial={{ width: '100%' }} animate={{ width: '0%' }} transition={{ duration: 4, ease: 'linear' }} className="h-full bg-cyan-400" />
                    </div>
                    {lastRoundStats && (
                        <div className="mb-6 md:mb-10 flex gap-4 md:gap-8 justify-center">
                             <div className="p-6 md:p-10 bg-white/5 rounded-2xl border border-white/10 flex-grow">
                                <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest mb-2">Round XP</p>
                                <p className={`text-4xl md:text-7xl font-black italic ${lastRoundStats.isCorrect ? 'text-emerald-400' : 'text-red-500'}`}>+{lastRoundStats.earnedPoints}</p>
                             </div>
                        </div>
                    )}
                    <div className="max-h-[40vh] overflow-y-auto pr-2 scrollbar-hide">
                        <MathRenderer text={currentQuestion?.explanation} className="!text-white text-lg md:!text-3xl font-medium leading-relaxed italic" />
                    </div>
                    <p className="mt-8 text-[9px] font-black text-slate-700 uppercase tracking-widest animate-pulse">Next Node Syncing...</p>
                </Card>
            </motion.div>
        )}
      </AnimatePresence>

      <div className="flex justify-between items-center bg-slate-950 p-4 md:p-10 rounded-[2rem] md:rounded-[3.5rem] border border-white/5 shadow-2xl">
        <div className="flex items-center gap-3 md:gap-6">
          <div className="w-12 h-12 md:w-16 md:h-16 rounded-xl flex items-center justify-center text-xl md:text-3xl font-black bg-violet-600">{timer}</div>
          <div className="hidden sm:block">
            <p className="text-[8px] font-black text-slate-600 uppercase tracking-widest">Time Remaining</p>
            <div className="w-32 h-1.5 bg-white/5 rounded-full overflow-hidden mt-2"><motion.div animate={{ width: `${(timer/15)*100}%` }} className="h-full bg-cyan-400" /></div>
          </div>
        </div>
        <div className="text-center px-4">
            <p className="text-[10px] md:text-xs font-black text-cyan-400 uppercase tracking-widest italic mb-1">GATE {room!.currentQuestionIndex + 1}</p>
            <p className="text-xl md:text-3xl font-black text-white uppercase italic tracking-tightest">ARENA LIVE</p>
        </div>
        <div className="text-right">
            <p className="text-[8px] font-black text-slate-600 uppercase mb-1">XP</p>
            <p className="text-2xl md:text-4xl font-black text-emerald-400 italic leading-none">{players.find(p => p.uid === currentUser?.uid)?.score || 0}</p>
        </div>
      </div>

      <motion.div key={room?.currentQuestionIndex} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4 md:space-y-8">
          <Card variant="dark" className="!p-8 md:!p-20 border-white/5 text-center relative overflow-hidden !rounded-[2rem] md:!rounded-[4rem] min-h-[220px] md:min-h-[350px] flex flex-col justify-center">
             <div className="absolute top-0 left-0 w-1.5 h-full bg-violet-600"></div>
             <MathRenderer text={currentQuestion?.questionText} className="!text-white text-2xl md:!text-6xl font-black italic tracking-tight leading-tight md:leading-none" />
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-6">
            {currentQuestion?.options.map((opt, i) => (
              <button key={i} onClick={() => handleAnswerSubmit(i)} disabled={hasAnswered || timer <= 0} className={`p-6 md:p-10 rounded-[1.5rem] md:rounded-[3rem] border-2 text-left transition-all relative group ${selectedOption === i ? 'bg-violet-600 border-violet-400 shadow-2xl scale-[1.01]' : (hasAnswered ? 'opacity-20 grayscale' : 'bg-slate-900 border-white/5 hover:border-violet-500/30')}`}>
                 <div className="flex items-center gap-4 md:gap-8">
                    <div className={`w-10 h-10 md:w-14 md:h-14 rounded-lg md:rounded-2xl bg-slate-950 flex items-center justify-center font-black text-base md:text-xl ${selectedOption === i ? 'bg-white text-black' : 'text-slate-600'}`}>{String.fromCharCode(65 + i)}</div>
                    <MathRenderer text={opt} className="text-base md:!text-3xl !font-bold text-white tracking-tight" />
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
      <div className="max-w-5xl mx-auto space-y-10 md:space-y-20 pb-40 px-6 pt-4">
        <div className="text-center space-y-4">
          <StarIcon className="w-12 h-12 md:w-24 text-amber-500 animate-pulse mx-auto" />
          <h1 className="text-4xl md:text-[8rem] font-black text-white italic tracking-tightest uppercase leading-none select-none">ZENITH<br/>CONQUERED</h1>
          <p className="text-slate-500 uppercase tracking-widest text-[9px] md:text-xs font-black italic">Arena Standings Finalized</p>
        </div>

        <div className="space-y-3 max-w-2xl mx-auto">
            {sortedPlayers.map((p, i) => (
                <div key={p.uid} className={`flex items-center justify-between p-6 border rounded-[1.5rem] md:rounded-[2.5rem] ${p.uid === currentUser?.uid ? 'bg-cyan-500/10 border-cyan-500/30' : 'bg-slate-950 border-white/5'}`}>
                    <div className="flex items-center gap-4 md:gap-8">
                        <span className="text-xl md:text-3xl font-black text-slate-800 italic">#{i+1}</span>
                        <div>
                            <p className="text-lg md:text-2xl font-black text-white uppercase truncate max-w-[120px] md:max-w-none">{p.name}</p>
                            <p className="text-[7px] md:text-[9px] text-slate-600 font-bold uppercase italic mt-1">{p.isAi ? 'Neural Core' : 'Human Operator'}</p>
                        </div>
                    </div>
                    <p className="text-3xl md:text-5xl font-black text-cyan-400 italic">{p.score}</p>
                </div>
            ))}
        </div>

        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center pt-10">
           <Button onClick={() => window.location.reload()} className="w-full sm:w-60 h-16 md:h-20 !text-xl !font-black !rounded-full !bg-white !text-black italic">RE-TRY &rarr;</Button>
           <Button onClick={() => navigate('/app')} variant="outline" className="w-full sm:w-60 h-16 md:h-20 !text-lg !font-black !rounded-full border-white/10 text-slate-600 uppercase">EXIT ARENA</Button>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-[#010208] relative overflow-hidden">
      <div className="fixed inset-0 z-0 pointer-events-none opacity-20">
        <div className="absolute top-0 left-0 w-full h-full bg-violet-600/20 blur-[200px]"></div>
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
