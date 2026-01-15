import React, { useState, useEffect, Suspense, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Canvas, useFrame } from '@react-three/fiber';
import { 
    OrbitControls, Stars, Float, 
    Environment, ContactShadows, PresentationControls, MeshTransmissionMaterial 
} from '@react-three/drei';
import * as THREE from 'three';
import { motion, AnimatePresence } from 'framer-motion';
import { useContent } from '../contexts/ContentContext';
import * as geminiService from '../services/geminiService';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import Spinner from '../components/common/Spinner';
import { BeakerIcon } from '../components/icons';

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
            setError("Neural link failed.");
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
        <div className="min-h-[80vh] flex items-center justify-center">
            <Card variant="dark" className="max-w-xl text-center !p-12">
                <BeakerIcon className="w-10 h-10 text-violet-400 mx-auto mb-8" />
                <h2 className="text-4xl font-black mb-4">Awaiting Signal</h2>
                <Link to="/new-session"><Button size="lg">INITIALIZE DATA STREAM</Button></Link>
            </Card>
        </div>
    );

    if (isLoading) return <div className="min-h-[80vh] flex flex-col items-center justify-center"><Spinner className="w-16" /><p className="mt-4 uppercase animate-pulse">Designing Reality...</p></div>;

    return (
        <div className="w-full min-h-screen bg-slate-950 text-white relative">
            <div className="fixed inset-0 z-0 opacity-40">
                <Canvas camera={{ position: [0, 5, 10], fov: 45 }}><Stars radius={100} depth={50} count={5000} factor={4} /></Canvas>
            </div>
            <div className="relative z-10 p-6">
                {experiment ? <SimulationActive experiment={experiment} /> : <Button onClick={initializeLab}>Retry Calibration</Button>}
            </div>
        </div>
    );
};

const SimulationActive = ({ experiment }: any) => {
    const [activeStep, setActiveStep] = useState(0);
    const [progress, setProgress] = useState(0);

    const performAction = () => {
        if (activeStep < experiment.steps.length - 1) {
            setActiveStep(s => s + 1);
            setProgress(((activeStep + 1) / experiment.steps.length) * 100);
        } else setProgress(100);
    };

    return (
        <div className="max-w-[1600px] mx-auto space-y-8">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 h-[75vh]">
                <div className="lg:col-span-8 glass-card rounded-[2.5rem] overflow-hidden relative">
                    <SimulationVisuals experiment={experiment} activeStep={activeStep} />
                </div>
                <div className="lg:col-span-4">
                    <Card variant="dark" className="h-full !p-8 relative">
                        <h3 className="text-sm font-black text-slate-500 mb-8">Simulation Control</h3>
                        <AnimatePresence mode="wait">
                            <motion.div key={activeStep} initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                                <p className="text-xl font-bold">{experiment.steps[activeStep].instruction}</p>
                            </motion.div>
                        </AnimatePresence>
                        <div className="absolute bottom-8 left-8 right-8">
                             <Button onClick={performAction} className="w-full h-16 !bg-cyan-500 !text-black">
                                {experiment.steps[activeStep].actionLabel.toUpperCase()}
                             </Button>
                        </div>
                    </Card>
                </div>
            </div>
        </div>
    );
};

const SimulationVisuals = ({ experiment, activeStep }: any) => (
    <Canvas camera={{ position: [0, 4, 8], fov: 40 }} shadows>
        <ambientLight intensity={1} /><spotLight position={[10, 10, 10]} intensity={3} castShadow />
        <Suspense fallback={null}>
            <Environment preset="city" /><PresentationControls global><StageContent experiment={experiment} activeStep={activeStep} /></PresentationControls>
            <ContactShadows position={[0, -2, 0]} opacity={0.4} scale={15} blur={1.5} />
        </Suspense>
        <OrbitControls enableZoom={false} />
    </Canvas>
);

const StageContent = ({ experiment, activeStep }: any) => {
    const beakerRef = useRef<THREE.Group>(null);
    useFrame((state) => { if (beakerRef.current) beakerRef.current.position.y = Math.sin(state.clock.getElapsedTime()) * 0.05; });
    const liquidColor = activeStep > 0 ? experiment.secondaryColor || "#ff00ff" : experiment.liquidColor || "#00ffff";
    return (
        <group ref={beakerRef}>
            <mesh castShadow receiveShadow>
                <cylinderGeometry args={[1.5, 1.4, 3, 64]} />
                <MeshTransmissionMaterial thickness={0.5} roughness={0} transmission={1} color="#ffffff" />
            </mesh>
            <mesh position={[0, -0.6, 0]}>
                <cylinderGeometry args={[1.45, 1.35, 1.7, 64]} />
                <meshStandardMaterial color={liquidColor} transparent opacity={0.7} emissive={liquidColor} />
            </mesh>
        </group>
    );
};

export default DigitalLabPage;
