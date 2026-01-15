import React, { useState, useRef, useEffect } from 'react';
import { NavLink, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import Button from '../common/Button';
import { 
    ArrowLeftOnRectangleIcon, AcademicCapIcon, UserCircleIcon, 
    ChevronDownIcon, SparklesIcon, CalendarIcon, 
    RocketLaunchIcon, DocumentDuplicateIcon, 
    GavelIcon, BeakerIcon, MenuIcon, XMarkIcon
} from '../icons';
import { motion, AnimatePresence } from 'framer-motion';

const Header: React.FC = () => {
  const { currentUser, logout, tokens } = useAuth();
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

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);
  
  const linkClass = "text-slate-300 hover:text-white transition-all duration-300 px-5 py-2 rounded-full text-[10px] font-black tracking-[0.2em] uppercase flex items-center gap-2";
  const activeLinkClass = "text-white !bg-violet-600 border border-violet-400/30 shadow-[0_0_20px_rgba(124,58,237,0.3)]";

  return (
    <header className={`fixed top-0 left-0 w-full z-[100] transition-all duration-700 ${scrolled ? 'py-2 md:py-4' : 'py-4 md:py-8'}`}>
      <nav className={`container mx-auto px-4 md:px-10 flex justify-between items-center transition-all duration-700 ${scrolled ? 'max-w-[1200px] glass-card !rounded-2xl md:!rounded-[2rem] !py-3 md:!py-4 border-white/10 shadow-2xl bg-slate-900/80' : 'max-w-full bg-transparent'}`}>
        <NavLink to="/" className="flex items-center gap-3 md:gap-4 group">
            <div className="relative">
                 <div className="absolute inset-0 bg-violet-600 rounded-lg md:rounded-xl blur opacity-40"></div>
                 <div className="relative bg-white p-2 md:p-2.5 rounded-lg md:rounded-xl group-hover:scale-110 transition-transform">
                    <AcademicCapIcon className="h-5 w-5 md:h-6 md:w-6 text-slate-950" />
                </div>
            </div>
            <div className="block">
                <span className="text-lg md:text-xl font-black text-white tracking-tighter leading-none block">STUBRO <span className="text-violet-500">AI</span></span>
                <span className="text-[7px] md:text-[8px] font-black text-slate-500 tracking-[0.3em] md:tracking-[0.4em] uppercase block mt-0.5 md:mt-1">OPERATIONAL</span>
            </div>
        </NavLink>

        {/* Desktop Navigation */}
        <div className="hidden lg:flex items-center gap-2">
          {currentUser ? (
            <>
              <NavLink to="/app" className={({ isActive }) => `${linkClass} ${isActive ? activeLinkClass : ''}`}>HQ</NavLink>
              
              <div className="relative" ref={dropdownRef}>
                <button onClick={() => setDropdownOpen(!dropdownOpen)} className={`${linkClass} ${dropdownOpen ? 'text-white bg-white/10' : ''}`}>
                  ASTRA <ChevronDownIcon className={`w-3 h-3 transition-transform ${dropdownOpen ? 'rotate-180' : ''}`} />
                </button>
                {dropdownOpen && (
                  <div className="absolute right-0 mt-6 w-80 rounded-[2.5rem] glass-card border border-white/10 p-3 shadow-[0_20px_80px_rgba(0,0,0,0.8)] animate-in fade-in slide-in-from-top-4 duration-500 bg-slate-900">
                    <div className="grid grid-cols-1 gap-1">
                      <SIMLink to="/career-guidance" icon={<RocketLaunchIcon/>} label="Careers" color="text-violet-400" onClick={()=>setDropdownOpen(false)} />
                      <SIMLink to="/study-planner" icon={<CalendarIcon/>} label="War Plan" color="text-pink-400" onClick={()=>setDropdownOpen(false)} />
                      <SIMLink to="/digital-lab" icon={<BeakerIcon/>} label="Digital Lab" color="text-cyan-400" onClick={()=>setDropdownOpen(false)} />
                    </div>
                  </div>
                )}
              </div>

              <div className="flex items-center gap-3 px-6 py-2.5 bg-slate-950 rounded-full border border-white/5 font-mono-tech text-xs shadow-inner ml-2">
                 <span className="text-slate-500 uppercase tracking-widest font-black text-[9px]">NT:</span>
                 <span className="text-white font-black">{tokens ?? '...'}</span>
              </div>
              
              <NavLink to="/profile" className={({ isActive }) => `ml-2 p-2.5 rounded-full border transition-all ${isActive ? 'bg-violet-600 border-violet-400 text-white shadow-lg' : 'bg-white/5 border-white/10 text-slate-400 hover:text-white'}`}>
                  <UserCircleIcon className="w-5 h-5"/>
              </NavLink>
              
              <button onClick={handleLogout} className="p-2 text-slate-600 hover:text-red-500 transition-colors ml-2">
                 <ArrowLeftOnRectangleIcon className="w-5 h-5" />
              </button>
            </>
          ) : (
            <>
              <Link to="/premium" className={`${linkClass} !text-amber-500`}>Premium</Link>
              <Link to="/login" className={linkClass}>Login</Link>
              <Link to="/signup">
                <Button size="sm" className="!bg-white !text-slate-950 !rounded-full !px-8 !py-2.5 !font-black !text-[10px] tracking-widest uppercase shadow-xl hover:scale-105 transition-transform">Launch</Button>
              </Link>
            </>
          )}
        </div>

        {/* Mobile Hamburger Trigger */}
        <div className="flex lg:hidden items-center gap-3">
          {currentUser && (
            <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-950 rounded-full border border-white/5 font-mono-tech text-[10px] shadow-inner">
                 <span className="text-slate-500 font-black">NT:</span>
                 <span className="text-white font-black">{tokens ?? '...'}</span>
            </div>
          )}
          <button onClick={() => setMobileMenuOpen(true)} className="p-2 text-white bg-white/5 rounded-lg border border-white/10">
            <MenuIcon className="w-6 h-6" />
          </button>
        </div>
      </nav>

      {/* Mobile Menu Overlay */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div 
            initial={{ opacity: 0, x: '100%' }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: '100%' }}
            className="fixed inset-0 z-[200] bg-slate-950/98 backdrop-blur-2xl lg:hidden flex flex-col p-8"
          >
            <div className="flex justify-between items-center mb-12">
              <div className="flex items-center gap-4">
                <AcademicCapIcon className="w-8 h-8 text-violet-500" />
                <span className="text-2xl font-black uppercase italic tracking-tighter">MENU</span>
              </div>
              <button onClick={() => setMobileMenuOpen(false)} className="p-3 bg-white/5 rounded-full">
                <XMarkIcon className="w-8 h-8 text-white" />
              </button>
            </div>

            <div className="flex-grow space-y-4">
              {currentUser ? (
                <>
                  <MobileNavLink to="/app" onClick={() => setMobileMenuOpen(false)}>Command HQ</MobileNavLink>
                  <div className="h-px bg-white/5 my-4"></div>
                  <p className="text-[10px] font-black text-slate-600 uppercase tracking-widest px-4">Astra Protocols</p>
                  <MobileNavLink to="/career-guidance" onClick={() => setMobileMenuOpen(false)}>Career Roadmap</MobileNavLink>
                  <MobileNavLink to="/study-planner" onClick={() => setMobileMenuOpen(false)}>Study War Plan</MobileNavLink>
                  <MobileNavLink to="/digital-lab" onClick={() => setMobileMenuOpen(false)}>Digital Lab</MobileNavLink>
                  <div className="h-px bg-white/5 my-4"></div>
                  <MobileNavLink to="/profile" onClick={() => setMobileMenuOpen(false)}>Identity Dossier</MobileNavLink>
                  <MobileNavLink to="/premium" onClick={() => setMobileMenuOpen(false)} className="!text-amber-500">Premium Upgrade</MobileNavLink>
                </>
              ) : (
                <>
                  <MobileNavLink to="/" onClick={() => setMobileMenuOpen(false)}>Home</MobileNavLink>
                  <MobileNavLink to="/premium" onClick={() => setMobileMenuOpen(false)}>Premium</MobileNavLink>
                  <MobileNavLink to="/login" onClick={() => setMobileMenuOpen(false)}>Login</MobileNavLink>
                  <Link to="/signup" onClick={() => setMobileMenuOpen(false)} className="block pt-4">
                    <Button className="w-full h-16 !text-lg !font-black uppercase tracking-widest !rounded-2xl">INITIALIZE ACCESS</Button>
                  </Link>
                </>
              )}
            </div>

            {currentUser && (
              <button onClick={handleLogout} className="w-full p-6 bg-red-500/10 border border-red-500/20 text-red-500 rounded-3xl font-black uppercase tracking-widest text-sm flex items-center justify-center gap-4">
                <ArrowLeftOnRectangleIcon className="w-6 h-6" /> TERMINATE SESSION
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