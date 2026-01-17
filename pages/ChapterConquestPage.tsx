import React, { useState, useEffect, Suspense, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { 
    OrbitControls, Stars, Float, 
    Environment, Text, ContactShadows, PresentationControls, 
    MeshDistortMaterial, PerspectiveCamera, Sparkles, PointLightHelper
} from '@react-three/drei';
import * as THREE from 'three';
import { motion, AnimatePresence } from 'framer-motion';
import { useContent } from '../contexts/ContentContext';
import * as geminiService from '../services/geminiService';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import Spinner from '../components/common/Spinner';
import { SparklesIcon, RocketLaunchIcon, CheckCircleIcon } from '../components/icons';

type GameState = 'generating' | 'playing' | 'interaction' | 'feedback' | 'completed' | 'error';

const ChapterConquestPage: React.FC = () => {
    const { extractedText } = useContent();
    const navigate = useNavigate();

    const [gameState, setGameState] = useState<GameState>('generating');
    const [gameData, setGameData] = useState<any>(null);
    const [score, setScore] = useState(0);
    const [activeInteraction, setActiveInteraction] = useState<any>(null);
    const [interactionAnswer, setInteractionAnswer] = useState('');
    const [feedback, setFeedback] = useState<{ correct: boolean; message: string } | null>(null);
    const [completedIds, setCompletedIds] = useState<Set<number>>(new Set());
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!extractedText) {
            setError("Knowledge Node missing. Start a new session first.");
            setGameState('error');
            return;
        }

        const initGame = async () => {
            try {
                const data = await geminiService.generateGameLevel(extractedText);
                setGameData(data);
                setGameState('playing');
            } catch (err) {
                setError("Neural build failure.");
                setGameState('error');
            }
        };
        initGame();
    }, [extractedText]);

    const handleOrbCapture = (orb: any) => {
        if (completedIds.has(orb.id)) return;
        setActiveInteraction(orb);
        setGameState('interaction');
    };

    const handleInteractionSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const isCorrect = interactionAnswer.trim().toLowerCase() === activeInteraction.correct_answer.toLowerCase();
        if (isCorrect) {
            setScore(s => s + 1);
            setCompletedIds(prev => new Set(prev).add(activeInteraction.id));
            setFeedback({ correct: true, message: activeInteraction.success_message });
        } else {
            setFeedback({ correct: false, message: activeInteraction.failure_message });
        }
        setGameState('feedback');
    };

    if (gameState === 'generating') return (
        <div className="flex flex-col items-center justify-center py-40 gap-10">
            <div className="relative">
                <div className="absolute inset-0 bg-violet-600 blur-[150px] opacity-30 animate-pulse"></div>
                <Spinner className="w-24 h-24 relative z-10" colorClass="bg-violet-500" />
            </div>
            <h2 className="text-4xl md:text-6xl font-black text-white uppercase italic tracking-tighter animate-pulse">Designing Reality...</h2>
        </div>
    );

    return (
        <div className="w-full h-screen fixed inset-0 bg-[#010208] z-[50]">
            {/* 3D Game World */}
            <div className="absolute inset-0 z-0">
                <Canvas shadows>
                    <Stars radius={100} depth={50} count={5000} factor={4} saturation={0} fade speed={1} />
                    <Sparkles count={200} scale={20} size={2} speed={0.4} color="#8b5cf6" />
                    <ambientLight intensity={0.2} />
                    <pointLight position={[10, 10, 10]} intensity={1.5} color="#8b5cf6" castShadow />
                    <Suspense fallback={null}>
                        <Environment preset="night" />
                        <KnowledgeNebula 
                            interactions={gameData?.interactions || []} 
                            completedIds={completedIds}
                            onOrbClick={handleOrbCapture}
                        />
                    </Suspense>
                    <OrbitControls 
                        enablePan={false} 
                        enableZoom={true} 
                        minDistance={5} 
                        maxDistance={30}
                        autoRotate 
                        autoRotateSpeed={0.5} 
                    />
                </Canvas>
            </div>

            {/* HUD */}
            <div className="absolute top-10 left-10 right-10 flex justify-between items-start pointer-events-none z-10">
                <div className="glass-card !rounded-2xl p-6 border-white/10 pointer-events-auto">
                    <h1 className="text-2xl font-black text-white uppercase italic tracking-widest">{gameData?.title || "CONQUEST"}</h1>
                    <p className="text-[10px] text-cyan-400 font-bold uppercase tracking-[0.4em] mt-1">{gameData?.goal}</p>
                </div>
                <div className="text-right space-y-4">
                    <div className="glass-card !rounded-2xl p-6 border-white/10 text-center pointer-events-auto">
                        <p className="text-5xl font-black text-violet-500 italic leading-none">{score}</p>
                        <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mt-2">KNOWLEDGE SYNCS</p>
                    </div>
                    <Button variant="outline" onClick={() => setGameState('completed')} className="pointer-events-auto h-12 !text-[9px] uppercase tracking-[0.3em]">EXIT REALITY</Button>
                </div>
            </div>

            {/* Modals */}
            <AnimatePresence>
                {gameState === 'interaction' && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 z-50 bg-black/80 backdrop-blur-3xl flex items-center justify-center p-6">
                        <Card variant="dark" className="max-w-2xl w-full !p-12 border-violet-500/30 relative">
                            <h3 className="text-4xl font-black text-violet-400 uppercase italic mb-8 tracking-tighter">DATA CHALLENGE</h3>
                            <p className="text-2xl text-white font-medium mb-12 leading-relaxed">"{activeInteraction?.prompt}"</p>
                            <form onSubmit={handleInteractionSubmit} className="space-y-8">
                                <input autoFocus value={interactionAnswer} onChange={e => setInteractionAnswer(e.target.value)} placeholder="> Type extraction result..." className="w-full bg-slate-950 border border-white/10 p-8 rounded-3xl text-white font-mono-code focus:border-cyan-500 outline-none shadow-inner text-xl"/>
                                <Button type="submit" className="w-full h-20 !text-2xl !font-black !bg-white !text-black !rounded-3xl shadow-2xl">VERIFY LOGIC &rarr;</Button>
                            </form>
                        </Card>
                    </motion.div>
                )}

                {gameState === 'feedback' && (
                    <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 z-[60] bg-black/90 backdrop-blur-3xl flex items-center justify-center p-6">
                        <Card variant="dark" className={`max-w-md w-full text-center border-4 ${feedback?.correct ? 'border-green-500' : 'border-red-500'} !p-16`}>
                            <div className={`w-24 h-24 rounded-full mx-auto mb-8 flex items-center justify-center border-2 ${feedback?.correct ? 'bg-green-500/20 border-green-500 text-green-400' : 'bg-red-500/20 border-red-500 text-red-400'}`}>
                                {feedback?.correct ? <CheckCircleIcon className="w-12 h-12" /> : <RocketLaunchIcon className="w-12 h-12 rotate-180" />}
                            </div>
                            <h3 className={`text-4xl font-black uppercase italic mb-4 ${feedback?.correct ? 'text-green-500' : 'text-red-500'}`}>{feedback?.correct ? 'SYNC SUCCESS' : 'SYNC ERROR'}</h3>
                            <p className="text-slate-300 text-xl font-medium mb-12">{feedback?.message}</p>
                            <Button onClick={() => {
                                setGameState('playing');
                                setActiveInteraction(null);
                                setInteractionAnswer('');
                                if(completedIds.size >= (gameData?.interactions?.length || 0)) setGameState('completed');
                            }} className="w-full h-18 !text-xl !font-black !bg-white !text-black">RESUME MISSION</Button>
                        </Card>
                    </motion.div>
                )}

                {gameState === 'completed' && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="absolute inset-0 z-[100] bg-slate-950/95 backdrop-blur-4xl flex items-center justify-center p-6 text-center">
                        <div className="space-y-12">
                            <div className="relative inline-block">
                                <div className="absolute inset-0 bg-cyan-400 blur-[150px] opacity-40 animate-pulse"></div>
                                <h1 className="text-7xl md:text-9xl font-black text-white italic tracking-tightest uppercase relative z-10 leading-none">CHAPTER<br/>CONQUERED</h1>
                            </div>
                            <div className="p-10 bg-white/5 border border-white/10 rounded-[3rem] shadow-2xl">
                                <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.5em] mb-4">Neural Mastery Rating</p>
                                <p className="text-8xl font-black text-cyan-400 italic">{score} / {gameData?.interactions?.length}</p>
                            </div>
                            <Button onClick={() => navigate('/app')} size="lg" className="h-24 px-20 !text-3xl !font-black !bg-white !text-black !rounded-full shadow-[0_0_50px_rgba(255,255,255,0.2)]">RETURN TO BASE</Button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

const KnowledgeNebula = ({ interactions, completedIds, onOrbClick }: any) => {
    return (
        <group>
            {interactions.map((orb: any, i: number) => {
                // Scatter orbs in 3D space
                const x = orb.position?.x ?? (Math.sin(i) * 15);
                const y = orb.position?.y ?? (Math.cos(i) * 8);
                const z = orb.position?.z ?? (Math.sin(i * 2) * 5);
                
                return (
                    <KnowledgeOrb 
                        key={orb.id} 
                        position={[x, y, z]} 
                        isCompleted={completedIds.has(orb.id)}
                        onClick={() => onOrbClick(orb)}
                    />
                );
            })}
            <CenterLogicCore />
        </group>
    );
};

const KnowledgeOrb = ({ position, isCompleted, onClick }: any) => {
    const meshRef = useRef<THREE.Mesh>(null);
    const [hovered, setHovered] = useState(false);
    
    useFrame((state) => {
        if (!meshRef.current) return;
        meshRef.current.rotation.y += 0.02;
        meshRef.current.position.y += Math.sin(state.clock.elapsedTime + position[0]) * 0.005;
    });

    return (
        <group position={position} onClick={onClick} onPointerOver={() => setHovered(true)} onPointerOut={() => setHovered(false)}>
            <mesh ref={meshRef} castShadow>
                <icosahedronGeometry args={[0.8, 2]} />
                <meshStandardMaterial 
                    color={isCompleted ? "#10b981" : (hovered ? "#22d3ee" : "#8b5cf6")} 
                    wireframe={!hovered && !isCompleted}
                    emissive={isCompleted ? "#059669" : (hovered ? "#0891b2" : "#4c1d95")}
                    emissiveIntensity={hovered ? 2 : 1}
                />
            </mesh>
            <pointLight intensity={hovered ? 1.5 : 0.5} distance={5} color={isCompleted ? "#10b981" : "#8b5cf6"} />
        </group>
    );
};

const CenterLogicCore = () => {
    const coreRef = useRef<THREE.Mesh>(null);
    useFrame((state) => {
        if (coreRef.current) {
            coreRef.current.rotation.x = state.clock.elapsedTime * 0.2;
            coreRef.current.rotation.z = state.clock.elapsedTime * 0.3;
        }
    });
    return (
        <Float speed={2} rotationIntensity={2} floatIntensity={1}>
            <mesh ref={coreRef}>
                <torusKnotGeometry args={[3, 0.8, 256, 32]} />
                <meshStandardMaterial 
                    color="#ffffff" 
                    roughness={0} 
                    metalness={1} 
                    emissive="#ffffff"
                    emissiveIntensity={0.1}
                />
            </mesh>
        </Float>
    );
};

export default ChapterConquestPage;