import express from 'express';
import type { Request, Response } from 'express';
import { createServer as createViteServer } from 'vite';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI, Type } from '@google/genai';
import {
  getAllSessions,
  saveSession,
  deleteSession as removeSession,
  getAllResumes,
  saveResume,
  deleteResume as removeResume,
  getAllPredictions,
  savePrediction,
  deletePrediction as removePrediction,
} from './server/db.ts';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;
  const isProd = process.env.NODE_ENV === 'production';

  app.use(express.json({ limit: '10mb' }));

  // Helper to get GoogleGenAI client
  const getAIClient = () => {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error('GEMINI_API_KEY is not configured in environment variables.');
    }
    return new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  };

  // Supported model mapping with safe fallback
  const sanitizeModel = (requestedModel?: string) => {
    const validModels = [
      'gemini-3.8-flash',
      'gemini-3.1-flash-lite',
      'gemini-3.5-flash',
      'gemini-3.1-pro-preview',
    ];
    if (requestedModel && validModels.includes(requestedModel)) {
      return requestedModel;
    }
    return 'gemini-3.8-flash';
  };

  // 1. Streaming Multi-Turn Chat Endpoint
  app.post('/api/chat', async (req: Request, res: Response) => {
    try {
      const {
        messages = [],
        systemInstruction = 'You are a warm, highly skilled, and professional career mentor for Korean job seekers (취준생).',
        model = 'gemini-3.8-flash',
        temperature = 0.7,
      } = req.body;

      if (!Array.isArray(messages) || messages.length === 0) {
        return res.status(400).json({ error: '대화 메시지 목록이 비어있습니다.' });
      }

      const ai = getAIClient();
      const modelName = sanitizeModel(model);

      // Convert messages to GenAI format
      const formattedContents = messages.map((m: { role: string; content: string }) => ({
        role: m.role === 'model' || m.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: m.content || '' }],
      }));

      // Set up SSE
      res.setHeader('Content-Type', 'text/event-stream');
      res.setHeader('Cache-Control', 'no-cache, no-transform');
      res.setHeader('Connection', 'keep-alive');

      const responseStream = await ai.models.generateContentStream({
        model: modelName,
        contents: formattedContents,
        config: {
          systemInstruction,
          temperature,
        },
      });

      for await (const chunk of responseStream) {
        const text = chunk.text;
        if (text) {
          res.write(`data: ${JSON.stringify({ text })}\n\n`);
        }
      }

      res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
      res.end();
    } catch (error: any) {
      console.error('Chat API Error:', error);
      const errorMessage =
        error?.message || 'Gemini API 호출 중 문제가 발생했습니다. 잠시 후 다시 시도해 주세요.';
      
      if (!res.headersSent) {
        return res.status(500).json({ error: errorMessage });
      } else {
        res.write(`data: ${JSON.stringify({ error: errorMessage })}\n\n`);
        res.end();
      }
    }
  });

  // 2. Structured Resume & Cover Letter Deep Diagnosis
  app.post('/api/analyze-resume', async (req: Request, res: Response) => {
    try {
      const { resumeText, jobRole, companyName } = req.body;

      if (!resumeText || typeof resumeText !== 'string' || !resumeText.trim()) {
        return res.status(400).json({ error: '분석할 자기소개서 내용이 필요합니다.' });
      }

      const ai = getAIClient();
      const prompt = `
당신은 대기업 및 유니콘 스타트업 채용을 담당한 15년 차 최고의 인사총괄 채용 전문가입니다.
다음 취준생의 자기소개서를 철저하고 애정 어린 시선으로 심층 진단하고, 구체적 수치와 STAR(Situation, Task, Action, Result) 원칙에 입각하여 리라이팅안을 제공해주세요.

[지원 목표]
- 희망 기업: ${companyName || '미지정 (범용 지원)'}
- 희망 직무: ${jobRole || '미지정'}

[자기소개서 원문]
${resumeText}
`;

      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: prompt,
        config: {
          systemInstruction:
            '취업준비생의 자기소개서를 평가하고 STAR 기법을 반영하여 명확하고 실질적인 피드백을 JSON 규격에 맞추어 출력하세요.',
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              overallScore: {
                type: Type.INTEGER,
                description: '100점 만점 기준 완성도 점수 (예: 78)',
              },
              oneLineVerdict: {
                type: Type.STRING,
                description: '인사담당자 관점의 솔직한 한 줄 총평',
              },
              strengths: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
                description: '돋보이는 핵심 강점 2~3가지',
              },
              weaknesses: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
                description: '보완이 시급한 약점 및 진부한 표현 2~3가지',
              },
              starRevision: {
                type: Type.OBJECT,
                properties: {
                  situation: { type: Type.STRING, description: '상황 (배경)' },
                  task: { type: Type.STRING, description: '과제 (직면한 문제/목표)' },
                  action: { type: Type.STRING, description: '행동 (본인이 주도한 구체적 액션)' },
                  result: { type: Type.STRING, description: '결과 (수치화된 성과 및 배운 점)' },
                  fullRewrittenText: {
                    type: Type.STRING,
                    description: '두괄식으로 완벽히 다듬은 완성형 자소서 수정본',
                  },
                },
                required: ['situation', 'task', 'action', 'result', 'fullRewrittenText'],
              },
              interviewQuestions: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    question: { type: Type.STRING, description: '예상 면접 질문' },
                    intent: { type: Type.STRING, description: '면접관의 질문 의도' },
                    answerTip: { type: Type.STRING, description: '추천 답변 가이드' },
                  },
                  required: ['question', 'intent', 'answerTip'],
                },
                description: '이 자소서에서 파생될 수 있는 예상 면접 질문 3가지',
              },
            },
            required: [
              'overallScore',
              'oneLineVerdict',
              'strengths',
              'weaknesses',
              'starRevision',
              'interviewQuestions',
            ],
          },
        },
      });

      const parsed = JSON.parse(response.text || '{}');
      return res.json(parsed);
    } catch (error: any) {
      console.error('Analyze Resume Error:', error);
      return res.status(500).json({
        error: error?.message || '자소서 분석 중 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.',
      });
    }
  });

  // 2.1 Structured Resume / CV (이력서·경력기술서) Deep Proofreading & Refactoring
  app.post('/api/analyze-cv', async (req: Request, res: Response) => {
    try {
      const { cvText, jobRole, careerLevel, targetCompany } = req.body;

      if (!cvText || typeof cvText !== 'string' || !cvText.trim()) {
        return res.status(400).json({ error: '첨삭할 이력서 본문 내용이 필요합니다.' });
      }

      const ai = getAIClient();
      const prompt = `
당신은 실리콘밸리 글로벌 테크 기업 및 국내 유니콘·대기업 채용을 이끌어온 15년 차 '이력서·경력기술서 전문 헤드헌터이자 채용 총괄자'입니다.
지원자가 제출한 이력서(CV/경력기술서)를 정밀 진단하고 다음 원칙에 따라 날카롭고 실질적인 첨삭을 제공하세요:

[지원자 기본 정보]
- 목표 직무: ${jobRole || '신입/미지정'}
- 경력 구분: ${careerLevel || '신입'}
- 목표 기업/산업: ${targetCompany || '일반 기업'}

[첨삭 핵심 가이드라인]
1. 불렛포인트(Bullet point) X-Y-Z 공식 엄격 적용:
   - "Accomplished [X] as measured by [Y], by doing [Z]"
   - '무엇을 담당했습니다' 식의 수동적 업무 나열 금지. 본인이 주도한 해결책과 구체적 정량 지표(%, 배수, 시간 단축, 비용 절감 등)를 명확히 삽입하여 재작성.
2. 3초 헤드라인 최적화:
   - 인사담당자가 첫 3초 만에 스크롤을 멈출 수 있는 매력적이고 전문적인 비즈니스 한 줄 요약문 제공.
3. ATS(채용관리시스템) 및 직무 키워드 진단:
   - 해당 직무에 필수적인 핵심 기술 키워드 및 누락된 역량 제안, 불필요하게 모호한 기술 표기 필터링.
4. 완성형 이력서 리라이팅:
   - 지원자가 그대로 복사해서 노션, 사람인, 원티드 이력서에 붙여넣을 수 있는 깔끔한 마크다운 완성본 출력.

[이력서 원문]
${cvText}
`;

      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: prompt,
        config: {
          systemInstruction:
            '이력서 및 경력기술서를 객관적이고 성과 중심적으로 심층 첨삭하여 JSON 규격에 맞게 반환하세요.',
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              overallScore: {
                type: Type.INTEGER,
                description: '100점 만점 기준 이력서 완성도 점수',
              },
              summaryVerdict: {
                type: Type.STRING,
                description: '채용담당자 관점의 솔직한 이력서 총평 (2~3문장)',
              },
              headlineCritique: {
                type: Type.OBJECT,
                properties: {
                  before: { type: Type.STRING, description: '기존 한줄 소개 or 추정 소개' },
                  after: { type: Type.STRING, description: '매력적인 비즈니스 프로필 헤드라인 추천안' },
                  advice: { type: Type.STRING, description: '헤드라인 개선 코멘트' },
                },
                required: ['before', 'after', 'advice'],
              },
              bulletImprovements: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    original: { type: Type.STRING, description: '기존의 밋밋한 업무 나열 문장' },
                    improved: { type: Type.STRING, description: 'X-Y-Z 공식과 액션버브로 수치화된 개선 문장' },
                    keyChange: { type: Type.STRING, description: '수정 핵심 이유 및 강조 포인트' },
                  },
                  required: ['original', 'improved', 'keyChange'],
                },
                description: '수정이 시급한 주요 프로젝트/경력 불렛포인트 3~5개 교정 전후',
              },
              skillsEvaluation: {
                type: Type.OBJECT,
                properties: {
                  recommendedKeywords: {
                    type: Type.ARRAY,
                    items: { type: Type.STRING },
                    description: '직무 매칭 및 ATS 통과를 위해 반드시 추가해야 할 추천 키워드',
                  },
                  redundantOrVague: {
                    type: Type.ARRAY,
                    items: { type: Type.STRING },
                    description: '모호하거나 단순 툴 나열이라 개선해야 할 항목',
                  },
                },
                required: ['recommendedKeywords', 'redundantOrVague'],
              },
              checklist: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    category: { type: Type.STRING, description: '평가 항목 (예: 정량적 수치화, 액션버브, 가독성, 키워드 적합도)' },
                    passed: { type: Type.BOOLEAN, description: '통과 여부' },
                    comment: { type: Type.STRING, description: '세부 평가 코멘트' },
                  },
                  required: ['category', 'passed', 'comment'],
                },
                description: '이력서 핵심 4대 체크리스트 평가',
              },
              fullRefactoredCV: {
                type: Type.STRING,
                description: '즉시 복사하여 쓸 수 있도록 마크다운으로 완벽하게 구조화된 이력서 재작성본',
              },
            },
            required: [
              'overallScore',
              'summaryVerdict',
              'headlineCritique',
              'bulletImprovements',
              'skillsEvaluation',
              'checklist',
              'fullRefactoredCV',
            ],
          },
        },
      });

      const parsed = JSON.parse(response.text || '{}');
      return res.json(parsed);
    } catch (error: any) {
      console.error('Analyze CV Error:', error);
      return res.status(500).json({
        error: error?.message || '이력서 첨삭 중 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.',
      });
    }
  });

  // 2.2 Realistic Hiring Pass Probability & Fit Prediction
  app.post('/api/predict-pass-rate', async (req: Request, res: Response) => {
    try {
      const {
        targetCompany,
        companyType,
        jobRole,
        applicantSpecs,
        portfolioOrResume,
        jobRequirements,
      } = req.body;

      if (!targetCompany || !jobRole) {
        return res.status(400).json({ error: '목표 기업명과 희망 직무가 필요합니다.' });
      }

      if (!applicantSpecs && !portfolioOrResume) {
        return res.status(400).json({ error: '지원자의 스펙 또는 이력/경험 정보가 필요합니다.' });
      }

      const ai = getAIClient();
      const prompt = `
당신은 대한민국 10대 대기업 및 주요 IT 테크 유니콘 채용 심사위원이자 취업 데이터 분석 전문가입니다.
지원자의 정량적 스펙, 프로젝트/경력 경험, 목표 기업 및 직무를 대한민국 취업 시장의 최근 합격자 데이터베이스 기준으로 엄격하고 객관적으로 교차 분석하여 합격 가능성을 정밀 진단하세요.

[목표 기업 및 포지션]
- 목표 기업: ${targetCompany} (${companyType || '일반 기업'})
- 목표 직무: ${jobRole}
- 공고 필수/우대 사항: ${jobRequirements || '일반적인 해당 직무 기준 적용'}

[지원자 보유 스펙 및 경험 데이터]
- 정량 스펙: ${applicantSpecs || '미기재'}
- 프로젝트 / 이력서 / 자소서 요약:
${portfolioOrResume || '미기재'}

[평가 지침]
1. 맹목적인 희망고문이나 무조건적인 칭찬은 금지합니다. 실제 서류 전형 통과율(통상 2~10% 미만)과 직무 핏을 감안하여 냉철하고 현실적인 서류 합격 확률(%)을 산출하세요.
2. 5대 핵심 지표(직무 전문성, 실무 경험 및 수치 성과, 기업/인재상 적합도, 정량 스펙 충족도, 차별화 필살기)를 0~100점으로 정량화하세요.
3. 확률을 올릴 수 있는 구체적인 액션 플랜(예: 어떤 수치를 추가할지, 어떤 자격/프로젝트를 보강할지)을 반드시 제시하세요.
`;

      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: prompt,
        config: {
          systemInstruction:
            '취업 지원자의 합격 가능성 및 직무 적합도를 대한민국 채용 시장 기준 객관적이고 현실적으로 진단하여 JSON 규격에 맞게 반환하세요.',
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              passProbability: {
                type: Type.INTEGER,
                description: '서류 통과 예상 확률 (0~100)',
              },
              tierRating: {
                type: Type.STRING,
                description: '안정권, 적정권, 도전권, 상향지원 중 택1',
              },
              overallAssessment: {
                type: Type.STRING,
                description: '채용 심사위원 시각의 종합 진단 소견 (3~4문장)',
              },
              categoryScores: {
                type: Type.OBJECT,
                properties: {
                  jobExpertise: { type: Type.INTEGER, description: '직무 전문성/하드스킬 점수 (0-100)' },
                  practicalExperience: { type: Type.INTEGER, description: '실무 프로젝트 및 성과 수치화 점수 (0-100)' },
                  companyFit: { type: Type.INTEGER, description: '기업 및 인재상 핏 (0-100)' },
                  quantitativeSpecs: { type: Type.INTEGER, description: '정량 스펙 충족도 (0-100)' },
                  differentiation: { type: Type.INTEGER, description: '차별화 필살기 점수 (0-100)' },
                },
                required: [
                  'jobExpertise',
                  'practicalExperience',
                  'companyFit',
                  'quantitativeSpecs',
                  'differentiation',
                ],
              },
              competitiveEdge: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
                description: '경쟁 지원자 대비 확실한 강점 2~3가지',
              },
              riskFactors: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    risk: { type: Type.STRING, description: '서류 탈락 위험 요소' },
                    remedy: { type: Type.STRING, description: '단기 극복 및 만회 방안' },
                  },
                  required: ['risk', 'remedy'],
                },
                description: '감점 위험 요소 2가지와 보완책',
              },
              boostStrategies: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
                description: '합격 확률을 15% 이상 높이는 긴급 보완 전략 3가지',
              },
              expectedInterviewChallenges: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    question: { type: Type.STRING, description: '면접관의 송곳 검증 질문' },
                    intent: { type: Type.STRING, description: '질문 의도 및 약점 파고들기' },
                    defenseStrategy: { type: Type.STRING, description: '모범 방어 논리' },
                  },
                  required: ['question', 'intent', 'defenseStrategy'],
                },
                description: '이 스펙으로 통과 시 면접에서 맞닥뜨릴 난관 질문 2가지',
              },
            },
            required: [
              'passProbability',
              'tierRating',
              'overallAssessment',
              'categoryScores',
              'competitiveEdge',
              'riskFactors',
              'boostStrategies',
              'expectedInterviewChallenges',
            ],
          },
        },
      });

      const parsed = JSON.parse(response.text || '{}');
      return res.json(parsed);
    } catch (error: any) {
      console.error('Predict Pass Rate Error:', error);
      return res.status(500).json({
        error: error?.message || '합격 가능성 분석 중 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.',
      });
    }
  });

  // 3. Quick Interview Answer Feedback
  app.post('/api/evaluate-interview', async (req: Request, res: Response) => {
    try {
      const { question, answer, jobRole, interviewerTone } = req.body;

      if (!question || !answer) {
        return res.status(400).json({ error: '면접 질문과 답변 내용이 필요합니다.' });
      }

      const ai = getAIClient();
      const prompt = `
[면접관 스타일]: ${interviewerTone || '따뜻하지만 날카로운 실무 팀장'}
[지원 직무]: ${jobRole || '신입'}
[면접 질문]: ${question}
[지원자의 답변]:
${answer}

위 답변을 평가하고, 면접관 관점의 점수와 피드백, 그리고 실제 면접장에서 바로 쓸 수 있는 모범 답변을 JSON으로 제공하세요.
`;

      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              score: { type: Type.INTEGER, description: '100점 만점 점수' },
              rating: { type: Type.STRING, description: '합격 / 보통 / 보완필요' },
              feedbackSummary: { type: Type.STRING, description: '총평 피드백' },
              goodPoints: { type: Type.ARRAY, items: { type: Type.STRING } },
              improvementPoints: { type: Type.ARRAY, items: { type: Type.STRING } },
              modelAnswer: { type: Type.STRING, description: '개선된 1분 모범 답변 예시' },
              followUpQuestion: { type: Type.STRING, description: '압박 꼬리질문 1개' },
            },
            required: [
              'score',
              'rating',
              'feedbackSummary',
              'goodPoints',
              'improvementPoints',
              'modelAnswer',
              'followUpQuestion',
            ],
          },
        },
      });

      const parsed = JSON.parse(response.text || '{}');
      return res.json(parsed);
    } catch (error: any) {
      console.error('Evaluate Interview Error:', error);
      return res.status(500).json({
        error: error?.message || '면접 피드백 생성 중 오류가 발생했습니다.',
      });
    }
  });

  /* =========================================================
     Backend Persistence Endpoints (서버 데이터 저장 & 동기화)
     ========================================================= */

  // 1. Chat Sessions Persistence
  app.get('/api/sessions', async (_req: Request, res: Response) => {
    try {
      const sessions = await getAllSessions();
      return res.json(sessions);
    } catch (err: any) {
      console.error('Failed to get sessions:', err);
      return res.status(500).json({ error: '대화 목록을 불러오는 중 오류가 발생했습니다.' });
    }
  });

  app.post('/api/sessions', async (req: Request, res: Response) => {
    try {
      const session = req.body;
      if (!session || !session.id) {
        return res.status(400).json({ error: '유효한 세션 데이터가 필요합니다.' });
      }
      const saved = await saveSession(session);
      return res.json(saved);
    } catch (err: any) {
      console.error('Failed to save session:', err);
      return res.status(500).json({ error: '세션을 저장하는 중 오류가 발생했습니다.' });
    }
  });

  app.put('/api/sessions/:id', async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const session = { ...req.body, id };
      const saved = await saveSession(session);
      return res.json(saved);
    } catch (err: any) {
      console.error('Failed to update session:', err);
      return res.status(500).json({ error: '세션을 업데이트하는 중 오류가 발생했습니다.' });
    }
  });

  app.delete('/api/sessions/:id', async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const success = await removeSession(id);
      return res.json({ success });
    } catch (err: any) {
      console.error('Failed to delete session:', err);
      return res.status(500).json({ error: '세션을 삭제하는 중 오류가 발생했습니다.' });
    }
  });

  // 2. Saved Resumes / CVs Persistence (내 자소서·이력서 보관함)
  app.get('/api/resumes', async (_req: Request, res: Response) => {
    try {
      const resumes = await getAllResumes();
      return res.json(resumes);
    } catch (err: any) {
      console.error('Failed to get resumes:', err);
      return res.status(500).json({ error: '저장된 서류 목록을 불러오는 중 오류가 발생했습니다.' });
    }
  });

  app.post('/api/resumes', async (req: Request, res: Response) => {
    try {
      const resumeData = req.body;
      if (!resumeData) {
        return res.status(400).json({ error: '서류 데이터가 필요합니다.' });
      }
      const saved = await saveResume(resumeData);
      return res.json(saved);
    } catch (err: any) {
      console.error('Failed to save resume:', err);
      return res.status(500).json({ error: '서류를 서버에 저장하는 중 오류가 발생했습니다.' });
    }
  });

  app.delete('/api/resumes/:id', async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const success = await removeResume(id);
      return res.json({ success });
    } catch (err: any) {
      console.error('Failed to delete resume:', err);
      return res.status(500).json({ error: '서류를 삭제하는 중 오류가 발생했습니다.' });
    }
  });

  // 3. Saved Pass Predictions Persistence (합격 가능성 진단 보관함)
  app.get('/api/predictions', async (_req: Request, res: Response) => {
    try {
      const predictions = await getAllPredictions();
      return res.json(predictions);
    } catch (err: any) {
      console.error('Failed to get predictions:', err);
      return res.status(500).json({ error: '진단 기록 목록을 불러오는 중 오류가 발생했습니다.' });
    }
  });

  app.post('/api/predictions', async (req: Request, res: Response) => {
    try {
      const predData = req.body;
      if (!predData) {
        return res.status(400).json({ error: '진단 데이터가 필요합니다.' });
      }
      const saved = await savePrediction(predData);
      return res.json(saved);
    } catch (err: any) {
      console.error('Failed to save prediction:', err);
      return res.status(500).json({ error: '진단 기록을 서버에 저장하는 중 오류가 발생했습니다.' });
    }
  });

  app.delete('/api/predictions/:id', async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const success = await removePrediction(id);
      return res.json({ success });
    } catch (err: any) {
      console.error('Failed to delete prediction:', err);
      return res.status(500).json({ error: '진단 기록을 삭제하는 중 오류가 발생했습니다.' });
    }
  });

  // Setup Vite in Dev or static files in Production
  if (!isProd) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`JobMate AI server running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
