import { generateInterviewQuestions } from "@/lib/actions/interview.action";
import { db } from "@/firebase/admin";
import { getRandomInterviewCover } from "@/lib/utils";
import { generateInterviewFeedback } from "@/lib/actions/feedback.action";

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
    try {
        const body = await request.json();
        console.log("Retell webhook received:", body.event);
        console.log("Full body:", JSON.stringify(body, null, 2));

        // Only process if analysis is complete
        if (body.event === "call_analyzed") {
            const analysis = body.call?.call_analysis?.custom_analysis_data;
            const metadata = body.call?.metadata;
            const transcript = body.call?.transcript;

            console.log("Extracted analysis:", analysis);
            console.log("Metadata:", metadata);
            console.log("Has transcript:", !!transcript);

            // Check if we have userId in metadata AND if this is a generator call
            if (metadata?.userId && metadata?.type === "generate") {
                // Idempotency check: Ensure we haven't already processed this call
                const callId = body.call?.call_id;
                if (callId) {
                    const existingInterviewQuery = await db.collection("interviews")
                        .where("callId", "==", callId)
                        .get();

                    if (!existingInterviewQuery.empty) {
                        console.log(`Skipping duplicate interview creation for callId: ${callId}`);
                        return Response.json({ success: true, message: "Duplicate processed" });
                    }
                }

                // Use analysis data if available, otherwise use defaults
                const role = analysis?.role || "Software Engineer";
                const level = analysis?.level || "junior";
                const type = analysis?.type || "technical";
                const techstackRaw = analysis?.techstack || "JavaScript";
                const amount = parseInt(analysis?.amount) || 5;

                const techstackArray = typeof techstackRaw === 'string'
                    ? techstackRaw.split(",").map((s: string) => s.trim())
                    : Array.isArray(techstackRaw) ? techstackRaw : ["JavaScript"];

                console.log("Creating interview with:", { role, level, type, techstackArray, amount });

                const questions = await generateInterviewQuestions({
                    role,
                    level,
                    type,
                    techstack: techstackArray,
                    amount,
                });

                console.log("Generated questions:", questions);

                const docRef = await db.collection("interviews").add({
                    userId: metadata.userId,
                    role,
                    level,
                    type,
                    techstack: techstackArray,
                    questions,
                    coverImage: getRandomInterviewCover(),
                    createdAt: new Date().toISOString(),
                    finalized: true,
                    callId: callId || null, // Store callId for future idempotency checks
                });

                console.log("Interview created successfully:", docRef.id);
            }

            else if (metadata?.userId && metadata?.type === "interview") {
                const interviewId = metadata.interviewId;

                const interviewRef = db.collection("interviews").doc(interviewId);
                const interviewDoc = await interviewRef.get();
                const interviewData = interviewDoc.data();

                if (!interviewData) {
                    console.log("Interview not found:", interviewId);
                    return Response.json({ success: false, error: "Interview not found" });
                }

                console.log("generating feedback for interview id:", interviewId);

                const feedback = await generateInterviewFeedback({
                    questions: interviewData.questions,
                    role: interviewData.role,
                    level: interviewData.level,
                    transcript: body.call?.transcript,
                })
                console.log("Generated feedback:", feedback);

                await interviewRef.update({
                    feedback,
                    transcript,
                    status: "completed",
                    completedAt: new Date().toISOString(),
                })

                console.log("Interview updated successfully:", interviewId);
            }


            else {
                console.log("Skipping interview creation. REASON:", {
                    hasUserId: !!metadata?.userId,
                    isGenerateType: metadata?.type === "generate",
                    metadataType: metadata?.type,
                    event: body.event
                });
            }
        }

        return Response.json({ success: true });
    } catch (error) {
        console.error("Webhook error:", error);
        console.error("Error details:", error instanceof Error ? error.message : String(error));
        return Response.json({ success: false }, { status: 500 });
    }
}
