import React, { useState, useEffect, useRef } from 'react';
import { Header } from './components/Header';
import { Sidebar } from './components/Sidebar';
import { ChatMessage } from './components/ChatMessage';
import { ChatInput } from './components/ChatInput';
import { InterviewTimerModal } from './components/InterviewTimerModal';
import { ResumeAnalyzerModal } from './components/ResumeAnalyzerModal';
import { CVAnalyzerModal } from './components/CVAnalyzerModal';
import { PassRateModal } from './components/PassRateModal';
import { StorageVaultModal } from './components/StorageVaultModal';
import { JobToolsModal } from './components/JobToolsModal';
import {
  ChatSession,
  ChatMessage as ChatMessageType,
  ModelId,
  PersonaId,
} from './types';
import { PERSONAS } from './constants/personas';
import {
  fetchServerSessions,
  syncSessionToServer,
  createSessionOnServer,
  deleteSessionOnServer,
} from './services/api';
import {
  FileEdit,
  FileCheck2,
  UserCheck,
  Briefcase,
  HeartHandshake,
  Sparkles,
  ArrowDown,
  RotateCcw,
} from 'lucide-react';

const STORAGE_KEY = 'jobmate_sessions_v1';
const MODEL_KEY = 'jobmate_active_model_v1';

export default function App() {
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<string>('');
  const [currentModel, setCurrentModel] = useState<ModelId>('gemini-3.8-flash');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(false);

  // Modals state
  const [isTimerModalOpen, setIsTimerModalOpen] = useState<boolean>(false);
  const [isResumeModalOpen, setIsResumeModalOpen] = useState<boolean>(false);
  const [isCVModalOpen, setIsCVModalOpen] = useState<boolean>(false);
  const [isPassRateModalOpen, setIsPassRateModalOpen] = useState<boolean>(false);
  const [isVaultModalOpen, setIsVaultModalOpen] = useState<boolean>(false);
  const [isToolsModalOpen, setIsToolsModalOpen] = useState<boolean>(false);

  // Auto-scroll control
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [showScrollBottom, setShowScrollBottom] = useState<boolean>(false);

  // Active streaming abort controller
  const abortControllerRef = useRef<AbortController | null>(null);

  // Initialize sessions from Backend Server
  useEffect(() => {
    const initSessions = async () => {
      try {
        const savedModel = localStorage.getItem(MODEL_KEY) as ModelId;
        if (savedModel) setCurrentModel(savedModel);

        const serverSessions = await fetchServerSessions();
        if (Array.isArray(serverSessions) && serverSessions.length > 0) {
          setSessions(serverSessions);
          setActiveSessionId(serverSessions[0].id);
          return;
        }
      } catch (e) {
        console.error('Failed to parse server sessions:', e);
      }

      // Default first session if none exists
      const initialSession: ChatSession = createNewSession('resume_doctor');
      setSessions([initialSession]);
      setActiveSessionId(initialSession.id);
      createSessionOnServer(initialSession);
    };

    initSessions();
  }, []);

  // Save selected model
  const handleSelectModel = (model: ModelId) => {
    setCurrentModel(model);
    localStorage.setItem(MODEL_KEY, model);
  };

  const createNewSession = (personaId: PersonaId = 'resume_doctor'): ChatSession => {
    const persona = PERSONAS[personaId];
    const newId = `session_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    return {
      id: newId,
      title: `${persona.name} 대화`,
      personaId,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      messages: [
        {
          id: `msg_welcome_${Date.now()}`,
          role: 'model',
          content: `안녕하세요! 취뽀메이트 **${persona.name}** 코치입니다. 🎯\n\n${persona.description}\n\n궁금한 점이나 첨삭이 필요한 자기소개서 문항, 혹은 실전 모의면접 답변을 편하게 말씀해 주세요! (대화와 모든 첨삭 데이터는 백엔드 서버에 안전하게 저장됩니다.)`,
          timestamp: Date.now(),
          personaId,
          modelUsed: currentModel,
        },
      ],
    };
  };

  const handleNewSession = (personaId?: PersonaId) => {
    const currentActive = sessions.find((s) => s.id === activeSessionId);
    const targetPersona = personaId || currentActive?.personaId || 'resume_doctor';
    const newSession = createNewSession(targetPersona);
    setSessions((prev) => [newSession, ...prev]);
    setActiveSessionId(newSession.id);
    createSessionOnServer(newSession);
  };

  const handleDeleteSession = (id: string) => {
    deleteSessionOnServer(id);
    const remaining = sessions.filter((s) => s.id !== id);
    if (remaining.length === 0) {
      const fresh = createNewSession('resume_doctor');
      setSessions([fresh]);
      setActiveSessionId(fresh.id);
      createSessionOnServer(fresh);
    } else {
      setSessions(remaining);
      if (activeSessionId === id) {
        setActiveSessionId(remaining[0].id);
      }
    }
  };

  const handleRenameSession = (id: string, newTitle: string) => {
    setSessions((prev) => {
      const updated = prev.map((s) => (s.id === id ? { ...s, title: newTitle, updatedAt: Date.now() } : s));
      const target = updated.find((s) => s.id === id);
      if (target) syncSessionToServer(target);
      return updated;
    });
  };

  const activeSession =
    sessions.find((s) => s.id === activeSessionId) || sessions[0];
  const currentPersonaId = activeSession?.personaId || 'resume_doctor';
  const currentPersona = PERSONAS[currentPersonaId];

  const handleSwitchPersona = (newPersonaId: PersonaId) => {
    if (!activeSession) return;
    if (activeSession.personaId === newPersonaId) return;

    // Check if session has only the default welcome message
    if (activeSession.messages.length <= 1) {
      const persona = PERSONAS[newPersonaId];
      const updatedMessages: ChatMessageType[] = [
        {
          id: `msg_welcome_${Date.now()}`,
          role: 'model',
          content: `안녕하세요! 취뽀메이트 **${persona.name}** 코치입니다. 🎯\n\n${persona.description}\n\n궁금한 점이나 첨삭이 필요한 자기소개서 문항, 혹은 실전 모의면접 답변을 편하게 말씀해 주세요!`,
          timestamp: Date.now(),
          personaId: newPersonaId,
          modelUsed: currentModel,
        },
      ];
      setSessions((prev) =>
        prev.map((s) =>
          s.id === activeSession.id
            ? {
                ...s,
                personaId: newPersonaId,
                title: `${persona.name} 대화`,
                messages: updatedMessages,
              }
            : s
        )
      );
    } else {
      // If conversation has already started, create a new session for the switched persona
      handleNewSession(newPersonaId);
    }
  };

  // Scroll to bottom
  const scrollToBottom = (behavior: ScrollBehavior = 'smooth') => {
    messagesEndRef.current?.scrollIntoView({ behavior });
  };

  useEffect(() => {
    scrollToBottom('auto');
  }, [activeSessionId]);

  useEffect(() => {
    if (isLoading) {
      scrollToBottom('smooth');
    }
  }, [activeSession?.messages, isLoading]);

  const handleScroll = () => {
    if (!scrollContainerRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = scrollContainerRef.current;
    const isAtBottom = scrollHeight - scrollTop - clientHeight < 120;
    setShowScrollBottom(!isAtBottom);
  };

  // Stop streaming
  const handleStopStreaming = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setIsLoading(false);
  };

  // Send message
  const handleSendMessage = async (text: string) => {
    if (!text.trim() || isLoading || !activeSession) return;

    const userMessage: ChatMessageType = {
      id: `msg_user_${Date.now()}`,
      role: 'user',
      content: text.trim(),
      timestamp: Date.now(),
    };

    const tempBotMessageId = `msg_bot_${Date.now()}`;
    const initialBotMessage: ChatMessageType = {
      id: tempBotMessageId,
      role: 'model',
      content: '',
      timestamp: Date.now(),
      personaId: currentPersonaId,
      modelUsed: currentModel,
    };

    // Update active session title if it's the first real question
    const isFirstUserMessage =
      activeSession.messages.filter((m) => m.role === 'user').length === 0;
    const autoTitle = isFirstUserMessage
      ? text.trim().slice(0, 18) + (text.length > 18 ? '...' : '')
      : activeSession.title;

    const updatedMessages = [...activeSession.messages, userMessage, initialBotMessage];

    setSessions((prev) =>
      prev.map((s) =>
        s.id === activeSession.id
          ? {
              ...s,
              title: autoTitle,
              messages: updatedMessages,
              updatedAt: Date.now(),
            }
          : s
      )
    );

    setIsLoading(true);

    const abortController = new AbortController();
    abortControllerRef.current = abortController;

    try {
      // Build history for backend
      const historyToSend = [...activeSession.messages, userMessage].map((m) => ({
        role: m.role,
        content: m.content,
      }));

      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: historyToSend,
          systemInstruction: currentPersona.systemInstruction,
          model: currentModel,
          temperature: 0.7,
        }),
        signal: abortController.signal,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || '답변 생성 중 오류가 발생했습니다.');
      }

      const reader = response.body?.getReader();
      if (!reader) throw new Error('Response stream reader is unavailable');

      const decoder = new TextDecoder();
      let accumulatedText = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const dataStr = line.slice(6).trim();
            if (dataStr) {
              try {
                const parsed = JSON.parse(dataStr);
                if (parsed.text) {
                  accumulatedText += parsed.text;
                  // Progressive update of bot message
                  setSessions((prev) =>
                    prev.map((s) => {
                      if (s.id !== activeSession.id) return s;
                      const newMsgs = s.messages.map((m) =>
                        m.id === tempBotMessageId
                          ? { ...m, content: accumulatedText }
                          : m
                      );
                      return { ...s, messages: newMsgs };
                    })
                  );
                } else if (parsed.error) {
                  throw new Error(parsed.error);
                }
              } catch (e: any) {
                if (e.message && !e.message.includes('JSON')) {
                  throw e;
                }
              }
            }
          }
        }
      }
    } catch (err: any) {
      if (err.name === 'AbortError') {
        console.log('Stream aborted by user');
      } else {
        console.error('Chat error:', err);
        setSessions((prev) =>
          prev.map((s) => {
            if (s.id !== activeSession.id) return s;
            const newMsgs = s.messages.map((m) =>
              m.id === tempBotMessageId
                ? {
                    ...m,
                    content:
                      err.message ||
                      '답변 생성 중 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.',
                    isError: true,
                  }
                : m
            );
            return { ...s, messages: newMsgs };
          })
        );
      }
    } finally {
      setIsLoading(false);
      abortControllerRef.current = null;
      // Sync latest session to backend server
      setSessions((current) => {
        const target = current.find((s) => s.id === activeSession.id);
        if (target) {
          syncSessionToServer(target);
        }
        return current;
      });
    }
  };

  const handleRetryLast = () => {
    if (!activeSession) return;
    const lastUserMsg = [...activeSession.messages]
      .reverse()
      .find((m) => m.role === 'user');
    if (lastUserMsg) {
      handleSendMessage(lastUserMsg.content);
    }
  };

  return (
    <div className="flex h-screen w-full overflow-hidden bg-slate-100 font-sans">
      {/* Sidebar for session management */}
      <Sidebar
        sessions={sessions}
        activeSessionId={activeSessionId}
        onSelectSession={setActiveSessionId}
        onNewSession={handleNewSession}
        onDeleteSession={handleDeleteSession}
        onRenameSession={handleRenameSession}
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        onOpenToolsModal={() => setIsToolsModalOpen(true)}
        onOpenCVModal={() => setIsCVModalOpen(true)}
        onOpenPassRateModal={() => setIsPassRateModalOpen(true)}
        onOpenVaultModal={() => setIsVaultModalOpen(true)}
      />

      {/* Main Chat Interface */}
      <div className="flex flex-1 flex-col overflow-hidden bg-white">
        <Header
          currentPersona={currentPersonaId}
          onSelectPersona={handleSwitchPersona}
          currentModel={currentModel}
          onSelectModel={handleSelectModel}
          onOpenTimerModal={() => setIsTimerModalOpen(true)}
          onOpenResumeModal={() => setIsResumeModalOpen(true)}
          onOpenCVModal={() => setIsCVModalOpen(true)}
          onOpenPassRateModal={() => setIsPassRateModalOpen(true)}
          onOpenVaultModal={() => setIsVaultModalOpen(true)}
          onOpenToolsModal={() => setIsToolsModalOpen(true)}
          onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
          isSidebarOpen={isSidebarOpen}
        />

        {/* Message Thread Area */}
        <div
          ref={scrollContainerRef}
          onScroll={handleScroll}
          className="relative flex-1 overflow-y-auto px-4 py-6 sm:px-8 bg-slate-50/50"
        >
          <div className="mx-auto max-w-4xl space-y-4">
            {/* Persona Hero Welcome Banner if thread is fresh */}
            {activeSession?.messages.length <= 1 && (
              <div className="rounded-2xl border border-indigo-100 bg-linear-to-b from-white to-indigo-50/40 p-6 text-center shadow-xs">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-600 text-white shadow-md shadow-indigo-200">
                  {currentPersonaId === 'resume_doctor' && <FileEdit className="h-7 w-7" />}
                  {currentPersonaId === 'cv_specialist' && <FileCheck2 className="h-7 w-7" />}
                  {currentPersonaId === 'mock_interview' && <UserCheck className="h-7 w-7" />}
                  {currentPersonaId === 'career_analyst' && <Briefcase className="h-7 w-7" />}
                  {currentPersonaId === 'mental_mentor' && <HeartHandshake className="h-7 w-7" />}
                </div>
                <h2 className="mt-3 text-lg font-bold text-slate-900">
                  {currentPersona.name} 코치와 함께하는 취업 성공
                </h2>
                <p className="mt-1 text-xs text-slate-500 max-w-md mx-auto">
                  {currentPersona.tagline}
                </p>

                {/* Quick starter grid */}
                <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 gap-2 text-left">
                  {currentPersona.starterQuestions.map((q, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleSendMessage(q)}
                      className="group flex items-start gap-2.5 rounded-xl border border-slate-200 bg-white p-3 text-xs text-slate-700 transition hover:border-indigo-300 hover:bg-indigo-50/40 hover:text-slate-900 shadow-xs"
                    >
                      <Sparkles className="h-4 w-4 shrink-0 text-indigo-500 mt-0.5 group-hover:scale-110 transition-transform" />
                      <span className="leading-snug">{q}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Chat Messages */}
            {activeSession?.messages.map((message) => (
              <ChatMessage
                key={message.id}
                message={message}
                onRetry={message.isError ? handleRetryLast : undefined}
              />
            ))}

            {/* Loading indicator when waiting for first token */}
            {isLoading &&
              activeSession?.messages[activeSession.messages.length - 1]?.content === '' && (
                <div className="flex items-center gap-3 py-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-slate-100 border border-slate-200 text-indigo-600">
                    <Sparkles className="h-4 w-4 animate-spin" />
                  </div>
                  <div className="rounded-2xl rounded-tl-xs border border-slate-200 bg-white px-4 py-3 shadow-xs">
                    <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium">
                      <span className="inline-block h-2 w-2 animate-bounce rounded-full bg-indigo-500" />
                      <span
                        className="inline-block h-2 w-2 animate-bounce rounded-full bg-indigo-500"
                        style={{ animationDelay: '0.2s' }}
                      />
                      <span
                        className="inline-block h-2 w-2 animate-bounce rounded-full bg-indigo-500"
                        style={{ animationDelay: '0.4s' }}
                      />
                      <span className="ml-2">취준생 맞춤 답변을 작성하고 있습니다...</span>
                    </div>
                  </div>
                </div>
              )}

            <div ref={messagesEndRef} className="h-2" />
          </div>

          {/* Floating Scroll to Bottom Button */}
          {showScrollBottom && (
            <button
              onClick={() => scrollToBottom('smooth')}
              className="fixed bottom-24 right-6 z-20 flex h-9 w-9 items-center justify-center rounded-full bg-slate-900 text-white shadow-lg transition hover:bg-slate-800"
              title="최신 메시지로 스크롤"
            >
              <ArrowDown className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* Input area */}
        <ChatInput
          onSendMessage={handleSendMessage}
          isLoading={isLoading}
          onStop={handleStopStreaming}
          currentPersona={currentPersonaId}
          starterQuestions={currentPersona.starterQuestions}
        />
      </div>

      {/* 1-Minute Mock Interview Timer Modal */}
      <InterviewTimerModal
        isOpen={isTimerModalOpen}
        onClose={() => setIsTimerModalOpen(false)}
        onSubmitToChat={(q, a) => {
          handleSwitchPersona('mock_interview');
          handleSendMessage(`${q}\n\n${a}`);
        }}
      />

      {/* Deep Resume STAR Analysis Modal */}
      <ResumeAnalyzerModal
        isOpen={isResumeModalOpen}
        onClose={() => setIsResumeModalOpen(false)}
        onSendToChat={(msg) => {
          handleSwitchPersona('resume_doctor');
          handleSendMessage(msg);
        }}
      />

      {/* CV / Resume Specialized Proofreading Modal */}
      <CVAnalyzerModal
        isOpen={isCVModalOpen}
        onClose={() => setIsCVModalOpen(false)}
        onSendToChat={(msg) => {
          handleSwitchPersona('cv_specialist');
          handleSendMessage(msg);
        }}
      />

      {/* Realistic Hiring Pass Probability Prediction Modal */}
      <PassRateModal
        isOpen={isPassRateModalOpen}
        onClose={() => setIsPassRateModalOpen(false)}
        onSendToChat={(msg) => {
          handleSwitchPersona('career_analyst');
          handleSendMessage(msg);
        }}
      />

      {/* Quick Job-Hunting Tools Modal */}
      <JobToolsModal
        isOpen={isToolsModalOpen}
        onClose={() => setIsToolsModalOpen(false)}
        onSendToChat={(msg) => {
          handleSendMessage(msg);
        }}
      />

      {/* Backend Server Storage Vault Modal (내 보관함) */}
      <StorageVaultModal
        isOpen={isVaultModalOpen}
        onClose={() => setIsVaultModalOpen(false)}
        onSendToChat={(msg) => {
          handleSendMessage(msg);
        }}
      />
    </div>
  );
}
