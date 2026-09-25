'use client';

import React from 'react';

interface ChatMessageFormatterProps {
  content: string;
}

/**
 * Parses and renders roleplay syntax:
 * - *asterisks* -> Action / Narration (italic, lavender/cyan)
 * - "quotes" -> Dialogue (bright, bold)
 * - (OOC: ...) -> Out of character note
 */
export function ChatMessageFormatter({ content }: ChatMessageFormatterProps) {
  if (!content) return null;

  // Split content into paragraphs
  const paragraphs = content.split('\n');

  return (
    <div className="space-y-2.5 leading-relaxed text-sm">
      {paragraphs.map((para, pIdx) => {
        if (!para.trim()) {
          return <div key={pIdx} className="h-1.5" />;
        }

        // Parse OOC format: (OOC: ...) or ((...))
        if (para.trim().startsWith('(OOC:') || para.trim().startsWith('((OOC:')) {
          return (
            <div key={pIdx} className="rp-ooc my-1 inline-block">
              {para}
            </div>
          );
        }

        // Tokenize paragraph by *...* and "..."
        // Regex matches asterisks *...* or double quotes "..."
        const tokens: React.ReactNode[] = [];
        let remaining = para;
        let key = 0;

        // Pattern matching *actions* or "quotes"
        const regex = /(\*[^*]+\*)|("[^"]+")/g;
        let lastIndex = 0;
        let match;

        while ((match = regex.exec(para)) !== null) {
          // Push plain text before match
          if (match.index > lastIndex) {
            tokens.push(
              <span key={key++} className="text-zinc-200">
                {para.substring(lastIndex, match.index)}
              </span>
            );
          }

          const matchedStr = match[0];
          if (matchedStr.startsWith('*') && matchedStr.endsWith('*')) {
            // Action / Narration
            tokens.push(
              <span key={key++} className="rp-action font-serif">
                {matchedStr}
              </span>
            );
          } else if (matchedStr.startsWith('"') && matchedStr.endsWith('"')) {
            // Dialogue
            tokens.push(
              <span key={key++} className="rp-dialogue font-medium">
                {matchedStr}
              </span>
            );
          }

          lastIndex = regex.lastIndex;
        }

        // Push any trailing plain text
        if (lastIndex < para.length) {
          tokens.push(
            <span key={key++} className="text-zinc-200">
              {para.substring(lastIndex)}
            </span>
          );
        }

        return <p key={pIdx}>{tokens.length > 0 ? tokens : para}</p>;
      })}
    </div>
  );
}
