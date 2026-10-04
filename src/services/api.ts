import { ChatSession } from '../types';

/**
 * Backend Data Persistence Service
 * Interacts with /api/sessions, /api/resumes, /api/predictions on the Express server.
 */

/* ================= Chat Sessions ================= */

export async function fetchServerSessions(): Promise<ChatSession[]> {
  try {
    const res = await fetch('/api/sessions');
    if (!res.ok) throw new Error('Failed to fetch sessions from server');
    const data = await res.json();
    return Array.isArray(data) ? data : [];
  } catch (err) {
    console.warn('Backend fetch failed, falling back to local storage:', err);
    const local = localStorage.getItem('jobmate_sessions_v1');
    return local ? JSON.parse(local) : [];
  }
}

export async function syncSessionToServer(session: ChatSession): Promise<void> {
  // Update local storage immediately for fast local cache
  try {
    const local = localStorage.getItem('jobmate_sessions_v1');
    const list: ChatSession[] = local ? JSON.parse(local) : [];
    const idx = list.findIndex((s) => s.id === session.id);
    if (idx >= 0) {
      list[idx] = session;
    } else {
      list.unshift(session);
    }
    localStorage.setItem('jobmate_sessions_v1', JSON.stringify(list));
  } catch (e) {
    console.error('Local cache error:', e);
  }

  // Persist to backend server
  try {
    await fetch(`/api/sessions/${session.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(session),
    });
  } catch (err) {
    console.error('Failed to sync session to backend:', err);
  }
}

export async function createSessionOnServer(session: ChatSession): Promise<void> {
  try {
    await fetch('/api/sessions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(session),
    });
  } catch (err) {
    console.error('Failed to create session on backend:', err);
  }
}

export async function deleteSessionOnServer(id: string): Promise<void> {
  try {
    await fetch(`/api/sessions/${id}`, {
      method: 'DELETE',
    });
  } catch (err) {
    console.error('Failed to delete session on backend:', err);
  }
}

/* ================= Saved Resumes & CVs (서버 보관함) ================= */

export interface SavedDocItem {
  id: string;
  type: 'cover_letter' | 'resume_cv';
  title: string;
  targetCompany?: string;
  jobRole?: string;
  originalText: string;
  analysisResult: any;
  createdAt: number;
}

export async function fetchSavedDocs(): Promise<SavedDocItem[]> {
  try {
    const res = await fetch('/api/resumes');
    if (!res.ok) throw new Error('Failed to fetch resumes');
    return await res.json();
  } catch (err) {
    console.error('Error fetching resumes:', err);
    return [];
  }
}

export async function saveDocToServer(item: Omit<SavedDocItem, 'id' | 'createdAt'>): Promise<SavedDocItem> {
  const res = await fetch('/api/resumes', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(item),
  });
  if (!res.ok) throw new Error('서류 저장에 실패했습니다.');
  return await res.json();
}

export async function deleteDocFromServer(id: string): Promise<void> {
  const res = await fetch(`/api/resumes/${id}`, {
    method: 'DELETE',
  });
  if (!res.ok) throw new Error('서류 삭제에 실패했습니다.');
}

/* ================= Saved Pass Rate Predictions (합격 진단 기록) ================= */

export interface SavedPredictionItem {
  id: string;
  targetCompany: string;
  jobRole: string;
  passProbability: number;
  tierRating: string;
  overallAssessment: string;
  resultData: any;
  createdAt: number;
}

export async function fetchSavedPredictions(): Promise<SavedPredictionItem[]> {
  try {
    const res = await fetch('/api/predictions');
    if (!res.ok) throw new Error('Failed to fetch predictions');
    return await res.json();
  } catch (err) {
    console.error('Error fetching predictions:', err);
    return [];
  }
}

export async function savePredictionToServer(item: Omit<SavedPredictionItem, 'id' | 'createdAt'>): Promise<SavedPredictionItem> {
  const res = await fetch('/api/predictions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(item),
  });
  if (!res.ok) throw new Error('진단 기록 저장에 실패했습니다.');
  return await res.json();
}

export async function deletePredictionFromServer(id: string): Promise<void> {
  const res = await fetch(`/api/predictions/${id}`, {
    method: 'DELETE',
  });
  if (!res.ok) throw new Error('진단 기록 삭제에 실패했습니다.');
}
