import React from 'react';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  className?: string;
  variant?: 'dark' | 'light' | 'glass';
}

const Card: React.FC<CardProps> = ({ children, className = '', variant = 'glass', ...props }) => {
  const hoverEffect = props.onClick ? 'active:scale-95 group cursor-pointer' : '';
  
  const baseClasses = `rounded-[2.5rem] transition-all duration-500 ${hoverEffect}`;

  const variantClasses = {
    // High-end blur for general items
    glass: 'bg-slate-900/30 backdrop-blur-3xl border border-white/10 shadow-2xl text-slate-200',
    // Heavy obsidian for main content
    dark: 'bg-[#05070f] border border-white/5 shadow-[0_40px_100px_rgba(0,0,0,0.9)] text-slate-200',
    // Elite 'Light' - actually a lighter glass for secondary layers, not gray
    light: 'bg-white/[0.03] backdrop-blur-2xl border border-white/10 shadow-xl text-slate-200 hover:bg-white/[0.05]' 
  };
  
  return (
    <div className={`${baseClasses} ${variantClasses[variant]} ${className}`} {...props}>
      {children}
    </div>
  );
};

export default Card;