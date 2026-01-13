import { generateText } from "ai";
import { google } from "@ai-sdk/google";
import { z } from "zod";

interface FeedbackParams {
    questions: string[];
    transcript: string;
    role: string;
    level: string;
}
interface FeedbackResults {
    overallScore: number;
    overallFeedback: string;
    answers:{
        question: string;
        score: number;
        feedback: string;
        userAnswer: string;
        strength: string[];
        improvements: string[];
    }[];
}

export async function generateInterviewFeedback(params: FeedbackParams): Promise<FeedbackResults>{

    const {role, level, questions, transcript} = params;

    const {object} = await generateObject({
        model: google("models/gemini-2.5-flash"),
        schema: z.object({
            overallScore: z.number(),
            overallFeedback: z.string(),
            answers: z.array(z.object({
                question: z.string(),
                score: z.number(),
                feedback: z.string(),
                userAnswer: z.string(),
                strength: z.array(z.string()),
                improvements: z.array(z.string())
            }))
        }),

        prompt: `You are an expert interview coach. Analyze this interview and provide detailed feedback.
        Role: ${role}
        Level: ${level}
        Questions: ${questions.join("\n")}
        Interview Transcript: ${transcript}
        
        Provide feedback on the candidate's performance for each question. Include a score out of 10 and a feedback for each question. Also provide a strength and an improvement for each question.`,
    });

    return object;
}
