import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { MindMapNode } from '../types';
import * as geminiService from '../services/geminiService';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import Spinner from '../components/common/Spinner';
import { BrainCircuitIcon, DownloadIcon } from '../components/icons';
import MindMap from '../components/app/MindMap';
import { useContent } from '../contexts/ContentContext';
import { saveWorkToHistory } from '../utils/history';

interface MindMapRef {
    download: () => void;
}

const MindMapPage: React.FC = () => {
    const { extractedText, classLevel, subject } = useContent();
    const navigate = useNavigate();

    const [mindMapData, setMindMapData] = useState<MindMapNode | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isDownloading, setIsDownloading] = useState(false);
    const [error, setError] = useState<React.ReactNode | null>(null);
    const mindMapRef = useRef<MindMapRef>(null);

    const handleApiError = (err: unknown) => {
        if (err instanceof Error) {
            setError(err.message.includes("Insufficient tokens")
                ? <span>You're out of tokens! Please <Link to="/premium" className="font-bold underline text-violet-600">upgrade to Premium</Link>.</span>
                : err.message);
        } else {
            setError("An unknown error occurred.");
        }
        setIsLoading(false);
    };

    useEffect(() => {
        if (extractedText) {
            const generateFromContent = async () => {
                setIsLoading(true);
                setMindMapData(null);
                setError(null);
                try {
                    const data = await geminiService.generateMindMapFromText(extractedText, classLevel);
                    setMindMapData(data);
                    saveWorkToHistory({
                        type: 'Mind Map',
                        title: `Mind Map for ${data.term}`,
                        data: data,
                        subject: subject || undefined
                    });
                } catch (err) {
                    handleApiError(err);
                } finally {
                    setIsLoading(false);
                }
            };
            generateFromContent();
        } else {
            setIsLoading(false);
        }
    }, [extractedText, classLevel, subject]);

    const handleDownload = () => {
        mindMapRef.current?.download();
    };
    
    const handleDownloadFinish = (err?: Error) => {
        if (err) {
            console.error("Failed to download mind map:", err);
            setError("Sorry, there was an error creating the download.");
        }
        setIsDownloading(false);
    };

    if (!extractedText && !isLoading) {
        return (
            <div className="text-center">
                <Card variant="light" className="max-w-xl mx-auto">
                    <BrainCircuitIcon className="w-16 h-16 mx-auto text-violet-600" />
                    <h1 className="text-2xl font-bold text-slate-800 mt-4">No Content Found</h1>
                    <p className="mt-2 text-slate-600">
                        To generate a mind map from your content, you first need to start a study session.
                    </p>
                    <div className="mt-6">
                        <Button onClick={() => navigate('/new-session')}>
                            Start a New Session
                        </Button>
                    </div>
                </Card>
            </div>
        );
    }
    
    if (isLoading) {
        return (
             <div className="flex flex-col items-center justify-center gap-4 py-16">
                <Spinner className="w-12 h-12" colorClass="bg-violet-600" />
                <p className="text-slate-600 font-semibold">Generating your mind map from the content...</p>
            </div>
        );
    }

    if (error) {
        return (
            <Card variant="light" className="max-w-lg mx-auto text-center">
                <h2 className="text-xl font-bold text-red-600">An Error Occurred</h2>
                <p className="text-slate-600 mt-2">{error}</p>
                <Button onClick={() => window.location.reload()} className="mt-4">
                    Try Again
                </Button>
            </Card>
        );
    }

    if (mindMapData) {
        return (
            <div className="space-y-6">
                <div className="text-center">
                     <h1 className="text-3xl font-bold text-slate-800">Mind Map for "{mindMapData.term}"</h1>
                     <p className="mt-1 text-slate-600">Interact with the nodes to explore concepts. Click nodes with a +/- sign to expand or collapse.</p>
                     <div className="mt-4 flex items-center justify-center gap-4">
                        <Button onClick={() => navigate('/new-session')} variant="outline">
                            Start New Session
                        </Button>
                        <Button onClick={handleDownload} variant="secondary" disabled={isDownloading}>
                            {isDownloading ? <Spinner /> : <><DownloadIcon className="w-5 h-5"/> Download as Image</>}
                        </Button>
                     </div>
                </div>
                <MindMap 
                    ref={mindMapRef} 
                    data={mindMapData} 
                    onDownloadStart={() => setIsDownloading(true)}
                    onDownloadFinish={handleDownloadFinish}
                />
            </div>
        );
    }

    return null;
};

export default MindMapPage;
