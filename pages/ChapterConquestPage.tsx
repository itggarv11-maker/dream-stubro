
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
import * as geminiService from '../services/geminiService';
import { db } from '../services/firebase';
import { doc, setDoc, onSnapshot, collection, query, serverTimestamp } from 'firebase/firestore';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import Spinner from '../components/common/Spinner';
import { SparklesIcon, UsersIcon, CheckCircleIcon, StarIcon } from '../components/icons';
import MathRenderer from '../components/common/MathRenderer';
import { GameverseWorld, GameMission } from '../types';

const ChapterConquestPage: React.FC = () => {
    const { extractedText } = useContent();
    const { currentUser, userName } = useAuth();
    const navigate = useNavigate();

    const [gameState, setGameState] = useState<'loading' | 'playing' | 'mission' | 'finished' | 'error'>('loading');
    const [worldData, setWorldData] = useState<GameverseWorld | null>(null);
    const [activeMission, setActiveMission] = useState<GameMission | null>(null);
    const [missionStatus, setMissionStatus] = useState<'idle' | 'success' | 'fail'>('idle');
    const [userInput, setUserInput] = useState('');
    const [otherPlayers, setOtherPlayers] = useState<any[]>([]);
    const [completedMissions, setCompletedMissions] = useState<Set<string>>(new Set());
    const [loadingStep, setLoadingStep] = useState("Initializing Cores...");

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
        if (!extractedText) {
            setGameState('error');
            return;
        }

        const buildWorld = async () => {
            setLoadingStep("Parsing Chapter Logic...");
            try {
                const data = await geminiService.generateGameverseWorld(extractedText);
                setLoadingStep("Synthesizing 3D Assets...");
                setWorldData(data);
                setGameState('playing');
            } catch (err) {
                setGameState('error');
            }
        };
        buildWorld();
    }, [extractedText]);

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
            }, 2500);
        } else {
            setMissionStatus('fail');
        }
    };

    if (gameState === 'loading') return (
        <div className="min-h-screen bg-black flex flex-col items-center justify-center gap-16 px-10 text-center">
            <div className="relative">
                <div className="absolute inset-0 bg-violet-600 blur-[150px] opacity-20 animate-pulse"></div>
                <Spinner className="w-32 h-32 relative z-10" colorClass="bg-violet-500" />
            </div>
            <div className="space-y-4">
                <h1 className="text-5xl font-black text-white italic tracking-tightest uppercase animate-pulse">Neural World Construction</h1>
                <p className="text-cyan-400 font-mono text-sm tracking-[0.6em] uppercase">{loadingStep}</p>
            </div>
            <div className="max-w-md w-full bg-white/5 h-1 rounded-full overflow-hidden">
                <motion.div initial={{ width: 0 }} animate={{ width: '100%' }} transition={{ duration: 5, ease: 'linear' }} className="h-full bg-cyan-400" />
            </div>
        </div>
    );

    return (
        <div className="fixed inset-0 bg-[#010208] z-[60]">
            <Canvas shadows className="absolute inset-0 z-0">
                <PerspectiveCamera makeDefault position={[0, 10, 25]} fov={40} />
                <Stars radius={100} depth={50} count={5000} factor={4} />
                <Sparkles count={300} scale={25} size={2} speed={0.4} color="#8b5cf6" />
                <ambientLight intensity={0.3} />
                <spotLight position={[20, 20, 10]} intensity={2.5} color="#8b5cf6" castShadow />
                
                <Suspense fallback={null}>
                    <Environment preset="night" />
                    <KnowledgeCore title={worldData?.title || "CONQUEST"} />
                    {worldData?.missions.map((m, i) => (
                        <MissionNode key={m.id} mission={m} index={i} isCompleted={completedMissions.has(m.id)} onClick={() => handleMissionClick(m)} />
                    ))}
                    {otherPlayers.map(p => (
                        <PeerAvatar key={p.uid} name={p.name} />
                    ))}
                    <OrbitControls enablePan={false} enableZoom={true} minDistance={10} maxDistance={40} autoRotate={gameState === 'playing'} autoRotateSpeed={0.3} />
                </Suspense>
            </Canvas>

            {/* HUD */}
            <div className="absolute top-10 left-10 pointer-events-none z-10">
                <div className="p-8 bg-black/60 backdrop-blur-3xl border border-white/5 rounded-[2.5rem] shadow-2xl pointer-events-auto">
                    <p className="text-violet-400 font-black text-[9px] uppercase tracking-[0.6em] mb-2 italic">Astra Gameverse Hub</p>
                    <h2 className="text-3xl font-black text-white italic tracking-tighter uppercase leading-none">{worldData?.title}</h2>
                    <div className="flex items-center gap-4 mt-6">
                        <span className="text-[10px] font-black text-slate-500 tracking-widest">{completedMissions.size}/{worldData?.missions.length} NODES CAPTURED</span>
                    </div>
                </div>
            </div>

            {/* MISSION INTERFACE */}
            <AnimatePresence>
                {gameState === 'mission' && activeMission && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 z-50 bg-black/90 backdrop-blur-3xl flex items-center justify-center p-6">
                        <Card variant="dark" className="max-w-3xl w-full !p-20 border-white/5 relative overflow-hidden !rounded-[4rem] shadow-2xl">
                            <div className="absolute top-0 left-0 w-full h-1 bg-violet-600"></div>
                            <div className="mb-10">
                                <span className="px-4 py-1 bg-violet-600/10 border border-violet-500/20 rounded-full text-violet-400 font-black text-[9px] uppercase tracking-widest">PHASE {activeMission.type}</span>
                                <h3 className="text-5xl font-black text-white uppercase italic tracking-tighter mt-4 leading-none">{activeMission.title}</h3>
                            </div>
                            <div className="mb-12">
                                <p className="text-3xl font-bold text-white italic tracking-tight leading-relaxed">"{activeMission.challenge.prompt}"</p>
                            </div>

                            {missionStatus === 'idle' ? (
                                <form onSubmit={verifyLogic} className="space-y-6">
                                    <input autoFocus value={userInput} onChange={e => setUserInput(e.target.value)} placeholder="Type logic response..." className="w-full bg-black/60 border border-white/10 p-8 rounded-[2.5rem] text-2xl text-white outline-none focus:border-cyan-500 transition-all font-mono" />
                                    <Button type="submit" className="w-full h-24 !text-2xl !font-black !bg-white !text-black !rounded-full shadow-2xl">VERIFY NODE &rarr;</Button>
                                    <p className="text-center text-slate-600 text-[9px] font-black uppercase tracking-widest cursor-help hover:text-cyan-400" title={activeMission.challenge.logicHint}>Access Neural Hint</p>
                                </form>
                            ) : (
                                <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className={`p-16 rounded-[4rem] text-center border-2 ${missionStatus === 'success' ? 'border-emerald-500 bg-emerald-500/5' : 'border-red-500 bg-red-500/5'}`}>
                                    <h4 className={`text-4xl font-black uppercase italic mb-4 ${missionStatus === 'success' ? 'text-emerald-400' : 'text-red-400'}`}>{missionStatus === 'success' ? 'SYNC SUCCESS' : 'SYNC FAILED'}</h4>
                                    <p className="text-slate-300 text-xl">{missionStatus === 'success' ? 'Concept archived to neural core.' : 'Logic mismatch. Re-try decryption.'}</p>
                                    {missionStatus === 'fail' && <Button onClick={() => setMissionStatus('idle')} className="mt-8 !px-12 mx-auto">RE-TRY</Button>}
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
        if (coreRef.current) coreRef.current.rotation.y = state.clock.elapsedTime * 0.15;
    });
    return (
        <group ref={coreRef}>
            <Float speed={2} floatIntensity={1}>
                <mesh castShadow>
                    <torusKnotGeometry args={[4.5, 0.6, 200, 32]} />
                    <MeshTransmissionMaterial thickness={1} roughness={0} transmission={1} color="#ffffff" />
                </mesh>
            </Float>
            <Text position={[0, 0, 0]} fontSize={1.4} font="/fonts/Outfit-Black.ttf" color="white" anchorX="center" anchorY="middle" maxWidth={6}>{title.toUpperCase()}</Text>
        </group>
    );
};

const MissionNode = ({ mission, index, isCompleted, onClick }: any) => {
    const [hovered, setHovered] = useState(false);
    const pos: [number, number, number] = [Math.sin(index * 1.5) * 16, Math.cos(index * 2) * 6, Math.sin(index * 3) * 12];
    return (
        <group position={pos} onClick={onClick} onPointerOver={() => setHovered(true)} onPointerOut={() => setHovered(false)}>
            <Float speed={5} rotationIntensity={1} floatIntensity={2}>
                <mesh castShadow>
                    <icosahedronGeometry args={[1.8, 1]} />
                    <meshStandardMaterial color={isCompleted ? "#10b981" : (hovered ? "#22d3ee" : "#8b5cf6")} wireframe emissive={isCompleted ? "#10b981" : (hovered ? "#22d3ee" : "#8b5cf6")} emissiveIntensity={hovered ? 8 : 1} />
                </mesh>
                <Text position={[0, -2.8, 0]} fontSize={0.7} color="white" font="/fonts/Outfit-Bold.ttf">{mission.title.toUpperCase()}</Text>
            </Float>
            <pointLight intensity={hovered ? 6 : 1} distance={10} color={isCompleted ? "#10b981" : "#8b5cf6"} />
        </group>
    );
};

const PeerAvatar: React.FC<{ name: string }> = ({ name }) => (
    <group position={[Math.random() * 20 - 10, 0, Math.random() * 20 - 10]}>
        <mesh>
            <boxGeometry args={[0.8, 1.8, 0.8]} />
            <meshStandardMaterial color="cyan" emissive="cyan" emissiveIntensity={2} wireframe />
        </mesh>
        <Text position={[0, 2.2, 0]} fontSize={0.5} color="cyan">{name}</Text>
    </group>
);

export default ChapterConquestPage;
