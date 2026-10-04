import React from 'react';

interface MarkdownRendererProps {
  content: string;
}

export const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({ content }) => {
  // Simple yet robust custom markdown renderer
  const lines = content.split('\n');
  const elements: React.ReactNode[] = [];
  let inCodeBlock = false;
  let codeBlockContent: string[] = [];
  let codeBlockLang = '';

  const renderInline = (text: string): React.ReactNode => {
    // Process bold, inline code, and links
    const parts: React.ReactNode[] = [];
    const regex = /(\*\*.*?\*\*|`.*?`|\[.*?\]\(.*?\))/g;
    let lastIndex = 0;
    let match;

    while ((match = regex.exec(text)) !== null) {
      if (match.index > lastIndex) {
        parts.push(text.substring(lastIndex, match.index));
      }

      const segment = match[0];
      if (segment.startsWith('**') && segment.endsWith('**')) {
        parts.push(
          <strong key={match.index} className="font-semibold text-slate-900">
            {segment.slice(2, -2)}
          </strong>
        );
      } else if (segment.startsWith('`') && segment.endsWith('`')) {
        parts.push(
          <code
            key={match.index}
            className="rounded bg-slate-100 px-1.5 py-0.5 font-mono text-xs text-indigo-700 font-medium"
          >
            {segment.slice(1, -1)}
          </code>
        );
      } else if (segment.startsWith('[') && segment.includes('](')) {
        const title = segment.substring(1, segment.indexOf(']('));
        const url = segment.substring(segment.indexOf('](') + 2, segment.length - 1);
        parts.push(
          <a
            key={match.index}
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-indigo-600 underline hover:text-indigo-800"
          >
            {title}
          </a>
        );
      }

      lastIndex = regex.lastIndex;
    }

    if (lastIndex < text.length) {
      parts.push(text.substring(lastIndex));
    }

    return parts.length > 0 ? parts : text;
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Code block toggle
    if (line.trim().startsWith('```')) {
      if (inCodeBlock) {
        elements.push(
          <div key={`code-${i}`} className="my-3 overflow-hidden rounded-lg bg-slate-900 text-slate-100">
            {codeBlockLang && (
              <div className="border-b border-slate-800 px-3 py-1.5 text-xs text-slate-400 font-mono">
                {codeBlockLang}
              </div>
            )}
            <pre className="p-3.5 font-mono text-xs leading-relaxed overflow-x-auto">
              <code>{codeBlockContent.join('\n')}</code>
            </pre>
          </div>
        );
        codeBlockContent = [];
        inCodeBlock = false;
        codeBlockLang = '';
      } else {
        inCodeBlock = true;
        codeBlockLang = line.trim().slice(3);
      }
      continue;
    }

    if (inCodeBlock) {
      codeBlockContent.push(line);
      continue;
    }

    // Headings
    if (line.startsWith('### ')) {
      elements.push(
        <h4 key={i} className="mt-4 mb-2 text-base font-semibold text-slate-900">
          {renderInline(line.slice(4))}
        </h4>
      );
      continue;
    }
    if (line.startsWith('## ')) {
      elements.push(
        <h3 key={i} className="mt-5 mb-2.5 text-lg font-bold text-slate-900 border-b border-slate-200 pb-1">
          {renderInline(line.slice(3))}
        </h3>
      );
      continue;
    }
    if (line.startsWith('# ')) {
      elements.push(
        <h2 key={i} className="mt-6 mb-3 text-xl font-extrabold text-slate-900">
          {renderInline(line.slice(2))}
        </h2>
      );
      continue;
    }

    // Blockquotes
    if (line.startsWith('> ')) {
      elements.push(
        <blockquote
          key={i}
          className="my-2 border-l-4 border-indigo-400 bg-indigo-50/50 py-2 px-3.5 text-sm text-slate-700 italic rounded-r"
        >
          {renderInline(line.slice(2))}
        </blockquote>
      );
      continue;
    }

    // Lists (bullet or ordered)
    if (line.match(/^[-*]\s+/)) {
      elements.push(
        <div key={i} className="my-1 flex items-start gap-2 text-sm text-slate-700 pl-1">
          <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-indigo-500" />
          <div className="leading-relaxed">{renderInline(line.replace(/^[-*]\s+/, ''))}</div>
        </div>
      );
      continue;
    }

    if (line.match(/^\d+\.\s+/)) {
      const match = line.match(/^(\d+)\.\s+(.*)/);
      if (match) {
        elements.push(
          <div key={i} className="my-1.5 flex items-start gap-2 text-sm text-slate-700 pl-1">
            <span className="font-semibold text-xs text-indigo-600 font-mono mt-0.5 min-w-[1.2rem]">
              {match[1]}.
            </span>
            <div className="leading-relaxed">{renderInline(match[2])}</div>
          </div>
        );
        continue;
      }
    }

    // Blank line
    if (!line.trim()) {
      elements.push(<div key={i} className="h-2" />);
      continue;
    }

    // Standard paragraph
    elements.push(
      <p key={i} className="my-1 text-sm leading-relaxed text-slate-800 break-keep">
        {renderInline(line)}
      </p>
    );
  }

  // Handle unclosed code block if stream cut off
  if (inCodeBlock && codeBlockContent.length > 0) {
    elements.push(
      <pre key="code-unclosed" className="my-3 overflow-x-auto rounded-lg bg-slate-900 p-3.5 text-xs text-slate-100 font-mono">
        <code>{codeBlockContent.join('\n')}</code>
      </pre>
    );
  }

  return <div className="space-y-0.5">{elements}</div>;
};
