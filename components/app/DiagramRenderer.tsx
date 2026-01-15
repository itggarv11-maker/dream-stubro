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
    <div className={`my-4 md:my-6 p-4 md:p-8 glass-card !rounded-2xl md:!rounded-[3rem] border-cyan-500/30 bg-slate-950/80 flex flex-col items-center shadow-[0_0_50px_rgba(34,211,238,0.15)] ${className}`}>
      <div className="w-full flex justify-center overflow-hidden">
        <svg 
          width="100%" 
          height="auto" 
          viewBox={`0 0 ${spec.width || 300} ${spec.height || 300}`} 
          className="max-w-full md:max-w-md drop-shadow-[0_0_20px_rgba(34,211,238,0.4)] overflow-visible"
        >
          <defs>
            <filter id="glow">
              <feGaussianBlur stdDeviation="2.5" result="coloredBlur"/>
              <feMerge>
                <feMergeNode in="coloredBlur"/>
                <feMergeNode in="SourceGraphic"/>
              </feMerge>
            </filter>
          </defs>

          {/* Circles */}
          {(spec.circles || []).map((c, i) => {
            const coords = getCoord(c.center);
            return (
              <circle key={i} cx={coords[0]} cy={coords[1]} r={c.radius} fill="none" stroke="#22d3ee" strokeWidth="2.5" filter="url(#glow)" />
            );
          })}

          {/* Lines */}
          {(spec.lines || []).map((l, i) => {
            const p1 = getCoord(l.from);
            const p2 = getCoord(l.to);
            return (
              <line 
                key={i} x1={p1[0]} y1={p1[1]} x2={p2[0]} y2={p2[1]} 
                stroke="#f8fafc" strokeWidth="2" 
                strokeDasharray={l.dashed ? "6,4" : "0"} 
                strokeLinecap="round"
              />
            );
          })}

          {/* Points & Labels */}
          {Object.entries(spec.points || {}).map(([name, coords], i) => {
            const [x, y] = coords as [number, number];
            return (
              <g key={i}>
                <circle cx={x} cy={y} r="4" fill="#8b5cf6" stroke="white" strokeWidth="1" />
                <text x={x + 8} y={y - 8} fill="#f1f5f9" fontSize="14" fontWeight="black" fontFamily="monospace" style={{ textShadow: '0 0 10px rgba(0,0,0,0.8)' }}>
                  {name}
                </text>
              </g>
            );
          })}

          {/* Angles */}
          {(spec.angles || []).map((ang, i) => {
            const [vx, vy] = getCoord(ang.vertex);
            if (ang.isRightAngle) {
              return <rect key={i} x={vx - 6} y={vy - 6} width="12" height="12" fill="none" stroke="#fbbf24" strokeWidth="2" />;
            }
            return null;
          })}
        </svg>
      </div>
      <div className="mt-6 md:mt-8 flex items-center gap-2">
         <div className="w-1 h-1 md:w-1.5 md:h-1.5 rounded-full bg-cyan-400 animate-ping"></div>
         <p className="text-[8px] md:text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] md:tracking-[0.5em]">ASTRA RENDER ENGINE v2.1</p>
      </div>
    </div>
  );
};

export default DiagramRenderer;