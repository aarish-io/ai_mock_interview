export interface UserFeedback {
  id: string;
  interviewId: string;
  userId: string;
  overallScore: number;
  overallFeedback: string;
  answers: {
    question: string;
    score: number;
    feedback: string;
    userAnswer: string;
    strengths: string[];
    improvements: string[];
  }[];
  createdAt: string;
}
export interface InterviewStats {
  interveiwId: string;
  totalAttempts: number;
  averageScore: number;
  highestScore: number;
  lowestScore: number;
  scoreDistribution: {
    range0_50: number;
    range51_75: number;
    range76_100: number;
  };
  lastUpdated: string;
}
export interface ScoreComparison {
  userScore: number;
  averageScore: number;
  percentile: number;
  totalAttempts: number;
}
export interface Feedback {
  overallScore: number;
  overallFeedback: string;
  answers: {
    question: string;
    score: number;
    feedback: string;
    userAnswer: string;
    strengths: string[];
    improvements: string[];
  }[];
  createdAt?: string;
}
export interface Interview {
  id: string;
  role: string;
  level: string;
  questions: string[];
  techStack: string[];
  createdAt: string;
  userId: string;
  type: string;
  finalized: boolean;
  feedback?: Feedback;
  callId?: string;
}
export interface CreateFeedbackParams {
  interviewId: string;
  userId: string;
  transcript: { role: string; content: string }[];
  feedbackId?: string;
}
export interface User {
  name: string;
  email: string;
  id: string;
}
export interface InterviewCardProps {
  id?: string;
  role: string;
  type: string;
  techStack: string[];
  createdAt?: string;
  feedback?: Feedback;
}
export interface Message {
  type: string;
  transcriptType?: string;
  role?: 'user' | 'system' | 'assistant';
  transcript?: string;
}
export interface AgentProps {
  userName: string;
  userId?: string;
  interviewId?: string;
  feedbackId?: string;
  type: "generate" | "interview";
  questions?: string[];
  interview?: Interview;
}
export interface RouteParams {
  params: Promise<Record<string, string>>;
  searchParams: Promise<Record<string, string>>;
}
export interface GetFeedbackByInterviewIdParams {
  interviewId: string;
  userId: string;
}
export interface GetLatestInterviewsParams {
  userId: string;
  limit?: number;
}
export interface SignInParams {
  email: string;
  idToken: string;
}
export interface SignUpParams {
  uid: string;
  name: string;
  email: string;
  password: string;
}
export type FormType = "sign-in" | "sign-up";
export interface InterviewFormProps {
  interviewId: string;
  role: string;
  level: string;
  type: string;
  techStack: string[];
  amount: number;
}
export interface TechIconProps {
  techStack: string[];
}
