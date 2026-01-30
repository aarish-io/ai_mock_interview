interface UserFeedback{
  id: string;
  interviewId: string;
  userId: string;
   overallScore: number;
  overallFeedback: string;
  answers:{
    question: string;
    score: number;
    feedback: string;
    userAnswer: string;
    strengths: string[];
    improvements: string[];
  }[];
  createdAt: string;
}

interface InterviewStats{
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

interface ScoreComparison{
  userScore: number;
  averageScore: number;
  percentile: number;
  totalAttempts: number;
}


interface Feedback {
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

interface Interview {
  id: string;
  role: string;
  level: string;
  questions: string[];
  techstack: string[];
  createdAt: string;
  userId: string;
  type: string;
  finalized: boolean;
  feedback?: Feedback;
  callId?: string;
}

interface CreateFeedbackParams {
  interviewId: string;
  userId: string;
  transcript: { role: string; content: string }[];
  feedbackId?: string;
}

interface User {
  name: string;
  email: string;
  id: string;
}

interface InterviewCardProps {
  id?: string;
  userId?: string;
  role: string;
  type: string;
  techstack: string[];
  createdAt?: string;
  feedback?: Feedback;
}

interface Message {
  type: string;
  transcriptType?: string;
  role?: 'user' | 'system' | 'assistant';
  transcript?: string;
}

interface AgentProps {
  userName: string;
  userId?: string;
  interviewId?: string;
  feedbackId?: string;
  type: "generate" | "interview";
  questions?: string[];
  interview?: Interview;
}

interface RouteParams {
  params: Promise<Record<string, string>>;
  searchParams: Promise<Record<string, string>>;
}

interface GetFeedbackByInterviewIdParams {
  interviewId: string;
  userId: string;
}

interface GetLatestInterviewsParams {
  userId: string;
  limit?: number;
}

interface SignInParams {
  email: string;
  idToken: string;
}

interface SignUpParams {
  uid: string;
  name: string;
  email: string;
  password: string;
}

type FormType = "sign-in" | "sign-up";

interface InterviewFormProps {
  interviewId: string;
  role: string;
  level: string;
  type: string;
  techstack: string[];
  amount: number;
}

interface TechIconProps {
  techStack: string[];
}
