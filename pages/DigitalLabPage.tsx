import React, { useState, useEffect, Suspense, useRef, useMemo } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Canvas, useFrame } from '@react-three/fiber';
import { 
    OrbitControls, Stars, Float, 
    Environment, ContactShadows, PresentationControls, MeshTransmissionMaterial, Sparkles
} from '@react-three/drei';
import * as THREE from 'three';
import { motion, AnimatePresence } from 'framer-motion';
import { useContent } from '../contexts/ContentContext';
import * as geminiService from '../services/geminiService';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import Spinner from '../components/common/Spinner';
import { BeakerIcon, SparklesIcon } from '../components/icons';

const DigitalLabPage: React.FC = () => {
    const { extractedText, subject } = useContent();
    const [experiment, setExperiment] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const initializeLab = async () => {
        if (!extractedText) return;
        setIsLoading(true);
        setError(null);
        try {
            const data = await geminiService.generateSimulationExperiment(extractedText);
            setExperiment(data);
        } catch (err) {
            setError("Neural link calibration failed.");
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        if (extractedText && (subject?.includes('Science') || subject === 'Physics' || subject === 'Chemistry' || subject === 'Biology')) {
            initializeLab();
        }
    }, [extractedText]);

    if (!extractedText) return (
        <div className="min-h-[80vh] flex items-center justify-center p-6">
            <Card variant="dark" className="max-w-2xl text-center !p-16 border-white/5 relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-1 bg-violet-600"></div>
                <BeakerIcon className="w-16 h-16 text-violet-400 mx-auto mb-10" />
                <h2 className="text-5xl font-black mb-6 uppercase tracking-tighter italic text-white">Awaiting Neural Stream</h2>
                <p className="text-slate-500 mb-12 uppercase tracking-widest text-[10px]">Initialize knowledge core to begin simulation</p>
                <Link to="/new-session"><Button size="lg" className="w-full h-18 !text-xl !font-black">INITIALIZE DATA SYNC →</Button></Link>
            </Card>
        </div>
    );

    if (isLoading) return (
        <div className="min-h-[90vh] flex flex-col items-center justify-center gap-8">
            <div className="relative">
                <div className="absolute inset-0 bg-cyan-400 blur-[120px] opacity-20 animate-pulse"></div>
                <Spinner className="w-24 h-24 relative z-10" colorClass="bg-cyan-500" />
            </div>
            <p className="text-3xl font-black uppercase tracking-widest text-white italic animate-pulse">Synthesizing Physics Model...</p>
        </div>
    );

    return (
        <div className="w-full min-h-screen bg-[#010208] text-white relative">
            <div className="fixed inset-0 z-0 opacity-60">
                <Canvas camera={{ position: [0, 5, 12], fov: 45 }}>
                    <Stars radius={100} depth={50} count={5000} factor={4} />
                    <Sparkles count={100} scale={10} size={1} speed={0.3} color="#22d3ee" />
                </Canvas>
            </div>
            <div className="relative z-10 p-6 md:p-12">
                {experiment ? (
                    <div className="animate-in fade-in duration-1000">
                        <SimulationActive experiment={experiment} onReset={initializeLab} />
                    </div>
                ) : (
                    <div className="text-center py-40">
                         <Button onClick={initializeLab} size="lg" className="!bg-red-500">RE-CALIBRATE NEURAL LINK</Button>
                    </div>
                )}
            </div>
        </div>
    );
};

const SimulationActive = ({ experiment, onReset }: any) => {
    const [activeStep, setActiveStep] = useState(0);
    const [progress, setProgress] = useState(0);

    const performAction = () => {
        if (activeStep < experiment.steps.length - 1) {
            setActiveStep(s => s + 1);
            setProgress(((activeStep + 1) / experiment.steps.length) * 100);
        } else {
            setProgress(100);
        }
    };

    return (
        <div className="max-w-[1800px] mx-auto space-y-12">
            <div className="flex flex-col lg:flex-row justify-between items-end gap-8 border-b border-white/5 pb-10">
                <div>
                    <h2 className="text-5xl font-black text-white uppercase italic tracking-tighter leading-none mb-4">{experiment.title || "Digital Lab Simulation"}</h2>
                    <p className="text-slate-500 font-mono-tech text-[10px] uppercase tracking-[0.5em]">{experiment.subTitle || "EXPERIMENTAL LOGIC CORE ACTIVE"}</p>
                </div>
                <div className="flex items-center gap-6">
                    <div className="text-right">
                        <p className="text-[9px] font-black text-cyan-400 uppercase tracking-widest mb-1">Phase: Stable</p>
                        <p className="text-3xl font-black text-white italic">{Math.round(progress)}% COMPLETED</p>
                    </div>
                    <Button variant="outline" onClick={onReset} className="h-16 !px-8 !text-[9px] !font-black uppercase tracking-widest">RELOAD MODEL</Button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
                <div className="lg:col-span-8 glass-card rounded-[3.5rem] overflow-hidden relative min-h-[600px] border-4 border-white/5 shadow-[0_40px_120px_rgba(0,0,0,0.9)]">
                    <div className="absolute top-8 left-8 z-10 flex gap-4">
                        <div className="bg-slate-900/80 backdrop-blur-xl px-6 py-2 rounded-full border border-white/10 text-[10px] font-black text-cyan-400 tracking-widest uppercase">3D Neural Visualizer</div>
                    </div>
                    <SimulationVisuals experiment={experiment} activeStep={activeStep} />
                </div>

                <div className="lg:col-span-4 flex flex-col gap-8">
                    <Card variant="dark" className="flex-grow !p-10 relative overflow-hidden !rounded-[3rem] border-violet-500/20 shadow-2xl">
                        <div className="absolute top-0 left-0 w-1 h-full bg-violet-600"></div>
                        <h3 className="text-[10px] font-black text-violet-400 uppercase tracking-[0.4em] mb-10">Execution Protocol</h3>
                        
                        <div className="space-y-12">
                            <AnimatePresence mode="wait">
                                <motion.div 
                                    key={activeStep} 
                                    initial={{ opacity: 0, x: 20 }} 
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: -20 }}
                                    className="space-y-6"
                                >
                                    <div className="w-14 h-14 rounded-2xl bg-violet-600/10 border border-violet-500/30 flex items-center justify-center text-violet-400 font-black text-2xl shadow-lg">
                                        {activeStep + 1}
                                    </div>
                                    <p className="text-3xl font-bold text-white leading-tight italic tracking-tight">"{experiment.steps[activeStep].instruction}"</p>
                                    <p className="text-slate-500 text-sm font-medium leading-relaxed">{experiment.steps[activeStep].logic_explanation || "Analyzing chemical and physical properties based on curriculum variables."}</p>
                                </motion.div>
                            </AnimatePresence>
                        </div>

                        <div className="mt-20">
                             <Button onClick={performAction} disabled={activeStep === experiment.steps.length - 1 && progress === 100} className="w-full h-24 !text-2xl !font-black !bg-white !text-black !rounded-3xl shadow-[0_20px_60px_rgba(255,255,255,0.1)] group hover:scale-105 transition-all italic">
                                {experiment.steps[activeStep].actionLabel.toUpperCase()} →
                             </Button>
                        </div>
                    </Card>
                    
                    <Card variant="glass" className="!p-8 border-white/5 !rounded-[2.5rem]">
                        <div className="flex items-center gap-4 mb-4">
                            <SparklesIcon className="w-5 h-5 text-amber-500" />
                            <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Lab Conclusion</h4>
                        </div>
                        <p className="text-slate-400 text-xs italic font-medium">Results are calculated in real-time based on NCERT laboratory standards v2025.</p>
                    </Card>
                </div>
            </div>
        </div>
    );
};

const SimulationVisuals = ({ experiment, activeStep }: any) => (
    <Canvas camera={{ position: [0, 5, 10], fov: 35 }} shadows>
        <ambientLight intensity={0.5} />
        <spotLight position={[15, 20, 10]} intensity={2.5} castShadow />
        <Suspense fallback={null}>
            <Environment preset="city" />
            <PresentationControls global rotation={[0, 0, 0]} polar={[-0.4, 0.2]} azimuth={[-0.4, 0.4]}>
                <StageContent experiment={experiment} activeStep={activeStep} />
            </PresentationControls>
            <ContactShadows position={[0, -2.5, 0]} opacity={0.6} scale={20} blur={2} />
        </Suspense>
        <OrbitControls enableZoom={true} enablePan={false} maxDistance={20} minDistance={5} />
    </Canvas>
);

const StageContent = ({ experiment, activeStep }: any) => {
    const beakerRef = useRef<THREE.Group>(null);
    useFrame((state) => { 
        if (beakerRef.current) {
            beakerRef.current.position.y = Math.sin(state.clock.getElapsedTime()) * 0.1;
            beakerRef.current.rotation.y += 0.005;
        }
    });

    /* Added useMemo to solve the 'Cannot find name' error */
    const liquidColor = useMemo(() => {
        if (activeStep === 0) return experiment.liquidColor || "#00ffff";
        return experiment.secondaryColor || "#ff00ff";
    }, [activeStep, experiment]);

    return (
        <group ref={beakerRef}>
            {/* The Beaker Vessel */}
            <mesh castShadow receiveShadow>
                <cylinderGeometry args={[2, 1.8, 4.5, 64]} />
                <MeshTransmissionMaterial 
                    thickness={0.8} 
                    roughness={0} 
                    transmission={1} 
                    ior={1.5}
                    chromaticAberration={0.06}
                    anisotropy={0.1}
                    color="#ffffff" 
                />
            </mesh>
            
            {/* The Internal Fluid */}
            <mesh position={[0, -0.8, 0]}>
                <cylinderGeometry args={[1.9, 1.7, 2.5, 64]} />
                <meshStandardMaterial 
                    color={liquidColor} 
                    transparent 
                    opacity={0.7} 
                    emissive={liquidColor}
                    emissiveIntensity={1}
                />
            </mesh>

            {/* Scientific Base Plate */}
            <mesh position={[0, -2.3, 0]} receiveShadow>
                <boxGeometry args={[6, 0.2, 6]} />
                <meshStandardMaterial color="#05070f" metalness={1} roughness={0.2} />
            </mesh>
        </group>
    );
};

export default DigitalLabPage;