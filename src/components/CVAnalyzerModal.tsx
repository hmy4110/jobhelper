import React, { useState } from 'react';
import {
  X,
  FileCheck2,
  Sparkles,
  Loader2,
  CheckCircle2,
  XCircle,
  Copy,
  Check,
  Send,
  ArrowRight,
  TrendingUp,
  Tag,
  BookOpen,
  Database,
} from 'lucide-react';
import { countKoreanText } from '../utils/text';
import { CVAnalysisResult } from '../types';
import { saveDocToServer } from '../services/api';

interface CVAnalyzerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSendToChat: (message: string) => void;
}

const SAMPLE_RESUMES = {
  developer: `[기본 정보]
이름: 김지원 / 신입 웹 프론트엔드 개발자
이메일: dev.applicant@example.com

[핵심 역량 요약]
React와 TypeScript를 활용한 웹 서비스 개발을 좋아하는 신입 개발자입니다. 성실하게 협업합니다.

[보유 기술]
React, TypeScript, Next.js, JavaScript, HTML/CSS, Git, Figma

[프로젝트 경험]
1. 취업 스터디 매칭 웹 서비스 (2025.03 ~ 2025.06 / 4인 팀)
- 역할: 프론트엔드 개발
- 스터디 모집 게시판 구현 및 사용자 프로필 페이지 개발
- 카카오 로그인 API 연동 및 결제 모듈 연동
- React Router를 사용한 페이지 라우팅 처리
- 팀원들과 매주 회의를 통해 일정 관리

2. 독서 기록 모바일 웹앱 (2024.09 ~ 2024.12 / 개인 프로젝트)
- 책 검색 API를 연동하여 검색 기능 개발
- 읽은 책 평점 남기기 및 독서 통계 차트 구현
- 로컬 스토리지를 활용하여 즐겨찾기 저장 기능 개발`,

  marketer: `[기본 정보]
이름: 이서연 / 주니어 퍼포먼스 & 콘텐츠 마케터
이메일: marketer.sy@example.com

[한줄 소개]
트렌드를 읽고 고객의 마음을 움직이는 열정적인 마케터입니다.

[보유 스킬]
Meta Ads, Google Analytics(GA4), SQL(기초), Figma, 카피라이팅, 노션

[경력 및 프로젝트]
1. 패션 이커머스 스타트업 마케팅 인턴 (2025.01 ~ 2025.06)
- 인스타그램 및 틱톡 광고 소재 기획 및 집행
- 공식 인스타그램 채널 피드 콘텐츠 주 3회 업로드
- 서포터즈 1기 모집 및 운영 관리
- 주간 광고 집행 리포트 작성 및 성과 분석

2. 대학교 축제 기획단 홍보팀장 (2024.03 ~ 2024.05)
- 축제 공식 굿즈 홍보 카드뉴스 제작
- 축제 참여 유도 인스타그램 이벤트 기획`,
};

export const CVAnalyzerModal: React.FC<CVAnalyzerModalProps> = ({
  isOpen,
  onClose,
  onSendToChat,
}) => {
  const [jobRole, setJobRole] = useState('웹 프론트엔드 개발자');
  const [careerLevel, setCareerLevel] = useState('신입 / 인턴');
  const [targetCompany, setTargetCompany] = useState('IT 테크 / 유니콘');
  const [cvText, setCvText] = useState(SAMPLE_RESUMES.developer);
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<CVAnalysisResult | null>(null);
  const [copied, setCopied] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [activeTab, setActiveTab] = useState<'bullets' | 'headline' | 'full_cv'>('bullets');

  if (!isOpen) return null;

  const stats = countKoreanText(cvText);

  const handleSaveToServer = async () => {
    if (!result) return;
    setIsSaving(true);
    try {
      await saveDocToServer({
        type: 'resume_cv',
        title: `${targetCompany || '이력서'} - ${jobRole} (${result.overallScore}점)`,
        targetCompany,
        jobRole,
        originalText: cvText,
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
    if (!cvText.trim()) {
      alert('첨삭할 이력서 본문을 입력해 주세요.');
      return;
    }

    setIsLoading(true);
    setResult(null);

    try {
      const res = await fetch('/api/analyze-cv', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cvText,
          jobRole,
          careerLevel,
          targetCompany,
        }),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || '이력서 첨삭에 실패했습니다.');
      }

      const data = await res.json();
      setResult(data);
      setActiveTab('bullets');
    } catch (err: any) {
      alert(err.message || '이력서 분석 중 문제가 발생했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopyFullCV = async () => {
    if (!result?.fullRefactoredCV) return;
    await navigator.clipboard.writeText(result.fullRefactoredCV);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleTransferToChat = () => {
    if (!result) return;
    const chatMsg = `
[이력서 첨삭 결과 반영 및 추가 질의]
- 목표 직무 / 연차: ${jobRole} / ${careerLevel}
- 이력서 점수: ${result.overallScore}점
- 추천 헤드라인: ${result.headlineCritique.after}
- 수정된 완성 이력서:
${result.fullRefactoredCV}

위 수정된 이력서를 기반으로 면접관이 주목할 만한 예상 기술/경력 꼬리질문 3개를 던져줘!
`.trim();

    onSendToChat(chatMsg);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-xs overflow-y-auto">
      <div className="relative w-full max-w-4xl rounded-2xl bg-white p-6 shadow-2xl ring-1 ring-slate-200 my-6 max-h-[92vh] flex flex-col">
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
            <span className="text-xs font-semibold text-blue-600 bg-blue-50 px-2 py-0.5 rounded border border-blue-100 flex items-center gap-1">
              <FileCheck2 className="h-3.5 w-3.5" />
              <span>실전 이력서·경력기술서 클리닉</span>
            </span>
            <span className="text-xs text-slate-400">· Google식 X-Y-Z 수치화 첨삭</span>
          </div>
          <h3 className="mt-1 text-xl font-bold text-slate-900">
            이력서 불렛포인트 성과 수치화 & 완성형 리라이팅
          </h3>
          <p className="text-xs text-slate-500">
            단순 업무 나열을 정량적 비즈니스 임팩트로 탈바꿈하고, 3초 만에 시선을 끄는 프로필 헤드라인과 ATS 필수 키워드를 도출합니다.
          </p>
        </div>

        {/* Scrollable Container */}
        <div className="flex-1 overflow-y-auto space-y-4 pr-1">
          {/* Target inputs */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="text-xs font-semibold text-slate-700 mb-1 block">
                목표 직무
              </label>
              <input
                type="text"
                placeholder="예: 프론트엔드 개발, 프로덕트 매니저(PM), 마케터"
                value={jobRole}
                onChange={(e) => setJobRole(e.target.value)}
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs focus:border-blue-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-700 mb-1 block">
                경력 구분
              </label>
              <select
                value={careerLevel}
                onChange={(e) => setCareerLevel(e.target.value)}
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs focus:border-blue-500 focus:outline-none bg-white"
              >
                <option value="신입 / 인턴">신입 / 인턴</option>
                <option value="주니어 (1~3년차)">주니어 (1~3년차)</option>
                <option value="중고신입 (타직무/경력 1년 미만)">중고신입 (타직무/1년 미만)</option>
                <option value="경력직 (4년차 이상)">경력직 (4년차 이상)</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-700 mb-1 block">
                목표 기업/분야
              </label>
              <input
                type="text"
                placeholder="예: 네이버, 당근, 대기업 공채, 외국계"
                value={targetCompany}
                onChange={(e) => setTargetCompany(e.target.value)}
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs focus:border-blue-500 focus:outline-none"
              />
            </div>
          </div>

          {/* Sample quick buttons */}
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold text-slate-700">
              이력서 / 경력기술서 본문
            </span>
            <div className="flex items-center gap-1.5">
              <span className="text-[11px] text-slate-400">예시 불러오기:</span>
              <button
                type="button"
                onClick={() => {
                  setJobRole('웹 프론트엔드 개발자');
                  setCvText(SAMPLE_RESUMES.developer);
                }}
                className="rounded bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-600 hover:bg-slate-200"
              >
                개발자 예시
              </button>
              <button
                type="button"
                onClick={() => {
                  setJobRole('퍼포먼스 마케터');
                  setCvText(SAMPLE_RESUMES.marketer);
                }}
                className="rounded bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-600 hover:bg-slate-200"
              >
                마케터 예시
              </button>
            </div>
          </div>

          {/* CV Textarea */}
          <div className="relative">
            <textarea
              rows={6}
              value={cvText}
              onChange={(e) => setCvText(e.target.value)}
              placeholder="이력서의 요약문, 프로젝트 경험, 경력사항 불렛포인트를 자유롭게 붙여넣으세요..."
              className="w-full rounded-xl border border-slate-200 p-3 text-xs leading-relaxed text-slate-800 placeholder:text-slate-400 focus:border-blue-500 focus:outline-none font-mono"
            />
            <div className="text-right text-[11px] text-slate-400 mt-1 tabular-nums">
              공백 포함 <strong>{stats.withSpaces}</strong>자 · 공백 제외 <strong>{stats.withoutSpaces}</strong>자
            </div>
          </div>

          {/* Run Button */}
          <button
            onClick={handleAnalyze}
            disabled={isLoading || !cvText.trim()}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 py-2.5 text-xs font-semibold text-white shadow-xs transition hover:bg-blue-700 disabled:opacity-50"
          >
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Google식 X-Y-Z 공식으로 성과 수치화 첨삭 중...</span>
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4" />
                <span>이력서 정밀 첨삭 & 불렛포인트 수치화 실행</span>
              </>
            )}
          </button>

          {/* Results section */}
          {result && (
            <div className="mt-6 rounded-2xl border border-blue-100 bg-blue-50/20 p-5 space-y-4">
              {/* Score & Verdict banner */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-blue-100 pb-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-blue-600 text-white font-extrabold text-xl shadow-sm">
                    {result.overallScore}점
                  </div>
                  <div>
                    <span className="text-xs font-semibold text-blue-700">
                      채용 총괄 헤드헌터 평가
                    </span>
                    <p className="text-xs font-bold text-slate-900 mt-0.5 leading-snug">
                      "{result.summaryVerdict}"
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
                    onClick={handleCopyFullCV}
                    className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                  >
                    {copied ? (
                      <>
                        <Check className="h-3.5 w-3.5 text-emerald-600" />
                        <span className="text-emerald-600">완성본 복사됨</span>
                      </>
                    ) : (
                      <>
                        <Copy className="h-3.5 w-3.5" />
                        <span>완성본 복사</span>
                      </>
                    )}
                  </button>

                  <button
                    onClick={handleTransferToChat}
                    className="flex items-center gap-1.5 rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-blue-700"
                  >
                    <Send className="h-3.5 w-3.5" />
                    <span>채팅창으로 가져오기</span>
                  </button>
                </div>
              </div>

              {/* 4-point Checklist */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {result.checklist.map((item, idx) => (
                  <div
                    key={idx}
                    className={`rounded-xl border p-2.5 text-xs ${
                      item.passed
                        ? 'border-emerald-200 bg-emerald-50/50 text-emerald-900'
                        : 'border-amber-200 bg-amber-50/50 text-amber-900'
                    }`}
                  >
                    <div className="flex items-center gap-1 font-bold mb-1">
                      {item.passed ? (
                        <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                      ) : (
                        <XCircle className="h-3.5 w-3.5 text-amber-600" />
                      )}
                      <span>{item.category}</span>
                    </div>
                    <p className="text-[11px] leading-tight text-slate-600">
                      {item.comment}
                    </p>
                  </div>
                ))}
              </div>

              {/* Result Tabs */}
              <div className="flex border-b border-blue-100 mt-2 text-xs font-semibold">
                <button
                  onClick={() => setActiveTab('bullets')}
                  className={`px-3 py-2 border-b-2 transition ${
                    activeTab === 'bullets'
                      ? 'border-blue-600 text-blue-700'
                      : 'border-transparent text-slate-500 hover:text-slate-800'
                  }`}
                >
                  불렛포인트 성과 수치화 ({result.bulletImprovements.length}개)
                </button>
                <button
                  onClick={() => setActiveTab('headline')}
                  className={`px-3 py-2 border-b-2 transition ${
                    activeTab === 'headline'
                      ? 'border-blue-600 text-blue-700'
                      : 'border-transparent text-slate-500 hover:text-slate-800'
                  }`}
                >
                  3초 헤드라인 & ATS 키워드
                </button>
                <button
                  onClick={() => setActiveTab('full_cv')}
                  className={`px-3 py-2 border-b-2 transition ${
                    activeTab === 'full_cv'
                      ? 'border-blue-600 text-blue-700'
                      : 'border-transparent text-slate-500 hover:text-slate-800'
                  }`}
                >
                  완성형 리팩토링 이력서 (Markdown)
                </button>
              </div>

              {/* Tab 1: Bullets */}
              {activeTab === 'bullets' && (
                <div className="space-y-3">
                  <div className="bg-blue-50/80 p-2.5 rounded-lg border border-blue-100 text-[11px] text-blue-900">
                    💡 <strong>Google X-Y-Z 공식이란?</strong> "어떤 구체적 행동(Z)을 통해, 어떤 수치적 지표(Y)를 측정하여, 어떤 비즈니스 성과(X)를 달성했는가"를 1문장에 담는 글로벌 테크 스탠다드 작성법입니다.
                  </div>

                  {result.bulletImprovements.map((bullet, idx) => (
                    <div
                      key={idx}
                      className="rounded-xl border border-slate-200 bg-white p-3.5 space-y-2 text-xs"
                    >
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="font-bold text-slate-500">
                          수정 항목 #{idx + 1}
                        </span>
                        <span className="rounded bg-indigo-50 px-2 py-0.5 font-semibold text-indigo-700">
                          수정 핵심: {bullet.keyChange}
                        </span>
                      </div>

                      {/* Before */}
                      <div className="rounded-lg bg-rose-50/70 p-2.5 border border-rose-100 text-rose-900">
                        <div className="text-[10px] font-bold text-rose-600 mb-0.5">
                          ❌ 기존 (수동적 업무 나열)
                        </div>
                        <p>{bullet.original}</p>
                      </div>

                      {/* Arrow */}
                      <div className="flex justify-center -my-1 text-slate-400">
                        <ArrowRight className="h-4 w-4 rotate-90 sm:rotate-0" />
                      </div>

                      {/* After */}
                      <div className="rounded-lg bg-emerald-50/70 p-2.5 border border-emerald-100 text-emerald-950 font-medium">
                        <div className="text-[10px] font-bold text-emerald-700 mb-0.5 flex items-center justify-between">
                          <span>✨ 개선본 (X-Y-Z 성과 수치화 & 액션버브)</span>
                          <button
                            onClick={() => {
                              navigator.clipboard.writeText(bullet.improved);
                              alert('불렛포인트가 복사되었습니다!');
                            }}
                            className="text-emerald-700 underline text-[10px]"
                          >
                            문장 복사
                          </button>
                        </div>
                        <p>{bullet.improved}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Tab 2: Headline & Skills */}
              {activeTab === 'headline' && (
                <div className="space-y-4">
                  {/* Headline critique */}
                  <div className="rounded-xl border border-slate-200 bg-white p-4 text-xs space-y-2">
                    <span className="font-bold text-slate-800 block text-sm">
                      📌 3초 프로필 헤드라인(한줄 요약) 교정
                    </span>
                    <div className="text-slate-500 text-[11px]">
                      <strong>기존 표현:</strong> "{result.headlineCritique.before}"
                    </div>
                    <div className="rounded-lg bg-blue-50 p-3 border border-blue-200 text-blue-950">
                      <span className="text-[10px] font-bold text-blue-600 block mb-1">
                        ✨ 추천 비즈니스 프로필 헤드라인:
                      </span>
                      <p className="text-xs font-bold">{result.headlineCritique.after}</p>
                    </div>
                    <p className="text-[11px] text-slate-600 bg-slate-50 p-2 rounded">
                      💡 <strong>헤드헌터 조언:</strong> {result.headlineCritique.advice}
                    </p>
                  </div>

                  {/* Skills evaluation */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                    <div className="rounded-xl border border-emerald-100 bg-white p-3.5">
                      <span className="font-bold text-emerald-700 block mb-2">
                        🎯 직무 매칭 & ATS 필수 추천 키워드
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        {result.skillsEvaluation.recommendedKeywords.map((kw, i) => (
                          <span
                            key={i}
                            className="rounded-md bg-emerald-50 px-2 py-1 text-[11px] font-semibold text-emerald-800 border border-emerald-100"
                          >
                            + {kw}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div className="rounded-xl border border-amber-100 bg-white p-3.5">
                      <span className="font-bold text-amber-700 block mb-2">
                        ⚠️ 모호하거나 구체화가 필요한 표현
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        {result.skillsEvaluation.redundantOrVague.map((rv, i) => (
                          <span
                            key={i}
                            className="rounded-md bg-amber-50 px-2 py-1 text-[11px] font-semibold text-amber-800 border border-amber-100"
                          >
                            {rv}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Tab 3: Full Refactored CV */}
              {activeTab === 'full_cv' && (
                <div className="rounded-xl border border-blue-200 bg-white p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-800">
                      📄 완성형 리팩토링 이력서 (Markdown 템플릿)
                    </span>
                    <button
                      onClick={handleCopyFullCV}
                      className="text-xs font-semibold text-blue-600 hover:text-blue-800 flex items-center gap-1"
                    >
                      {copied ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />}
                      <span>{copied ? '복사되었습니다!' : '전체 복사하기'}</span>
                    </button>
                  </div>
                  <pre className="max-h-96 overflow-y-auto rounded-lg bg-slate-900 p-4 text-[11px] font-mono text-slate-100 whitespace-pre-wrap leading-relaxed">
                    {result.fullRefactoredCV}
                  </pre>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
