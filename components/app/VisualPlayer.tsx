import React, { useState, useEffect, useRef } from 'react';
import { VisualExplanationScene } from '../../types';
import { PlayIcon, PauseIcon, SpeakerWaveIcon, SpeakerXMarkIcon, ArrowsPointingOutIcon } from '../icons';
import { motion, AnimatePresence } from 'framer-motion';

interface VisualPlayerProps {
    scenes: VisualExplanationScene[];
    language: string; 
    jumpToScene?: number;
    onSceneChange?: (sceneIndex: number) => void;
}

const VisualPlayer: React.FC<VisualPlayerProps> = ({ scenes, language, jumpToScene, onSceneChange }) => {
    const [currentSceneIndex, setCurrentSceneIndex] = useState(0);
    const [isPlaying, setIsPlaying] = useState(false);
    const [progress, setProgress] = useState(0);
    const [isMuted, setIsMuted] = useState(false);
    const [volume, setVolume] = useState(0.8);
    
    const playerRef = useRef<HTMLDivElement>(null);
    const progressIntervalRef = useRef<number | null>(null);
    const sceneDurations = useRef<number[]>([]);
    const totalDuration = useRef<number>(0);
    const playerStateRef = useRef({ isPlaying: false, currentSceneIndex: 0 });

    useEffect(() => {
        playerStateRef.current.isPlaying = isPlaying;
        playerStateRef.current.currentSceneIndex = currentSceneIndex;
        if(onSceneChange) onSceneChange(currentSceneIndex);
    }, [isPlaying, currentSceneIndex, onSceneChange]);
    
    useEffect(() => {
        if (jumpToScene !== undefined && jumpToScene !== currentSceneIndex) {
            setCurrentSceneIndex(jumpToScene);
            setIsPlaying(true);
        }
    }, [jumpToScene]);

    useEffect(() => {
        return () => {
            window.speechSynthesis.cancel();
            if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);
        };
    }, []);

     useEffect(() => {
        sceneDurations.current = scenes.map(s => s.narration.length * 70); 
        totalDuration.current = sceneDurations.current.reduce((sum, dur) => sum + dur, 0);
    }, [scenes]);

    const playScene = (sceneIndex: number, timeOffset = 0) => {
        if (sceneIndex >= scenes.length || !('speechSynthesis' in window)) {
            setIsPlaying(false);
            return;
        }
        
        window.speechSynthesis.cancel();
        if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);
        
        const scene = scenes[sceneIndex];
        const utterance = new SpeechSynthesisUtterance(scene.narration);
        utterance.volume = isMuted ? 0 : volume;

        const getElapsedDuration = () => sceneDurations.current.slice(0, sceneIndex).reduce((sum, dur) => sum + dur, 0);

        utterance.onstart = () => {
             const sceneStartTime = Date.now() - timeOffset;
             progressIntervalRef.current = window.setInterval(() => {
                const timeInScene = Date.now() - sceneStartTime;
                const overallElapsedTime = getElapsedDuration() + timeInScene;
                setProgress(Math.min(100, (overallElapsedTime / totalDuration.current) * 100));
            }, 100);
        };

        utterance.onend = () => {
            if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);
            if (playerStateRef.current.isPlaying && playerStateRef.current.currentSceneIndex < scenes.length - 1) {
                setCurrentSceneIndex(playerStateRef.current.currentSceneIndex + 1);
            } else {
                setIsPlaying(false);
                setProgress(100);
            }
        };
        
        window.speechSynthesis.speak(utterance);
    };

    useEffect(() => {
        if (isPlaying) {
            playScene(currentSceneIndex);
        } else {
            window.speechSynthesis.cancel();
            if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);
        }
    }, [isPlaying, currentSceneIndex]);

    const handlePlayPause = () => {
        if (progress >= 100) {
            setCurrentSceneIndex(0);
            setProgress(0);
        }
        setIsPlaying(!isPlaying);
    };

    const handleFullscreen = () => {
        if (!playerRef.current) return;
        if (document.fullscreenElement) document.exitFullscreen();
        else playerRef.current.requestFullscreen();
    };

    const currentScene = scenes[currentSceneIndex];

    return (
        <div ref={playerRef} className="w-full aspect-video rounded-[2rem] overflow-hidden glass-card border-4 border-white/5 relative group">
            <AnimatePresence mode="wait">
                <motion.img
                    key={currentSceneIndex}
                    src={currentScene.imageUrl || `data:image/jpeg;base64,${currentScene.imageBytes}`}
                    initial={{ opacity: 0, scale: 1.1 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.8 }}
                    className="absolute inset-0 w-full h-full object-cover"
                />
            </AnimatePresence>
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-slate-950/40 p-10 flex flex-col justify-between pointer-events-none">
                <div className="flex justify-between items-start">
                     <div className="bg-black/40 backdrop-blur-md px-4 py-1 rounded-full text-[10px] font-bold text-cyan-400 tracking-widest uppercase border border-cyan-500/20">
                        Neural Vis: Scene {currentSceneIndex + 1}/{scenes.length}
                     </div>
                </div>
                <div className="text-center max-w-4xl mx-auto">
                    <motion.p 
                        key={currentSceneIndex}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-2xl md:text-4xl font-bold text-white drop-shadow-2xl"
                    >
                        {currentScene.narration}
                    </motion.p>
                </div>
                <div className="space-y-4 pointer-events-auto">
                    <div className="w-full bg-white/10 h-1.5 rounded-full overflow-hidden cursor-pointer" onClick={(e) => {
                         const rect = e.currentTarget.getBoundingClientRect();
                         const p = (e.clientX - rect.left) / rect.width;
                         setProgress(p * 100);
                         setCurrentSceneIndex(Math.min(scenes.length -1, Math.floor(p * scenes.length)));
                    }}>
                        <div className="h-full bg-gradient-to-r from-violet-500 to-fuchsia-500 shadow-[0_0_10px_rgba(124,58,237,0.8)]" style={{ width: `${progress}%` }}></div>
                    </div>
                    <div className="flex items-center justify-between text-white/60">
                        <div className="flex items-center gap-6">
                            <button onClick={handlePlayPause} className="hover:text-white transition-colors">
                                {isPlaying ? <PauseIcon className="w-10 h-10"/> : <PlayIcon className="w-10 h-10"/>}
                            </button>
                            <button onClick={() => setIsMuted(!isMuted)} className="hover:text-white transition-colors">
                                {isMuted ? <SpeakerXMarkIcon className="w-6 h-6"/> : <SpeakerWaveIcon className="w-6 h-6"/>}
                            </button>
                        </div>
                        <button onClick={handleFullscreen} className="hover:text-white transition-colors"><ArrowsPointingOutIcon className="w-6 h-6"/></button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default VisualPlayer;
