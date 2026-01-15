import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import * as geminiService from '../services/geminiService';
import * as userService from '../services/userService';
import { useContent } from '../contexts/ContentContext';
import { VisualExplanationScene, ClassLevel, Subject } from '../types';
import { CLASS_LEVELS, SUBJECTS } from '../constants';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import Spinner from '../components/common/Spinner';
import VisualPlayer from '../components/app/VisualPlayer';
import { CheckCircleIcon, XCircleIcon, VideoCameraIcon } from '../components/icons';

type PageState = 'setup' | 'generating' | 'error';
type TopicStatus = 'pending' | 'generating' | 'complete' | 'error';
type SetupMode = 'content' | 'topic';
type Language = 'en-IN' | 'en-US' | 'en-GB' | 'hi';

interface TopicState {
  title: string;
  content: string;
  status: TopicStatus;
  errorMessage?: string;
}

const VisualExplanationPage: React.FC = () => {
    const { extractedText: globalExtractedText, classLevel: globalClassLevel, subject: globalSubject, hasSessionStarted } = useContent();
    const navigate = useNavigate();

    const [pageState, setPageState] = useState<PageState>('setup');
    const [setupMode, setSetupMode] = useState<SetupMode>(hasSessionStarted && globalExtractedText ? 'content' : 'topic');
    const [customTopic, setCustomTopic] = useState('');
    const [classLevel, setClassLevel] = useState<ClassLevel>(globalClassLevel || 'Class 10');
    const [subject, setSubject] = useState<Subject | null>(globalSubject);
    const [language, setLanguage] = useState<Language>('en-IN');
    const [sourceText, setSourceText] = useState(globalExtractedText);

    const [topics, setTopics] = useState<TopicState[]>([]);
    const [allScenes, setAllScenes] = useState<VisualExplanationScene[]>([]);
    const [topicSceneStarts, setTopicSceneStarts] = useState<number[]>([]);
    const [summaryVideoScenes, setSummaryVideoScenes] = useState<VisualExplanationScene[]>([]);
    const [summaryStatus, setSummaryStatus] = useState<TopicStatus>('pending');
    
    const [jumpToScene, setJumpToScene] = useState<number | undefined>(undefined);
    const [currentPlayingTopicIndex, setCurrentPlayingTopicIndex] = useState(0);
    const [error, setError] = useState<React.ReactNode | null>(null);

    const isGenerating = useRef(false);
    
    const handleApiError = (err: unknown) => {
        const message = err instanceof Error ? err.message : "An unknown error occurred.";
        setError(message.includes("Insufficient tokens")
            ? <span>You're out of tokens! Please <Link to="/premium" className="font-bold underline text-violet-600">upgrade to Premium</Link>.</span>
            : message);
        setPageState('error');
        isGenerating.current = false;
    };

    const handleStartGeneration = async () => {
        setPageState('generating');
        isGenerating.current = true;
        let textToProcess = sourceText;

        if (setupMode === 'topic') {
            if (!customTopic || !subject || !classLevel) {
                handleApiError(new Error("Missing topic parameters."));
                return;
            }
            try {
                const fetchedContent = await geminiService.fetchChapterContent(classLevel, subject, customTopic, '');
                setSourceText(fetchedContent);
                textToProcess = fetchedContent;
            } catch (err) {
                handleApiError(err);
                return;
            }
        }
        
        if (!textToProcess) {
             handleApiError(new Error("No content available."));
             return;
        }

        try {
            const topicData = await geminiService.breakdownTextIntoTopics(textToProcess);
            setTopics(topicData.map(t => ({ ...t, status: 'pending' })));
        } catch (err) {
            handleApiError(err);
        }
    };
    
    useEffect(() => {
        if (topics.length === 0 || !isGenerating.current) return;

        const processQueue = async () => {
            let currentScenes: VisualExplanationScene[] = [];
            let sceneStartIndices: number[] = [];

            for (let i = 0; i < topics.length; i++) {
                setTopics(prev => prev.map((t, idx) => idx === i ? { ...t, status: 'generating' } : t));
                try {
                    const newScenes = await geminiService.generateScenesForTopic(topics[i].content, language, classLevel);
                    sceneStartIndices.push(currentScenes.length);
                    currentScenes = [...currentScenes, ...newScenes];
                    setAllScenes([...currentScenes]);
                    setTopicSceneStarts([...sceneStartIndices]);
                    setTopics(prev => prev.map((t, idx) => idx === i ? { ...t, status: 'complete' } : t));
                } catch (err) {
                    const errorMessage = err instanceof Error ? err.message : 'Unknown error';
                    setTopics(prev => prev.map((t, idx) => idx === i ? { ...t, status: 'error', errorMessage } : t));
                }
            }
            
            setSummaryStatus('generating');
            try {
                 const summaryScenes = await geminiService.generateFullChapterSummaryVideo(sourceText, language, classLevel);
                 setSummaryVideoScenes(summaryScenes);
                 setSummaryStatus('complete');
            } catch (err) {
                 setSummaryStatus('error');
            }

            if (currentScenes.length > 0) {
                userService.saveActivity('visual_explanation', customTopic || "Visual Explanation", subject || 'General', {
                    scenes: currentScenes,
                    summaryScenes: summaryVideoScenes
                });
            }
            isGenerating.current = false;
        };
        processQueue();
    }, [topics, sourceText, language, classLevel, customTopic, subject]);

    const handleTopicSelect = (index: number) => {
        if (topics[index].status !== 'complete') return;
        setJumpToScene(topicSceneStarts[index]);
    };
    
    const handleSummarySelect = () => {
        if (summaryStatus !== 'complete') return;
        setJumpToScene(allScenes.length);
    };

    const handleSceneChange = (sceneIndex: number) => {
        let topicIdx = topicSceneStarts.findIndex((start, i) => {
            const end = topicSceneStarts[i+1] || allScenes.length;
            return sceneIndex >= start && sceneIndex < end;
        });
        if (topicIdx === -1 && sceneIndex >= allScenes.length) setCurrentPlayingTopicIndex(topics.length);
        else if (topicIdx !== -1) setCurrentPlayingTopicIndex(topicIdx);
    };

    const renderSetup = () => (
        <Card variant="light" className="max-w-2xl mx-auto">
            <div className="text-center mb-8">
                <VideoCameraIcon className="w-16 h-16 mx-auto text-violet-600" />
                <h1 className="text-3xl font-bold text-slate-800 mt-4">Visual Explanation</h1>
                <p className="mt-2 text-slate-600">Cinematic chapter summaries.</p>
            </div>
             <div className="flex space-x-1 rounded-t-lg bg-slate-100 p-1 w-full mb-4">
                <button disabled={!globalExtractedText} onClick={() => setSetupMode('content')} className={`w-full py-2 text-sm font-medium rounded-md ${setupMode === 'content' ? 'bg-white text-violet-600 shadow' : 'text-slate-600'}`}>Use Content</button>
                <button onClick={() => setSetupMode('topic')} className={`w-full py-2 text-sm font-medium rounded-md ${setupMode === 'topic' ? 'bg-white text-violet-600 shadow' : 'text-slate-600'}`}>Use Topic</button>
            </div>
            <div className="space-y-4">
                {setupMode === 'topic' && (
                    <>
                        <input type="text" value={customTopic} onChange={e => setCustomTopic(e.target.value)} placeholder="Topic..." className="w-full p-2 bg-white/60 border border-slate-400 rounded-md"/>
                        <select value={subject || ''} onChange={(e) => setSubject(e.target.value as Subject)} className="w-full p-2 bg-white/60 border border-slate-400 rounded-md">
                            <option value="" disabled>-- Subject --</option>
                            {SUBJECTS.map(s => <option key={s.name} value={s.name}>{s.name}</option>)}
                        </select>
                    </>
                )}
                <select value={classLevel} onChange={e => setClassLevel(e.target.value as ClassLevel)} className="w-full p-2 bg-white/60 border border-slate-400 rounded-md">
                    {CLASS_LEVELS.map(level => <option key={level} value={level}>{level}</option>)}
                </select>
                <select value={language} onChange={e => setLanguage(e.target.value as Language)} className="w-full p-2 bg-white/60 border border-slate-400 rounded-md">
                    <option value="en-IN">English (India)</option>
                    <option value="en-US">English (US)</option>
                    <option value="hi">Hinglish</option>
                </select>
                <Button onClick={handleStartGeneration} size="lg" className="w-full">Generate Video</Button>
            </div>
        </Card>
    );

    return (
        <div>
            {pageState === 'setup' ? renderSetup() : (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <div className="lg:col-span-2">
                        {allScenes.length > 0 ? (
                            <VisualPlayer scenes={[...allScenes, ...summaryVideoScenes]} language={language} jumpToScene={jumpToScene} onSceneChange={handleSceneChange} />
                        ) : <div className="aspect-video bg-slate-800 rounded-xl flex items-center justify-center text-white"><Spinner /> Generating...</div>}
                    </div>
                    <Card variant="light">
                        <h3 className="text-xl font-bold mb-4 text-center">Playlist</h3>
                        <div className="space-y-2">
                            {topics.map((topic, index) => (
                                <button key={index} onClick={() => handleTopicSelect(index)} className={`w-full p-3 rounded-lg border text-left ${currentPlayingTopicIndex === index ? 'bg-violet-100 border-violet-300' : 'bg-white/50 border-slate-300'}`}>
                                    {topic.title}
                                </button>
                            ))}
                        </div>
                    </Card>
                </div>
            )}
        </div>
    );
};

export default VisualExplanationPage;
