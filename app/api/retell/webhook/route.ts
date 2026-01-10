import { generateInterviewQuestions } from "@/lib/actions/interview.action";
import { db } from "@/firebase/admin";
import { getRandomInterviewCover } from "@/lib/utils";

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
                });

                console.log("Interview created successfully:", docRef.id);
            } else {
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
