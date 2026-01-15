import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import Card from '../components/common/Card';
import { RealWorldIcon } from '../components/icons';
import Button from '../components/common/Button';
import Spinner from '../components/common/Spinner';
import * as geminiService from '../services/geminiService';
import { RealWorldApplication } from '../types';
import { saveWorkToHistory } from '../utils/history';

const RealWorldApplicationPage: React.FC = () => {
    const [concept, setConcept] = useState('');
    const [applications, setApplications] = useState<RealWorldApplication[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<React.ReactNode | null>(null);

    const handleApiError = (err: unknown) => {
        const message = err instanceof Error ? err.message : "An unknown error occurred.";
        setError(message.includes("Insufficient tokens")
            ? <span>You're out of tokens! Please <Link to="/premium" className="font-bold underline text-violet-600">upgrade to Premium</Link>.</span>
            : message);
        setIsLoading(false);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!concept.trim()) return;
        setError(null);
        setIsLoading(true);
        try {
            const result = await geminiService.findRealWorldApplications(concept);
            setApplications(result);
            saveWorkToHistory({ type: 'Real-World Apps', title: concept, data: { concept, applications: result } });
        } catch (err) { handleApiError(err); } finally { setIsLoading(false); }
    };
    
    return (
        <Card variant="light" className="text-center max-w-3xl mx-auto">
            <RealWorldIcon className="w-20 h-20 mx-auto text-violet-500" />
            <h1 className="text-3xl font-bold mt-4">Real-World Application Finder</h1>
             <form onSubmit={handleSubmit} className="mt-8 flex gap-2">
                <input type="text" value={concept} onChange={e => setConcept(e.target.value)} placeholder="Concept..." className="w-full px-4 py-3 bg-white/80 border rounded-lg shadow-sm" />
                <Button type="submit" size="lg" disabled={isLoading}>{isLoading ? <Spinner colorClass="bg-white" /> : 'Discover'}</Button>
            </form>
             <div className="mt-8 space-y-6 text-left">
                {applications.map((item, index) => (
                    <div key={index} className="p-4 bg-slate-50 border rounded-lg">
                        <p className="font-bold text-violet-800 text-lg">{item.industry}</p>
                        <p className="mt-1 text-slate-700">{item.description}</p>
                    </div>
                ))}
             </div>
        </Card>
    );
};

export default RealWorldApplicationPage;
