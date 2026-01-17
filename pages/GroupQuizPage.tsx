import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
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
  CheckCircleIcon, XCircleIcon, SparklesIcon, ClipboardIcon 
} from '../components/icons';
import { useAuth } from '../contexts/AuthContext';
import { useContent } from '../contexts/ContentContext';

const DEFAULT_QUIZ: LiveQuizQuestion[] = [
  {
    questionText: "What is the primary function of the CPU?",
    options: ["Display graphics", "Process data", "Store long-term files", "Input sound"],
    correctOptionIndex: 1,
    explanation: "The Central Processing Unit (CPU) is the brain of the computer, responsible for executing instructions and processing data."
  },
  {
    questionText: "Which chemical symbol represents Gold?",
    options: ["Gd", "Ag", "Au", "Pb"],
    correctOptionIndex: 2,
    explanation: "Au comes from the Latin word 'aurum', meaning gold."
  },
  {
    questionText: "In which year did India gain independence?",
    options: ["1942", "1947", "1950", "1935"],
    correctOptionIndex: 1,
    explanation: "India became an independent nation on August 15, 1947."
  },
  {
    questionText: "What is the square root of 144?",
    options: ["10", "14", "12", "16"],
    correctOptionIndex: 2,
    explanation: "12 multiplied by 12 equals 144."
  },
  {
    questionText: "Which layer of the atmosphere contains the Ozone layer?",
    options: ["Troposphere", "Stratosphere", "Mesosphere", "Exosphere"],
    correctOptionIndex: 1,
    explanation: "The stratosphere contains the ozone layer, which protects Earth from harmful ultraviolet radiation."
  }
];

const GroupQuizPage: React.FC = () => {
  const { currentUser, userName: authUserName } = useAuth();
  const { extractedText, subject } = useContent();
  const { roomCode: urlRoomCode } = useParams();
  const navigate = useNavigate();

  const [uiState, setUiState] = useState<'entry' | 'lobby' | 'live' | 'finished'>('entry');
  const [roomId, setRoomId] = useState<string | null>(null);
  const [room, setRoom] = useState<LiveQuizRoom | null>(null);
  const [players, setPlayers] = useState<LiveQuizPlayer[]>([]);
  const [currentQuestion, setCurrentQuestion] = useState<LiveQuizQuestion | null>(null);
  
  const [playerName, setPlayerName] = useState(authUserName || '');
  const [roomCodeInput, setRoomCodeInput] = useState(urlRoomCode || '');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [timer, setTimer] = useState(15);
  const [hasAnswered, setHasAnswered] = useState(false);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [feedback, setFeedback] = useState<'correct' | 'wrong' | null>(null);
  const [copySuccess, setCopySuccess] = useState(false);

  const timerRef = useRef<number | null>(null);

  // Auto-Auth for direct URL access
  useEffect(() => {
    if (!currentUser) {
      signInAnonymously(auth).catch(console.error);
    }
  }, [currentUser]);

  // Handle automatic entry if URL has code
  useEffect(() => {
    if (urlRoomCode && uiState === 'entry') {
      setRoomCodeInput(urlRoomCode);
    }
  }, [urlRoomCode]);

  // Real-time Sync Logic
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

    return () => {
      unsubRoom();
      unsubPlayers();
    };
  }, [roomId, currentUser]);

  // Game Progress Monitor
  useEffect(() => {
    if (uiState === 'live' && room) {
      const loadQ = async () => {
        const q = await liveQuizService.getQuestion(roomId!, room.currentQuestionIndex);
        setCurrentQuestion(q);
        setSelectedOption(null);
        setFeedback(null);
        startTimer();
      };
      loadQ();
    }
  }, [uiState, room?.currentQuestionIndex]);

  const startTimer = () => {
    if (timerRef.current) window.clearInterval(timerRef.current);
    setTimer(15);
    timerRef.current = window.setInterval(() => {
      setTimer((t) => {
        if (t <= 1) {
          if (timerRef.current) window.clearInterval(timerRef.current);
          return 0;
        }
        return t - 1;
      });
    }, 1000);
  };

  const handleCreateRoom = async () => {
    if (!playerName.trim()) return setError("Identify yourself first.");
    setIsLoading(true);
    setError(null);
    try {
      let qs = DEFAULT_QUIZ;
      if (extractedText && extractedText.length > 200) {
        try {
          qs = await geminiService.generateLiveQuizQuestions(extractedText.substring(0, 4000));
        } catch (e) { console.warn("AI Generation failed, using system defaults."); }
      }
      
      const rid = await liveQuizService.createLiveQuizRoom(
        playerName, 
        subject || "Mixed Logic Battle", 
        subject || "General", 
        qs
      );
      setRoomId(rid);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleJoinRoom = async () => {
    if (!playerName.trim()) return setError("Identify yourself first.");
    if (roomCodeInput.length < 5) return setError("Room code invalid.");
    setIsLoading(true);
    setError(null);
    try {
      const rid = await liveQuizService.findRoomByCode(roomCodeInput);
      if (!rid) throw new Error("Arena not found or combat closed.");
      await liveQuizService.joinLiveQuizRoom(rid, playerName);
      setRoomId(rid);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleStartGame = async () => {
    if (roomId) await liveQuizService.startLiveQuiz(roomId);
  };

  const handleAnswerSubmit = async (optionIndex: number) => {
    if (hasAnswered || timer <= 0 || !currentQuestion) return;
    
    setSelectedOption(optionIndex);
    const isCorrect = optionIndex === currentQuestion.correctOptionIndex;
    setFeedback(isCorrect ? 'correct' : 'wrong');
    
    const startTs = room?.questionStartTime?.toMillis() || Date.now();
    await liveQuizService.submitLiveAnswer(roomId!, room!.currentQuestionIndex, isCorrect, startTs);
  };

  const handleNext = async () => {
    const allQs = await liveQuizService.getAllQuestions(roomId!);
    await liveQuizService.nextLiveQuestion(roomId!, room!.currentQuestionIndex + 1, allQs.length);
  };

  const copyInviteLink = () => {
    const url = `${window.location.origin}/#/live/${room?.roomCode}`;
    navigator.clipboard.writeText(url);
    setCopySuccess(true);
    setTimeout(() => setCopySuccess(false), 2000);
  };

  // UI VIEWS

  const renderEntry = () => (
    <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="max-w-2xl mx-auto space-y-12">
      <div className="text-center">
        <div className="inline-block p-6 rounded-full bg-violet-600/10 border border-violet-500/20 mb-8 shadow-2xl">
          <RocketLaunchIcon className="w-16 h-16 text-violet-500" />
        </div>
        <h1 className="text-6xl font-black text-white italic tracking-tighter uppercase leading-none">ASTRAL ARENA</h1>
        <p className="text-slate-500 font-bold uppercase tracking-[0.4em] text-[10px] mt-4">Real-time Competitive Learning</p>
      </div>

      <Card variant="dark" className="!p-12 border-slate-800 space-y-10 shadow-[0_50px_150px_rgba(0,0,0,0.8)] relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1 bg-violet-600"></div>
        
        <div className="space-y-6">
          <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Callsign (Display Name)</label>
          <input 
            value={playerName} 
            onChange={e => setPlayerName(e.target.value)} 
            placeholder="ENTER CALLSIGN..." 
            className="w-full bg-slate-950 border border-white/5 p-6 rounded-3xl text-2xl font-black text-center text-white placeholder-slate-900 focus:border-violet-500 outline-none transition-all"
          />
        </div>

        {urlRoomCode ? (
           <div className="space-y-6">
              <p className="text-center text-slate-400 text-sm font-medium">Entering Combat Room: <span className="text-cyan-400 font-black italic">{urlRoomCode}</span></p>
              <Button onClick={handleJoinRoom} disabled={isLoading || !playerName.trim()} className="w-full h-24 !text-2xl !font-black !bg-white !text-black !rounded-[2.5rem] shadow-2xl">JOIN ARENA →</Button>
           </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Button onClick={handleCreateRoom} disabled={isLoading} className="h-24 !text-xl !font-black !bg-white !text-black !rounded-[2.5rem] shadow-2xl group relative overflow-hidden">
              <span className="relative z-10 uppercase italic">Create Realm</span>
              <div className="absolute inset-0 bg-violet-600 translate-y-full group-hover:translate-y-0 transition-transform duration-500"></div>
            </Button>
            <div className="space-y-4">
              <input 
                value={roomCodeInput} 
                onChange={e => setRoomCodeInput(e.target.value.toUpperCase())} 
                placeholder="CODE" 
                className="w-full bg-slate-950 border border-white/5 p-4 rounded-2xl text-xl font-black text-center text-white placeholder-slate-900 focus:border-cyan-500 outline-none"
              />
              <Button onClick={handleJoinRoom} variant="outline" disabled={isLoading} className="w-full h-12 !text-[9px] !font-black uppercase tracking-widest hover:!bg-cyan-600 !rounded-2xl">JOIN ROOM</Button>
            </div>
          </div>
        )}
        
        {error && <p className="text-red-500 text-center font-black uppercase text-[10px] tracking-widest">{error}</p>}
      </Card>
    </motion.div>
  );

  const renderLobby = () => (
    <div className="max-w-4xl mx-auto space-y-12 pb-40">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 border-b border-white/5 pb-10">
        <div>
          <h2 className="text-5xl font-black text-white italic tracking-tighter uppercase leading-none">WAR ROOM</h2>
          <p className="text-violet-400 font-mono text-[10px] uppercase tracking-[0.4em] mt-3">Objective: {room?.title}</p>
        </div>
        <div className="flex items-center gap-4">
            <div className="text-right">
                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Invite Code</p>
                <p className="text-4xl font-black text-cyan-400 italic tracking-widest">{room?.roomCode}</p>
            </div>
            <button onClick={copyInviteLink} className={`p-4 rounded-2xl border transition-all ${copySuccess ? 'bg-emerald-600 border-emerald-500 text-white' : 'bg-slate-900 border-white/10 text-slate-400 hover:text-white'}`}>
                {copySuccess ? <CheckCircleIcon className="w-6 h-6"/> : <ClipboardIcon className="w-6 h-6"/>}
            </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        <div className="lg:col-span-8 space-y-6">
          <div className="flex items-center gap-4 text-white/40 uppercase font-black text-[10px] tracking-widest">
            <UsersIcon className="w-4 h-4"/> Combatants Syncing ({players.length})
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            {players.map((p) => (
              <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} key={p.uid} className="p-8 bg-slate-900/60 border border-white/5 rounded-[2.5rem] text-center relative group">
                {p.uid === room?.hostUid && <div className="absolute top-3 right-5 text-[7px] font-black text-amber-500 uppercase tracking-widest">HOST</div>}
                <div className="w-16 h-16 rounded-3xl bg-violet-600/10 mx-auto mb-4 flex items-center justify-center text-2xl font-black text-white group-hover:bg-violet-600 transition-all shadow-2xl">{p.name[0].toUpperCase()}</div>
                <p className="font-black text-white text-sm uppercase tracking-widest truncate">{p.name}</p>
              </motion.div>
            ))}
          </div>
        </div>
        <div className="lg:col-span-4">
          <Card variant="dark" className="!p-8 border-slate-800 text-center space-y-8 !rounded-[3rem]">
            <div className="w-20 h-20 bg-violet-600/10 rounded-full mx-auto flex items-center justify-center animate-pulse border border-violet-500/20">
               <UsersIcon className="w-10 h-10 text-violet-500"/>
            </div>
            <p className="text-slate-400 text-xs italic font-medium leading-relaxed">Share the room code or invite link to bring more participants into the arena.</p>
            {room?.hostUid === currentUser?.uid ? (
              <Button onClick={handleStartGame} size="lg" className="w-full h-20 !text-xl !font-black !bg-white !text-black !rounded-3xl shadow-[0_20px_50px_rgba(255,255,255,0.1)] hover:scale-105 transition-all">ENGAGE ENGINE →</Button>
            ) : (
              <div className="py-6 px-6 bg-slate-950 rounded-3xl border border-white/5 text-[10px] font-black uppercase tracking-widest text-slate-500">Awaiting Neural Link Authorization...</div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );

  const renderLive = () => (
    <div className="max-w-5xl mx-auto space-y-10 pb-40">
      <div className="flex justify-between items-center bg-slate-900/90 p-8 rounded-[3rem] border border-white/5 backdrop-blur-3xl shadow-2xl">
        <div className="flex items-center gap-6">
          <div className="w-14 h-14 rounded-2xl bg-violet-600 flex items-center justify-center text-2xl font-black italic shadow-[0_0_20px_rgba(124,58,237,0.5)]">{timer}</div>
          <div>
            <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest">Time Buffer</p>
            <div className="w-40 h-1.5 bg-white/5 rounded-full mt-2 overflow-hidden shadow-inner">
               <motion.div animate={{ width: `${(timer/15)*100}%` }} className="h-full bg-cyan-400 shadow-[0_0_10px_#22d3ee]"/>
            </div>
          </div>
        </div>
        <div className="text-center">
           <p className="text-[10px] font-black text-pink-500 uppercase tracking-[0.4em] italic leading-none mb-2">Combat Sync</p>
           <p className="text-2xl font-black text-white uppercase italic tracking-tighter">PHASE {room!.currentQuestionIndex + 1}</p>
        </div>
        <div className="text-right">
            <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest mb-1">Your Mastery</p>
            <p className="text-2xl font-black text-emerald-400 italic leading-none">{players.find(p => p.uid === currentUser?.uid)?.score || 0}</p>
        </div>
      </div>

      <AnimatePresence mode="wait">
        <motion.div key={room?.currentQuestionIndex} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 1.05 }} className="space-y-10">
          <Card variant="dark" className="!p-16 border-slate-800 text-center relative overflow-hidden shadow-[0_60px_150px_rgba(0,0,0,0.9)] !rounded-[4rem]">
             <div className="absolute top-0 left-0 w-1.5 h-full bg-violet-600"></div>
             <h3 className="text-4xl md:text-5xl font-black text-white italic tracking-tighter leading-tight drop-shadow-2xl">"{currentQuestion?.questionText}"</h3>
          </Card>

          <div className="grid md:grid-cols-2 gap-6">
            {currentQuestion?.options.map((opt, i) => (
              <button 
                key={i} 
                onClick={() => handleAnswerSubmit(i)}
                disabled={hasAnswered || timer <= 0}
                className={`p-10 rounded-[3rem] border-2 text-left transition-all relative overflow-hidden group ${
                  selectedOption === i 
                    ? (feedback === 'correct' ? 'bg-emerald-600/20 border-emerald-500' : 'bg-red-600/20 border-red-500')
                    : (hasAnswered ? 'opacity-40 grayscale pointer-events-none' : 'bg-slate-900 border-white/5 hover:border-violet-500/50 hover:bg-slate-800')
                }`}
              >
                 <div className="flex items-center gap-8">
                    <div className={`w-12 h-12 rounded-2xl bg-slate-950 flex items-center justify-center font-black text-lg transition-all ${selectedOption === i ? 'bg-white text-black scale-110 shadow-2xl' : 'text-slate-600 group-hover:bg-white group-hover:text-black'}`}>{String.fromCharCode(65 + i)}</div>
                    <span className="text-2xl font-bold text-white tracking-tight">{opt}</span>
                 </div>
                 {selectedOption === i && (
                   <div className="absolute top-6 right-8">
                      {feedback === 'correct' ? <CheckCircleIcon className="w-10 h-10 text-emerald-500"/> : <XCircleIcon className="w-10 h-10 text-red-500"/>}
                   </div>
                 )}
              </button>
            ))}
          </div>

          {(hasAnswered || timer <= 0) && (
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="p-12 rounded-[4rem] bg-indigo-500/5 border border-white/5 relative overflow-hidden">
                <div className="absolute -right-10 -bottom-10 opacity-5"><SparklesIcon className="w-60 h-60 text-indigo-400" /></div>
                <div className="flex items-center gap-4 mb-6">
                  <SparklesIcon className="w-6 h-6 text-indigo-400"/>
                  <h4 className="text-[10px] font-black text-indigo-400 uppercase tracking-widest italic">Astra Logic Analysis</h4>
                </div>
                <p className="text-slate-400 text-xl font-medium leading-relaxed italic max-w-4xl">"{currentQuestion?.explanation}"</p>
                {room?.hostUid === currentUser?.uid && (
                  <Button onClick={handleNext} className="mt-12 w-80 h-20 !bg-white !text-black !font-black uppercase tracking-widest italic !rounded-[2rem] shadow-2xl group hover:scale-105 transition-all">NEXT PHASE &rarr;</Button>
                )}
            </motion.div>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );

  const renderFinished = () => {
    const podium = [...players].sort((a, b) => b.score - a.score).slice(0, 3);
    return (
      <div className="max-w-4xl mx-auto space-y-16 pb-40">
        <div className="text-center space-y-6">
          <div className="relative inline-block">
             <div className="absolute inset-0 bg-amber-500 blur-[120px] opacity-25 animate-pulse"></div>
             <StarIcon className="w-24 h-24 mx-auto text-amber-500 relative z-10" />
          </div>
          <h1 className="text-7xl md:text-9xl font-black text-white italic tracking-tightest uppercase leading-none">ARENA<br/>CONQUERED</h1>
          <p className="text-slate-500 uppercase tracking-[0.8em] text-xs font-black">Neural Mastery Archive Complete</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-end px-4">
           {podium[1] && (
             <motion.div initial={{ y: 50, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.2 }}>
                <Card variant="dark" className="!p-8 border-slate-800 text-center space-y-4 !rounded-[3.5rem] opacity-90 scale-95 shadow-2xl">
                    <div className="w-16 h-16 bg-slate-900 rounded-full mx-auto flex items-center justify-center text-3xl font-black italic border border-white/5">2</div>
                    <p className="text-xl font-black text-white uppercase truncate">{podium[1].name}</p>
                    <p className="text-4xl font-black text-slate-400 italic">{podium[1].score}</p>
                </Card>
             </motion.div>
           )}
           {podium[0] && (
             <motion.div initial={{ y: 100, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.1 }}>
                <Card variant="dark" className="!p-14 border-amber-500/40 text-center space-y-6 !rounded-[4.5rem] shadow-[0_0_100px_rgba(245,158,11,0.2)] bg-amber-500/5">
                    <div className="w-28 h-28 bg-amber-500 text-black rounded-[3rem] mx-auto flex items-center justify-center text-6xl font-black italic rotate-3 shadow-2xl border-4 border-white/20">1</div>
                    <p className="text-3xl font-black text-white uppercase tracking-tighter truncate">{podium[0].name}</p>
                    <p className="text-7xl font-black text-amber-400 italic leading-none tracking-tightest">{podium[0].score}</p>
                </Card>
             </motion.div>
           )}
           {podium[2] && (
             <motion.div initial={{ y: 30, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.3 }}>
                <Card variant="dark" className="!p-8 border-slate-800 text-center space-y-4 !rounded-[3.5rem] opacity-70 scale-90 shadow-2xl">
                    <div className="w-16 h-16 bg-slate-900 rounded-full mx-auto flex items-center justify-center text-3xl font-black italic border border-white/5">3</div>
                    <p className="text-xl font-black text-white uppercase truncate">{podium[2].name}</p>
                    <p className="text-4xl font-black text-slate-400 italic">{podium[2].score}</p>
                </Card>
             </motion.div>
           )}
        </div>

        <div className="space-y-6">
           <div className="flex items-center gap-6 justify-center opacity-30 mb-10">
              <div className="h-px w-20 bg-white"></div>
              <h4 className="text-[10px] font-black text-white uppercase tracking-[1.5em] italic">Full Dossier</h4>
              <div className="h-px w-20 bg-white"></div>
           </div>
           <div className="space-y-4 px-4">
             {players.map((p, i) => (
               <motion.div layout key={p.uid} className="flex items-center justify-between p-8 bg-slate-900/40 border border-white/5 rounded-[2.5rem] group hover:border-violet-500/30 transition-all">
                  <div className="flex items-center gap-8">
                    <span className="text-2xl font-black text-slate-700 group-hover:text-violet-500 transition-all italic">#{i+1}</span>
                    <p className="text-xl font-black text-white uppercase tracking-widest">{p.name}</p>
                  </div>
                  <p className="text-3xl font-black text-cyan-400 italic shadow-cyan-400/20">{p.score}</p>
               </motion.div>
             ))}
           </div>
        </div>

        <div className="flex flex-col md:flex-row gap-6 justify-center items-center pt-20">
           <Button onClick={() => window.location.reload()} size="lg" className="h-24 px-20 !text-2xl !font-black !rounded-full !bg-white !text-black shadow-2xl italic group">
              RE-ENTER ARENA
              <RocketLaunchIcon className="w-6 h-6 group-hover:translate-x-2 transition-transform"/>
           </Button>
           <Button onClick={() => navigate('/app')} variant="outline" className="h-24 px-12 !text-xl !font-black !rounded-full border-white/10 hover:border-white/20 italic">RETURN TO HQ</Button>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-[#010208] px-4 md:px-8 py-16 md:py-24 relative overflow-hidden">
      {/* Background Ambience */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] bg-violet-600/10 blur-[200px] animate-pulse"></div>
        <div className="absolute bottom-[-20%] right-[-10%] w-[60%] h-[60%] bg-pink-600/10 blur-[200px] animate-pulse"></div>
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
