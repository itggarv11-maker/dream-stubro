import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Button from '../components/common/Button';
import Card from '../components/common/Card';
import { useAuth } from '../contexts/AuthContext';
import Spinner from '../components/common/Spinner';
import { motion } from 'framer-motion';
import { CheckBadgeIcon } from '../components/icons';
import { CLASS_LEVELS } from '../constants';

const SignUpPage: React.FC = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [inviteCode, setInviteCode] = useState('');
  const [classLevel, setClassLevel] = useState('Class 10');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { signup, loginWithGoogle } = useAuth();
  const navigate = useNavigate();

  const REQUIRED_INVITE_CODE = "GARVBRO";
  const isInviteValid = inviteCode.trim().toUpperCase() === REQUIRED_INVITE_CODE;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isInviteValid) return setError('Encryption Mismatch. Key Denied.');
    if (password !== confirmPassword) return setError('Neural Key Unmatched.');
    if (!name.trim()) return setError('Identity Needed.');
    
    setError('');
    setLoading(true);
    try {
      await signup(email, password, name, classLevel);
      navigate('/app');
    } catch (err: any) {
      setError(err.message || 'Transmission Failure.');
    }
    setLoading(false);
  };

  const handleGoogleSignup = async () => {
    if (!isInviteValid) return setError('Unlock with Astral Key first.');
    setError('');
    setLoading(true);
    try {
        await loginWithGoogle();
        navigate('/app');
    } catch (err: any) {
        setError(err.message || 'Sync failed.');
    } finally {
        setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-slate-950 relative overflow-hidden">
      <div className="w-full max-w-xl relative z-10">
        <Card variant="dark" className="!p-10 md:!p-16 shadow-[0_0_100px_rgba(139,92,246,0.2)] border-white/5 !rounded-[3rem] bg-slate-900/80">
          <div className="text-center mb-10">
            <h1 className="text-4xl font-black text-white tracking-tighter uppercase italic leading-none">STUBRO <span className="text-violet-500">VAULT</span></h1>
            <p className="mt-4 text-slate-500 font-bold uppercase tracking-[0.4em] text-[8px]">Access restricted. Enter Authorization Key.</p>
          </div>
          
          {error && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-red-500/10 border border-red-500/30 text-red-500 p-4 rounded-2xl text-center mb-8 text-[10px] font-black uppercase tracking-widest">
                ALERT: {error}
            </motion.div>
          )}

          <div className="space-y-8">
            <div className="relative">
              <label className="block text-[10px] font-black text-slate-500 uppercase tracking-[0.4em] mb-3">01. Neural Invite Key</label>
              <input 
                type="password" 
                value={inviteCode} 
                onChange={(e) => setInviteCode(e.target.value)} 
                className={`w-full px-4 py-4 border-2 rounded-2xl outline-none text-white font-black text-center tracking-[1em] transition-all text-xl ${isInviteValid ? 'bg-green-500/5 border-green-500 shadow-[0_0_30px_rgba(34,197,94,0.2)]' : 'bg-slate-950 border-slate-800 focus:border-violet-500'}`} 
                placeholder="•••••••"
              />
              {isInviteValid && (
                  <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-2 text-green-500 bg-slate-950 px-3 py-1 rounded-full border border-green-500/30">
                      <CheckBadgeIcon className="w-3 h-3" />
                      <span className="text-[8px] font-black uppercase tracking-widest">KEY_VALID</span>
                  </div>
              )}
            </div>

            <form onSubmit={handleSubmit} className={`space-y-6 transition-all duration-700 ${isInviteValid ? 'opacity-100' : 'opacity-10 blur-sm pointer-events-none'}`}>
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-[8px] font-black text-slate-500 uppercase tracking-widest mb-2">Display ID</label>
                        <input type="text" value={name} onChange={(e) => setName(e.target.value)} required className="w-full px-5 py-3 bg-slate-950 border border-slate-800 rounded-xl outline-none focus:border-violet-500 text-white font-bold" placeholder="NAME"/>
                    </div>
                    <div>
                        <label className="block text-[8px] font-black text-slate-500 uppercase tracking-widest mb-2">Subject Grade</label>
                        <select value={classLevel} onChange={(e) => setClassLevel(e.target.value)} className="w-full px-5 py-3 bg-slate-950 border border-slate-800 rounded-xl outline-none focus:border-violet-500 text-white font-bold">
                            {CLASS_LEVELS.map(l => <option key={l} value={l}>{l}</option>)}
                        </select>
                    </div>
                </div>
                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required className="w-full px-5 py-3 bg-slate-950 border border-slate-800 rounded-xl outline-none focus:border-violet-500 text-white font-bold" placeholder="E_MAIL_ADDRESS"/>
                <div className="grid grid-cols-2 gap-4">
                    <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required className="w-full px-5 py-3 bg-slate-950 border border-slate-800 rounded-xl outline-none focus:border-violet-500 text-white font-bold" placeholder="ACCESS_KEY"/>
                    <input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required className="w-full px-5 py-3 bg-slate-950 border border-slate-800 rounded-xl outline-none focus:border-violet-500 text-white font-bold" placeholder="RE_KEY"/>
                </div>
                
                <div className="pt-4 space-y-4">
                    <Button type="submit" className="w-full h-16 !text-lg !font-black uppercase tracking-widest !rounded-2xl !bg-violet-600 shadow-2xl" disabled={loading}>
                        {loading ? <Spinner colorClass="bg-white"/> : 'INITIALIZE PROTOCOL'}
                    </Button>
                    <div className="relative py-2"><div className="absolute inset-0 flex items-center"><div className="w-full border-t border-white/5"></div></div><div className="relative flex justify-center text-[10px] uppercase"><span className="bg-slate-900 px-4 text-slate-500 font-black">OR FAST_SYNC</span></div></div>
                    <button type="button" onClick={handleGoogleSignup} className="w-full h-16 bg-white rounded-2xl flex items-center justify-center gap-3 hover:bg-slate-100 transition-all text-slate-900 font-black uppercase tracking-tight italic">
                        <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" className="w-5 h-5" alt="" />
                        Sync with Google
                    </button>
                </div>
            </form>
          </div>

          <p className="mt-8 text-center text-[10px] font-black text-slate-500 uppercase tracking-widest">
            Already Synced? <Link to="/login" className="text-violet-500 hover:text-white underline transition-colors">LOGIN_LINK</Link>
          </p>
        </Card>
      </div>
    </div>
  );
};

export default SignUpPage;