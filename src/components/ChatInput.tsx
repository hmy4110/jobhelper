import React, { useState, useRef, useEffect } from 'react';
import { Send, Square, Sparkles, CornerDownLeft } from 'lucide-react';
import { countKoreanText } from '../utils/text';
import { PersonaId } from '../types';
import { PERSONAS } from '../constants/personas';

interface ChatInputProps {
  onSendMessage: (text: string) => void;
  isLoading: boolean;
  onStop: () => void;
  currentPersona: PersonaId;
  starterQuestions: string[];
}

export const ChatInput: React.FC<ChatInputProps> = ({
  onSendMessage,
  isLoading,
  onStop,
  currentPersona,
  starterQuestions,
}) => {
  const [input, setInput] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const persona = PERSONAS[currentPersona];

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      const scrollHeight = textareaRef.current.scrollHeight;
      textareaRef.current.style.height = `${Math.min(scrollHeight, 180)}px`;
    }
  }, [input]);

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!input.trim() || isLoading) return;

    onSendMessage(input.trim());
    setInput('');
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      // Avoid composing issue in Korean IME
      if (e.nativeEvent.isComposing) return;
      e.preventDefault();
      handleSubmit();
    }
  };

  const stats = countKoreanText(input);

  return (
    <div className="border-t border-slate-200 bg-white/95 px-4 pt-3 pb-4 backdrop-blur-sm sm:px-6">
      <div className="mx-auto max-w-4xl">
        {/* Starter suggestion chips */}
        <div className="mb-2.5 flex items-center gap-1.5 overflow-x-auto no-scrollbar py-1">
          <div className="flex items-center gap-1 text-[11px] font-semibold text-slate-500 shrink-0 mr-1">
            <Sparkles className="h-3 w-3 text-indigo-500" />
            <span>추천 질문:</span>
          </div>
          {starterQuestions.slice(0, 3).map((question, idx) => (
            <button
              key={idx}
              onClick={() => onSendMessage(question)}
              disabled={isLoading}
              className="shrink-0 rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs text-slate-700 transition hover:border-indigo-300 hover:bg-indigo-50/60 hover:text-indigo-900 disabled:opacity-50"
            >
              {question}
            </button>
          ))}
        </div>

        {/* Input box card */}
        <div className="relative rounded-2xl border border-slate-300/90 bg-white p-2 shadow-xs transition-all focus-within:border-indigo-500 focus-within:ring-2 focus-within:ring-indigo-100">
          <textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={`${persona.name}에게 질문하거나 작성 중인 자기소개서, 면접 답변을 자유롭게 입력해보세요... (Enter로 전송, Shift+Enter 줄바꿈)`}
            rows={1}
            disabled={isLoading}
            className="w-full resize-none border-0 bg-transparent px-2.5 py-1.5 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-0 leading-relaxed max-h-48"
          />

          {/* Bottom Toolbar inside input */}
          <div className="mt-1 flex items-center justify-between border-t border-slate-100 px-2 pt-2">
            {/* Live Character & Byte Counter for Korean Job Applications */}
            <div className="flex items-center gap-2 text-[11px] text-slate-400 tabular-nums">
              <span>
                공백 포함 <strong className="font-semibold text-slate-600">{stats.withSpaces}</strong>자
              </span>
              <span>·</span>
              <span>
                공백 제외 <strong className="font-semibold text-slate-600">{stats.withoutSpaces}</strong>자
              </span>
              <span className="hidden sm:inline">({stats.byteCount} Bytes)</span>
            </div>

            {/* Action buttons */}
            <div className="flex items-center gap-2">
              {isLoading ? (
                <button
                  type="button"
                  onClick={onStop}
                  className="flex items-center gap-1.5 rounded-xl bg-slate-900 px-3 py-1.5 text-xs font-semibold text-white shadow-xs transition hover:bg-slate-800"
                >
                  <Square className="h-3 w-3 fill-white" />
                  <span>생성 중지</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => handleSubmit()}
                  disabled={!input.trim()}
                  className="flex items-center gap-1.5 rounded-xl bg-indigo-600 px-3.5 py-1.5 text-xs font-semibold text-white shadow-xs transition hover:bg-indigo-700 disabled:bg-slate-200 disabled:text-slate-400 disabled:cursor-not-allowed"
                >
                  <span>전송</span>
                  <Send className="h-3 w-3" />
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
