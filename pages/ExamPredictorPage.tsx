import React, { useState, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Card from '../components/common/Card';
import { ExamPredictorIcon, DownloadIcon } from '../components/icons';
import Button from '../components/common/Button';
import Spinner from '../components/common/Spinner';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';
import { QuestionPaper } from '../types';
import * as geminiService from '../services/geminiService';
import { useContent } from '../contexts/ContentContext';
import { saveWorkToHistory } from '../utils/history';
import MathRenderer from '../components/common/MathRenderer';

const ExamPredictorPage: React.FC = () => {
    const { extractedText, subject } = useContent();
    const navigate = useNavigate();
    const [difficulty, setDifficulty] = useState<'Easy' | 'Medium' | 'Hard'>('Medium');
    const [totalMarks, setTotalMarks] = useState(80);
    const [paper, setPaper] = useState<QuestionPaper | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<React.ReactNode | null>(null);
    const paperRef = useRef<HTMLDivElement>(null);

     const handleApiError = (err: unknown) => {
        const message = err instanceof Error ? err.message : "An unknown error occurred.";
        setError(message.includes("Insufficient tokens")
            ? <span>You're out of tokens! Please <Link to="/premium" className="font-bold underline text-violet-600">upgrade to Premium</Link>.</span>
            : message);
        setIsLoading(false);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!extractedText) return;
        setError(null);
        setIsLoading(true);
        try {
            const result = await geminiService.predictExamPaper(extractedText, difficulty, totalMarks, subject);
            setPaper(result);
            saveWorkToHistory({ type: 'Predicted Exam Paper', title: result.title, data: result, subject: subject || undefined });
        } catch (err) { handleApiError(err); } finally { setIsLoading(false); }
    };
    
    const handleDownloadPdf = () => {
        if (!paperRef.current) return;
        setIsLoading(true);
        html2canvas(paperRef.current, { scale: 2 }).then(canvas => {
            const imgData = canvas.toDataURL('image/png');
            const pdf = new jsPDF('p', 'mm', 'a4');
            pdf.addImage(imgData, 'PNG', 10, 10, 190, (canvas.height * 190) / canvas.width);
            pdf.save('predicted-paper.pdf');
            setIsLoading(false);
        });
    };

    if (!extractedText) return (
        <div className="text-center"><Card variant="light" className="max-w-xl mx-auto"><h1 className="text-2xl font-bold">No Content</h1><Button onClick={() => navigate('/new-session')} className="mt-6">Add Content</Button></Card></div>
    );

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            {!paper ? (
                <Card variant="light" className="max-w-3xl mx-auto">
                    <div className="text-center mb-8">
                        <ExamPredictorIcon className="w-16 h-16 mx-auto text-violet-600" />
                        <h1 className="text-3xl font-bold mt-4">Exam Paper Predictor</h1>
                    </div>
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="grid grid-cols-2 gap-4">
                            <input type="number" value={totalMarks} onChange={(e) => setTotalMarks(parseInt(e.target.value))} className="p-2 border rounded-md" placeholder="Total Marks"/>
                            <select value={difficulty} onChange={(e) => setDifficulty(e.target.value as any)} className="p-2 border rounded-md">
                                <option>Easy</option><option>Medium</option><option>Hard</option>
                            </select>
                        </div>
                        {error && <p className="text-red-600 text-center">{error}</p>}
                        <Button type="submit" size="lg" className="w-full" disabled={isLoading}>{isLoading ? <Spinner colorClass="bg-white" /> : 'Predict Paper'}</Button>
                    </form>
                </Card>
            ) : (
                <div className="space-y-6">
                    <div className="flex justify-center gap-4">
                        <Button onClick={handleDownloadPdf} variant="secondary"><DownloadIcon className="w-5 h-5" /> PDF</Button>
                        <Button onClick={() => setPaper(null)} variant="outline">New Prediction</Button>
                    </div>
                    <div ref={paperRef} className="p-8 bg-white text-black rounded-lg shadow-lg">
                        <h2 className="text-2xl font-bold text-center">{paper.title}</h2>
                        <hr className="my-4"/>
                        <div className="space-y-6">
                            {paper.questions.map((q, i) => (
                                <div key={i}>
                                    <MathRenderer text={`${i + 1}. ${q.question}`} />
                                    <span className="font-bold text-sm">[{q.marks} Marks]</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ExamPredictorPage;
