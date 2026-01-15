import React from 'react';
import { Link } from 'react-router-dom';
import { HeartIcon, AcademicCapIcon, RocketLaunchIcon } from '../icons';

const Footer: React.FC = () => {
  return (
    <footer className="bg-[#010208] border-t border-white/5 pt-32 pb-12 overflow-hidden relative">
      {/* Subtle Branding Background */}
      <div className="absolute top-0 right-0 p-20 opacity-[0.02] pointer-events-none">
        <AcademicCapIcon className="w-[800px] h-[800px] rotate-12" />
      </div>

      <div className="container mx-auto px-10 relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-20 md:gap-32 mb-32">
          
          {/* Main Info */}
          <div className="md:col-span-5 space-y-12">
            <Link to="/" className="flex items-center gap-6 group">
                <div className="relative bg-white p-3 rounded-2xl group-hover:scale-110 transition-transform shadow-[0_10px_30px_rgba(255,255,255,0.2)]">
                    <AcademicCapIcon className="h-8 w-8 text-slate-950" />
                </div>
                <div>
                    <span className="text-3xl font-black text-white tracking-tightest uppercase leading-none block italic">STUBRO <span className="text-violet-500">AI</span></span>
                    <span className="text-[10px] font-black text-slate-600 tracking-[0.5em] uppercase block mt-2">The Omega Core</span>
                </div>
            </Link>
            <p className="text-slate-400 font-medium text-xl leading-relaxed max-w-md italic">
                Architecting the future of Indian education. From Board Finals to Ivy League—Master every concept with elite logic.
            </p>
            <div className="flex gap-8">
                {['TW', 'LI', 'IG', 'YT'].map(social => (
                    <div key={social} className="text-[11px] font-black text-slate-600 hover:text-white transition-all cursor-pointer tracking-widest border-b border-transparent hover:border-violet-500 pb-1 italic">
                        {social}
                    </div>
                ))}
            </div>
          </div>

          {/* Nav Links */}
          <div className="md:col-span-3 space-y-12">
            <h4 className="text-[11px] font-black text-slate-500 uppercase tracking-[0.5em] mb-12 italic">Precision Links</h4>
            <ul className="space-y-6">
              <li><Link to="/about" className="text-slate-300 hover:text-cyan-400 transition-colors text-base font-bold uppercase tracking-widest block">About Protocol</Link></li>
              <li><Link to="/privacy-policy" className="text-slate-300 hover:text-cyan-400 transition-colors text-base font-bold uppercase tracking-widest block">Privacy Ledger</Link></li>
              <li><Link to="/contact" className="text-slate-300 hover:text-cyan-400 transition-colors text-base font-bold uppercase tracking-widest block">Command Center</Link></li>
              <li><Link to="/premium" className="text-amber-500 hover:text-amber-400 transition-colors text-base font-black uppercase tracking-[0.2em] italic block">Ascension Tiers</Link></li>
            </ul>
          </div>

          {/* Operational Status */}
          <div className="md:col-span-4">
            <div className="p-12 rounded-[4rem] bg-white/[0.02] border border-white/5 relative overflow-hidden group shadow-2xl">
                <div className="absolute top-0 right-0 p-8 opacity-[0.05] rotate-12 group-hover:scale-125 transition-transform duration-1000">
                    <RocketLaunchIcon className="w-32 h-32 text-violet-500"/>
                </div>
                <h4 className="text-[10px] font-black text-violet-400 uppercase tracking-[0.6em] mb-6 italic">Operational Status</h4>
                <p className="text-white text-3xl font-black tracking-tightest mb-6 uppercase italic">Sync: STABLE</p>
                <div className="flex items-center gap-3 text-slate-400 text-xs font-bold uppercase tracking-widest">
                    <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_15px_rgba(16,185,129,0.5)]"></div>
                    Real-time Latency: 0.18s
                </div>
            </div>
          </div>
        </div>

        {/* Legal Bar */}
        <div className="pt-16 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-12">
          <p className="text-[11px] font-bold text-slate-800 uppercase tracking-[0.4em]">
            &copy; {new Date().getFullYear()} STUBRO AI LABS. ALL INTELLECT RESERVED.
          </p>
          <div className="flex items-center gap-4 text-slate-800 font-black text-[11px] uppercase tracking-widest italic group cursor-default">
            Built with Precision in India <HeartIcon className="w-5 h-5 text-slate-900 group-hover:text-red-600 transition-colors" /> by Garv
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;