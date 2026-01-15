import React, { useState } from 'react';
import { Link } from 'https://esm.sh/react-router-dom';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import Spinner from '../components/common/Spinner';
import { AILabAssistantIcon, BookOpenIcon, CheckCircleIcon } from '../components/icons';
import { LabExperiment, Subject } from '../types';
import * as geminiService from '../services/geminiService';
import { saveWorkToHistory } from '../utils/history';

const AILabAssistantPage: React.FC = () => {
    const [subject, setSubject] = useState<Subject>(Subject.Physics);
    const [topic, setTopic] = useState('');
    const [safetyLevel, setSafetyLevel] = useState<'School Lab' | 'Advanced'>('School Lab');
    
    const [experiment, setExperiment] = useState<LabExperiment | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<React.ReactNode | null>(null);

    const handleApiError = (err: unknown) => {
        const message = err instanceof Error ? err.message : "An unknown error occurred.";
        setError(message.includes("Insufficient tokens")
            ? <span>You're out of tokens! Please <Link to="/premium" className="font-bold underline text-violet-600">upgrade to Premium</Link> for unlimited access.</span>
            : message);
        setIsLoading(false);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!topic.trim()) {
            setError('Please enter an experiment topic.');
            return;
        }
        setError(null);
        setIsLoading(true);
        setExperiment(null);
        try {
            const result = await geminiService.generateLabExperiment(subject, topic, safetyLevel);
            setExperiment(result);
            saveWorkToHistory({
                type: 'AI Lab Experiment',
                title: result.experimentTitle,
                data: result,
                subject: subject
            });
        } catch (err) {
            handleApiError(err);
        } finally {
            setIsLoading(false);
        }
    };

    const renderForm = () => (
        <Card variant="light" className="max-w-2xl mx-auto">
            <div className="text-center mb-8">
                <AILabAssistantIcon className="w-16 h-16 mx-auto text-violet-600" />
                <h1 className="text-3xl font-bold text-slate-800 mt-4">AI Lab Assistant</h1>
                <p className="mt-2 text-slate-600">Design experiments, get hypotheses, and understand safety protocols for Physics, Chemistry, and Biology.</p>
            </div>
            <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Subject</label>
                    <div className="flex flex-wrap gap-2">
                        {[Subject.Physics, Subject.Chemistry, Subject.Biology].map(s => (
                            <button
                                type="button"
                                key={s}
                                onClick={() => setSubject(s)}
                                className={`px-4 py-2 rounded-full text-sm font-semibold border-2 transition ${subject === s ? 'bg-violet-600 text-white border-violet-600' : 'bg-white/50 text-slate-700 hover:border-violet-400 border-slate-300'}`}
                            >
                                {s}
                            </button>
                        ))}
                    </div>
                </div>
                <div>
                    <label htmlFor="topic" className="block text-sm font-medium text-slate-700">Experiment Topic</label>
                    <input type="text" id="topic" value={topic} onChange={e => setTopic(e.target.value)} required placeholder="e.g., 'To study the reflection of light' or 'Osmosis in potatoes'" className="mt-1 block w-full px-3 py-2 bg-white/60 border border-slate-400 rounded-md shadow-sm"/>
                </div>
                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Safety Level</label>
                     <div className="flex rounded-md shadow-sm">
                        {(['School Lab', 'Advanced'] as const).map((level, idx) => (
                            <button type="button" key={level} onClick={() => setSafetyLevel(level)} className={`py-2 px-4 w-full text-sm font-medium transition-colors border border-slate-300 ${idx === 0 ? 'rounded-l-lg' : ''} ${idx === 1 ? 'rounded-r-lg' : ''} ${safetyLevel === level ? 'bg-violet-600 text-white' : 'bg-white/70'}`}>
                                {level}
                            </button>
                        ))}
                    </div>
                </div>
                {error && <p className="text-red-600 text-center font-semibold">{error}</p>}
                <div className="text-center pt-2">
                    <Button type="submit" size="lg" disabled={isLoading}>
                        {isLoading ? <Spinner colorClass="bg-white" /> : 'Design Experiment'}
                    </Button>
                </div>
            </form>
        </Card>
    );

    const renderResults = () => (
        <div className="max-w-4xl mx-auto space-y-6">
             <div className="text-center">
                <h1 className="text-3xl font-bold text-slate-800">{experiment?.experimentTitle}</h1>
                <p className="text-lg text-slate-600 mt-1">{experiment?.objective}</p>
            </div>
            <Card variant="light">
                <h2 className="text-xl font-bold text-slate-700 mb-2 flex items-center gap-2"><BookOpenIcon className="w-6 h-6 text-violet-500"/> Hypothesis</h2>
                <p className="text-slate-600 italic">{experiment?.hypothesis}</p>
            </Card>
            <div className="grid md:grid-cols-2 gap-6">
                <Card variant="light">
                    <h2 className="text-xl font-bold text-slate-700 mb-3">Materials Required</h2>
                    <ul className="list-disc list-inside space-y-1 text-slate-600">
                        {experiment?.materials.map((item, i) => <li key={i}>{item}</li>)}
                    </ul>
                </Card>
                 <Card variant="light">
                    <h2 className="text-xl font-bold text-red-600 mb-3">Safety Precautions</h2>
                    <ul className="list-disc list-inside space-y-1 text-slate-600">
                        {experiment?.safetyPrecautions.map((item, i) => <li key={i}>{item}</li>)}
                    </ul>
                </Card>
            </div>
            <Card variant="light">
                <h2 className="text-xl font-bold text-slate-700 mb-3">Procedure</h2>
                 <ol className="list-decimal list-inside space-y-2 text-slate-600">
                    {experiment?.procedure.map((step, i) => <li key={i}>{step}</li>)}
                </ol>
            </Card>
            <div className="text-center">
                <Button onClick={() => setExperiment(null)} variant="outline">Design Another Experiment</Button>
            </div>
        </div>
    );

    return (
        <div>
            {isLoading && <div className="flex justify-center items-center py-10"><Spinner className="w-12 h-12" colorClass="bg-violet-600" /></div>}
            {!isLoading && (experiment ? renderResults() : renderForm())}
        </div>
    );
};

export default AILabAssistantPage;