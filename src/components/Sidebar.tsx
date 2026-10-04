import React, { useState } from 'react';
import {
  Plus,
  MessageSquare,
  Trash2,
  Edit2,
  Check,
  X,
  FileEdit,
  FileCheck2,
  UserCheck,
  Briefcase,
  HeartHandshake,
  BookOpen,
  ChevronRight,
  Info,
  TrendingUp,
  Target,
  Database,
} from 'lucide-react';
import { ChatSession, PersonaId } from '../types';
import { PERSONAS } from '../constants/personas';

interface SidebarProps {
  sessions: ChatSession[];
  activeSessionId: string;
  onSelectSession: (id: string) => void;
  onNewSession: (personaId?: PersonaId) => void;
  onDeleteSession: (id: string) => void;
  onRenameSession: (id: string, newTitle: string) => void;
  isOpen: boolean;
  onClose: () => void;
  onOpenToolsModal: () => void;
  onOpenCVModal: () => void;
  onOpenPassRateModal: () => void;
  onOpenVaultModal: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  sessions,
  activeSessionId,
  onSelectSession,
  onNewSession,
  onDeleteSession,
  onRenameSession,
  isOpen,
  onClose,
  onOpenToolsModal,
  onOpenCVModal,
  onOpenPassRateModal,
  onOpenVaultModal,
}) => {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState('');

  const startEditing = (session: ChatSession, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingId(session.id);
    setEditingTitle(session.title);
  };

  const saveEditing = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (editingId && editingTitle.trim()) {
      onRenameSession(editingId, editingTitle.trim());
    }
    setEditingId(null);
  };

  const cancelEditing = (e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingId(null);
  };

  const getPersonaIcon = (id: PersonaId) => {
    switch (id) {
      case 'resume_doctor':
        return <FileEdit className="h-3.5 w-3.5 text-indigo-500" />;
      case 'cv_specialist':
        return <FileCheck2 className="h-3.5 w-3.5 text-blue-500" />;
      case 'mock_interview':
        return <UserCheck className="h-3.5 w-3.5 text-emerald-500" />;
      case 'career_analyst':
        return <Briefcase className="h-3.5 w-3.5 text-amber-500" />;
      case 'mental_mentor':
        return <HeartHandshake className="h-3.5 w-3.5 text-rose-500" />;
      default:
        return <MessageSquare className="h-3.5 w-3.5 text-slate-400" />;
    }
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/40 backdrop-blur-xs lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar Panel */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 flex w-72 flex-col border-r border-slate-200 bg-slate-50/90 transition-transform duration-200 ease-in-out lg:static lg:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Top Header: New Session button */}
        <div className="p-3 border-b border-slate-200 bg-white">
          <button
            onClick={() => {
              onNewSession();
              if (window.innerWidth < 1024) onClose();
            }}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-xs font-semibold text-white shadow-xs transition hover:bg-indigo-700 active:scale-[0.99]"
          >
            <Plus className="h-4 w-4" />
            <span>새 대화 시작하기</span>
          </button>
        </div>

        {/* Sessions List */}
        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          <div className="px-2 py-1.5 text-[11px] font-semibold text-slate-400">
            대화 기록 ({sessions.length})
          </div>

          {sessions.length === 0 ? (
            <div className="px-4 py-8 text-center text-xs text-slate-400">
              저장된 대화가 없습니다.
              <br />새 대화를 시작해보세요!
            </div>
          ) : (
            sessions.map((session) => {
              const isActive = session.id === activeSessionId;
              const isEditing = editingId === session.id;

              return (
                <div
                  key={session.id}
                  onClick={() => {
                    onSelectSession(session.id);
                    if (window.innerWidth < 1024) onClose();
                  }}
                  className={`group relative flex cursor-pointer items-center justify-between rounded-xl px-2.5 py-2 text-xs transition ${
                    isActive
                      ? 'bg-white font-semibold text-slate-900 shadow-xs ring-1 ring-slate-200'
                      : 'text-slate-600 hover:bg-slate-200/60 hover:text-slate-900'
                  }`}
                >
                  <div className="flex min-w-0 items-center gap-2">
                    <span className="shrink-0">{getPersonaIcon(session.personaId)}</span>

                    {isEditing ? (
                      <input
                        type="text"
                        value={editingTitle}
                        onChange={(e) => setEditingTitle(e.target.value)}
                        onClick={(e) => e.stopPropagation()}
                        autoFocus
                        className="w-36 rounded border border-indigo-500 bg-white px-1.5 py-0.5 text-xs font-normal text-slate-900 focus:outline-none"
                      />
                    ) : (
                      <span className="truncate">{session.title}</span>
                    )}
                  </div>

                  {/* Action icons */}
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    {isEditing ? (
                      <>
                        <button
                          onClick={saveEditing}
                          className="p-1 text-emerald-600 hover:bg-emerald-50 rounded"
                          title="저장"
                        >
                          <Check className="h-3 w-3" />
                        </button>
                        <button
                          onClick={cancelEditing}
                          className="p-1 text-slate-400 hover:bg-slate-100 rounded"
                          title="취소"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          onClick={(e) => startEditing(session, e)}
                          className="p-1 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded"
                          title="제목 수정"
                        >
                          <Edit2 className="h-3 w-3" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            if (window.confirm('이 대화 기록을 삭제하시겠습니까?')) {
                              onDeleteSession(session.id);
                            }
                          }}
                          className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded"
                          title="대화 삭제"
                        >
                          <Trash2 className="h-3 w-3" />
                        </button>
                      </>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Bottom Quick Reference & Guides */}
        <div className="border-t border-slate-200 bg-white p-3 space-y-2">
          <div className="rounded-xl border border-rose-100 bg-rose-50/50 p-2.5 text-xs">
            <div className="flex items-center gap-1.5 font-bold text-rose-950 mb-1">
              <Target className="h-3.5 w-3.5 text-rose-600" />
              <span>합격 가능성 정밀 진단</span>
            </div>
            <p className="text-[11px] text-slate-600 leading-snug">
              목표 기업·직무 기준 서류 통과율 예측 및 5대 역량 매칭도 분석
            </p>
            <button
              onClick={onOpenPassRateModal}
              className="mt-2 flex items-center gap-1 text-[11px] font-semibold text-rose-600 hover:text-rose-800"
            >
              <span>합격률 진단하기</span>
              <ChevronRight className="h-3 w-3" />
            </button>
          </div>

          <div className="rounded-xl border border-blue-100 bg-blue-50/50 p-2.5 text-xs">
            <div className="flex items-center gap-1.5 font-bold text-blue-950 mb-1">
              <FileCheck2 className="h-3.5 w-3.5 text-blue-600" />
              <span>이력서 불렛포인트 첨삭</span>
            </div>
            <p className="text-[11px] text-slate-600 leading-snug">
              Google X-Y-Z 공식으로 밋밋한 이력서 불렛포인트를 성과 중심 수치화!
            </p>
            <button
              onClick={onOpenCVModal}
              className="mt-2 flex items-center gap-1 text-[11px] font-semibold text-blue-600 hover:text-blue-800"
            >
              <span>이력서 첨삭 실행</span>
              <ChevronRight className="h-3 w-3" />
            </button>
          </div>

          <div className="rounded-xl border border-indigo-100 bg-indigo-50/50 p-2.5 text-xs">
            <div className="flex items-center gap-1.5 font-bold text-indigo-950 mb-1">
              <BookOpen className="h-3.5 w-3.5 text-indigo-600" />
              <span>합격하는 STAR 공식</span>
            </div>
            <p className="text-[11px] text-slate-600 leading-snug">
              Situation(상황) → Task(과제) → Action(행동) → Result(수치 성과)
            </p>
            <button
              onClick={onOpenToolsModal}
              className="mt-2 flex items-center gap-1 text-[11px] font-semibold text-indigo-600 hover:text-indigo-800"
            >
              <span>STAR 템플릿 열기</span>
              <ChevronRight className="h-3 w-3" />
            </button>
          </div>

          <div className="flex items-center justify-between px-1 text-[11px] text-slate-500">
            <div className="flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span>백엔드 서버 실시간 연동</span>
            </div>
            <button
              onClick={onOpenVaultModal}
              className="font-semibold text-emerald-700 hover:underline"
            >
              내 보관함 보기
            </button>
          </div>
        </div>
      </aside>
    </>
  );
};
