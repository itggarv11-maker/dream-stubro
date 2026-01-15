
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Button from '../components/common/Button';
import Card from '../components/common/Card';
import { useAuth } from '../contexts/AuthContext';
import Spinner from '../components/common/Spinner';

const LoginPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login, loginWithGoogle } = useAuth();
  const navigate = useNavigate();

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email, password);
      navigate('/app');
    } catch (err: any) {
      setError('Invalid credentials.');
    }
    setLoading(false);
  };

  const handleGoogleLogin = async () => {
    setError('');
    setLoading(true);
    try {
        await loginWithGoogle();
        navigate('/app');
    } catch (err: any) {
        setError('Google authentication failed.');
    } finally {
        setLoading(false);
    }
  };

  return (
    <div className="min-h-[70vh] flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <Card variant="dark" className="!p-10 shadow-2xl border-white/5 bg-slate-900/60 backdrop-blur-3xl">
          <div className="text-center mb-10">
            <h1 className="text-4xl font-black text-white tracking-tighter uppercase leading-none">WELCOME <span className="text-violet-500">BACK</span></h1>
            <p className="mt-3 text-slate-500 font-mono-tech text-[10px] uppercase tracking-[0.2em]">Sync with Neural Core</p>
          </div>
          
          <div className="space-y-6">
            <button 
                onClick={handleGoogleLogin}
                disabled={loading}
                className="w-full h-18 bg-white border border-slate-300 rounded-2xl flex items-center justify-center gap-3 hover:bg-slate-100 transition-all active:scale-[0.98] shadow-2xl"
            >
                {loading ? <Spinner colorClass="bg-violet-600" /> : (
                    <>
                        <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" className="w-6 h-6" alt="Google" />
                        <span className="text-base font-black text-slate-800 uppercase tracking-tight">Sync with Google</span>
                    </>
                )}
            </button>

            <div className="relative py-4">
                <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-white/5"></div></div>
                <div className="relative flex justify-center text-[10px] uppercase font-bold text-slate-600 bg-transparent px-2">OR SECURE CHANNEL</div>
            </div>

            <form onSubmit={handleEmailLogin} className="space-y-4">
                <input type="email" value={email} onChange={e => setEmail(e.target.value)} required className="w-full px-5 py-5 bg-slate-950 border border-slate-800 rounded-2xl focus:ring-2 focus:ring-violet-500 outline-none text-white font-mono text-sm" placeholder="EMAIL_ADDRESS"/>
                <input type="password" value={password} onChange={e => setPassword(e.target.value)} required className="w-full px-5 py-5 bg-slate-950 border border-slate-800 rounded-2xl focus:ring-2 focus:ring-violet-500 outline-none text-white font-mono text-sm" placeholder="ACCESS_KEY"/>
                {error && <p className="text-red-500 text-[10px] font-black uppercase text-center tracking-widest">{error}</p>}
                <Button type="submit" className="w-full h-16 !text-lg !font-black uppercase tracking-widest shadow-2xl shadow-violet-900/40" disabled={loading}>
                    {loading ? <Spinner colorClass="bg-white"/> : 'INITIALIZE LINK'}
                </Button>
            </form>
          </div>

          <p className="mt-10 text-center text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">
            No access node? <Link to="/signup" className="text-violet-500 hover:underline">Register Module</Link>
          </p>
        </Card>
      </div>
    </div>
  );
};

export default LoginPage;
