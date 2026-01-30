import { generateInterviewQuestions } from "@/lib/actions/interview.action";
import { db } from "@/firebase/admin";
import { getRandomInterviewCover } from "@/lib/utils";
import { generateInterviewFeedback } from "@/lib/actions/feedback.action";
import { saveUserFeedback } from "@/lib/actions/feedback.action";

export const dynamic = 'force-dynamic';
export const maxDuration = 60; // Increase timeout to 60s for LLM processing

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
                const callId = body.call?.call_id;

                // Strict validation: Ensure analysis data is complete (User request)
                // If the user hanged up early or analysis failed, we shouldn't generate a partial interview
                if (!analysis?.role || !analysis?.level || !analysis?.type || !analysis?.techstack) {
                    console.log("Analysis incomplete/missing, stopping interview generation.", analysis);
                    return Response.json({ success: false, error: "Incomplete analysis data" });
                }

                if (!callId) {
                    console.error("Missing callId in webhook body");
                    return Response.json({ success: false, error: "Missing callId" });
                }

                // Extract fields without defaults (Strict mode)
                const role = analysis.role;
                const level = analysis.level;
                const type = analysis.type;
                const techstackRaw = analysis.techstack;
                const amount = parseInt(analysis?.amount) || 5; // Default amount is fine

                const techstackArray = typeof techstackRaw === 'string'
                    ? techstackRaw.split(",").map((s: string) => s.trim())
                    : Array.isArray(techstackRaw) ? techstackRaw : ["JavaScript"];

                console.log("Creating interview with:", { role, level, type, techstackArray, amount });

                try {
                    const questions = await generateInterviewQuestions({
                        role,
                        level,
                        type,
                        techstack: techstackArray,
                        amount,
                    });

                    console.log("Generated questions:", questions);


                    // Use callId as the document ID to prevent duplicates (Idempotency)
                    await db.collection("interviews").doc(callId).create({
                        userId: metadata.userId,
                        role,
                        level,
                        type,
                        techstack: techstackArray,
                        questions,
                        coverImage: getRandomInterviewCover(),
                        createdAt: new Date().toISOString(),
                        finalized: true,
                        callId: callId, // Store callId field as well
                        stats: { // Initialize embedded stats
                            totalAttempts: 0,
                            averageScore: 0,
                            highestScore: 0,
                            lowestScore: 100,
                            lastUpdated: new Date().toISOString()
                        }
                    });


                    console.log("Interview created successfully:", callId);
                } catch (error: any) {
                    // Check if error is "Already Exists" (Code 6 in gRPC/Firebase)
                    if (error.code === 6 || error.message?.includes("already exists")) {
                        console.log(`Skipping duplicate interview creation for callId: ${callId}`);
                        return Response.json({ success: true, message: "Duplicate processed" });
                    }
                    throw error; // Re-throw other errors
                }
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

                let feedback;
                try {
                    feedback = await generateInterviewFeedback({
                        questions: interviewData.questions,
                        role: interviewData.role,
                        level: interviewData.level,
                        transcript: body.call?.transcript,
                    });
                    console.log("Generated feedback:", feedback ? "Success" : "Empty");
                } catch (err) {
                    console.error("Error generating feedback:", err);
                    return Response.json({ success: false, error: "Feedback generation failed" });
                }

                if (!feedback) {
                    console.error("Feedback generation returned null/undefined");
                    return Response.json({ success: false, error: "Feedback generation failed" });
                }

                const result = await saveUserFeedback({
                    interviewId,
                    userId: metadata.userId, // FIX: Use person TAKING interview, not creator
                    feedbackData: feedback
                });

                if (!result.success) {
                    console.error("Failed to save feedback:", result.error);
                }

                await interviewRef.update({
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

        return Response.json({ success: true }, {
            headers: {
                'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
                'Pragma': 'no-cache',
                'Expires': '0'
            }
        });
    } catch (error) {
        console.error("Webhook error:", error);
        console.error("Error details:", error instanceof Error ? error.message : String(error));
        return Response.json({ success: false }, {
            status: 500,
            headers: {
                'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
                'Pragma': 'no-cache',
                'Expires': '0'
            }
        });
    }
}
