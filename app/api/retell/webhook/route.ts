import { generateInterviewQuestions } from "@/lib/actions/interview.action";
import { db } from "@/firebase/admin";

export async function POST(request: Request) {
    try {
        const body = await request.json();
        console.log("Retell webhook received:", body.event);
        console.log("Full body:", JSON.stringify(body, null, 2));

        if (body.event === "call_ended" || body.event === "call_analyzed") {
            const analysis = body.call?.call_analysis?.custom_analysis_data;
            const metadata = body.call?.metadata;

            console.log("Extracted data:", analysis);
            console.log("Metadata:", metadata);

            if (analysis && metadata?.userId) {
                const techstackArray = analysis.techstack
                    ? analysis.techstack.split(",").map((s: string) => s.trim())
                    : ["JavaScript"];

                const questions = await generateInterviewQuestions({
                    role: analysis.role || "Software Engineer",
                    level: analysis.level || "junior",
                    type: analysis.type || "technical",
                    techstack: techstackArray,
                    amount: parseInt(analysis.amount) || 5,
                });

                const docRef = await db.collection("interviews").add({
                    userId: metadata.userId,
                    role: analysis.role,
                    level: analysis.level,
                    type: analysis.type,
                    techstack: techstackArray,
                    questions,
                    createdAt: new Date().toISOString(),
                    finalized: true,
                });

                console.log("Interview created:", docRef.id);
            }
        }

        return Response.json({ success: true });
    } catch (error) {
        console.error("Webhook error:", error);
        return Response.json({ success: false }, { status: 500 });
    }
}
