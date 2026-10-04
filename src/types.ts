export type ModelId =
  | 'gemini-3.8-flash'
  | 'gemini-3.1-flash-lite'
  | 'gemini-3.5-flash'
  | 'gemini-3.1-pro-preview';

export type PersonaId =
  | 'resume_doctor'
  | 'cv_specialist'
  | 'mock_interview'
  | 'career_analyst'
  | 'mental_mentor';

export type InterviewerTone = 'team_lead' | 'hr_manager' | 'executive';

export interface PersonaConfig {
  id: PersonaId;
  name: string;
  badge: string;
  tagline: string;
  description: string;
  iconName: string;
  color: string;
  bgLight: string;
  borderLight: string;
  systemInstruction: string;
  starterQuestions: string[];
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  content: string;
  timestamp: number;
  modelUsed?: string;
  personaId?: PersonaId;
  isError?: boolean;
}

export interface ChatSession {
  id: string;
  title: string;
  personaId: PersonaId;
  messages: ChatMessage[];
  createdAt: number;
  updatedAt: number;
}

export interface ResumeAnalysisResult {
  overallScore: number;
  oneLineVerdict: string;
  strengths: string[];
  weaknesses: string[];
  starRevision: {
    situation: string;
    task: string;
    action: string;
    result: string;
    fullRewrittenText: string;
  };
  interviewQuestions: Array<{
    question: string;
    intent: string;
    answerTip: string;
  }>;
}

export interface CVAnalysisResult {
  overallScore: number;
  summaryVerdict: string;
  headlineCritique: {
    before: string;
    after: string;
    advice: string;
  };
  bulletImprovements: Array<{
    original: string;
    improved: string;
    keyChange: string;
  }>;
  skillsEvaluation: {
    recommendedKeywords: string[];
    redundantOrVague: string[];
  };
  checklist: Array<{
    category: string;
    passed: boolean;
    comment: string;
  }>;
  fullRefactoredCV: string;
}

export interface InterviewEvaluationResult {
  score: number;
  rating: string;
  feedbackSummary: string;
  goodPoints: string[];
  improvementPoints: string[];
  modelAnswer: string;
  followUpQuestion: string;
}

export interface PassPredictionResult {
  passProbability: number;
  tierRating: '안정권' | '적정권' | '도전권' | '상향지원';
  overallAssessment: string;
  categoryScores: {
    jobExpertise: number;
    practicalExperience: number;
    companyFit: number;
    quantitativeSpecs: number;
    differentiation: number;
  };
  competitiveEdge: string[];
  riskFactors: Array<{
    risk: string;
    remedy: string;
  }>;
  boostStrategies: string[];
  expectedInterviewChallenges: Array<{
    question: string;
    intent: string;
    defenseStrategy: string;
  }>;
}
