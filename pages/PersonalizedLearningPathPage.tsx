import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import Card from '../components/common/Card';
import { LearningPathIcon } from '../components/icons';
import Button from '../components/common/Button';
import Spinner from '../components/common/Spinner';
import * as geminiService from '../services/geminiService';
import { QuizQuestion, LearningPath, Subject, ClassLevel } from '../types';
import { CLASS_LEVELS } from '../constants';
import MathRenderer from '../components/common/MathRenderer';
import { saveWorkToHistory } from '../utils/history';

const PersonalizedLearningPathPage: React.FC = () => {
    const [step, setStep] = useState<'topic' | 'quiz' | 'path'>('topic');
    const [topic, setTopic] = useState('');
    const [subject, setSubject] = useState<Subject>(Subject.Science);
    const [classLevel, setClassLevel] = useState<ClassLevel>('Class 10');
    const [diagnosticQuiz, setDiagnosticQuiz] = useState<QuizQuestion[] | null>(null);
    const [learningPath, setLearningPath] = useState<LearningPath | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<React.ReactNode | null>(null);

    const handleGenerateQuiz = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setIsLoading(true);
        try {
            const quiz = await geminiService.generateQuiz(subject, classLevel, `Diagnostic for ${topic}`, 5);
            setDiagnosticQuiz(quiz);
            setStep('quiz');
        } catch (err) { handleApiError(err); } finally { setIsLoading(false); }
    };

    const handleQuizComplete = async (results: any) => {
        setError(null);
        setIsLoading(true);
        try {
            const path = await geminiService.generateLearningPath(topic, subject, classLevel, diagnosticQuiz!);
            setLearningPath(path);
            saveWorkToHistory({ type: 'Learning Path', title: path.mainTopic, data: path, subject: subject });
            setStep('path');
        } catch(err) { handleApiError(err); } finally { setIsLoading(false); }
    };

    const handleApiError = (err: unknown) => {
        const message = err instanceof Error ? err.message : "An unknown error occurred.";
        setError(message);
        setIsLoading(false);
    };

    return (
        <div className="max-w-3xl mx-auto">
            {step === 'topic' && (
                 <Card variant="light" className="text-center !p-12">
                    <LearningPathIcon className="w-20 h-20 mx-auto text-violet-500" />
                    <h1 className="text-3xl font-bold mt-4">Personalized Learning Path</h1>
                    <form onSubmit={handleGenerateQuiz} className="mt-8 space-y-4">
                        <input type="text" value={topic} onChange={e => setTopic(e.target.value)} required placeholder="Topic..." className="w-full p-3 border rounded-md shadow-sm"/>
                        <div className="grid grid-cols-2 gap-4">
                            <select value={subject} onChange={e => setSubject(e.target.value as Subject)} className="p-3 border rounded-md">
                                {Object.values(Subject).map(s => <option key={s} value={s}>{s}</option>)}
                            </select>
                            <select value={classLevel} onChange={e => setClassLevel(e.target.value as ClassLevel)} className="p-3 border rounded-md">
                                {CLASS_LEVELS.map(l => <option key={l} value={l}>{l}</option>)}
                            </select>
                        </div>
                        <Button type="submit" size="lg" disabled={!topic || isLoading}>Start Diagnostic</Button>
                    </form>
                </Card>
            )}
            {step === 'quiz' && (
                <div className="text-center space-y-6">
                    <h2 className="text-2xl font-bold">Diagnostic Quiz</h2>
                    <Button onClick={handleQuizComplete}>Complete Simulation & Get Path</Button>
                </div>
            )}
            {step === 'path' && learningPath && (
                <div className="space-y-6">
                    <h1 className="text-3xl font-bold text-center">Your Path for {learningPath.mainTopic}</h1>
                    {learningPath.learningSteps.map(s => (
                        <Card key={s.step} variant="light" className="!p-6">
                            <div className="flex gap-4">
                                <div className="w-10 h-10 bg-violet-600 text-white rounded-full flex items-center justify-center font-bold">{s.step}</div>
                                <div><h3 className="font-bold text-lg">{s.topic}</h3><p>{s.goal}</p></div>
                            </div>
                        </Card>
                    ))}
                    <Button onClick={() => setStep('topic')} variant="outline" className="mx-auto block">New Path</Button>
                </div>
            )}
            {isLoading && <Spinner className="mx-auto mt-8" />}
        </div>
    );
};

export default PersonalizedLearningPathPage;
