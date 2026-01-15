
import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'https://esm.sh/react-router-dom';
import { GameLevel, PlayerPosition, Interaction } from '../types';
import * as geminiService from '../services/geminiService';
import * as userService from '../services/userService';
import { useContent } from '../contexts/ContentContext';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import Spinner from '../components/common/Spinner';

type GameState = 'generating' | 'playing' | 'interaction' | 'feedback' | 'completed' | 'error';

const TILE_SIZE = 40;

const ChapterConquestPage: React.FC = () => {
    const { extractedText, subject } = useContent();
    const navigate = useNavigate();

    const [gameState, setGameState] = useState<GameState>('generating');
    const [level, setLevel] = useState<GameLevel | null>(null);
    const [playerPosition, setPlayerPosition] = useState<PlayerPosition>({ x: 0, y: 0 });
    const [score, setScore] = useState(0);

    const [activeInteraction, setActiveInteraction] = useState<Interaction | null>(null);
    const [interactionAnswer, setInteractionAnswer] = useState('');
    const [feedback, setFeedback] = useState<{ correct: boolean; message: string } | null>(null);
    const [completedInteractions, setCompletedInteractions] = useState<Set<number>>(new Set());
    const [error, setError] = useState<React.ReactNode | null>(null);

    useEffect(() => {
        if (!extractedText) {
             setError(
                <span>
                    No content loaded. Please <button onClick={() => navigate('/new-session')} className="text-violet-600 underline font-bold">start a new session</button> to play.
                </span>
            );
            setGameState('error');
            return;
        }

        const initLevel = async () => {
            try {
                const generatedLevel = await geminiService.generateGameLevel(extractedText);
                setLevel(generatedLevel);
                setPlayerPosition(generatedLevel.player_start || { x: 0, y: 0 });
                setGameState('playing');
            } catch (err) {
                setError(err instanceof Error ? err.message : "Failed to generate level");
                setGameState('error');
            }
        };

        initLevel();
    }, [extractedText, navigate]);

    useEffect(() => {
        if (gameState === 'completed' && level) {
            userService.saveActivity('other', `Chapter Conquest: ${level.title}`, subject || 'General', {
                score: score,
                maxScore: (level.interactions || []).length,
                level: level.title
            });
        }
    }, [gameState, level, score, subject]);

    const movePlayer = useCallback((dx: number, dy: number) => {
        if (gameState !== 'playing' || !level || !level.grid) return;
        setPlayerPosition(prev => {
            const newX = prev.x + dx;
            const newY = prev.y + dy;
            
            // Bounds check
            if (newY < 0 || newY >= (level.grid || []).length || newX < 0 || newX >= (level.grid[0] || []).length) {
                return prev;
            }

            // Wall check
            if (level.grid[newY][newX].type === 'wall') {
                return prev;
            }

            return { x: newX, y: newY };
        });
    }, [gameState, level]);

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (gameState !== 'playing') return;
            if(['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
                e.preventDefault();
            }
            switch(e.key) {
                case 'ArrowUp': case 'w': movePlayer(0, -1); break;
                case 'ArrowDown': case 's': movePlayer(0, 1); break;
                case 'ArrowLeft': case 'a': movePlayer(-1, 0); break;
                case 'ArrowRight': case 'd': movePlayer(1, 0); break;
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [movePlayer, gameState]);

    useEffect(() => {
        if (!level || !level.grid || gameState !== 'playing') return;
        
        if (playerPosition.y >= level.grid.length || playerPosition.x >= level.grid[0].length) return;

        const tile = level.grid[playerPosition.y][playerPosition.x];
        const interaction = (level.interactions || []).find(i => i.position.x === playerPosition.x && i.position.y === playerPosition.y);
        
        if (interaction && !completedInteractions.has(interaction.id)) {
            setActiveInteraction(interaction);
            setGameState('interaction');
            return;
        }

        if (tile && tile.type === 'exit') {
            setGameState('completed');
        }
    }, [playerPosition, level, gameState, completedInteractions]);

    const handleInteractionSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!activeInteraction) return;
        
        const isCorrect = interactionAnswer.trim().toLowerCase() === activeInteraction.correct_answer.toLowerCase();
        if (isCorrect) {
            setScore(s => s + 1);
            setCompletedInteractions(prev => new Set(prev).add(activeInteraction.id));
            setFeedback({ correct: true, message: activeInteraction.success_message });
        } else {
            setFeedback({ correct: false, message: activeInteraction.failure_message });
        }
        setGameState('feedback');
    };

    const handleContinue = () => {
        setGameState('playing');
        setActiveInteraction(null);
        setInteractionAnswer('');
        setFeedback(null);
    };

    const renderGrid = () => {
        if (!level || !level.grid) return null;
        return (
             <div className="relative mx-auto bg-slate-800 rounded-lg overflow-hidden shadow-2xl" style={{ 
                 width: (level.grid[0] || []).length * TILE_SIZE, 
                 height: level.grid.length * TILE_SIZE 
             }}>
                 {(level.grid || []).map((row, y) => (row || []).map((tile, x) => {
                     let bg = 'bg-slate-700'; // floor
                     if (tile.type === 'wall') bg = 'bg-slate-900';
                     if (tile.type === 'exit') bg = 'bg-amber-500';
                     
                     const interaction = (level.interactions || []).find(i => i.position.x === x && i.position.y === y);
                     if (interaction) {
                         bg = completedInteractions.has(interaction.id) ? 'bg-purple-900' : 'bg-purple-500';
                     }

                     return (
                         <div key={`${x}-${y}`} className={`absolute ${bg} border border-slate-600/20`} style={{
                             width: TILE_SIZE,
                             height: TILE_SIZE,
                             left: x * TILE_SIZE,
                             top: y * TILE_SIZE
                         }} />
                     );
                 }))}
                 <div className="absolute bg-green-400 rounded-full shadow-lg shadow-green-400/50 transition-all duration-200 ease-linear" style={{
                     width: TILE_SIZE * 0.8,
                     height: TILE_SIZE * 0.8,
                     left: playerPosition.x * TILE_SIZE + (TILE_SIZE * 0.1),
                     top: playerPosition.y * TILE_SIZE + (TILE_SIZE * 0.1),
                     zIndex: 10
                 }} />
             </div>
        );
    };

    if (gameState === 'generating') return <div className="flex flex-col items-center py-20"><Spinner className="w-12 h-12" colorClass="bg-violet-600"/><p className="mt-4 text-slate-600 font-semibold">Building your level...</p></div>;
    if (gameState === 'error') return <Card variant="light" className="text-center text-red-600"><h2 className="text-xl font-bold">Error</h2><p>{error}</p></Card>;

    return (
        <div className="flex flex-col items-center space-y-6">
            <Card variant="dark" className="w-full max-w-4xl !p-4 flex justify-between items-center text-white">
                <div>
                    <h2 className="text-xl font-bold">{level?.title}</h2>
                    <p className="text-sm text-slate-300">Goal: {level?.goal}</p>
                </div>
                <div className="text-right">
                    <p className="font-bold text-lg text-green-400">Score: {score}</p>
                    <p className="text-xs text-slate-400">Use Arrow Keys to Move</p>
                </div>
            </Card>

            <div className="overflow-auto w-full flex justify-center p-4">
                {renderGrid()}
            </div>

            {gameState === 'interaction' && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <Card variant="light" className="max-w-md w-full animate-in fade-in zoom-in duration-300">
                        <h3 className="text-xl font-bold text-slate-800 mb-4">Challenge!</h3>
                        <p className="text-slate-700 mb-4 text-lg">{activeInteraction?.prompt}</p>
                        <form onSubmit={handleInteractionSubmit} className="space-y-4">
                            <input 
                                autoFocus
                                type="text" 
                                value={interactionAnswer} 
                                onChange={e => setInteractionAnswer(e.target.value)}
                                className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-violet-500 outline-none"
                                placeholder="Type your answer..."
                            />
                            <Button type="submit" className="w-full">Submit</Button>
                        </form>
                    </Card>
                </div>
            )}

            {gameState === 'feedback' && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                     <Card variant="light" className={`max-w-md w-full text-center border-4 ${feedback?.correct ? 'border-green-400' : 'border-red-400'}`}>
                        <h3 className={`text-2xl font-bold mb-2 ${feedback?.correct ? 'text-green-600' : 'text-red-600'}`}>
                            {feedback?.correct ? 'Correct!' : 'Incorrect'}
                        </h3>
                        <p className="text-slate-700 mb-6">{feedback?.message}</p>
                        <Button onClick={handleContinue} className="w-full">Continue</Button>
                    </Card>
                </div>
            )}

            {gameState === 'completed' && (
                 <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
                    <Card variant="light" className="max-w-lg w-full text-center !p-8">
                        <h2 className="text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-violet-600 to-pink-600 mb-4">Level Conquered!</h2>
                        <p className="text-xl text-slate-600 mb-8">You have mastered this chapter.</p>
                        <div className="bg-slate-100 p-4 rounded-lg mb-8">
                             <p className="text-2xl font-bold text-slate-800">Final Score: {score} / {level?.interactions?.length || 0}</p>
                        </div>
                        <Button onClick={() => navigate('/app')} size="lg" className="w-full">Back to Dashboard</Button>
                    </Card>
                </div>
            )}
        </div>
    );
};

export default ChapterConquestPage;
