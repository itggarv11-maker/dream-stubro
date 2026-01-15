
import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import Card from '../components/common/Card';
import Spinner from '../components/common/Spinner';
import { 
    AcademicCapIcon, CheckBadgeIcon, DocumentTextIcon, LightBulbIcon, 
    SparklesIcon, ChatBubbleIcon, DocumentDuplicateIcon, RocketLaunchIcon,
    RectangleStackIcon, BrainCircuitIcon, MicrophoneIcon
} from '../components/icons';
import * as userService from '../services/userService';

const ProfilePage: React.FC = () => {
  const { currentUser, userName, isPremium } = useAuth();
  const [history, setHistory] = useState<any[]>([]);
  const [personal, setPersonal] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      if (!currentUser) return;
      setIsLoading(true);
      try {
        const [fullHistory, metrics] = await Promise.all([
          userService.getFullHistory(),
          userService.getPersonalMetrics()
        ]);
        setHistory(fullHistory);
        setPersonal(metrics);
      } catch (err) {
        console.error("Cloud Dossier Sync Failure:", err);
      } finally {
        setIsLoading(false);
      }
    };
    loadData();
  }, [currentUser]);

  if (isLoading) return <div className="flex py-60 justify-center bg-slate-950"><Spinner className="w-20 h-20" colorClass="bg-violet-600"/></div>;

  const getToolIcon = (type: string) => {
    switch(type) {
        case 'chat': return <ChatBubbleIcon className="w-5 h-5 text-cyan-400" />;
        case 'summary': return <DocumentDuplicateIcon className="w-5 h-5 text-emerald-400" />;
        case 'quiz': return <CheckBadgeIcon className="w-5 h-5 text-yellow-400" />;
        case 'mindmap': return <BrainCircuitIcon className="w-5 h-5 text-violet-400" />;
        case 'flashcards': return <RectangleStackIcon className="w-5 h-5 text-pink-400" />;
        case 'viva': return <MicrophoneIcon className="w-5 h-5 text-teal-400" />;
        default: return <DocumentTextIcon className="w-5 h-5 text-slate-400" />;
    }
  };

  /**
   * FIX: Prevent "Minified React error #31" by ensuring we never render a raw object as text.
   */
  const renderTopicText = (item: any) => {
    if (typeof item.topic === 'string') return item.topic;
    if (item.data && typeof item.data.title === 'string') return item.data.title;
    return `${item.type.charAt(0).toUpperCase() + item.type.slice(1)} Session`;
  };

  return (
    <div className="max-w-[1600px] mx-auto px-6 space-y-12 pb-40">
      <div className="border-b border-white/5 pb-10 flex justify-between items-end">
        <div>
            <h1 className="text-6xl font-black tracking-tighter uppercase">STUDENT <span className="text-violet-500">DOSSIER</span></h1>
            <p className="text-slate-500 font-mono-tech mt-2 tracking-widest uppercase italic">Node Hash: {currentUser?.uid.substring(0,12)}... | Access Level: {isPremium ? 'ROOT_PREMIUM' : 'GUEST_USER'}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        <div className="lg:col-span-4 space-y-6">
            <Card variant="dark" className="!p-10 border-slate-800 text-center relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-1 bg-violet-600 shadow-[0_0_20px_rgba(124,58,237,0.5)]"></div>
                <div className="w-24 h-24 rounded-3xl bg-gradient-to-br from-violet-600 to-indigo-600 flex items-center justify-center mx-auto mb-6 shadow-2xl rotate-3">
                    <AcademicCapIcon className="w-12 h-12 text-white" />
                </div>
                <h2 className="text-2xl font-black text-white uppercase tracking-tighter truncate">{userName || "Neural Link Alpha"}</h2>
                {isPremium && <div className="mt-4 inline-block px-4 py-1 bg-amber-500/10 border border-amber-500/20 text-amber-500 text-[9px] font-black uppercase rounded-full tracking-widest">Premium Core Active</div>}
            </Card>

            <Card variant="glass" className="!p-8 border-slate-800">
                <div className="flex items-center gap-3 mb-8">
                    <LightBulbIcon className="w-5 h-5 text-cyan-400" />
                    <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Cognitive Intelligence</h3>
                </div>
                <div className="space-y-8">
                    <div>
                        <p className="text-[9px] font-black text-green-500 uppercase tracking-widest mb-3 flex items-center gap-2">
                             Established Vectors
                        </p>
                        <div className="flex flex-wrap gap-2">
                            {personal?.strengths?.length ? personal.strengths.map((s: string, i: number) => (
                                <span key={i} className="px-2 py-1 bg-green-500/10 text-green-400 text-[9px] font-black border border-green-500/20 rounded uppercase">{s}</span>
                            )) : <p className="text-slate-600 text-[10px] italic font-mono uppercase tracking-widest">Neural Buffer Empty</p>}
                        </div>
                    </div>
                </div>
            </Card>
        </div>

        <div className="lg:col-span-8 space-y-10">
            <div className="space-y-6">
                <div className="flex items-center gap-4">
                    <DocumentTextIcon className="w-6 h-6 text-violet-500"/>
                    <h2 className="text-2xl font-black tracking-widest uppercase text-white/40">Knowledge Archive</h2>
                    <div className="flex-grow h-px bg-white/5"></div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {history.length ? history.map(item => (
                        <div key={item.id} className="p-6 rounded-3xl bg-slate-900/40 border border-white/5 flex items-center justify-between hover:border-violet-500/30 transition-all group">
                            <div className="flex items-center gap-4 overflow-hidden">
                                <div className="flex-shrink-0 p-3 rounded-2xl bg-slate-950 border border-white/5 group-hover:scale-110 transition-transform">
                                    {getToolIcon(item.type)}
                                </div>
                                <div className="overflow-hidden">
                                    <p className="text-sm font-black text-white uppercase truncate pr-2">{renderTopicText(item)}</p>
                                    <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">{item.type} &bull; {item.date}</p>
                                </div>
                            </div>
                            <div className="flex flex-col items-end gap-1 flex-shrink-0">
                                <div className="text-[8px] font-black text-slate-600 uppercase bg-white/5 px-2 py-0.5 rounded border border-white/5">{item.subject}</div>
                            </div>
                        </div>
                    )) : (
                        <div className="col-span-full py-32 text-center border-2 border-dashed border-white/5 rounded-[2.5rem] flex flex-col items-center justify-center">
                            <RocketLaunchIcon className="w-12 h-12 text-slate-800 mb-4 animate-bounce" />
                            <p className="text-slate-600 font-black uppercase tracking-[0.3em] text-xs">Knowledge Archive Offline</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
