import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DATA_DIR = path.resolve(__dirname, '..', 'data');
const DB_FILE = path.join(DATA_DIR, 'db.json');

export interface ServerDatabase {
  sessions: any[];
  resumes: any[];
  predictions: any[];
}

const DEFAULT_DB: ServerDatabase = {
  sessions: [
    {
      id: 'session_welcome_default',
      title: '자소서 마스터 첫 대화',
      personaId: 'resume_doctor',
      createdAt: Date.now(),
      updatedAt: Date.now(),
      messages: [
        {
          id: 'msg_welcome_init',
          role: 'model',
          content: `안녕하세요! 취뽀메이트 **자소서 마스터** 코치입니다. 🎯\n\n수천 장의 서류를 검토한 인사담당자 관점에서 밋밋한 문장을 흡입력 있는 비즈니스 언어로 다듬어 드립니다.\n\n궁금한 점이나 첨삭이 필요한 자기소개서 문항, 혹은 실전 모의면접 답변을 편하게 말씀해 주세요! (모든 대화와 첨삭 기록은 백엔드 서버에 안전하게 영구 저장됩니다.)`,
          timestamp: Date.now(),
          personaId: 'resume_doctor',
          modelUsed: 'gemini-3.8-flash',
        },
      ],
    },
  ],
  resumes: [],
  predictions: [],
};

// In-memory cache for fast reads
let dbCache: ServerDatabase | null = null;
let writeQueue = Promise.resolve();

async function initDB(): Promise<void> {
  try {
    await fs.mkdir(DATA_DIR, { recursive: true });
    try {
      const data = await fs.readFile(DB_FILE, 'utf-8');
      dbCache = JSON.parse(data);
    } catch {
      // File doesn't exist or is empty, write default
      dbCache = { ...DEFAULT_DB };
      await fs.writeFile(DB_FILE, JSON.stringify(dbCache, null, 2), 'utf-8');
    }
  } catch (err) {
    console.error('Failed to initialize server database:', err);
    dbCache = { ...DEFAULT_DB };
  }
}

async function persistDB(): Promise<void> {
  if (!dbCache) return;
  const dataToWrite = JSON.stringify(dbCache, null, 2);
  const tempFile = `${DB_FILE}.tmp.${Date.now()}`;

  // Queue writes sequentially to prevent race conditions
  writeQueue = writeQueue.then(async () => {
    try {
      await fs.writeFile(tempFile, dataToWrite, 'utf-8');
      await fs.rename(tempFile, DB_FILE);
    } catch (err) {
      console.error('Failed to persist database file:', err);
    }
  });

  return writeQueue;
}

export async function getDatabase(): Promise<ServerDatabase> {
  if (!dbCache) {
    await initDB();
  }
  return dbCache!;
}

/* ================= Chat Sessions API ================= */
export async function getAllSessions(): Promise<any[]> {
  const db = await getDatabase();
  return [...db.sessions].sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0));
}

export async function getSessionById(id: string): Promise<any | null> {
  const db = await getDatabase();
  return db.sessions.find((s) => s.id === id) || null;
}

export async function saveSession(session: any): Promise<any> {
  const db = await getDatabase();
  const index = db.sessions.findIndex((s) => s.id === session.id);
  const updatedSession = {
    ...session,
    updatedAt: Date.now(),
  };

  if (index >= 0) {
    db.sessions[index] = updatedSession;
  } else {
    db.sessions.unshift(updatedSession);
  }

  await persistDB();
  return updatedSession;
}

export async function deleteSession(id: string): Promise<boolean> {
  const db = await getDatabase();
  const prevLength = db.sessions.length;
  db.sessions = db.sessions.filter((s) => s.id !== id);

  if (db.sessions.length < prevLength) {
    await persistDB();
    return true;
  }
  return false;
}

/* ================= Saved Resumes & CVs API ================= */
export async function getAllResumes(): Promise<any[]> {
  const db = await getDatabase();
  return [...db.resumes].sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
}

export async function saveResume(resumeItem: any): Promise<any> {
  const db = await getDatabase();
  const newItem = {
    id: resumeItem.id || `resume_${Date.now()}`,
    ...resumeItem,
    createdAt: resumeItem.createdAt || Date.now(),
    updatedAt: Date.now(),
  };

  const index = db.resumes.findIndex((r) => r.id === newItem.id);
  if (index >= 0) {
    db.resumes[index] = newItem;
  } else {
    db.resumes.unshift(newItem);
  }

  await persistDB();
  return newItem;
}

export async function deleteResume(id: string): Promise<boolean> {
  const db = await getDatabase();
  const prevLength = db.resumes.length;
  db.resumes = db.resumes.filter((r) => r.id !== id);

  if (db.resumes.length < prevLength) {
    await persistDB();
    return true;
  }
  return false;
}

/* ================= Saved Pass Rate Predictions API ================= */
export async function getAllPredictions(): Promise<any[]> {
  const db = await getDatabase();
  return [...db.predictions].sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
}

export async function savePrediction(predItem: any): Promise<any> {
  const db = await getDatabase();
  const newItem = {
    id: predItem.id || `pred_${Date.now()}`,
    ...predItem,
    createdAt: predItem.createdAt || Date.now(),
  };

  db.predictions.unshift(newItem);
  await persistDB();
  return newItem;
}

export async function deletePrediction(id: string): Promise<boolean> {
  const db = await getDatabase();
  const prevLength = db.predictions.length;
  db.predictions = db.predictions.filter((p) => p.id !== id);

  if (db.predictions.length < prevLength) {
    await persistDB();
    return true;
  }
  return false;
}
