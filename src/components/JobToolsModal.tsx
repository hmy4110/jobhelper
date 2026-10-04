import React, { useState } from 'react';
import { X, Copy, Check, Send, Sparkles, FileText, Mail, Target } from 'lucide-react';

interface JobToolsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSendToChat: (text: string) => void;
}

export const JobToolsModal: React.FC<JobToolsModalProps> = ({
  isOpen,
  onClose,
  onSendToChat,
}) => {
  const [activeTab, setActiveTab] = useState<'star_builder' | 'intro_builder' | 'cold_email'>('star_builder');
  const [copied, setCopied] = useState(false);

  // STAR state
  const [situation, setSituation] = useState('');
  const [task, setTask] = useState('');
  const [action, setAction] = useState('');
  const [result, setResult] = useState('');

  // 1-minute intro state
  const [keyword, setKeyword] = useState('');
  const [jobRole, setJobRole] = useState('');
  const [bestAchievement, setBestAchievement] = useState('');
  const [aspiration, setAspiration] = useState('');

  if (!isOpen) return null;

  const handleCopy = async (text: string) => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Generated STAR text
  const combinedStarText = `
[STAR 기법 정리]
- 상황(S): ${situation || '(미입력)'}
- 과제(T): ${task || '(미입력)'}
- 행동(A): ${action || '(미입력)'}
- 성과(R): ${result || '(미입력)'}

이 4가지 요소를 바탕으로 인사담당자가 매료될 수 있는 매끄러운 자소서 문단 및 면접용 1분 답변으로 완성해줘!
`.trim();

  // Generated 1-min intro template
  const generatedIntro = `
안녕하십니까, ${jobRole || '[희망 직무]'} 지원자 OOO입니다.
저를 한마디로 표현하자면 "${keyword || '문제를 끝까지 파고드는 집요한 해결사'}"입니다.

실제로 ${bestAchievement || '지난 인턴십에서 데이터 분석을 통해 고객 이탈율을 18% 감소시킨 경험'}이 있습니다. 문제 원인을 파악하기 위해 직접 사용자 인터뷰를 진행하고 팀원들과 가설을 검증하며 주도적으로 성과를 도출했습니다.

이러한 직무 역량을 바탕으로 귀사에서 ${aspiration || '실질적인 비즈니스 성장을 견인하는 핵심 인재'}로 기여하겠습니다. 감사합니다.
`.trim();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-xs overflow-y-auto">
      <div className="relative w-full max-w-2xl rounded-2xl bg-white p-6 shadow-2xl ring-1 ring-slate-200 my-8">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute right-4 top-4 rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Modal Header */}
        <div className="mb-4">
          <span className="text-xs font-semibold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-100">
            취준생 필수 툴킷
          </span>
          <h3 className="mt-1 text-xl font-bold text-slate-900">
            합격 치트키 템플릿 & 빌더
          </h3>
          <p className="text-xs text-slate-500">
            어려운 자소서 문항과 1분 자기소개를 공식에 맞춰 빠르게 작성해 보세요.
          </p>
        </div>

        {/* Tab selection */}
        <div className="flex border-b border-slate-200 mb-4 text-xs font-semibold">
          <button
            onClick={() => setActiveTab('star_builder')}
            className={`flex items-center gap-1.5 px-3 py-2 border-b-2 transition ${
              activeTab === 'star_builder'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Target className="h-3.5 w-3.5" />
            <span>STAR 경험 조립기</span>
          </button>
          <button
            onClick={() => setActiveTab('intro_builder')}
            className={`flex items-center gap-1.5 px-3 py-2 border-b-2 transition ${
              activeTab === 'intro_builder'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Sparkles className="h-3.5 w-3.5" />
            <span>1분 자기소개 빌더</span>
          </button>
          <button
            onClick={() => setActiveTab('cold_email')}
            className={`flex items-center gap-1.5 px-3 py-2 border-b-2 transition ${
              activeTab === 'cold_email'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Mail className="h-3.5 w-3.5" />
            <span>채용 문의 메일 양식</span>
          </button>
        </div>

        {/* Tab 1: STAR builder */}
        {activeTab === 'star_builder' && (
          <div className="space-y-3">
            <p className="text-xs text-slate-600 bg-slate-50 p-2 rounded-lg border border-slate-200">
              💡 지원자의 경험을 4개 항목으로 쪼개서 적은 후 챗봇에게 전송하면 매력적인 완성본으로 만들어 드립니다.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  1. 상황 (Situation)
                </label>
                <input
                  type="text"
                  placeholder="예: 4학년 1학기 캡스톤 프로젝트 진행 당시"
                  value={situation}
                  onChange={(e) => setSituation(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 p-2 text-xs focus:border-indigo-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  2. 과제 및 문제 (Task)
                </label>
                <input
                  type="text"
                  placeholder="예: 마감 2주 전 서버 트래픽 폭주로 응답 지연 발생"
                  value={task}
                  onChange={(e) => setTask(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 p-2 text-xs focus:border-indigo-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  3. 본인의 구체적 행동 (Action)
                </label>
                <input
                  type="text"
                  placeholder="예: 캐싱 전략 도입 및 DB 인덱싱을 직접 설계 적용함"
                  value={action}
                  onChange={(e) => setAction(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 p-2 text-xs focus:border-indigo-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  4. 정량적 성과 (Result)
                </label>
                <input
                  type="text"
                  placeholder="예: 응답 속도 45% 단축, 학과 최우수상 수상"
                  value={result}
                  onChange={(e) => setResult(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 p-2 text-xs focus:border-indigo-500 focus:outline-none"
                />
              </div>
            </div>

            <div className="pt-2 flex gap-2">
              <button
                onClick={() => handleCopy(combinedStarText)}
                className="flex-1 flex items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-white py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
              >
                {copied ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />}
                <span>{copied ? '복사됨' : '정리 내용 복사'}</span>
              </button>

              <button
                onClick={() => {
                  onSendToChat(combinedStarText);
                  onClose();
                }}
                className="flex-1 flex items-center justify-center gap-1.5 rounded-xl bg-indigo-600 py-2 text-xs font-semibold text-white hover:bg-indigo-700"
              >
                <Send className="h-3.5 w-3.5" />
                <span>AI 자소서 마스터에게 다듬기 요청</span>
              </button>
            </div>
          </div>
        )}

        {/* Tab 2: Intro builder */}
        {activeTab === 'intro_builder' && (
          <div className="space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  지원 직무
                </label>
                <input
                  type="text"
                  placeholder="예: 서비스 기획자, 데이터 엔지니어"
                  value={jobRole}
                  onChange={(e) => setJobRole(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 p-2 text-xs focus:border-indigo-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  나를 표현하는 한 줄 키워드
                </label>
                <input
                  type="text"
                  placeholder="예: 고객의 숨은 불편을 찾아내는 탐정"
                  value={keyword}
                  onChange={(e) => setKeyword(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 p-2 text-xs focus:border-indigo-500 focus:outline-none"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  가장 자랑하고 싶은 핵심 성과
                </label>
                <input
                  type="text"
                  placeholder="예: 쇼핑몰 웹앱 개발 프로젝트에서 결제 이탈률을 15% 개선한 경험"
                  value={bestAchievement}
                  onChange={(e) => setBestAchievement(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 p-2 text-xs focus:border-indigo-500 focus:outline-none"
                />
              </div>
            </div>

            {/* Preview Box */}
            <div className="rounded-xl border border-indigo-100 bg-indigo-50/30 p-3.5 text-xs text-slate-800 leading-relaxed">
              <span className="font-bold text-indigo-900 block mb-1">1분 자기소개 초안 미리보기:</span>
              <p className="whitespace-pre-wrap">{generatedIntro}</p>
            </div>

            <div className="pt-2 flex gap-2">
              <button
                onClick={() => handleCopy(generatedIntro)}
                className="flex-1 flex items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-white py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
              >
                {copied ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />}
                <span>{copied ? '복사됨' : '초안 복사'}</span>
              </button>

              <button
                onClick={() => {
                  onSendToChat(`[1분 자기소개 피드백 요청]\n${generatedIntro}\n\n이 1분 자기소개를 실제 면접장에서 더 호소력 있고 매끄럽게 들리도록 수정해주고, 면접관 관점의 꼬리질문 2개를 추천해줘!`);
                  onClose();
                }}
                className="flex-1 flex items-center justify-center gap-1.5 rounded-xl bg-indigo-600 py-2 text-xs font-semibold text-white hover:bg-indigo-700"
              >
                <Send className="h-3.5 w-3.5" />
                <span>AI 면접관에게 피드백 받기</span>
              </button>
            </div>
          </div>
        )}

        {/* Tab 3: Cold email */}
        {activeTab === 'cold_email' && (
          <div className="space-y-3">
            <p className="text-xs text-slate-600">
              커피챗 요청이나 수시 채용 문의 시 정중하고 명확한 비즈니스 메일 예시입니다.
            </p>
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-3.5 text-xs text-slate-800 leading-relaxed font-mono">
              <p className="font-bold text-slate-900 mb-1">[제목] [포지션명 지원 문의] OOO 지원자 입사 및 면담 문의의 건</p>
              <div className="mt-2 space-y-1.5 text-slate-700">
                <p>안녕하세요 채용 담당자님,</p>
                <p>귀사의 [기업명]에서 추진 중인 [비즈니스/제품] 성장에 깊은 인상을 받아 연락드리게 된 [지원자명]입니다.</p>
                <p>저는 [주요 역량/경험 1~2줄]을 보유하고 있으며, 귀사의 [채용 포지션]에 기여할 수 있는 기회를 희망하고 있습니다.</p>
                <p>바쁘시겠지만 짧은 티타임이나 포지션 지원 관련하여 조언을 구하고자 연락드립니다. 첨부된 이력서와 포트폴리오를 함께 검토해 주시면 감사하겠습니다.</p>
                <p>감사합니다.<br/>[지원자명] 드림</p>
              </div>
            </div>

            <button
              onClick={() => handleCopy(`[제목] [포지션명 지원 문의] OOO 지원자 입사 및 면담 문의의 건\n\n안녕하세요 채용 담당자님,\n귀사의 [기업명]에서 추진 중인 [비즈니스/제품] 성장에 깊은 인상을 받아 연락드리게 된 [지원자명]입니다.\n\n저는 [주요 역량/경험 1~2줄]을 보유하고 있으며, 귀사의 [채용 포지션]에 기여할 수 있는 기회를 희망하고 있습니다.\n\n바쁘시겠지만 짧은 티타임이나 포지션 지원 관련하여 조언을 구하고자 연락드립니다. 첨부된 이력서와 포트폴리오를 함께 검토해 주시면 감사하겠습니다.\n\n감사합니다.\n[지원자명] 드림`)}
              className="w-full flex items-center justify-center gap-1.5 rounded-xl bg-slate-900 py-2 text-xs font-semibold text-white hover:bg-slate-800"
            >
              {copied ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
              <span>{copied ? '메일 템플릿 복사됨' : '메일 양식 클립보드에 복사'}</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
