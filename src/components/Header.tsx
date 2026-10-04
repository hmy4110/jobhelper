import React, { useState } from 'react';
import {
  FileEdit,
  FileCheck2,
  UserCheck,
  Briefcase,
  HeartHandshake,
  Timer,
  Sparkles,
  Bot,
  Menu,
  ChevronDown,
  Wrench,
  GraduationCap,
  Target,
  Database,
} from 'lucide-react';
import { ModelId, PersonaId } from '../types';
import { AVAILABLE_MODELS, PERSONAS } from '../constants/personas';

interface HeaderProps {
  currentPersona: PersonaId;
  onSelectPersona: (id: PersonaId) => void;
  currentModel: ModelId;
  onSelectModel: (model: ModelId) => void;
  onOpenTimerModal: () => void;
  onOpenResumeModal: () => void;
  onOpenCVModal: () => void;
  onOpenPassRateModal: () => void;
  onOpenVaultModal: () => void;
  onOpenToolsModal: () => void;
  onToggleSidebar: () => void;
  isSidebarOpen: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  currentPersona,
  onSelectPersona,
  currentModel,
  onSelectModel,
  onOpenTimerModal,
  onOpenResumeModal,
  onOpenCVModal,
  onOpenPassRateModal,
  onOpenVaultModal,
  onOpenToolsModal,
  onToggleSidebar,
}) => {
  const [isModelDropdownOpen, setIsModelDropdownOpen] = useState(false);

  const getPersonaIcon = (id: PersonaId) => {
    switch (id) {
      case 'resume_doctor':
        return <FileEdit className="h-4 w-4" />;
      case 'cv_specialist':
        return <FileCheck2 className="h-4 w-4" />;
      case 'mock_interview':
        return <UserCheck className="h-4 w-4" />;
      case 'career_analyst':
        return <Briefcase className="h-4 w-4" />;
      case 'mental_mentor':
        return <HeartHandshake className="h-4 w-4" />;
    }
  };

  const selectedModelObj =
    AVAILABLE_MODELS.find((m) => m.id === currentModel) || AVAILABLE_MODELS[0];

  return (
    <header className="sticky top-0 z-30 flex flex-col border-b border-slate-200 bg-white/95 backdrop-blur-md">
      {/* Top Main Navigation Bar */}
      <div className="flex h-16 items-center justify-between px-4 sm:px-6">
        {/* Brand & Sidebar Toggle */}
        <div className="flex items-center gap-3">
          <button
            onClick={onToggleSidebar}
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-600 transition hover:bg-slate-100 hover:text-slate-900"
            title="대화 목록 열기/닫기"
            aria-label="대화 목록 토글"
          >
            <Menu className="h-5 w-5" />
          </button>

          <div className="flex items-center gap-2.5">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-600 text-white shadow-sm shadow-indigo-200">
              <GraduationCap className="h-6 w-6" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-base font-bold tracking-tight text-slate-900">
                  취뽀메이트
                </span>
                <span className="text-[11px] font-semibold text-indigo-600 bg-indigo-50 px-1.5 py-0.5 rounded border border-indigo-100">
                  AI Career Coach
                </span>
              </div>
              <p className="text-xs text-slate-500 hidden sm:block">
                취준생 맞춤 자소서·이력서 첨삭 · 실전 모의면접 · STAR 역량 코칭
              </p>
            </div>
          </div>
        </div>

        {/* Action Tools & Model Picker */}
        <div className="flex items-center gap-2">
          {/* Server Vault Button with Live Connection Indicator */}
          <button
            onClick={onOpenVaultModal}
            className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-800 shadow-xs hover:bg-slate-50 transition"
            title="백엔드 서버에 저장된 서류 및 진단 기록"
          >
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            <Database className="h-3.5 w-3.5 text-emerald-600" />
            <span className="hidden lg:inline">서버 보관함</span>
          </button>

          {/* Quick Tools */}
          <button
            onClick={onOpenPassRateModal}
            className="flex items-center gap-1.5 rounded-lg border border-rose-200 bg-rose-50/80 px-3 py-1.5 text-xs font-semibold text-rose-700 transition hover:bg-rose-100"
          >
            <Target className="h-3.5 w-3.5 text-rose-600" />
            <span>합격 가능성</span>
          </button>

          <button
            onClick={onOpenCVModal}
            className="flex items-center gap-1.5 rounded-lg border border-blue-200 bg-blue-50/80 px-3 py-1.5 text-xs font-semibold text-blue-700 transition hover:bg-blue-100"
          >
            <FileCheck2 className="h-3.5 w-3.5 text-blue-600" />
            <span>이력서 첨삭</span>
          </button>

          <button
            onClick={onOpenResumeModal}
            className="hidden md:flex items-center gap-1.5 rounded-lg border border-indigo-200 bg-indigo-50/70 px-3 py-1.5 text-xs font-semibold text-indigo-700 transition hover:bg-indigo-100"
          >
            <Sparkles className="h-3.5 w-3.5 text-indigo-600" />
            <span>자소서 STAR 진단</span>
          </button>

          <button
            onClick={onOpenTimerModal}
            className="hidden sm:flex items-center gap-1.5 rounded-lg border border-emerald-200 bg-emerald-50/70 px-3 py-1.5 text-xs font-semibold text-emerald-700 transition hover:bg-emerald-100"
          >
            <Timer className="h-3.5 w-3.5 text-emerald-600" />
            <span>1분 면접 타이머</span>
          </button>

          <button
            onClick={onOpenToolsModal}
            className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-medium text-slate-700 transition hover:bg-slate-100"
          >
            <Wrench className="h-3.5 w-3.5 text-slate-500" />
            <span className="hidden sm:inline">취준 툴킷</span>
          </button>

          {/* Model Selector Dropdown */}
          <div className="relative">
            <button
              onClick={() => setIsModelDropdownOpen(!isModelDropdownOpen)}
              className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-700 shadow-xs transition hover:bg-slate-50"
            >
              <Bot className="h-3.5 w-3.5 text-indigo-600" />
              <span className="max-w-[100px] truncate sm:max-w-none font-semibold text-slate-800">
                {selectedModelObj.name}
              </span>
              <ChevronDown className="h-3.5 w-3.5 text-slate-400" />
            </button>

            {isModelDropdownOpen && (
              <>
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setIsModelDropdownOpen(false)}
                />
                <div className="absolute right-0 top-full mt-1.5 z-50 w-72 rounded-xl border border-slate-200 bg-white p-2 shadow-xl ring-1 ring-slate-900/5">
                  <div className="px-2 py-1.5 border-b border-slate-100 text-[11px] font-semibold text-slate-500">
                    AI 모델 선택
                  </div>
                  <div className="mt-1 space-y-1">
                    {AVAILABLE_MODELS.map((model) => (
                      <button
                        key={model.id}
                        onClick={() => {
                          onSelectModel(model.id);
                          setIsModelDropdownOpen(false);
                        }}
                        className={`w-full rounded-lg p-2 text-left transition ${
                          currentModel === model.id
                            ? 'bg-indigo-50/80 border border-indigo-200'
                            : 'hover:bg-slate-50'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span
                            className={`text-xs font-bold ${
                              currentModel === model.id
                                ? 'text-indigo-900'
                                : 'text-slate-800'
                            }`}
                          >
                            {model.name}
                          </span>
                          <span
                            className={`rounded px-1.5 py-0.5 text-[10px] font-semibold ${
                              currentModel === model.id
                                ? 'bg-indigo-600 text-white'
                                : 'bg-slate-100 text-slate-600'
                            }`}
                          >
                            {model.badge}
                          </span>
                        </div>
                        <p className="mt-0.5 text-[11px] text-slate-500 leading-snug">
                          {model.desc}
                        </p>
                      </button>
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Persona Mode Tabs Bar */}
      <div className="flex overflow-x-auto border-t border-slate-100 bg-slate-50/80 px-4 sm:px-6 py-2 no-scrollbar gap-2">
        {Object.values(PERSONAS).map((persona) => {
          const isActive = currentPersona === persona.id;
          return (
            <button
              key={persona.id}
              onClick={() => onSelectPersona(persona.id)}
              className={`flex shrink-0 items-center gap-2 rounded-lg px-3 py-1.5 text-xs font-medium transition ${
                isActive
                  ? 'bg-white text-slate-900 shadow-xs ring-1 ring-slate-200 font-semibold'
                  : 'text-slate-600 hover:bg-slate-200/60 hover:text-slate-900'
              }`}
            >
              <span className={isActive ? persona.color : 'text-slate-500'}>
                {getPersonaIcon(persona.id)}
              </span>
              <span>{persona.name}</span>
              <span
                className={`text-[10px] px-1 py-0.2 rounded font-normal ${
                  isActive ? 'bg-slate-100 text-slate-700' : 'text-slate-400'
                }`}
              >
                {persona.badge}
              </span>
            </button>
          );
        })}
      </div>
    </header>
  );
};
