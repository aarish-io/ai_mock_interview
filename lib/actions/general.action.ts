import { db } from "@/firebase/admin";

export async function getInterviewsByUserId(userId: string): Promise<Interview[] | null> {
    if (!userId) return [];

    const interviews = await db.collection('interviews')
        .where('userId', '==', userId)
        .orderBy('createdAt', 'desc')
        .get();

    const interviewsWithFeedback = await Promise.all(interviews.docs.map(async (doc) => {
        const interviewData = doc.data();
        let feedbackDoc = await db.collection('user_feedbacks').doc(doc.id).get();

        // Backward compatibility: If not found by ID, try querying by interviewId field
        if (!feedbackDoc.exists) {
            const feedbackQuery = await db.collection('user_feedbacks')
                .where('interviewId', '==', doc.id)
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

    const interviewsWithFeedback = await Promise.all(interviews.docs.map(async (doc) => {
        const interviewData = doc.data();
        // For public interviews, we might not want to show the current user's feedback, 
        // or we might logic differently. For now, let's leave feedback undefined 
        // as "Latest Interviews" usually shows *other people's* or general interviews to take.
        // If the intention is to show if *I* have taken it, we'd need to fetch *my* feedback.
        // Assuming "Latest Interviews" are templates to start a new test.

        return {
            id: doc.id,
            ...interviewData,
        } as Interview;
    }));

    return interviewsWithFeedback;
}

export async function getInterviewsById(id: string): Promise<Interview | null> {
    const interview = await db.collection('interviews')
        .doc(id)
        .get();

    return interview.data() as Interview | null;

}