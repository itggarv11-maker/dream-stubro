import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import Card from '../components/common/Card';
import { PoetryProseIcon, BookOpenIcon } from '../components/icons';
import Button from '../components/common/Button';
import Spinner from '../components/common/Spinner';
import { useContent } from '../contexts/ContentContext';
import * as geminiService from '../services/geminiService';
import { LiteraryAnalysis } from '../types';
import { saveWorkToHistory } from '../utils/history';

const PoetryProseAnalysisPage: React.FC = () => {
    const navigate = useNavigate();
    const { extractedText, subject } = useContent();

    const [textToAnalyze, setTextToAnalyze] = useState(extractedText);
    const [analysis, setAnalysis] = useState<LiteraryAnalysis | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<React.ReactNode | null>(null);
    
     const handleApiError = (err: unknown) => {
        const message = err instanceof Error ? err.message : "An unknown error occurred.";
        setError(message.includes("Insufficient tokens")
            ? <span>You're out of tokens! Please <Link to="/premium" className="font-bold underline text-violet-600">upgrade to Premium</Link>.</span>
            : message);
        setIsLoading(false);
    };

    const handleAnalyze = async () => {
        if (textToAnalyze.trim().length < 50) {
            setError('Please provide more text.');
            return;
        }
        setError(null);
        setIsLoading(true);
        setAnalysis(null);
        try {
            const result = await geminiService.analyzeLiteraryText(textToAnalyze);
            setAnalysis(result);
            saveWorkToHistory({
                type: 'Literary Analysis',
                title: `Analysis of "${result.title}"`,
                data: result,
                subject: subject || undefined
            });
        } catch (err) {
            handleApiError(err);
        } finally {
            setIsLoading(false);
        }
    };

    const renderForm = () => (
         <Card variant="light" className="max-w-3xl mx-auto">
            <div className="text-center mb-8">
                <PoetryProseIcon className="w-16 h-16 mx-auto text-violet-600" />
                <h1 className="text-3xl font-bold text-slate-800 mt-4">Literary Analyst</h1>
            </div>
             <div className="space-y-4">
                <textarea
                    value={textToAnalyze}
                    onChange={(e) => setTextToAnalyze(e.target.value)}
                    placeholder="Paste text here..."
                    className="w-full h-60 p-3 bg-white/80 border border-slate-400 rounded-lg focus:ring-violet-500 outline-none"
                />
                {error && <p className="text-red-500 text-center font-semibold">{error}</p>}
                <div className="text-center"><Button onClick={handleAnalyze} size="lg" disabled={isLoading}>Analyze Text</Button></div>
            </div>
        </Card>
    );

    return isLoading ? <div className="flex justify-center py-20"><Spinner className="w-12 h-12" /></div> : analysis ? (
        <div className="max-w-4xl mx-auto space-y-6">
            <h1 className="text-3xl font-bold text-center">Analysis: {analysis.title}</h1>
            <Card variant="light" className="!p-8"><p>{analysis.overallSummary}</p></Card>
            <div className="grid md:grid-cols-2 gap-6">
                <Card variant="light" className="!p-8">
                    <h3 className="font-bold mb-4">Themes</h3>
                    <ul>{analysis.themes.map((t, i) => <li key={i}>&bull; {t}</li>)}</ul>
                </Card>
                 <Card variant="light" className="!p-8">
                    <h3 className="font-bold mb-4">Devices</h3>
                    {analysis.literaryDevices.map((d, i) => <div key={i} className="mb-2"><strong>{d.device}:</strong> {d.example}</div>)}
                </Card>
            </div>
            <Button onClick={() => setAnalysis(null)} variant="outline" className="mx-auto block">Analyze New Text</Button>
        </div>
    ) : renderForm();
};

export default PoetryProseAnalysisPage;
