import React, { useState } from 'react';
import {
  X,
  Target,
  Sparkles,
  Loader2,
  CheckCircle2,
  AlertTriangle,
  ArrowUpRight,
  Send,
  ShieldCheck,
  TrendingUp,
  HelpCircle,
  Building2,
  Award,
  Database,
  Check,
} from 'lucide-react';
import { PassPredictionResult } from '../types';
import { savePredictionToServer } from '../services/api';

interface PassRateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSendToChat: (message: string) => void;
}

const PRESETS = [
  {
    title: '삼성전자 DX부문 SW개발',
    company: '삼성전자',
    type: '대기업 (공채)',
    role: '서버/백엔드 소프트웨어 개발',
    specs: '인서울 4년제 컴퓨터공학 / 학점 3.75 / OPIc IH / 정보처리기사, SQLD',
    experience: `[주요 프로젝트]
- 대용량 트래픽 처리 웹 서비스 개발 (Redis 캐싱으로 TPS 350% 향상)
- 캡스톤 디자인 대회 최우수상 수상
- 스타트업 인턴 6개월 (Spring Boot 기반 결제 마이크로서비스 유지보수)`,
    requirements: 'Java, Spring 기반 백엔드 설계 역량, 알고리즘 및 CS 기본기, 협업 경험',
  },
  {
    title: '토스(비바리퍼블리카) PM',
    company: '토스 (비바리퍼블리카)',
    type: '유니콘 / 테크',
    role: 'Product Manager (주니어/신입)',
    specs: '비전공자(경영학) / 학점 3.6 / TOEIC 910 / 데이터분석 준전문가(ADsP)',
    experience: `[주요 경험]
- 교내 핀테크 소모임 회장 및 대학생 가계부 앱 MVP 런칭 (MAU 1,200명 달성)
- GA4 및 SQL 활용 데이터 퍼널 분석을 통해 온보딩 이탈률 18% 감소
- 2개 IT 동아리 PM 리드 경험`,
    requirements: '지표 기반 가설 검증 능력, 빠른 실행력, 유저 집착, 데이터 리터러시',
  },
  {
    title: '네이버 마케팅 인턴',
    company: '네이버',
    type: '대기업 (수시/인턴)',
    role: '브랜드 및 콘텐츠 마케터',
    specs: '수도권 4년제 신문방송학 / 학점 3.8 / 토익 885, 토익스피킹 AL',
    experience: `[주요 경험]
- 대외활동 서포터즈 3회 수료 (최우수 서포터즈 1회 선정)
- 인스타그램 릴스 200만 조회수 달성 콘텐츠 기획 및 제작
- 패션 브랜드 팝업스토어 현장 운영 스태프 및 바이럴 마케팅`,
    requirements: '트렌드 민감도, 숏폼 콘텐츠 기획/제작 역량, 정량 성과 분석 능력',
  },
];

export const PassRateModal: React.FC<PassRateModalProps> = ({
  isOpen,
  onClose,
  onSendToChat,
}) => {
  const [targetCompany, setTargetCompany] = useState(PRESETS[0].company);
  const [companyType, setCompanyType] = useState(PRESETS[0].type);
  const [jobRole, setJobRole] = useState(PRESETS[0].role);
  const [applicantSpecs, setApplicantSpecs] = useState(PRESETS[0].specs);
  const [portfolioOrResume, setPortfolioOrResume] = useState(PRESETS[0].experience);
  const [jobRequirements, setJobRequirements] = useState(PRESETS[0].requirements);

  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<PassPredictionResult | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  if (!isOpen) return null;

  const handleSaveToServer = async () => {
    if (!result) return;
    setIsSaving(true);
    try {
      await savePredictionToServer({
        targetCompany,
        jobRole,
        passProbability: result.passProbability,
        tierRating: result.tierRating,
        overallAssessment: result.overallAssessment,
        resultData: result,
      });
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 2500);
    } catch (err: any) {
      alert(err.message || '서버 저장에 실패했습니다.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleApplyPreset = (idx: number) => {
    const p = PRESETS[idx];
    setTargetCompany(p.company);
    setCompanyType(p.type);
    setJobRole(p.role);
    setApplicantSpecs(p.specs);
    setPortfolioOrResume(p.experience);
    setJobRequirements(p.requirements);
  };

  const handlePredict = async () => {
    if (!targetCompany.trim() || !jobRole.trim()) {
      alert('목표 기업과 희망 직무를 입력해 주세요.');
      return;
    }

    setIsLoading(true);
    setResult(null);

    try {
      const res = await fetch('/api/predict-pass-rate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          targetCompany,
          companyType,
          jobRole,
          applicantSpecs,
          portfolioOrResume,
          jobRequirements,
        }),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || '합격 가능성 분석에 실패했습니다.');
      }

      const data = await res.json();
      setResult(data);
    } catch (err: any) {
      alert(err.message || '분석 중 문제가 발생했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendToChatbot = () => {
    if (!result) return;
    const msg = `
[합격 가능성 분석 결과 연계 상담 요청]
- 목표 기업/직무: ${targetCompany} (${companyType}) / ${jobRole}
- 예상 합격 확률: ${result.passProbability}% (${result.tierRating})
- 심사위원 진단: "${result.overallAssessment}"
- 경쟁 우위: ${result.competitiveEdge.join(', ')}
- 약점 및 리스크: ${result.riskFactors.map((r) => r.risk).join(' / ')}

위 분석 결과를 바탕으로, 합격 확률을 ${result.passProbability}%에서 85% 이상으로 끌어올리기 위한 맞춤형 자소서/면접 집중 보완 전략을 세워줘!
`.trim();

    onSendToChat(msg);
    onClose();
  };

  const getTierColor = (tier: string) => {
    switch (tier) {
      case '안정권':
        return 'text-emerald-700 bg-emerald-100 border-emerald-300';
      case '적정권':
        return 'text-blue-700 bg-blue-100 border-blue-300';
      case '도전권':
        return 'text-amber-700 bg-amber-100 border-amber-300';
      default:
        return 'text-rose-700 bg-rose-100 border-rose-300';
    }
  };

  const getBarColor = (score: number) => {
    if (score >= 80) return 'bg-emerald-500';
    if (score >= 60) return 'bg-blue-500';
    if (score >= 40) return 'bg-amber-500';
    return 'bg-rose-500';
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
            <span className="text-xs font-semibold text-rose-600 bg-rose-50 px-2 py-0.5 rounded border border-rose-100 flex items-center gap-1">
              <Target className="h-3.5 w-3.5" />
              <span>AI 채용 데이터 교차 진단</span>
            </span>
            <span className="text-xs text-slate-400">· 대한민국 최근 합격자 DB 벤치마크</span>
          </div>
          <h3 className="mt-1 text-xl font-bold text-slate-900">
            목표 기업·직무 실전 합격 가능성 & 핏(Fit) 정밀 진단
          </h3>
          <p className="text-xs text-slate-500">
            지원자의 스펙과 프로젝트 경험을 심사위원 시각에서 객관적으로 검증하고, 현실적인 서류 통과율과 보완 로드맵을 도출합니다.
          </p>
        </div>

        {/* Scrollable Form Body */}
        <div className="flex-1 overflow-y-auto space-y-4 pr-1">
          {/* Quick Preset Buttons */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar text-xs">
            <span className="text-slate-400 shrink-0 font-medium">빠른 예시:</span>
            {PRESETS.map((p, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => handleApplyPreset(idx)}
                className="shrink-0 rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1 text-slate-700 hover:bg-indigo-50 hover:border-indigo-200 hover:text-indigo-900 transition"
              >
                {p.title}
              </button>
            ))}
          </div>

          {/* Form Fields */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="text-xs font-semibold text-slate-700 mb-1 block">
                목표 기업명 *
              </label>
              <input
                type="text"
                value={targetCompany}
                onChange={(e) => setTargetCompany(e.target.value)}
                placeholder="예: 현대자동차, 네이버, 카카오"
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs focus:border-rose-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-700 mb-1 block">
                기업 형태
              </label>
              <select
                value={companyType}
                onChange={(e) => setCompanyType(e.target.value)}
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs focus:border-rose-500 focus:outline-none bg-white"
              >
                <option value="대기업 (공채)">대기업 (공채)</option>
                <option value="대기업 (수시/인턴)">대기업 (수시/인턴)</option>
                <option value="유니콘 / 테크 스타트업">유니콘 / 테크 스타트업</option>
                <option value="중견·강소기업">중견·강소기업</option>
                <option value="공기업 / 공공기관 (NCS)">공기업 / 공공기관 (NCS)</option>
                <option value="외국계 기업">외국계 기업</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-700 mb-1 block">
                목표 직무 *
              </label>
              <input
                type="text"
                value={jobRole}
                onChange={(e) => setJobRole(e.target.value)}
                placeholder="예: 백엔드 개발자, PM, 퍼포먼스 마케터"
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs focus:border-rose-500 focus:outline-none"
              />
            </div>
          </div>

          {/* Applicant Specs */}
          <div>
            <label className="text-xs font-semibold text-slate-700 mb-1 block">
              정량 스펙 요약 (학력, 전공, 학점, 어학, 자격증)
            </label>
            <input
              type="text"
              value={applicantSpecs}
              onChange={(e) => setApplicantSpecs(e.target.value)}
              placeholder="예: 인서울 4년제 컴퓨터공학 / 3.8 / 토익 890 / 정보처리기사"
              className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs focus:border-rose-500 focus:outline-none"
            />
          </div>

          {/* Experience / Resume summary */}
          <div>
            <label className="text-xs font-semibold text-slate-700 mb-1 block">
              프로젝트 경험 / 인턴 / 자소서·이력서 핵심 요약 *
            </label>
            <textarea
              rows={4}
              value={portfolioOrResume}
              onChange={(e) => setPortfolioOrResume(e.target.value)}
              placeholder="주요 프로젝트 내용, 맡은 역할, 정량 성과, 인턴 및 대외활동 경험을 자유롭게 적어주세요."
              className="w-full rounded-xl border border-slate-200 p-3 text-xs leading-relaxed text-slate-800 placeholder:text-slate-400 focus:border-rose-500 focus:outline-none"
            />
          </div>

          {/* Requirements (Optional) */}
          <div>
            <label className="text-xs font-semibold text-slate-700 mb-1 block">
              공고 우대사항 및 주요 요건 (선택)
            </label>
            <input
              type="text"
              value={jobRequirements}
              onChange={(e) => setJobRequirements(e.target.value)}
              placeholder="예: 대용량 트래픽 경험 우대, SQL 능숙자 우대 등"
              className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs focus:border-rose-500 focus:outline-none"
            />
          </div>

          {/* Submit Button */}
          <button
            onClick={handlePredict}
            disabled={isLoading || !targetCompany.trim() || !jobRole.trim()}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-rose-600 py-2.5 text-xs font-semibold text-white shadow-xs transition hover:bg-rose-700 disabled:opacity-50"
          >
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>합격 데이터베이스 교차 대조 및 심층 분석 중...</span>
              </>
            ) : (
              <>
                <Target className="h-4 w-4" />
                <span>실전 합격 가능성 & 핏(Fit) 정밀 진단 실행</span>
              </>
            )}
          </button>

          {/* Analysis Results View */}
          {result && (
            <div className="mt-6 rounded-2xl border border-rose-100 bg-rose-50/20 p-5 space-y-5">
              {/* Top Banner: Probability + Tier */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-rose-100 pb-4">
                <div className="flex items-center gap-4">
                  {/* Circular/Gauge visual */}
                  <div className="relative flex h-20 w-20 shrink-0 items-center justify-center rounded-2xl bg-slate-900 text-white shadow-md">
                    <div className="text-center">
                      <span className="block font-mono text-2xl font-black tabular-nums text-rose-400 leading-none">
                        {result.passProbability}%
                      </span>
                      <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">
                        합격 확률
                      </span>
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center gap-2">
                      <span
                        className={`rounded-md border px-2.5 py-0.5 text-xs font-bold ${getTierColor(
                          result.tierRating
                        )}`}
                      >
                        {result.tierRating}
                      </span>
                      <span className="text-xs text-slate-500">
                        {targetCompany} · {jobRole}
                      </span>
                    </div>
                    <p className="mt-1 text-xs font-medium text-slate-800 leading-relaxed max-w-xl">
                      "{result.overallAssessment}"
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2 shrink-0">
                  <button
                    onClick={handleSaveToServer}
                    disabled={isSaving}
                    className="flex items-center gap-1.5 rounded-xl border border-emerald-200 bg-emerald-50 px-3.5 py-2 text-xs font-semibold text-emerald-800 hover:bg-emerald-100 transition"
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
                    onClick={handleSendToChatbot}
                    className="flex items-center justify-center gap-1.5 rounded-xl bg-slate-900 px-4 py-2 text-xs font-semibold text-white shadow-xs hover:bg-slate-800 transition"
                  >
                    <Send className="h-3.5 w-3.5" />
                    <span>AI 코치와 보완 상담하기</span>
                  </button>
                </div>
              </div>

              {/* 5 Core Competency Match Radar Bars */}
              <div className="rounded-xl border border-slate-200 bg-white p-4">
                <h4 className="text-xs font-bold text-slate-800 mb-3 flex items-center gap-1.5">
                  <Award className="h-4 w-4 text-rose-600" />
                  <span>5대 핵심 역량 매칭 지수</span>
                </h4>
                <div className="space-y-2.5 text-xs">
                  {[
                    { label: '직무 전문성 & 하드스킬', score: result.categoryScores.jobExpertise },
                    { label: '실무 프로젝트 & 수치 성과', score: result.categoryScores.practicalExperience },
                    { label: '기업 인재상 & 컬처 핏', score: result.categoryScores.companyFit },
                    { label: '정량 스펙 충족도', score: result.categoryScores.quantitativeSpecs },
                    { label: '차별화 필살기 & 무기', score: result.categoryScores.differentiation },
                  ].map((cat, idx) => (
                    <div key={idx}>
                      <div className="flex justify-between text-[11px] mb-1">
                        <span className="font-semibold text-slate-700">{cat.label}</span>
                        <span className="font-mono font-bold text-slate-900">{cat.score}점</span>
                      </div>
                      <div className="h-2 w-full rounded-full bg-slate-100 overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-1000 ${getBarColor(
                            cat.score
                          )}`}
                          style={{ width: `${cat.score}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* 2-Column: Competitive Edge vs Risk Factors */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                {/* Competitive Edge */}
                <div className="rounded-xl border border-emerald-100 bg-white p-4 space-y-2">
                  <div className="flex items-center gap-1.5 font-bold text-emerald-800">
                    <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                    <span>경쟁자 대비 나의 확실한 우위 요소</span>
                  </div>
                  <ul className="space-y-1.5 text-slate-700 text-[11px]">
                    {result.competitiveEdge.map((edge, i) => (
                      <li key={i} className="flex items-start gap-1.5">
                        <span className="font-bold text-emerald-600">✔</span>
                        <span>{edge}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Risk Factors */}
                <div className="rounded-xl border border-rose-100 bg-white p-4 space-y-2">
                  <div className="flex items-center gap-1.5 font-bold text-rose-800">
                    <AlertTriangle className="h-4 w-4 text-rose-600" />
                    <span>서류 탈락 위험 요소 & 즉시 처방전</span>
                  </div>
                  <div className="space-y-2 text-[11px]">
                    {result.riskFactors.map((rf, i) => (
                      <div key={i} className="rounded-lg bg-rose-50/50 p-2 border border-rose-100">
                        <p className="font-bold text-rose-900">⚠️ {rf.risk}</p>
                        <p className="mt-0.5 text-slate-700">💡 {rf.remedy}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Boost Strategies (How to increase +15%) */}
              <div className="rounded-xl border border-indigo-100 bg-indigo-50/40 p-4 text-xs space-y-2">
                <div className="flex items-center gap-1.5 font-bold text-indigo-950">
                  <TrendingUp className="h-4 w-4 text-indigo-600" />
                  <span>합격 확률 +15% 끌어올리는 긴급 보완 전략</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  {result.boostStrategies.map((strat, i) => (
                    <div
                      key={i}
                      className="rounded-lg bg-white p-2.5 border border-indigo-100 text-[11px] text-slate-800 leading-snug"
                    >
                      <span className="font-bold text-indigo-600 block mb-1">전략 0{i + 1}</span>
                      {strat}
                    </div>
                  ))}
                </div>
              </div>

              {/* Expected Interview Challenges */}
              <div className="rounded-xl border border-slate-200 bg-white p-4 text-xs space-y-2.5">
                <div className="flex items-center gap-1.5 font-bold text-slate-900">
                  <ShieldCheck className="h-4 w-4 text-slate-700" />
                  <span>면접관의 송곳 검증 질문 & 방어 논리</span>
                </div>
                {result.expectedInterviewChallenges.map((ic, i) => (
                  <div key={i} className="rounded-lg bg-slate-50 p-3 border border-slate-200 space-y-1">
                    <p className="font-bold text-slate-900">Q. "{ic.question}"</p>
                    <p className="text-[11px] text-slate-500">
                      <strong>의도:</strong> {ic.intent}
                    </p>
                    <p className="text-[11px] text-emerald-800 bg-emerald-50/70 p-2 rounded border border-emerald-100">
                      <strong>방어 가이드:</strong> {ic.defenseStrategy}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
