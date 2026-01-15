import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import { CheckCircleIcon } from '../components/icons/CheckCircleIcon';
import { SparklesIcon } from '../components/icons/SparklesIcon';
import { useAuth } from '../contexts/AuthContext';

const PremiumPage: React.FC = () => {
  const { currentUser } = useAuth();
  const [secretCode, setSecretCode] = useState('');
  const [specialPlanCode, setSpecialPlanCode] = useState('');
  const [specialPlanError, setSpecialPlanError] = useState('');
  const SECRET_KEY = "GARV";

  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
        if (e.key.length > 1) return; 

        const newSecretCode = (secretCode + e.key).toUpperCase();
        
        if (SECRET_KEY.startsWith(newSecretCode)) {
            if (newSecretCode === SECRET_KEY) {
                if (currentUser) {
                    const tokenKey = `userTokens_${currentUser.uid}`;
                    const unlimitedTokens = 999999;
                    localStorage.setItem(tokenKey, String(unlimitedTokens));
                    window.dispatchEvent(new CustomEvent('tokenChange', { detail: { newTokens: unlimitedTokens } }));
                    alert('SECRET ACTIVATED: Unlimited access granted! ✨');
                } else {
                    alert('Secret code detected, but you must be logged in to activate it.');
                }
                setSecretCode('');
            } else {
                setSecretCode(newSecretCode);
            }
        } else {
            setSecretCode('');
        }
    };
    
    window.addEventListener('keydown', handleKeyPress);
    
    return () => {
        window.removeEventListener('keydown', handleKeyPress);
    };
  }, [secretCode, currentUser]);

  const handleSpecialPlanActivation = () => {
    setSpecialPlanError('');
    if (specialPlanCode.toUpperCase().trim() === SECRET_KEY) {
        if (currentUser) {
            const tokenKey = `userTokens_${currentUser.uid}`;
            const unlimitedTokens = 999999;
            localStorage.setItem(tokenKey, String(unlimitedTokens));
            window.dispatchEvent(new CustomEvent('tokenChange', { detail: { newTokens: unlimitedTokens } }));
            alert('SPECIAL PLAN ACTIVATED: Unlimited access granted! ✨');
            setSpecialPlanCode('');
        } else {
            setSpecialPlanError('You must be logged in to activate a plan.');
        }
    } else {
        setSpecialPlanError('Invalid special message.');
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-12">
      <div className="text-center">
        <SparklesIcon className="w-16 h-16 mx-auto text-transparent bg-clip-text bg-gradient-to-r from-amber-500 to-pink-500" />
        <h1 className="text-4xl md:text-5xl font-extrabold text-slate-800 mt-4">Unlock Your Full Potential</h1>
        <p className="mt-4 text-lg text-slate-600 max-w-2xl mx-auto">
          Choose the plan that's right for you and supercharge your studies with the power of AI.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-stretch">
        <Card variant="light" className="flex flex-col">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-slate-700">Free</h2>
            <p className="text-4xl font-bold text-slate-800 mt-2">
              ₹0<span className="text-lg font-medium text-slate-500">/month</span>
            </p>
            <p className="text-sm text-slate-500 mt-1">Get started for free</p>
          </div>
          <div className="my-6 border-t border-slate-300"></div>
          <ul className="space-y-3 text-slate-600 flex-grow">
            <li className="flex items-center gap-3">
              <CheckCircleIcon className="w-5 h-5 text-violet-500" />
              <span><span className="font-bold">100</span> initial tokens on signup</span>
            </li>
            <li className="flex items-center gap-3">
              <CheckCircleIcon className="w-5 h-5 text-violet-500" />
              <span>Access to all AI tools</span>
            </li>
             <li className="flex items-center gap-3">
              <CheckCircleIcon className="w-5 h-5 text-violet-500" />
              <span>Standard access</span>
            </li>
          </ul>
           <div className="mt-8">
             <Link to="/signup">
                <Button variant="outline" className="w-full">
                    Sign Up for Free
                </Button>
            </Link>
          </div>
        </Card>

        <div className="relative">
            <div className="absolute -inset-0.5 bg-gradient-to-r from-violet-600 to-pink-600 rounded-2xl blur opacity-75"></div>
            <Card variant="light" className="relative flex flex-col h-full !border-violet-300">
              <div className="text-center">
                <h2 className="text-2xl font-bold text-violet-700">Premium</h2>
                <p className="text-4xl font-bold text-slate-800 mt-2">
                  Contact Us
                </p>
                <p className="text-sm text-slate-500 mt-1">For unlimited access</p>
              </div>
              <div className="my-6 border-t border-slate-300"></div>
              <ul className="space-y-3 text-slate-600 flex-grow">
                <li className="flex items-center gap-3">
                  <CheckCircleIcon className="w-5 h-5 text-violet-500" />
                  <span className="font-bold text-slate-800">Unlimited Tokens & Usage</span>
                </li>
                 <li className="flex items-center gap-3">
                  <CheckCircleIcon className="w-5 h-5 text-violet-500" />
                  <span>Access to all AI tools</span>
                </li>
                <li className="flex items-center gap-3">
                  <CheckCircleIcon className="w-5 h-5 text-violet-500" />
                  <span>Priority support</span>
                </li>
                 <li className="flex items-center gap-3">
                  <CheckCircleIcon className="w-5 h-5 text-violet-500" />
                  <span>Early access to new features</span>
                </li>
              </ul>
               <div className="mt-8">
                <a href="mailto:itggarv11@gmail.com">
                    <Button variant="primary" className="w-full text-base">
                        Contact to Buy
                    </Button>
                </a>
              </div>
            </Card>
        </div>
        
        <Card variant="light" className="flex flex-col border-2 border-amber-400">
            <div className="text-center">
                <h2 className="text-2xl font-bold text-amber-600">Special Plan</h2>
                <p className="text-4xl font-bold text-slate-800 mt-2">
                ✨
                <span className="text-lg font-medium text-slate-500"> Free Upgrade</span>
                </p>
                <p className="text-sm text-slate-500 mt-1">For friends &amp; family</p>
            </div>
            <div className="my-6 border-t border-slate-300"></div>
            <ul className="space-y-3 text-slate-600 flex-grow">
                <li className="flex items-center gap-3">
                    <CheckCircleIcon className="w-5 h-5 text-violet-500" />
                    <span className="font-bold text-slate-800">Unlimited Tokens & Usage</span>
                </li>
                <li className="flex items-center gap-3">
                    <CheckCircleIcon className="w-5 h-5 text-violet-500" />
                    <span>All premium features included</span>
                </li>
            </ul>
            <div className="mt-8">
                <div className="space-y-2">
                    <label htmlFor="special-code" className="text-sm font-medium text-slate-600">Enter special message:</label>
                    <input 
                        id="special-code"
                        type="text" 
                        value={specialPlanCode}
                        onChange={(e) => setSpecialPlanCode(e.target.value)}
                        placeholder="Your message here"
                        className="w-full p-2 border border-slate-300 rounded-md focus:ring-amber-500 focus:border-amber-500"
                    />
                    <Button onClick={handleSpecialPlanActivation} className="w-full !bg-amber-500 hover:!bg-amber-600 !text-white">
                        Activate Plan
                    </Button>
                    {specialPlanError && <p className="text-red-500 text-center text-sm mt-1">{specialPlanError}</p>}
                </div>
            </div>
        </Card>
      </div>
    </div>
  );
};

export default PremiumPage;