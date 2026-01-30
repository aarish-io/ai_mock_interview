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

        const feedbackRef = db.collection("user_feedbacks").doc();

        // Save individual feedback
        await feedbackRef.set({
            id: feedbackRef.id,
            interviewId,
            userId,
            ...feedbackData,
            createdAt: new Date().toISOString(),
        });

        // Trigger stats update
        await updateInterviewStats(interviewId, feedbackData.overallScore);

        return { success: true, feedbackId: feedbackRef.id };
    } catch (error) {
        console.error("Error saving user feedback:", error);
        return { success: false, error: "Failed to save feedback" };
    }
}

// Update aggregated stats for the interview using a transaction
export async function updateInterviewStats(interviewId: string, newScore: number) {
    try {
        const statsRef = db.collection("interview_stats").doc(interviewId);

        await db.runTransaction(async (transaction) => {
            const doc = await transaction.get(statsRef);

            if (!doc.exists) {
                // Initialize stats if first time
                transaction.set(statsRef, {
                    interviewId,
                    totalAttempts: 1,
                    averageScore: newScore,
                    highestScore: newScore,
                    lowestScore: newScore,
                    scoreDistribution: {
                        range0_50: newScore <= 50 ? 1 : 0,
                        range51_75: newScore > 50 && newScore <= 75 ? 1 : 0,
                        range76_100: newScore > 75 ? 1 : 0,
                    },
                    lastUpdated: new Date().toISOString()
                });
            } else {
                const data = doc.data()!;
                const newTotal = (data.totalAttempts || 0) + 1;
                const currentAvg = data.averageScore || 0;

                // Calculate new running average: (OldAvg * OldCount + NewScore) / NewCount
                const newAverage = ((currentAvg * data.totalAttempts) + newScore) / newTotal;

                transaction.update(statsRef, {
                    totalAttempts: newTotal,
                    averageScore: Number(newAverage.toFixed(1)),
                    highestScore: Math.max(data.highestScore || 0, newScore),
                    lowestScore: Math.min(data.lowestScore || 100, newScore),
                    [`scoreDistribution.range0_50`]: FieldValue.increment(newScore <= 50 ? 1 : 0),
                    [`scoreDistribution.range51_75`]: FieldValue.increment(newScore > 50 && newScore <= 75 ? 1 : 0),
                    [`scoreDistribution.range76_100`]: FieldValue.increment(newScore > 75 ? 1 : 0),
                    lastUpdated: new Date().toISOString()
                });
            }
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
): Promise<{ userScore: number; averageScore: number; percentile: number; totalAttempts: number } | null> {
    try {
        // Get user's score
        const userFeedback = await getUserFeedback(interviewId, userId);
        if (!userFeedback) return null;

        // Get interview stats
        const statsDoc = await db.collection("interview_stats").doc(interviewId).get();

        if (!statsDoc.exists) {
            return {
                userScore: userFeedback.overallScore,
                averageScore: userFeedback.overallScore,
                percentile: 100,
                totalAttempts: 1
            };
        }

        const stats = statsDoc.data()!;

        // Calculate simplified percentile based on distribution
        // This is an estimation since we only store ranges
        let percentile = 50;
        const { overallScore } = userFeedback;
        const { range0_50, range51_75, range76_100 } = stats.scoreDistribution;
        const total = stats.totalAttempts;

        // Logic: Count how many people scored LESS than the current user based on buckets
        let peopleBelow = 0;

        if (overallScore > 50) peopleBelow += range0_50;
        if (overallScore > 75) peopleBelow += range51_75;
        // For the bucket the user is in, assume they are better than half of them
        if (overallScore <= 50) peopleBelow += range0_50 * 0.5;
        else if (overallScore <= 75) peopleBelow += range51_75 * 0.5;
        else peopleBelow += range76_100 * 0.5;

        percentile = Math.min(99, Math.round((peopleBelow / total) * 100));

        return {
            userScore: overallScore,
            averageScore: stats.averageScore,
            percentile,
            totalAttempts: total
        };
    } catch (error) {
        console.error("Error getting score comparison:", error);
        return null;
    }
}