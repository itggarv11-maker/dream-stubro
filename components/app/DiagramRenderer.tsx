import React from 'react';
import { DiagramSpec } from '../../types';

interface DiagramRendererProps {
  spec: DiagramSpec;
  className?: string;
}

const DiagramRenderer: React.FC<DiagramRendererProps> = ({ spec, className = "" }) => {
  if (!spec) return null;

  const getCoord = (pointName: string): [number, number] => (spec.points && spec.points[pointName]) || [0, 0];

  return (
    <div className={`my-8 p-6 md:p-12 glass-card !rounded-[3rem] border-cyan-500/20 bg-slate-950/90 flex flex-col items-center shadow-[0_0_80px_rgba(0,0,0,0.8)] relative overflow-hidden ${className}`}>
      {/* Decorative Blueprint Grid */}
      <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: 'radial-gradient(#22d3ee 0.5px, transparent 0.5px)', backgroundSize: '20px 20px' }}></div>
      
      <div className="w-full flex justify-center overflow-visible relative z-10">
        <svg 
          width="100%" 
          height="auto" 
          viewBox={`0 0 ${spec.width || 400} ${spec.height || 400}`} 
          className="max-w-full md:max-w-lg drop-shadow-[0_0_30px_rgba(34,211,238,0.3)] overflow-visible"
        >
          <defs>
            <filter id="astra-glow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
            <linearGradient id="line-grad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#8b5cf6" />
              <stop offset="100%" stopColor="#22d3ee" />
            </linearGradient>
          </defs>

          {/* Circles with glow */}
          {(spec.circles || []).map((c, i) => {
            const coords = getCoord(c.center);
            return (
              <circle key={i} cx={coords[0]} cy={coords[1]} r={c.radius} fill="rgba(34, 211, 238, 0.05)" stroke="url(#line-grad)" strokeWidth="3" filter="url(#astra-glow)" />
            );
          })}

          {/* Lines */}
          {(spec.lines || []).map((l, i) => {
            const p1 = getCoord(l.from);
            const p2 = getCoord(l.to);
            return (
              <line 
                key={i} x1={p1[0]} y1={p1[1]} x2={p2[0]} y2={p2[1]} 
                stroke="#f8fafc" strokeWidth="2.5" 
                strokeDasharray={l.dashed ? "8,6" : "0"} 
                strokeLinecap="round"
                filter="url(#astra-glow)"
              />
            );
          })}

          {/* Points & Neon Labels */}
          {Object.entries(spec.points || {}).map(([name, coords], i) => {
            const [x, y] = coords as [number, number];
            return (
              <g key={i}>
                <circle cx={x} cy={y} r="5" fill="#22d3ee" stroke="#fff" strokeWidth="2" />
                <rect x={x + 10} y={y - 25} width="24" height="24" rx="4" fill="rgba(15, 23, 42, 0.8)" stroke="rgba(255,255,255,0.1)" />
                <text x={x + 14} y={y - 8} fill="#22d3ee" fontSize="16" fontWeight="900" fontFamily="JetBrains Mono, monospace">
                  {name}
                </text>
              </g>
            );
          })}

          {/* Right Angles */}
          {(spec.angles || []).map((ang, i) => {
            const [vx, vy] = getCoord(ang.vertex);
            if (ang.isRightAngle) {
              return <rect key={i} x={vx - 8} y={vy - 8} width="16" height="16" fill="none" stroke="#fbbf24" strokeWidth="3" strokeDasharray="2,2" />;
            }
            return null;
          })}
        </svg>
      </div>
      <div className="mt-10 flex items-center gap-4 bg-slate-900/50 px-6 py-2 rounded-full border border-white/5">
         <div className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse shadow-[0_0_10px_#22d3ee]"></div>
         <p className="text-[10px] font-black text-cyan-500/80 uppercase tracking-[0.5em] italic">GEOMETRY CORE: ACCURACY 101%</p>
      </div>
    </div>
  );
};

export default DiagramRenderer;