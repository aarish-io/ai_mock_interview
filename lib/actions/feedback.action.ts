import { generateObject } from "ai";
import { google } from "@ai-sdk/google";
import { z } from "zod";
import { db } from "@/firebase/admin";
import { FieldValue } from "firebase-admin/firestore";


interface FeedbackParams {
    questions: string[];
    transcript: string;
    role: string;
    level: string;
}
interface FeedbackResults {
    overallScore: number;
    overallFeedback: string;
    answers: {
        question: string;
        score: number;
        feedback: string;
        userAnswer: string;
        strength: string[];
        improvements: string[];
    }[];
}

export async function generateInterviewFeedback(params: FeedbackParams): Promise<FeedbackResults> {

    const { role, level, questions, transcript } = params;

    const { object } = await generateObject({
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
        
        Provide feedback on the candidate's performance for each question. Include a score out of 100 and a feedback for each question. Also provide a strength and an improvement for each question. 
        IMPORTANT: The "overallScore" must be a calculated average of all individual answer scores, also out of 100.`,
    });

    return object;
}


//save user specific feedback to the new user_feedback collection

export async function saveUserFeedback({
    interviewId,
    userId,
    feedbackData
}: {
    interviewId: string;
    userId: string;
    feedbackData: any;
}): Promise<{ success: boolean; feedbackId?: string; error?: string }> {

    try {
        if (!interviewId || !userId || !feedbackData) {
            return { success: false, error: "Missing required fields" };
        }

        // Use composite ID to allow multiple users to take the same interview
        // (e.g. public interviews or shared links)
        const feedbackId = `${interviewId}_${userId}`;
        const feedbackRef = db.collection("user_feedbacks").doc(feedbackId);
        const existingFeedback = await feedbackRef.get();

        // Save individual feedback
        await feedbackRef.set({
            id: feedbackId,
            interviewId,
            userId,
            ...feedbackData,
            createdAt: new Date().toISOString(),
        });

        // Only update stats if this is a NEW feedback submission
        if (!existingFeedback.exists) {
            await updateInterviewStats(interviewId, feedbackData.overallScore);
        }

        return { success: true, feedbackId: feedbackId };
    } catch (error) {
        console.error("Error saving user feedback:", error);
        return { success: false, error: "Failed to save feedback" };
    }
}

// Update aggregated stats embedded in the interview document
export async function updateInterviewStats(
    interviewId: string,
    newScore: number
) {
    try {
        const interviewRef = db.collection("interviews").doc(interviewId);

        await db.runTransaction(async (transaction) => {
            const doc = await transaction.get(interviewRef);

            if (!doc.exists) {
                console.error("Interview not found:", interviewId);
                return;
            }

            const data = doc.data()!;
            const currentStats = data.stats || {
                totalAttempts: 0,
                averageScore: 0,
                highestScore: 0,
                lowestScore: 100
            };

            const newTotal = currentStats.totalAttempts + 1;
            const newAverage = ((currentStats.averageScore * currentStats.totalAttempts) + newScore) / newTotal;

            // Update embedded stats field
            transaction.update(interviewRef, {
                'stats.totalAttempts': newTotal,
                'stats.averageScore': Number(newAverage.toFixed(1)),
                'stats.highestScore': Math.max(currentStats.highestScore, newScore),
                'stats.lowestScore': Math.min(currentStats.lowestScore, newScore),
                'stats.lastUpdated': new Date().toISOString()
            });
        });
    } catch (error) {
        console.error("Error updating interview stats:", error);
    }
}

// Fetch a user's latest feedback for a specific interview
export async function getUserFeedback(
    interviewId: string,
    userId: string
): Promise<any | null> {
    try {
        const feedbackSnapshot = await db
            .collection("user_feedbacks")
            .where("interviewId", "==", interviewId)
            .where("userId", "==", userId)
            .orderBy("createdAt", "desc")
            .limit(1)
            .get();

        if (feedbackSnapshot.empty) {
            return null;
        }

        const feedbackDoc = feedbackSnapshot.docs[0];
        return {
            id: feedbackDoc.id,
            ...feedbackDoc.data(),
        };
    } catch (error) {
        console.error("Error getting user feedback:", error);
        return null;
    }
}

// Get comparison data (user score vs average)
export async function getScoreComparison(
    interviewId: string,
    userId: string
): Promise<any | null> {
    try {
        // Get user's score
        const userFeedback = await getUserFeedback(interviewId, userId);
        if (!userFeedback) return null;

        // Get interview with embedded stats
        const interviewDoc = await db.collection("interviews").doc(interviewId).get();

        if (!interviewDoc.exists) {
            return {
                userScore: userFeedback.overallScore,
                averageScore: userFeedback.overallScore,
                percentile: 100,
                totalAttempts: 1
            };
        }

        const stats = interviewDoc.data()?.stats;

        // If no stats yet, user is first
        if (!stats || stats.totalAttempts === 0) {
            return {
                userScore: userFeedback.overallScore,
                averageScore: userFeedback.overallScore,
                percentile: 100,
                totalAttempts: 1
            };
        }

        // Calculate percentile based on average (simplified)
        const userScore = userFeedback.overallScore;
        const avgScore = stats.averageScore;

        // Simple percentile: if above average, >50, if below <50
        let percentile = 50;
        if (userScore > avgScore) {
            percentile = 50 + Math.min(50, ((userScore - avgScore) / (100 - avgScore)) * 50);
        } else if (userScore < avgScore) {
            percentile = Math.max(0, 50 - ((avgScore - userScore) / avgScore) * 50);
        }

        return {
            userScore,
            averageScore: stats.averageScore,
            percentile: Math.round(percentile),
            totalAttempts: stats.totalAttempts
        };
    } catch (error) {
        console.error("Error getting score comparison:", error);
        return null;
    }
}