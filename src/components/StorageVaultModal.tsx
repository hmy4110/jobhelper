import React, { useState, useEffect } from 'react';
import {
  X,
  Database,
  Trash2,
  FileText,
  FileCheck2,
  Target,
  Clock,
  Send,
  Loader2,
  ArrowRight,
  ExternalLink,
} from 'lucide-react';
import {
  fetchSavedDocs,
  deleteDocFromServer,
  fetchSavedPredictions,
  deletePredictionFromServer,
  SavedDocItem,
  SavedPredictionItem,
} from '../services/api';

interface StorageVaultModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSendToChat: (message: string) => void;
}

export const StorageVaultModal: React.FC<StorageVaultModalProps> = ({
  isOpen,
  onClose,
  onSendToChat,
}) => {
  const [activeTab, setActiveTab] = useState<'docs' | 'predictions'>('docs');
  const [docs, setDocs] = useState<SavedDocItem[]>([]);
  const [predictions, setPredictions] = useState<SavedPredictionItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedDoc, setSelectedDoc] = useState<SavedDocItem | null>(null);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [docList, predList] = await Promise.all([
        fetchSavedDocs(),
        fetchSavedPredictions(),
      ]);
      setDocs(docList);
      setPredictions(predList);
    } catch (e) {
      console.error('Error loading vault data:', e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadData();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleDeleteDoc = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!window.confirm('이 서류를 서버에서 삭제하시겠습니까?')) return;
    try {
      await deleteDocFromServer(id);
      setDocs((prev) => prev.filter((d) => d.id !== id));
      if (selectedDoc?.id === id) setSelectedDoc(null);
    } catch (err: any) {
      alert(err.message || '삭제 실패');
    }
  };

  const handleDeletePrediction = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!window.confirm('이 진단 기록을 서버에서 삭제하시겠습니까?')) return;
    try {
      await deletePredictionFromServer(id);
      setPredictions((prev) => prev.filter((p) => p.id !== id));
    } catch (err: any) {
      alert(err.message || '삭제 실패');
    }
  };

  const handleSendDocToChat = (doc: SavedDocItem) => {
    const msg = `
[서버 보관함 서류 불러오기]
- 제목: ${doc.title}
- 기업/직무: ${doc.targetCompany || '미지정'} / ${doc.jobRole || '미지정'}
- 내용:
${doc.originalText}

이 서류를 기반으로 추가 질문이나 면접 대비를 이어나가고 싶어!
`.trim();
    onSendToChat(msg);
    onClose();
  };

  const handleSendPredToChat = (pred: SavedPredictionItem) => {
    const msg = `
[서버 보관함 합격 진단 기록 불러오기]
- 목표 기업/직무: ${pred.targetCompany} / ${pred.jobRole}
- 합격 예상 확률: ${pred.passProbability}% (${pred.tierRating})
- 진단 소견: "${pred.overallAssessment}"

이 진단 결과를 바탕으로 단기 합격률 향상 전략을 집중 상담해줘!
`.trim();
    onSendToChat(msg);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-xs overflow-y-auto">
      <div className="relative w-full max-w-3xl rounded-2xl bg-white p-6 shadow-2xl ring-1 ring-slate-200 my-6 max-h-[90vh] flex flex-col">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute right-4 top-4 rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Header */}
        <div className="mb-4">
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-100 flex items-center gap-1">
              <Database className="h-3.5 w-3.5 text-emerald-600" />
              <span>백엔드 데이터베이스 실시간 연동</span>
            </span>
            <span className="text-xs text-slate-400">· Node.js Express Server</span>
          </div>
          <h3 className="mt-1 text-xl font-bold text-slate-900">
            내 취업 서류 & 합격 진단 서버 보관함
          </h3>
          <p className="text-xs text-slate-500">
            백엔드 서버에 안전하게 저장된 자기소개서, 이력서, 합격 가능성 진단 이력을 언제든 다시 열람하고 챗봇 코치와 이어갈 수 있습니다.
          </p>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-slate-200 mb-4 text-xs font-semibold">
          <button
            onClick={() => setActiveTab('docs')}
            className={`flex items-center gap-1.5 px-3 py-2 border-b-2 transition ${
              activeTab === 'docs'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <FileText className="h-3.5 w-3.5" />
            <span>저장된 자소서·이력서 ({docs.length})</span>
          </button>
          <button
            onClick={() => setActiveTab('predictions')}
            className={`flex items-center gap-1.5 px-3 py-2 border-b-2 transition ${
              activeTab === 'predictions'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Target className="h-3.5 w-3.5" />
            <span>합격 가능성 진단 기록 ({predictions.length})</span>
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto pr-1">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-16 text-slate-400">
              <Loader2 className="h-8 w-8 animate-spin text-indigo-600 mb-2" />
              <p className="text-xs">백엔드 서버 데이터베이스에서 불러오는 중...</p>
            </div>
          ) : activeTab === 'docs' ? (
            docs.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-slate-200 p-12 text-center text-slate-400">
                <FileText className="mx-auto h-8 w-8 text-slate-300 mb-2" />
                <p className="text-xs font-semibold text-slate-600">
                  서버에 저장된 자소서나 이력서가 없습니다.
                </p>
                <p className="text-[11px] mt-1">
                  자소서 진단이나 이력서 첨삭 창에서 '서버에 저장' 버튼을 누르면 여기에 영구 보관됩니다.
                </p>
              </div>
            ) : (
              <div className="space-y-2.5">
                {docs.map((doc) => (
                  <div
                    key={doc.id}
                    className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white p-3.5 transition hover:border-indigo-300 hover:shadow-xs"
                  >
                    <div className="space-y-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="rounded bg-indigo-50 px-1.5 py-0.5 text-[10px] font-semibold text-indigo-700">
                          {doc.type === 'cover_letter' ? '자기소개서' : '이력서·CV'}
                        </span>
                        <h4 className="text-xs font-bold text-slate-900 truncate">
                          {doc.title}
                        </h4>
                      </div>
                      <p className="text-[11px] text-slate-500 truncate">
                        {doc.targetCompany && `기업: ${doc.targetCompany} · `}
                        {doc.jobRole && `직무: ${doc.jobRole} · `}
                        <span className="tabular-nums">
                          {new Date(doc.createdAt).toLocaleDateString('ko-KR')}
                        </span>
                      </p>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        onClick={() => handleSendDocToChat(doc)}
                        className="flex items-center gap-1 rounded-lg bg-indigo-50 px-2.5 py-1.5 text-xs font-semibold text-indigo-700 hover:bg-indigo-100 transition"
                      >
                        <Send className="h-3 w-3" />
                        <span>채팅으로 열기</span>
                      </button>
                      <button
                        onClick={(e) => handleDeleteDoc(doc.id, e)}
                        className="rounded-lg p-1.5 text-slate-400 hover:bg-rose-50 hover:text-rose-600 transition"
                        title="서버에서 삭제"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )
          ) : predictions.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-200 p-12 text-center text-slate-400">
              <Target className="mx-auto h-8 w-8 text-slate-300 mb-2" />
              <p className="text-xs font-semibold text-slate-600">
                서버에 저장된 합격 가능성 진단 기록이 없습니다.
              </p>
              <p className="text-[11px] mt-1">
                상단의 '합격 가능성' 메뉴에서 진단 후 '서버에 저장'을 눌러보세요.
              </p>
            </div>
          ) : (
            <div className="space-y-2.5">
              {predictions.map((pred) => (
                <div
                  key={pred.id}
                  className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white p-3.5 transition hover:border-rose-300 hover:shadow-xs"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-slate-900 text-rose-400 font-mono font-black text-sm">
                      {pred.passProbability}%
                    </div>
                    <div className="space-y-0.5 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-bold text-slate-900 truncate">
                          {pred.targetCompany} · {pred.jobRole}
                        </span>
                        <span className="rounded bg-rose-50 border border-rose-200 px-1.5 py-0.2 text-[10px] font-semibold text-rose-700">
                          {pred.tierRating}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 truncate max-w-md">
                        "{pred.overallAssessment}"
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => handleSendPredToChat(pred)}
                      className="flex items-center gap-1 rounded-lg bg-slate-900 px-2.5 py-1.5 text-xs font-semibold text-white hover:bg-slate-800 transition"
                    >
                      <Send className="h-3 w-3" />
                      <span>보완 상담하기</span>
                    </button>
                    <button
                      onClick={(e) => handleDeletePrediction(pred.id, e)}
                      className="rounded-lg p-1.5 text-slate-400 hover:bg-rose-50 hover:text-rose-600 transition"
                      title="서버에서 삭제"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
