import React, { useState } from 'react';
import {
  Copy,
  Check,
  Volume2,
  VolumeX,
  FileEdit,
  FileCheck2,
  UserCheck,
  Briefcase,
  HeartHandshake,
  Bot,
  User,
  AlertCircle,
} from 'lucide-react';
import { ChatMessage as ChatMessageType, PersonaId } from '../types';
import { PERSONAS } from '../constants/personas';
import { MarkdownRenderer } from './MarkdownRenderer';
import { speakText, stopSpeaking } from '../utils/text';

interface ChatMessageProps {
  message: ChatMessageType;
  onRetry?: () => void;
}

export const ChatMessage: React.FC<ChatMessageProps> = ({ message, onRetry }) => {
  const [copied, setCopied] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);

  const isUser = message.role === 'user';
  const persona = message.personaId ? PERSONAS[message.personaId] : undefined;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(message.content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy message:', err);
    }
  };

  const handleToggleSpeak = () => {
    if (isSpeaking) {
      stopSpeaking();
      setIsSpeaking(false);
    } else {
      setIsSpeaking(true);
      const started = speakText(message.content, () => {
        setIsSpeaking(false);
      });
      if (!started) {
        setIsSpeaking(false);
      }
    }
  };

  const getPersonaIcon = (id?: PersonaId) => {
    switch (id) {
      case 'resume_doctor':
        return <FileEdit className="h-4 w-4 text-indigo-600" />;
      case 'cv_specialist':
        return <FileCheck2 className="h-4 w-4 text-blue-600" />;
      case 'mock_interview':
        return <UserCheck className="h-4 w-4 text-emerald-600" />;
      case 'career_analyst':
        return <Briefcase className="h-4 w-4 text-amber-600" />;
      case 'mental_mentor':
        return <HeartHandshake className="h-4 w-4 text-rose-600" />;
      default:
        return <Bot className="h-4 w-4 text-indigo-600" />;
    }
  };

  const formattedTime = new Date(message.timestamp).toLocaleTimeString('ko-KR', {
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <div
      className={`group flex w-full gap-3 py-4 transition-colors ${
        isUser ? 'justify-end' : 'justify-start'
      }`}
    >
      {/* Bot Avatar */}
      {!isUser && (
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-slate-100 border border-slate-200 shadow-xs">
          {getPersonaIcon(message.personaId)}
        </div>
      )}

      {/* Message Content Container */}
      <div
        className={`flex max-w-[88%] sm:max-w-[78%] flex-col ${
          isUser ? 'items-end' : 'items-start'
        }`}
      >
        {/* Header meta */}
        <div className="mb-1.5 flex items-center gap-2 text-xs text-slate-500">
          {!isUser && (
            <span className="font-semibold text-slate-800">
              {persona?.name || '취뽀메이트 코치'}
            </span>
          )}
          {message.modelUsed && (
            <span className="text-[10px] text-slate-400">
              · {message.modelUsed.replace('gemini-', 'Gemini ')}
            </span>
          )}
          <span className="text-[11px] tabular-nums text-slate-400">{formattedTime}</span>
        </div>

        {/* Bubble */}
        <div
          className={`relative rounded-2xl px-4 py-3.5 text-sm leading-relaxed shadow-xs ${
            isUser
              ? 'bg-indigo-600 text-white rounded-tr-xs'
              : message.isError
              ? 'bg-rose-50 border border-rose-200 text-rose-800 rounded-tl-xs'
              : 'bg-white border border-slate-200/90 text-slate-800 rounded-tl-xs'
          }`}
        >
          {message.isError && (
            <div className="mb-2 flex items-center gap-1.5 text-rose-600 font-semibold text-xs">
              <AlertCircle className="h-4 w-4" />
              <span>오류 발생</span>
            </div>
          )}

          {isUser ? (
            <div className="whitespace-pre-wrap break-keep">{message.content}</div>
          ) : (
            <MarkdownRenderer content={message.content} />
          )}

          {/* Action buttons (only for model responses) */}
          {!isUser && !message.isError && (
            <div className="mt-3 flex items-center gap-1.5 border-t border-slate-100 pt-2 text-slate-400 opacity-90 transition group-hover:opacity-100">
              <button
                onClick={handleCopy}
                className="flex items-center gap-1 rounded-md px-2 py-1 text-xs text-slate-500 transition hover:bg-slate-100 hover:text-slate-800"
                title="답변 복사"
              >
                {copied ? (
                  <>
                    <Check className="h-3.5 w-3.5 text-emerald-600" />
                    <span className="text-emerald-600 font-medium">복사됨</span>
                  </>
                ) : (
                  <>
                    <Copy className="h-3.5 w-3.5" />
                    <span>복사</span>
                  </>
                )}
              </button>

              <button
                onClick={handleToggleSpeak}
                className={`flex items-center gap-1 rounded-md px-2 py-1 text-xs transition ${
                  isSpeaking
                    ? 'bg-indigo-50 text-indigo-700 font-medium'
                    : 'text-slate-500 hover:bg-slate-100 hover:text-slate-800'
                }`}
                title={isSpeaking ? '음성 중지' : '음성으로 듣기'}
              >
                {isSpeaking ? (
                  <>
                    <VolumeX className="h-3.5 w-3.5 text-indigo-600 animate-pulse" />
                    <span>멈춤</span>
                  </>
                ) : (
                  <>
                    <Volume2 className="h-3.5 w-3.5" />
                    <span>읽어주기</span>
                  </>
                )}
              </button>

              {onRetry && (
                <button
                  onClick={onRetry}
                  className="rounded-md px-2 py-1 text-xs text-slate-500 hover:bg-slate-100 hover:text-slate-800"
                  title="답변 다시 생성"
                >
                  다시 생성
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* User Avatar */}
      {isUser && (
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-indigo-100 text-indigo-700 shadow-xs">
          <User className="h-4 w-4" />
        </div>
      )}
    </div>
  );
};
