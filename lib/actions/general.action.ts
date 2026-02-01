import { db } from "@/firebase/admin";

export async function getInterviewsByUserId(userId: string): Promise<Interview[] | null> {
    if (!userId) return [];

    const interviews = await db.collection('interviews')
        .where('userId', '==', userId)
        .orderBy('createdAt', 'desc')
        .get();

    const interviewsWithFeedback = await Promise.all(interviews.docs.map(async (doc) => {
        const interviewData = doc.data();
        // Construct composite ID using the CURRENT USER (function parameter), not the interview creator
        const feedbackId = `${doc.id}_${userId}`;

        let feedbackDoc = await db.collection('user_feedbacks').doc(feedbackId).get();
        // console.log(`[DEBUG] Checking feedback for ${feedbackId}: ${feedbackDoc.exists}`);

        // Fallback: Query by fields if direct ID lookup fails (handles legacy data or mismatches)
        if (!feedbackDoc.exists) {
            const feedbackQuery = await db.collection('user_feedbacks')
                .where('interviewId', '==', doc.id)
                .where('userId', '==', userId)
                .limit(1)
                .get();

            if (!feedbackQuery.empty) {
                feedbackDoc = feedbackQuery.docs[0];
            }
        }

        return {
            id: doc.id,
            ...interviewData,
            feedback: feedbackDoc.exists ? feedbackDoc.data() : undefined
        } as Interview;
    }));

    return interviewsWithFeedback;
}

export async function getLatestInterviews(params: GetLatestInterviewsParams): Promise<Interview[] | null> {
    const { userId, limit = 20 } = params;

    let query = db.collection('interviews')
        .orderBy('createdAt', 'desc')
        .where('finalized', '==', true);

    if (userId) {
        query = query.where('userId', '!=', userId);
    }

    const interviews = await query.limit(limit).get();

    // Check if current user has taken each interview
    const interviewsWithFeedback = await Promise.all(interviews.docs.map(async (doc) => {
        let userFeedback = null;

        if (userId) {
            const feedbackId = `${doc.id}_${userId}`;
            const feedbackDoc = await db.collection('user_feedbacks').doc(feedbackId).get();

            if (feedbackDoc.exists) {
                userFeedback = feedbackDoc.data();
            }
        }

        return {
            id: doc.id,
            ...doc.data(),
            averageScore: doc.data().stats?.averageScore || null,
            feedback: userFeedback // Add user's feedback if they've taken it
        } as any;
    }));

    return interviewsWithFeedback;
}

export async function getInterviewsById(id: string): Promise<Interview | null> {
    const interview = await db.collection('interviews')
        .doc(id)
        .get();

    return interview.data() as Interview | null;

}

export async function getCompletedInterviews(userId: string): Promise<Interview[] | null> {
    if (!userId) return [];

    const feedbackQuery = await db.collection('user_feedbacks')
        .where('userId', '==', userId)
        .orderBy('createdAt', 'desc')
        .get();

    const interviews = await Promise.all(feedbackQuery.docs.map(async (feedbackDoc) => {
        const feedbackData = feedbackDoc.data();
        const interviewDoc = await db.collection('interviews').doc(feedbackData.interviewId).get();

        if (!interviewDoc.exists) return null;

        return {
            id: interviewDoc.id,
            ...interviewDoc.data(),
            feedback: feedbackData
        } as Interview;
    }));

    return interviews.filter((i): i is Interview => i !== null);
}

export async function getTrendingInterviews(limit: number = 5): Promise<Interview[] | null> {
    try {
        const interviews = await db.collection('interviews')
            .orderBy('stats.totalAttempts', 'desc')
            .where('finalized', '==', true)
            .limit(limit)
            .get();

        return interviews.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
            averageScore: doc.data().stats?.averageScore || null
        })) as unknown as Interview[];
    } catch (error) {
        console.warn("Trending fetch failed (likely missing index), falling back to latest", error);
        // Fallback to latest if stats.totalAttempts index doesn't exist
        const interviews = await db.collection('interviews')
            .orderBy('createdAt', 'desc')
            .where('finalized', '==', true)
            .limit(limit)
            .get();
        
        return interviews.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
            averageScore: doc.data().stats?.averageScore || null
        })) as unknown as Interview[];
    }
}
