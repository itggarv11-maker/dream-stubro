
import React, { useState, useEffect, Suspense, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Canvas, useFrame } from '@react-three/fiber';
import { 
    Stars, Float, Environment, Text, Sparkles, 
    OrbitControls, PerspectiveCamera, MeshTransmissionMaterial,
} from '@react-three/drei';
import * as THREE from 'three';
import { motion, AnimatePresence } from 'framer-motion';
import { useContent } from '../contexts/ContentContext';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import * as geminiService from '../services/geminiService';
import { db } from '../services/firebase';
import { doc, setDoc, onSnapshot, collection, query, serverTimestamp } from 'firebase/firestore';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import Spinner from '../components/common/Spinner';
// Added XMarkIcon to the imports to resolve the "Cannot find name 'XMarkIcon'" error.
import { SparklesIcon, UsersIcon, CheckCircleIcon, StarIcon, ShieldCheckIcon, XMarkIcon } from '../components/icons';
import MathRenderer from '../components/common/MathRenderer';
import { GameverseWorld, GameMission } from '../types';

const ChapterConquestPage: React.FC = () => {
    const { extractedText, subject } = useContent();
    const { currentUser, userName } = useAuth();
    const { theme } = useTheme();
    const navigate = useNavigate();

    const [gameState, setGameState] = useState<'loading' | 'playing' | 'mission' | 'finished' | 'error'>('loading');
    const [worldData, setWorldData] = useState<GameverseWorld | null>(null);
    const [activeMission, setActiveMission] = useState<GameMission | null>(null);
    const [missionStatus, setMissionStatus] = useState<'idle' | 'success' | 'fail'>('idle');
    const [userInput, setUserInput] = useState('');
    const [otherPlayers, setOtherPlayers] = useState<any[]>([]);
    const [completedMissions, setCompletedMissions] = useState<Set<string>>(new Set());
    const [loadingStep, setLoadingStep] = useState("Initializing Core...");

    const worldId = useRef(`world_${Date.now()}`);

    useEffect(() => {
        if (!currentUser) return;
        const playerRef = doc(db, 'gameverse', worldId.current, 'players', currentUser.uid);
        setDoc(playerRef, {
            uid: currentUser.uid,
            name: userName,
            pos: [0, 0, 0],
            lastActive: serverTimestamp(),
            progress: completedMissions.size
        }, { merge: true });

        const q = query(collection(db, 'gameverse', worldId.current, 'players'));
        const unsub = onSnapshot(q, (snap) => {
            setOtherPlayers(snap.docs.map(d => d.data()).filter(p => p.uid !== currentUser.uid));
        });
        return () => unsub();
    }, [currentUser, completedMissions.size]);

    useEffect(() => {
        const buildWorld = async () => {
            setLoadingStep("Parsing Chapter Logic...");
            try {
                // If text is missing, use a fallback topic or redirect
                const textToUse = extractedText || `General studies for ${subject || 'Science'}`;
                const data = await geminiService.generateGameverseWorld(textToUse);
                setLoadingStep("Synthesizing 3D High-Fidelity World...");
                setWorldData(data);
                setGameState('playing');
            } catch (err) {
                // FALLBACK: Load a deterministic world if AI fails
                setLoadingStep("Using Standard Logic Model...");
                const fallback: GameverseWorld = {
                    id: 'fallback',
                    title: subject || "Study Mission",
                    theme: 'neon_city',
                    missions: [
                        { id: 'm1', type: 'unlock', title: 'Logic Gate Alpha', objective: 'Sync basic terms.', concept: 'Fundamentals', challenge: { prompt: "What is the primary focus of this chapter?", correctAnswer: subject || "Learning", logicHint: "Look at the subject name." } }
                    ],
                    npcs: [{ id: 'n1', name: 'Guardian', role: 'Archivist', dialogue: ['Welcome to the fallback sim.'], position: [5, 0, 5] }],
                    globalAbilities: ['Recall']
                };
                setWorldData(fallback);
                setGameState('playing');
            }
        };
        buildWorld();
    }, [extractedText, subject]);

    const handleMissionClick = (mission: GameMission) => {
        if (completedMissions.has(mission.id)) return;
        setActiveMission(mission);
        setGameState('mission');
        setMissionStatus('idle');
        setUserInput('');
    };

    const verifyLogic = (e: React.FormEvent) => {
        e.preventDefault();
        if (!activeMission) return;
        
        const isCorrect = userInput.trim().toLowerCase() === activeMission.challenge.correctAnswer.toLowerCase();
        if (isCorrect) {
            setMissionStatus('success');
            setCompletedMissions(prev => new Set(prev).add(activeMission.id));
            setTimeout(() => {
                setGameState('playing');
                setActiveMission(null);
                if (completedMissions.size + 1 >= (worldData?.missions.length || 0)) setGameState('finished');
            }, 2000);
        } else {
            setMissionStatus('fail');
        }
    };

    if (gameState === 'loading') return (
        <div className="min-h-screen bg-black flex flex-col items-center justify-center gap-16 px-10 text-center">
            <div className="relative">
                <div className="absolute inset-0 bg-violet-600 blur-[200px] opacity-20 animate-pulse"></div>
                <Spinner className="w-48 h-48 relative z-10" colorClass="bg-violet-500" />
            </div>
            <div className="space-y-6">
                <h1 className="text-6xl md:text-8xl font-black text-white italic tracking-tightest uppercase leading-none">NEURAL SYNCING...</h1>
                <p className="text-cyan-400 font-mono text-xl tracking-[0.5em] uppercase font-black">{loadingStep}</p>
            </div>
        </div>
    );

    return (
        <div className="fixed inset-0 bg-[#010208] z-[60] overflow-hidden">
            <Canvas shadows className="absolute inset-0 z-0">
                <PerspectiveCamera makeDefault position={[0, 15, 35]} fov={35} />
                <Stars radius={150} depth={60} count={10000} factor={6} />
                <Sparkles count={500} scale={30} size={1.5} speed={0.5} color={theme === 'dark' ? '#8b5cf6' : '#fbbf24'} />
                <ambientLight intensity={0.4} />
                <spotLight position={[20, 30, 20]} intensity={3} color="#ffffff" castShadow />
                <pointLight position={[-10, 10, -10]} intensity={2} color="#22d3ee" />
                
                <Suspense fallback={null}>
                    <Environment preset="night" />
                    <KnowledgeCore title={worldData?.title || "OMEGA"} />
                    {worldData?.missions.map((m, i) => (
                        <MissionNode key={m.id} mission={m} index={i} isCompleted={completedMissions.has(m.id)} onClick={() => handleMissionClick(m)} />
                    ))}
                    {otherPlayers.map(p => (
                        <PeerAvatar key={p.uid} name={p.name} />
                    ))}
                    <OrbitControls enablePan={false} enableZoom={true} minDistance={15} maxDistance={50} autoRotate={gameState === 'playing'} autoRotateSpeed={0.4} />
                </Suspense>
            </Canvas>

            {/* HUD LAYERING */}
            <div className="absolute top-10 left-10 pointer-events-none z-10 max-w-sm md:max-w-md">
                <div className="p-10 bg-black/60 backdrop-blur-4xl border border-white/10 rounded-[3rem] shadow-[0_40px_100px_rgba(0,0,0,0.8)] pointer-events-auto">
                    <p className="text-violet-400 font-black text-[10px] uppercase tracking-[0.6em] mb-4 italic flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-violet-500 animate-ping"></div> TITAN GAMEVERSE ACTIVE</p>
                    <h2 className="text-4xl font-black text-white italic tracking-tighter uppercase leading-none mb-8">{worldData?.title}</h2>
                    <div className="flex items-center gap-4">
                        <div className="flex-grow h-1.5 bg-white/5 rounded-full overflow-hidden">
                            <motion.div animate={{ width: `${(completedMissions.size / (worldData?.missions.length || 1)) * 100}%` }} className="h-full bg-cyan-400 shadow-[0_0_20px_#22d3ee]"/>
                        </div>
                        <span className="text-[10px] font-black text-slate-500 tracking-widest uppercase">{completedMissions.size}/{worldData?.missions.length} SYNCED</span>
                    </div>
                </div>
            </div>

            {/* INTERFACE MODALS */}
            <AnimatePresence>
                {gameState === 'mission' && activeMission && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 z-50 bg-black/95 backdrop-blur-2xl flex items-center justify-center p-8">
                        <Card variant="dark" className="max-w-3xl w-full !p-16 md:!p-24 border-white/10 relative overflow-hidden !rounded-[5rem] shadow-[0_60px_150px_rgba(0,0,0,1)]">
                            <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-violet-600 to-cyan-400 shadow-2xl"></div>
                            <div className="mb-12">
                                <span className="px-6 py-2 bg-white/5 border border-white/10 rounded-full text-slate-500 font-black text-[10px] uppercase tracking-widest italic">Phase Control: {activeMission.type}</span>
                                <h3 className="text-5xl md:text-7xl font-black text-white uppercase italic tracking-tighter mt-6 leading-none">{activeMission.title}</h3>
                            </div>
                            
                            <div className="mb-12">
                                <p className="text-3xl md:text-5xl font-black text-white leading-tight italic tracking-tighter drop-shadow-2xl">"{activeMission.challenge.prompt}"</p>
                            </div>

                            {missionStatus === 'idle' ? (
                                <form onSubmit={verifyLogic} className="space-y-8">
                                    <input autoFocus value={userInput} onChange={e => setUserInput(e.target.value)} placeholder="Type Decryption Key..." className="w-full bg-black/60 border-2 border-white/5 p-8 rounded-[3rem] text-3xl text-white outline-none focus:border-cyan-500 transition-all font-black text-center shadow-inner italic" />
                                    <Button type="submit" className="w-full h-24 !text-3xl !font-black !bg-white !text-black !rounded-full shadow-2xl hover:scale-105 transition-all italic group">VERIFY NODE SYNC <span className="group-hover:translate-x-2 transition-transform">&rarr;</span></Button>
                                    <p className="text-center text-slate-600 text-[10px] font-black uppercase tracking-widest cursor-help hover:text-cyan-400 transition-colors" title={activeMission.challenge.logicHint}>Access Neural Proxy (Hint)</p>
                                </form>
                            ) : (
                                <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className={`p-20 rounded-[4rem] text-center border-4 ${missionStatus === 'success' ? 'border-emerald-500/30 bg-emerald-500/5 shadow-[0_0_100px_rgba(16,185,129,0.1)]' : 'border-red-500/30 bg-red-500/5'}`}>
                                     <div className={`w-24 h-24 rounded-full mx-auto mb-10 flex items-center justify-center ${missionStatus === 'success' ? 'bg-emerald-500 text-black' : 'bg-red-500 text-white'}`}>
                                        {missionStatus === 'success' ? <CheckCircleIcon className="w-14 h-14" /> : <XMarkIcon className="w-14 h-14" />}
                                    </div>
                                    <h4 className={`text-5xl font-black uppercase italic mb-6 ${missionStatus === 'success' ? 'text-emerald-400' : 'text-red-400'}`}>{missionStatus === 'success' ? 'LOGIC ALIGNED' : 'DATA CORRUPTED'}</h4>
                                    <p className="text-slate-400 text-2xl font-medium">{missionStatus === 'success' ? 'Module archived to memory core.' : 'Neural dissonance. Retry sync.'}</p>
                                    {missionStatus === 'fail' && <Button onClick={() => setMissionStatus('idle')} className="mt-12 h-20 !px-16 mx-auto !font-black !rounded-full !bg-white !text-black">RE-TRY SYNC</Button>}
                                </motion.div>
                            )}
                        </Card>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

const KnowledgeCore = ({ title }: { title: string }) => {
    const coreRef = useRef<THREE.Group>(null);
    useFrame((state) => {
        if (coreRef.current) {
            coreRef.current.rotation.y = state.clock.elapsedTime * 0.1;
            coreRef.current.position.y = Math.sin(state.clock.elapsedTime * 0.5) * 1.5;
        }
    });
    return (
        <group ref={coreRef}>
            <Float speed={2} floatIntensity={1.5}>
                <mesh castShadow>
                    <torusKnotGeometry args={[5, 0.7, 300, 32]} />
                    <MeshTransmissionMaterial thickness={1.2} roughness={0} transmission={1} ior={1.5} chromaticAberration={0.08} color="#ffffff" />
                </mesh>
            </Float>
            <Text position={[0, 0, 0]} fontSize={1.6} font="/fonts/Outfit-Black.ttf" color="white" anchorX="center" anchorY="middle" maxWidth={8} outlineWidth={0.05} outlineColor="#000000">{title.toUpperCase()}</Text>
        </group>
    );
};

const MissionNode = ({ mission, index, isCompleted, onClick }: any) => {
    const [hovered, setHovered] = useState(false);
    const pos: [number, number, number] = [Math.sin(index * 1.8) * 18, Math.cos(index * 2.2) * 8, Math.sin(index * 3.5) * 14];
    return (
        <group position={pos} onClick={onClick} onPointerOver={() => setHovered(true)} onPointerOut={() => setHovered(false)}>
            <Float speed={4} rotationIntensity={1.5}>
                <mesh castShadow>
                    <icosahedronGeometry args={[2.2, 1]} />
                    <meshStandardMaterial color={isCompleted ? "#10b981" : (hovered ? "#22d3ee" : "#8b5cf6")} wireframe emissive={isCompleted ? "#10b981" : (hovered ? "#22d3ee" : "#8b5cf6")} emissiveIntensity={hovered ? 12 : 2} />
                </mesh>
                <Text position={[0, -3.5, 0]} fontSize={0.9} color="white" font="/fonts/Outfit-Bold.ttf" outlineWidth={0.02}>{mission.title.toUpperCase()}</Text>
            </Float>
            <pointLight intensity={hovered ? 10 : 3} distance={12} color={isCompleted ? "#10b981" : "#8b5cf6"} />
        </group>
    );
};

const PeerAvatar: React.FC<{ name: string }> = ({ name }) => (
    <group position={[Math.random() * 25 - 12, 0, Math.random() * 25 - 12]}>
        <mesh>
            <boxGeometry args={[1, 2.2, 1]} />
            <meshStandardMaterial color="cyan" emissive="cyan" emissiveIntensity={2} wireframe />
        </mesh>
        <Text position={[0, 2.8, 0]} fontSize={0.6} color="cyan">{name}</Text>
    </group>
);

export default ChapterConquestPage;
