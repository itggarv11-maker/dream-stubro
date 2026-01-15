
import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const Button: React.FC<ButtonProps> = ({ children, variant = 'primary', size = 'md', className = '', ...props }) => {
  const baseClasses = 'interactive-3d rounded-xl font-semibold transition-all duration-300 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 active:scale-95';

  const sizeClasses = {
    sm: 'px-4 py-2 text-xs',
    md: 'px-6 py-2.5 text-sm',
    lg: 'px-8 py-3.5 text-base',
  };

  const variantClasses = {
    // Glowing Violet
    primary: 'bg-gradient-to-r from-violet-600 to-indigo-600 text-white shadow-lg shadow-violet-600/30 hover:shadow-violet-600/50 border border-transparent hover:border-white/20',
    // Dark Slate
    secondary: 'bg-slate-800 text-white hover:bg-slate-700 border border-slate-700 hover:border-slate-600 shadow-md',
    // Outline
    outline: 'bg-transparent border border-slate-600 text-slate-300 hover:bg-slate-800 hover:text-white hover:border-slate-500',
    // Ghost
    ghost: 'bg-transparent text-slate-400 hover:text-white hover:bg-slate-800/50'
  };

  return (
    <button className={`${baseClasses} ${sizeClasses[size]} ${variantClasses[variant]} ${className}`} {...props}>
      {children}
    </button>
  );
};

export default Button;
