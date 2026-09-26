'use client';

import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Copy, Check } from 'lucide-react';

interface ChatMessageFormatterProps {
  content: string;
}

// Tokenize spoken quotes ("...") and OOC markers inside plain text nodes
function renderDialogueAndOOC(text: string): React.ReactNode {
  const regex = /("[^"]+")|(\(OOC:[^)]+\))|(\(\(OOC:[^)]+\)\))/g;
  const parts: React.ReactNode[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;
  let key = 0;

  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push(text.substring(lastIndex, match.index));
    }
    const matched = match[0];
    if (matched.startsWith('"') && matched.endsWith('"')) {
      parts.push(
        <span key={key++} className="rp-dialogue text-white font-medium">
          {matched}
        </span>
      );
    } else if (matched.includes('OOC:')) {
      parts.push(
        <span key={key++} className="rp-ooc my-0.5 inline-block">
          {matched}
        </span>
      );
    }
    lastIndex = regex.lastIndex;
  }

  if (lastIndex < text.length) {
    parts.push(text.substring(lastIndex));
  }

  return parts.length > 0 ? parts : text;
}

// Transform children recursively to highlight dialogues inside markdown text nodes
function formatChildNodes(children: React.ReactNode): React.ReactNode {
  return React.Children.map(children, (child) => {
    if (typeof child === 'string') {
      return renderDialogueAndOOC(child);
    }
    return child;
  });
}

function CodeBlock({ children, className }: { children: React.ReactNode; className?: string }) {
  const [copied, setCopied] = useState(false);
  const codeString = String(children).replace(/\n$/, '');

  const handleCopy = () => {
    if (typeof navigator !== 'undefined') {
      navigator.clipboard.writeText(codeString);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const language = className?.replace('language-', '') || 'code';

  return (
    <div className="relative my-2.5 rounded-xl overflow-hidden bg-zinc-900 border border-white/10 text-xs font-mono shadow-md">
      <div className="flex items-center justify-between px-3.5 py-1.5 bg-zinc-950/80 border-b border-white/5 text-zinc-400">
        <span className="text-[11px] font-mono text-cyan-400 uppercase tracking-wider">{language}</span>
        <button
          onClick={handleCopy}
          className="flex items-center gap-1 text-[10px] text-zinc-400 hover:text-white transition-colors cursor-pointer"
          title="Salin Kode"
        >
          {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3 text-zinc-400" />}
          <span>{copied ? 'Tersalin' : 'Salin'}</span>
        </button>
      </div>
      <pre className="p-3.5 overflow-x-auto text-zinc-200 leading-relaxed scrollbar-none">
        <code>{codeString}</code>
      </pre>
    </div>
  );
}

/**
 * Enhanced Roleplay Message Formatter with full Markdown (GFM) support:
 * - *Italic / Asterisks* -> Action / Narration (.rp-action)
 * - "Quotes" -> Spoken Dialogue (.rp-dialogue)
 * - (OOC: ...) -> Out of Character note (.rp-ooc)
 * - **Bold**, `inline code`, ```fenced code blocks```, tables, lists, blockquotes
 */
export function ChatMessageFormatter({ content }: ChatMessageFormatterProps) {
  if (!content) return null;

  return (
    <div className="space-y-2.5 leading-relaxed text-sm text-zinc-200 font-sans">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          // Em: Actions and narrations (*action*)
          em: ({ children }) => (
            <span className="rp-action font-serif italic text-indigo-300">
              *{children}*
            </span>
          ),
          // Strong: Bold text (**bold**)
          strong: ({ children }) => (
            <strong className="font-bold text-white tracking-wide">
              {children}
            </strong>
          ),
          // Paragraphs: Format dialogue & OOC inside text
          p: ({ children }) => (
            <p className="my-1.5 leading-relaxed">
              {formatChildNodes(children)}
            </p>
          ),
          // Code: Inline code vs Multi-line Code block
          code: ({ className, children, ...props }) => {
            const isInline = !className && typeof children === 'string' && !children.includes('\n');
            if (isInline) {
              return (
                <code
                  className="px-1.5 py-0.5 rounded-md bg-zinc-900 border border-white/10 text-cyan-300 font-mono text-xs"
                  {...props}
                >
                  {children}
                </code>
              );
            }
            return <CodeBlock className={className}>{children}</CodeBlock>;
          },
          // Blockquote
          blockquote: ({ children }) => (
            <blockquote className="border-l-2 border-cyan-500/50 pl-3.5 my-2.5 italic text-zinc-300 bg-white/[0.02] py-1 rounded-r-lg">
              {children}
            </blockquote>
          ),
          // Lists
          ul: ({ children }) => (
            <ul className="list-disc list-outside pl-5 my-2 space-y-1 text-zinc-200">
              {children}
            </ul>
          ),
          ol: ({ children }) => (
            <ol className="list-decimal list-outside pl-5 my-2 space-y-1 text-zinc-200">
              {children}
            </ol>
          ),
          li: ({ children }) => <li className="leading-relaxed">{formatChildNodes(children)}</li>,
          // Tables
          table: ({ children }) => (
            <div className="overflow-x-auto my-3 rounded-xl border border-white/10">
              <table className="w-full text-left text-xs border-collapse">{children}</table>
            </div>
          ),
          thead: ({ children }) => <thead className="bg-zinc-900 text-cyan-300 font-semibold">{children}</thead>,
          th: ({ children }) => <th className="p-2.5 border-b border-white/10">{children}</th>,
          td: ({ children }) => <td className="p-2.5 border-b border-white/5 text-zinc-300">{children}</td>,
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
