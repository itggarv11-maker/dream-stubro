import React, { useState } from 'react';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import Spinner from '../components/common/Spinner';
import { UsersIcon } from '../components/icons';
import { motion, AnimatePresence } from 'framer-motion';

const GroupQuizPage: React.FC = () => {
  const [state, setState] = useState<'lobby' | 'joining' | 'battle'>('lobby');
  const [gameCode, setGameCode] = useState('');
  const [opponentName, setOpponentName] = useState('');

  const simulateJoin = () => {
    setState('joining');
    setTimeout(() => {
        setOpponentName("Opponent_X99");
        setState('battle');
    }, 2500);
  };

  return (
    <div className="max-w-6xl mx-auto px-6 py-20">
        <AnimatePresence mode="wait">
            {state === 'lobby' && (
                <motion.div key="lobby" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="max-w-2xl mx-auto">
                    <Card variant="dark" className="!p-16 border-slate-800 text-center relative overflow-hidden">
                        <div className="absolute top-0 left-0 w-full h-1 bg-pink-600 shadow-[0_0_20px_rgba(236,72,153,0.5)]"></div>
                        <UsersIcon className="w-24 h-24 mx-auto text-pink-500 mb-8" />
                        <h1 className="text-5xl font-black text-white uppercase tracking-tighter mb-4">Astral Arena</h1>
                        <p className="text-slate-500 uppercase tracking-widest text-[10px] mb-12">Realtime Neural Combat Mode</p>
                        
                        <div className="space-y-6">
                            <div className="p-10 bg-slate-950 border border-slate-800 rounded-[3rem] space-y-6">
                                <input value={gameCode} onChange={e => setGameCode(e.target.value.toUpperCase())} placeholder="ENTER BATTLE CODE" className="w-full text-center text-3xl font-black tracking-[0.5em] bg-transparent outline-none text-white placeholder-slate-800" maxLength={6}/>
                                <Button onClick={simulateJoin} className="w-full h-20 text-2xl font-black !bg-pink-600">ENTER COMBAT &rarr;</Button>
                            </div>
                            <div className="relative py-4"><div className="absolute inset-0 flex items-center"><div className="w-full border-t border-white/5"></div></div><div className="relative flex justify-center text-[10px] uppercase font-bold text-slate-700 bg-[#02040a] px-4 tracking-widest">OR CREATE REALM</div></div>
                            <Button variant="outline" className="w-full h-18 text-lg font-black tracking-widest">GENERATE PRIVATE LINK</Button>
                        </div>
                    </Card>
                </motion.div>
            )}

            {state === 'joining' && (
                <motion.div key="joining" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center py-40 gap-8">
                    <div className="relative">
                        <div className="absolute inset-0 bg-pink-500 blur-[100px] opacity-20 animate-pulse"></div>
                        <Spinner className="w-32 h-32 relative z-10" colorClass="bg-pink-500"/>
                    </div>
                    <p className="text-3xl font-black uppercase tracking-widest text-white animate-pulse">Searching for neural link...</p>
                </motion.div>
            )}

            {state === 'battle' && (
                <motion.div key="battle" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="space-y-12">
                    <div className="flex justify-between items-center bg-slate-900/60 p-8 rounded-[3rem] border border-white/5 backdrop-blur-3xl shadow-2xl">
                        <div className="flex items-center gap-6">
                            <div className="w-16 h-16 rounded-2xl bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center text-2xl font-black text-cyan-400 shadow-[0_0_20px_rgba(34,211,238,0.3)]">YOU</div>
                            <div>
                                <p className="text-2xl font-black text-white">1,450</p>
                                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Neural Score</p>
                            </div>
                        </div>
                        <div className="text-4xl font-black text-pink-500 italic">VS</div>
                        <div className="flex items-center gap-6 text-right">
                             <div>
                                <p className="text-2xl font-black text-white">1,420</p>
                                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{opponentName}</p>
                            </div>
                            <div className="w-16 h-16 rounded-2xl bg-red-500/20 border border-red-500/40 flex items-center justify-center text-2xl font-black text-red-400 shadow-[0_0_20px_rgba(239,68,68,0.3)] animate-pulse">AI</div>
                        </div>
                    </div>

                    <Card variant="dark" className="!p-16 border-slate-800 text-center space-y-12">
                        <h2 className="text-4xl font-black text-white uppercase tracking-tighter italic">If a point P moves such that its distance from point O(0,0) is always 5 units, what is the locus of P?</h2>
                        <div className="grid md:grid-cols-2 gap-6">
                            {['A straight line through O', 'A circle with center O and radius 5', 'A parabola with focus O', 'A square around O'].map((opt, i) => (
                                <Button key={i} variant="outline" className="h-24 text-xl font-bold !rounded-[2rem] hover:!bg-pink-600/10 hover:!border-pink-500/50">{opt}</Button>
                            ))}
                        </div>
                        <p className="text-slate-500 font-mono-tech uppercase tracking-[0.4em] text-[10px]">Transmission Ends in 08s</p>
                    </Card>
                </motion.div>
            )}
        </AnimatePresence>
    </div>
  );
};

export default GroupQuizPage;
