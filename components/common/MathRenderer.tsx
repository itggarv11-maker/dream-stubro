import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface MathRendererProps {
  text?: any;
  className?: string;
  isChat?: boolean;
}

const MathRenderer: React.FC<MathRendererProps> = ({ text, className = "", isChat = false }) => {
    const getSafeText = (input: any): string => {
        if (input === null || input === undefined) return "";
        if (typeof input === 'string') return input.replace(/\$/g, "");
        if (typeof input === 'object') {
            const rawText = input.text || input.message || (Array.isArray(input.parts) ? input.parts[0]?.text : null) || JSON.stringify(input);
            return String(rawText).replace(/\$/g, "");
        }
        return String(input).replace(/\$/g, "");
    };

    const safeText = getSafeText(text);
    if (!safeText) return null;

    return (
        <div className={`precision-content-block break-words overflow-hidden ${className} ${isChat ? 'text-sm md:text-base' : 'text-base md:text-xl'}`}>
            <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                components={{
                    p: ({ children }) => <p className={`${isChat ? 'mb-2' : 'mb-6'} leading-relaxed font-medium`}>{children}</p>,
                    // Neural Highlighting for results and variables
                    strong: ({ children }) => <strong className="font-black text-cyan-400 drop-shadow-[0_0_8px_rgba(34,211,238,0.4)] italic">{children}</strong>,
                    em: ({ children }) => <em className="text-violet-400 font-bold not-italic drop-shadow-[0_0_8px_rgba(167,139,250,0.4)]">{children}</em>,
                    h1: ({ children }) => <h1 className="text-2xl md:text-3xl font-black uppercase tracking-tighter text-white mb-6 border-l-8 border-violet-600 pl-6 bg-white/5 py-2 rounded-r-xl">{children}</h1>,
                    h2: ({ children }) => <h2 className="text-xl md:text-2xl font-black uppercase tracking-tight text-cyan-500 mb-4">{children}</h2>,
                    li: ({ children }) => <li className="mb-3 pl-2 marker:text-cyan-500">{children}</li>,
                    ul: ({ children }) => <ul className="list-disc list-inside mb-6 space-y-2">{children}</ul>,
                    code: ({ children }) => (
                        <code className="bg-slate-950 px-3 py-1 rounded-lg font-mono-code text-pink-400 border border-white/10 text-sm md:text-base inline-block my-1 shadow-inner">
                            {children}
                        </code>
                    )
                }}
            >
                {safeText}
            </ReactMarkdown>
        </div>
    );
};

export default MathRenderer;