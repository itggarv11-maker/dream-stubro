
import React, { useState, useRef, useEffect } from 'react';
import { NavLink, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import Button from '../common/Button';
import { 
    ArrowLeftOnRectangleIcon, AcademicCapIcon, UserCircleIcon, 
    ChevronDownIcon, StarIcon, RocketLaunchIcon, 
    BeakerIcon, MenuIcon, XMarkIcon, BoltIcon
} from '../icons';
import { motion, AnimatePresence } from 'framer-motion';

const Header: React.FC = () => {
  const { currentUser, logout, tokens } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [scrolled, setScrolled] = useState(false);
  
  const handleLogout = async () => {
    try {
      await logout();
      setMobileMenuOpen(false);
      navigate('/');
    } catch (error) {
      console.error('Failed to log out', error);
    }
  };

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const linkClass = "text-[var(--text-main)] opacity-60 hover:opacity-100 transition-all duration-300 px-5 py-2 rounded-full text-[10px] font-black tracking-[0.2em] uppercase flex items-center gap-2";
  const activeLinkClass = "!opacity-100 !bg-violet-600 !text-white border border-violet-400/30 shadow-[0_0_20px_rgba(124,58,237,0.3)]";

  return (
    <header className={`fixed top-0 left-0 w-full z-[100] transition-all duration-700 ${scrolled ? 'py-2 md:py-4' : 'py-4 md:py-8'}`}>
      <nav className={`container mx-auto px-4 md:px-10 flex justify-between items-center transition-all duration-700 ${scrolled ? 'max-w-[1200px] glass-card !rounded-full !py-3 md:!py-4 bg-slate-900/80 shadow-2xl' : 'max-w-full bg-transparent'}`}>
        <NavLink to="/" className="flex items-center gap-3 md:gap-4 group">
            <div className="relative">
                 <div className="absolute inset-0 bg-violet-600 rounded-lg md:rounded-xl blur opacity-40"></div>
                 <div className="relative bg-white p-2 md:p-2.5 rounded-lg md:rounded-xl group-hover:scale-110 transition-transform">
                    <AcademicCapIcon className="h-5 w-5 md:h-6 md:w-6 text-slate-950" />
                </div>
            </div>
            <div className="block">
                <span className="text-lg md:text-xl font-black tracking-tighter leading-none block">STUBRO <span className="text-violet-500">AI</span></span>
                <span className="text-[7px] md:text-[8px] font-black opacity-40 tracking-[0.3em] uppercase block mt-0.5 md:mt-1">V10 OMEGA</span>
            </div>
        </NavLink>

        {/* Desktop Navigation */}
        <div className="hidden lg:flex items-center gap-2">
          {currentUser ? (
            <>
              <NavLink to="/app" className={({ isActive }) => `${linkClass} ${isActive ? activeLinkClass : ''}`}>HQ</NavLink>
              
              <div className="relative" ref={dropdownRef}>
                <button onClick={() => setDropdownOpen(!dropdownOpen)} className={`${linkClass} ${dropdownOpen ? 'opacity-100 bg-white/10' : ''}`}>
                  ASTRA <ChevronDownIcon className={`w-3 h-3 transition-transform ${dropdownOpen ? 'rotate-180' : ''}`} />
                </button>
                <AnimatePresence>
                {dropdownOpen && (
                  <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }} className="absolute right-0 mt-6 w-80 rounded-[2.5rem] glass-card border border-white/10 p-3 shadow-[0_20px_80px_rgba(0,0,0,0.8)] bg-slate-900 overflow-hidden">
                    <div className="grid grid-cols-1 gap-1">
                      <SIMLink to="/career-guidance" icon={<RocketLaunchIcon/>} label="Careers" color="text-violet-400" onClick={()=>setDropdownOpen(false)} />
                      <SIMLink to="/digital-lab" icon={<BeakerIcon/>} label="Digital Lab" color="text-cyan-400" onClick={()=>setDropdownOpen(false)} />
                    </div>
                  </motion.div>
                )}
                </AnimatePresence>
              </div>

              <div className="flex items-center gap-3 px-6 py-2.5 bg-black/40 rounded-full border border-white/5 font-mono text-xs shadow-inner ml-2">
                 <span className="opacity-40 uppercase tracking-widest font-black text-[9px]">NT:</span>
                 <span className="font-black text-violet-400">{tokens ?? '...'}</span>
              </div>
              
              <button onClick={toggleTheme} className="p-3 rounded-full bg-white/5 border border-white/10 hover:bg-white/10 transition-all ml-2 text-amber-500">
                  <StarIcon className="w-5 h-5"/>
              </button>

              <NavLink to="/profile" className={({ isActive }) => `ml-2 p-2.5 rounded-full border transition-all ${isActive ? 'bg-violet-600 border-violet-400 text-white shadow-lg' : 'bg-white/5 border-white/10 text-slate-400 hover:text-white'}`}>
                  <UserCircleIcon className="w-5 h-5"/>
              </NavLink>
              
              <button onClick={handleLogout} className="p-2 opacity-40 hover:opacity-100 hover:text-red-500 transition-all ml-2">
                 <ArrowLeftOnRectangleIcon className="w-5 h-5" />
              </button>
            </>
          ) : (
            <>
              <button onClick={toggleTheme} className="p-2 opacity-60 hover:opacity-100 transition-all mr-2 text-amber-500"><StarIcon className="w-5 h-5"/></button>
              <Link to="/premium" className={`${linkClass} !text-amber-500 opacity-100`}>Premium</Link>
              <Link to="/login" className={linkClass}>Login</Link>
              <Link to="/signup">
                <Button size="sm" className="!bg-white !text-slate-950 !rounded-full !px-8 !py-2.5 !font-black !text-[10px] tracking-widest uppercase shadow-xl hover:scale-105 transition-transform">Launch</Button>
              </Link>
            </>
          )}
        </div>

        {/* Mobile Hamburger Trigger */}
        <div className="flex lg:hidden items-center gap-3">
          <button onClick={toggleTheme} className="p-2 text-amber-500"><StarIcon className="w-5 h-5"/></button>
          <button onClick={() => setMobileMenuOpen(true)} className="p-2 bg-white/5 rounded-lg border border-white/10">
            <MenuIcon className="w-6 h-6" />
          </button>
        </div>
      </nav>

      {/* Mobile Menu Overlay */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div initial={{ opacity: 0, x: '100%' }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: '100%' }} className="fixed inset-0 z-[200] bg-slate-950/98 backdrop-blur-2xl lg:hidden flex flex-col p-8">
            <div className="flex justify-between items-center mb-12">
              <div className="flex items-center gap-4">
                <AcademicCapIcon className="w-8 h-8 text-violet-500" />
                <span className="text-2xl font-black uppercase italic tracking-tighter">STUBRO</span>
              </div>
              <button onClick={() => setMobileMenuOpen(false)} className="p-3 bg-white/5 rounded-full"><XMarkIcon className="w-8 h-8 text-white" /></button>
            </div>
            <div className="flex-grow space-y-4">
              <MobileNavLink to="/app" onClick={() => setMobileMenuOpen(false)}>Command HQ</MobileNavLink>
              <MobileNavLink to="/career-guidance" onClick={() => setMobileMenuOpen(false)}>Career Roadmap</MobileNavLink>
              <MobileNavLink to="/premium" onClick={() => setMobileMenuOpen(false)} className="!text-amber-500">Premium Upgrade</MobileNavLink>
            </div>
            {currentUser && (
              <button onClick={handleLogout} className="w-full p-6 bg-red-500/10 border border-red-500/20 text-red-500 rounded-3xl font-black uppercase tracking-widest text-sm flex items-center justify-center gap-4">
                <ArrowLeftOnRectangleIcon className="w-6 h-6" /> TERMINATE
              </button>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
};

const MobileNavLink = ({ to, children, onClick, className = "" }: any) => (
  <NavLink to={to} onClick={onClick} className={({ isActive }) => `block p-5 text-xl font-black uppercase tracking-widest transition-all rounded-2xl ${isActive ? 'bg-violet-600 text-white shadow-lg' : 'text-slate-400 hover:bg-white/5'} ${className}`}>
    {children}
  </NavLink>
);

const SIMLink = ({ to, icon, label, color, onClick }: any) => (
  <Link to={to} onClick={onClick} className="flex items-center gap-4 px-6 py-4 rounded-3xl hover:bg-white/5 transition-all group">
    <div className={`p-3 bg-slate-950 rounded-2xl group-hover:scale-110 transition-transform border border-white/5 ${color}`}>{icon}</div>
    <span className="text-[10px] font-black text-slate-400 group-hover:text-white uppercase tracking-[0.2em]">{label}</span>
  </Link>
);

export default Header;
