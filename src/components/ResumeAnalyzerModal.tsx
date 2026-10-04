import React, { useState } from 'react';
import {
  X,
  Sparkles,
  Loader2,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  Copy,
  Check,
  Send,
  HelpCircle,
  Database,
} from 'lucide-react';
import { countKoreanText } from '../utils/text';
import { ResumeAnalysisResult } from '../types';
import { saveDocToServer } from '../services/api';

interface ResumeAnalyzerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSendToChat: (message: string) => void;
}

export const ResumeAnalyzerModal: React.FC<ResumeAnalyzerModalProps> = ({
  isOpen,
  onClose,
  onSendToChat,
}) => {
  const [companyName, setCompanyName] = useState('');
  const [jobRole, setJobRole] = useState('');
  const [resumeText, setResumeText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<ResumeAnalysisResult | null>(null);
  const [copied, setCopied] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [activeTab, setActiveTab] = useState<'diagnosis' | 'star' | 'questions'>('diagnosis');

  if (!isOpen) return null;

  const stats = countKoreanText(resumeText);

  const handleSaveToServer = async () => {
    if (!result) return;
    setIsSaving(true);
    try {
      await saveDocToServer({
        type: 'cover_letter',
        title: `${companyName || '자기소개서'} - ${jobRole || '희망직무'} (${result.overallScore}점)`,
        targetCompany: companyName,
        jobRole,
        originalText: resumeText,
        analysisResult: result,
      });
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 2500);
    } catch (err: any) {
      alert(err.message || '서버 저장에 실패했습니다.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleAnalyze = async () => {
    if (!resumeText.trim()) {
      alert('분석할 자기소개서 본문을 입력해 주세요.');
      return;
    }

    setIsLoading(true);
    setResult(null);

    try {
      const res = await fetch('/api/analyze-resume', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          resumeText,
          companyName,
          jobRole,
        }),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || '자기소개서 분석에 실패했습니다.');
      }

      const data = await res.json();
      setResult(data);
      setActiveTab('diagnosis');
    } catch (err: any) {
      alert(err.message || '분석 중 문제가 발생했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopyRewrite = async () => {
    if (!result?.starRevision?.fullRewrittenText) return;
    await navigator.clipboard.writeText(result.starRevision.fullRewrittenText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleTransferToChat = () => {
    if (!result) return;
    const chatMsg = `
[자소서 STAR 진단 결과 반영 요청]
- 지원 기업/직무: ${companyName || '미정'} / ${jobRole || '미정'}
- AI 진단 점수: ${result.overallScore}점
- 수정본:
${result.starRevision.fullRewrittenText}

위 수정본을 바탕으로 좀 더 자연스러운 문장으로 다듬거나 소제목 3개를 추천해줘!
`.trim();

    onSendToChat(chatMsg);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-xs overflow-y-auto">
      <div className="relative w-full max-w-3xl rounded-2xl bg-white p-6 shadow-2xl ring-1 ring-slate-200 my-8 max-h-[90vh] flex flex-col">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute right-4 top-4 rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Modal Header */}
        <div className="mb-4">
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-semibold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-100">
              AI 심층 자소서 클리닉
            </span>
            <span className="text-xs text-slate-400">· 15년 차 채용총괄 시각</span>
          </div>
          <h3 className="mt-1 text-xl font-bold text-slate-900">
            자기소개서 STAR 정밀 진단 & 리라이팅
          </h3>
          <p className="text-xs text-slate-500">
            작성하신 자소서를 입력하시면 100점 만점 평가 점수, STAR 분해, 그리고 합격형 리라이팅본을 도출해 드립니다.
          </p>
        </div>

        {/* Body content with scroll */}
        <div className="flex-1 overflow-y-auto space-y-4 pr-1">
          {/* Target inputs */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-slate-700 mb-1 block">
                지원 기업명 (선택)
              </label>
              <input
                type="text"
                placeholder="예: 현대자동차, 네이버, 토스 등"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs focus:border-indigo-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-700 mb-1 block">
                지원 직무 (선택)
              </label>
              <input
                type="text"
                placeholder="예: 프론트엔드 개발, 프로덕트 매니저, 해외영업"
                value={jobRole}
                onChange={(e) => setJobRole(e.target.value)}
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs focus:border-indigo-500 focus:outline-none"
              />
            </div>
          </div>

          {/* Resume Textarea */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-semibold text-slate-700">
                자기소개서 문항 및 본문
              </label>
              <span className="text-[11px] text-slate-400 tabular-nums">
                공백 포함 <strong>{stats.withSpaces}</strong>자 · 공백 제외{' '}
                <strong>{stats.withoutSpaces}</strong>자
              </span>
            </div>
            <textarea
              rows={5}
              value={resumeText}
              onChange={(e) => setResumeText(e.target.value)}
              placeholder="예: [지원동기] 귀사의 혁신적인 AI 물류 솔루션에 매료되어 지원하게 되었습니다. 대학 시절 동아리 프로젝트에서 물류 병목 현상을 30% 개선한 경험이 있으며..."
              className="w-full rounded-xl border border-slate-200 p-3 text-xs leading-relaxed text-slate-800 placeholder:text-slate-400 focus:border-indigo-500 focus:outline-none"
            />
          </div>

          {/* Analyze Button */}
          <button
            onClick={handleAnalyze}
            disabled={isLoading || !resumeText.trim()}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 py-2.5 text-xs font-semibold text-white shadow-xs transition hover:bg-indigo-700 disabled:opacity-50"
          >
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>채용담당자 관점에서 정밀 진단 및 리라이팅 중...</span>
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4" />
                <span>자소서 심층 분석 & STAR 리라이팅 실행</span>
              </>
            )}
          </button>

          {/* Results section */}
          {result && (
            <div className="mt-6 rounded-2xl border border-indigo-100 bg-indigo-50/20 p-4">
              {/* Score header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-indigo-100/70 pb-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-indigo-600 text-white font-extrabold text-xl shadow-sm">
                    {result.overallScore}점
                  </div>
                  <div>
                    <span className="text-xs font-semibold text-indigo-700">
                      인사담당자 총평
                    </span>
                    <p className="text-sm font-bold text-slate-900 mt-0.5">
                      "{result.oneLineVerdict}"
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <button
                    onClick={handleSaveToServer}
                    disabled={isSaving}
                    className="flex items-center gap-1.5 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-800 hover:bg-emerald-100 transition"
                  >
                    {isSaving ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin text-emerald-600" />
                    ) : savedSuccess ? (
                      <Check className="h-3.5 w-3.5 text-emerald-600" />
                    ) : (
                      <Database className="h-3.5 w-3.5 text-emerald-600" />
                    )}
                    <span>{savedSuccess ? '서버에 저장됨!' : '서버에 저장'}</span>
                  </button>

                  <button
                    onClick={handleCopyRewrite}
                    className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                  >
                    {copied ? (
                      <>
                        <Check className="h-3.5 w-3.5 text-emerald-600" />
                        <span className="text-emerald-600">수정본 복사됨</span>
                      </>
                    ) : (
                      <>
                        <Copy className="h-3.5 w-3.5" />
                        <span>수정본 복사</span>
                      </>
                    )}
                  </button>

                  <button
                    onClick={handleTransferToChat}
                    className="flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-indigo-700"
                  >
                    <Send className="h-3.5 w-3.5" />
                    <span>채팅으로 가져오기</span>
                  </button>
                </div>
              </div>

              {/* Result Tabs */}
              <div className="flex border-b border-indigo-100/80 mt-3 text-xs">
                <button
                  onClick={() => setActiveTab('diagnosis')}
                  className={`px-3 py-2 font-semibold border-b-2 transition ${
                    activeTab === 'diagnosis'
                      ? 'border-indigo-600 text-indigo-700'
                      : 'border-transparent text-slate-500 hover:text-slate-800'
                  }`}
                >
                  강점 & 약점 진단
                </button>
                <button
                  onClick={() => setActiveTab('star')}
                  className={`px-3 py-2 font-semibold border-b-2 transition ${
                    activeTab === 'star'
                      ? 'border-indigo-600 text-indigo-700'
                      : 'border-transparent text-slate-500 hover:text-slate-800'
                  }`}
                >
                  STAR 리라이팅 완성본
                </button>
                <button
                  onClick={() => setActiveTab('questions')}
                  className={`px-3 py-2 font-semibold border-b-2 transition ${
                    activeTab === 'questions'
                      ? 'border-indigo-600 text-indigo-700'
                      : 'border-transparent text-slate-500 hover:text-slate-800'
                  }`}
                >
                  예상 면접 꼬리질문 (3개)
                </button>
              </div>

              {/* Tab Contents */}
              <div className="mt-4">
                {activeTab === 'diagnosis' && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className="rounded-xl border border-emerald-100 bg-white p-3.5">
                      <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-700 mb-2">
                        <CheckCircle2 className="h-4 w-4" />
                        <span>핵심 강점 (살릴 부분)</span>
                      </div>
                      <ul className="space-y-1.5 text-xs text-slate-700">
                        {result.strengths.map((str, i) => (
                          <li key={i} className="flex items-start gap-1.5">
                            <span className="text-emerald-500 font-bold">·</span>
                            <span>{str}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div className="rounded-xl border border-rose-100 bg-white p-3.5">
                      <div className="flex items-center gap-1.5 text-xs font-bold text-rose-700 mb-2">
                        <AlertTriangle className="h-4 w-4" />
                        <span>시급한 보완점 (수정 필요)</span>
                      </div>
                      <ul className="space-y-1.5 text-xs text-slate-700">
                        {result.weaknesses.map((w, i) => (
                          <li key={i} className="flex items-start gap-1.5">
                            <span className="text-rose-500 font-bold">·</span>
                            <span>{w}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                )}

                {activeTab === 'star' && (
                  <div className="space-y-3">
                    {/* STAR details */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                      <div className="rounded-lg bg-white p-2.5 border border-slate-200">
                        <span className="font-bold text-indigo-600 block">S (Situation)</span>
                        <p className="text-[11px] text-slate-600 mt-1">
                          {result.starRevision.situation}
                        </p>
                      </div>
                      <div className="rounded-lg bg-white p-2.5 border border-slate-200">
                        <span className="font-bold text-indigo-600 block">T (Task)</span>
                        <p className="text-[11px] text-slate-600 mt-1">
                          {result.starRevision.task}
                        </p>
                      </div>
                      <div className="rounded-lg bg-white p-2.5 border border-slate-200">
                        <span className="font-bold text-indigo-600 block">A (Action)</span>
                        <p className="text-[11px] text-slate-600 mt-1">
                          {result.starRevision.action}
                        </p>
                      </div>
                      <div className="rounded-lg bg-white p-2.5 border border-slate-200">
                        <span className="font-bold text-indigo-600 block">R (Result)</span>
                        <p className="text-[11px] text-slate-600 mt-1">
                          {result.starRevision.result}
                        </p>
                      </div>
                    </div>

                    {/* Full rewritten version */}
                    <div className="rounded-xl border border-indigo-200 bg-white p-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-bold text-indigo-900">
                          ✨ 두괄식 완성형 자소서 수정본
                        </span>
                        <button
                          onClick={handleCopyRewrite}
                          className="text-[11px] font-semibold text-indigo-600 hover:text-indigo-800"
                        >
                          {copied ? '복사됨!' : '본문 복사'}
                        </button>
                      </div>
                      <p className="text-xs leading-relaxed text-slate-800 whitespace-pre-wrap">
                        {result.starRevision.fullRewrittenText}
                      </p>
                    </div>
                  </div>
                )}

                {activeTab === 'questions' && (
                  <div className="space-y-2.5">
                    {result.interviewQuestions.map((q, idx) => (
                      <div
                        key={idx}
                        className="rounded-xl border border-slate-200 bg-white p-3.5 text-xs"
                      >
                        <div className="flex items-start gap-2">
                          <span className="font-bold text-indigo-600">Q{idx + 1}.</span>
                          <span className="font-bold text-slate-900">{q.question}</span>
                        </div>
                        <div className="mt-2 pl-6 space-y-1 text-[11px]">
                          <p className="text-slate-500">
                            <strong>면접관 질문 의도:</strong> {q.intent}
                          </p>
                          <p className="text-emerald-700 bg-emerald-50/60 p-2 rounded border border-emerald-100">
                            <strong>💡 답변 팁:</strong> {q.answerTip}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
