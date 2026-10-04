import React, { useState, useEffect } from 'react';
import { X, Play, Pause, RotateCcw, Volume2, Sparkles, Send } from 'lucide-react';

interface InterviewTimerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmitToChat: (question: string, answer: string) => void;
}

const PRACTICE_QUESTIONS = [
  '1분 동안 자기소개와 지원동기를 말씀해 주세요.',
  '지금까지 가장 큰 성취감을 느꼈던 프로젝트 경험은 무엇인가요?',
  '팀원과의 갈등이나 의견 충돌이 생겼을 때 어떻게 해결하셨나요?',
  '우리 회사와 지원 직무를 선택한 결정적인 이유는 무엇인가요?',
  '살면서 가장 뼈아픈 실패 경험과 이를 통해 배운 점은 무엇인가요?',
];

export const InterviewTimerModal: React.FC<InterviewTimerModalProps> = ({
  isOpen,
  onClose,
  onSubmitToChat,
}) => {
  const [selectedDuration, setSelectedDuration] = useState<number>(60);
  const [timeLeft, setTimeLeft] = useState<number>(60);
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [currentQuestion, setCurrentQuestion] = useState<string>(PRACTICE_QUESTIONS[0]);
  const [userSpokenNotes, setUserSpokenNotes] = useState<string>('');

  useEffect(() => {
    setTimeLeft(selectedDuration);
    setIsRunning(false);
  }, [selectedDuration]);

  useEffect(() => {
    let interval: any = null;
    if (isRunning && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);
    } else if (timeLeft === 0 && isRunning) {
      setIsRunning(false);
      // Play ding chime
      try {
        const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.frequency.value = 587.33; // D5
        gain.gain.setValueAtTime(0.15, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.8);
        osc.start();
        osc.stop(audioCtx.currentTime + 0.8);
      } catch (e) {
        // audio context fail-safe
      }
    }
    return () => clearInterval(interval);
  }, [isRunning, timeLeft]);

  if (!isOpen) return null;

  const progressPercentage = ((selectedDuration - timeLeft) / selectedDuration) * 100;
  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  const formattedTime = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;

  const handleSelectRandomQuestion = () => {
    const nextQ =
      PRACTICE_QUESTIONS[Math.floor(Math.random() * PRACTICE_QUESTIONS.length)];
    setCurrentQuestion(nextQ);
  };

  const handleSendToChatbot = () => {
    if (!userSpokenNotes.trim()) {
      alert('연습한 답변 요약이나 키워드를 적어주시면 면접관 챗봇이 정밀 피드백해 드립니다.');
      return;
    }
    onSubmitToChat(
      `[실전 모의면접 질문]\n${currentQuestion}`,
      `[지원자 실전 답변]\n${userSpokenNotes.trim()}`
    );
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-xs">
      <div className="relative w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl ring-1 ring-slate-200">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute right-4 top-4 rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Modal Header */}
        <div className="mb-4">
          <span className="text-xs font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-100">
            실전 모의면접 도구
          </span>
          <h3 className="mt-1 text-lg font-bold text-slate-900">
            1분 실전 면접 스피치 타이머
          </h3>
          <p className="text-xs text-slate-500">
            실제 면접관 앞이라 생각하고 정해진 시간 안에 두괄식으로 간결하게 말하는 훈련을 해보세요.
          </p>
        </div>

        {/* Duration Select */}
        <div className="flex gap-2 mb-5">
          {[
            { label: '60초 (1분 자기소개)', val: 60 },
            { label: '90초 (STAR 경험 설명)', val: 90 },
            { label: '120초 (심화 직무 답변)', val: 120 },
          ].map((d) => (
            <button
              key={d.val}
              onClick={() => setSelectedDuration(d.val)}
              className={`flex-1 rounded-lg py-1.5 text-xs font-semibold transition ${
                selectedDuration === d.val
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {d.label}
            </button>
          ))}
        </div>

        {/* Question Card */}
        <div className="rounded-xl border border-slate-200 bg-slate-50/80 p-3.5 mb-5">
          <div className="flex items-center justify-between text-[11px] font-semibold text-slate-500 mb-1">
            <span>연습 면접 질문</span>
            <button
              onClick={handleSelectRandomQuestion}
              className="flex items-center gap-1 text-indigo-600 hover:text-indigo-800"
            >
              <Sparkles className="h-3 w-3" />
              <span>다른 질문 뽑기</span>
            </button>
          </div>
          <p className="text-sm font-semibold text-slate-800">{currentQuestion}</p>
        </div>

        {/* Timer Display */}
        <div className="flex flex-col items-center justify-center my-4">
          <div className="relative flex h-36 w-36 items-center justify-center rounded-full border-4 border-slate-100 bg-slate-50 shadow-inner">
            {/* Simple progress ring simulation */}
            <div
              className="absolute inset-0 rounded-full border-4 border-emerald-500 transition-all duration-1000"
              style={{
                clipPath: `polygon(50% 50%, -50% -50%, ${progressPercentage}% -50%, ${progressPercentage}% ${progressPercentage}%, -50% ${progressPercentage}%)`,
              }}
            />
            <div className="z-10 text-center">
              <span
                className={`font-mono text-3xl font-extrabold tabular-nums tracking-tight ${
                  timeLeft <= 10 && timeLeft > 0
                    ? 'text-rose-600 animate-pulse'
                    : 'text-slate-800'
                }`}
              >
                {formattedTime}
              </span>
              <p className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">
                {isRunning ? '답변 진행 중' : timeLeft === 0 ? '시간 종료!' : '준비 완료'}
              </p>
            </div>
          </div>

          {/* Timer Controls */}
          <div className="mt-4 flex items-center gap-3">
            <button
              onClick={() => setIsRunning(!isRunning)}
              className={`flex items-center gap-1.5 rounded-xl px-5 py-2 text-xs font-semibold text-white shadow-md transition ${
                isRunning
                  ? 'bg-amber-600 hover:bg-amber-700'
                  : 'bg-emerald-600 hover:bg-emerald-700'
              }`}
            >
              {isRunning ? (
                <>
                  <Pause className="h-4 w-4" /> 일시정지
                </>
              ) : (
                <>
                  <Play className="h-4 w-4" /> 타이머 시작
                </>
              )}
            </button>
            <button
              onClick={() => {
                setIsRunning(false);
                setTimeLeft(selectedDuration);
              }}
              className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-medium text-slate-600 hover:bg-slate-50"
            >
              <RotateCcw className="h-4 w-4" /> 초기화
            </button>
          </div>
        </div>

        {/* Pacing Advice */}
        <div className="rounded-lg bg-emerald-50/60 p-2.5 text-[11px] text-emerald-800 border border-emerald-100 mb-4">
          <strong>💡 60초 답변 황금 비율:</strong>
          <span className="ml-1">
            첫 15초(두괄식 핵심 결론) → 15~45초(구체적 행동과 수치 성과) → 마지막 15초(입사 후 적용점)
          </span>
        </div>

        {/* User notes / speech text box to send to chat */}
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-slate-700">
            방금 연습한 답변을 적어주시면 AI 모의면접관이 즉시 첨삭해 드립니다:
          </label>
          <textarea
            value={userSpokenNotes}
            onChange={(e) => setUserSpokenNotes(e.target.value)}
            placeholder="예: 안녕하십니까, 데이터로 비즈니스를 견인하는 마케터 OOO입니다. 지난 인턴십 당시 CTR을 24% 개선하며..."
            rows={2}
            className="w-full rounded-xl border border-slate-200 p-2.5 text-xs text-slate-800 placeholder:text-slate-400 focus:border-indigo-500 focus:outline-none"
          />
          <button
            onClick={handleSendToChatbot}
            disabled={!userSpokenNotes.trim()}
            className="flex w-full items-center justify-center gap-1.5 rounded-xl bg-slate-900 py-2 text-xs font-semibold text-white transition hover:bg-slate-800 disabled:opacity-50"
          >
            <Send className="h-3.5 w-3.5" />
            <span>AI 모의면접관에게 전송하고 피드백 받기</span>
          </button>
        </div>
      </div>
    </div>
  );
};
