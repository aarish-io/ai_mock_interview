import { NextResponse } from "next/server";

const RETELL_API_KEY = process.env.RETELL_API_KEY!;
const RETELL_AGENT_ID = process.env.NEXT_PUBLIC_RETELL_AGENT_ID!;
const RETELL_INTERVIEW_AGENT_ID = process.env.NEXT_PUBLIC_RETELL_INTERVIEW_AGENT_ID;

import { db } from "@/firebase/admin";

export async function POST(request: Request) {
    try {
        const body = await request.json();
        console.log("create-call received body:", JSON.stringify(body, null, 2));

        const { userName, userId, type, interviewId, questions, role, level, interview } = body;

        // Determine which agent to use
        // If interview data is provided, use the interview taker agent
        const isInterviewSession = !!interview || !!interviewId;
        const agentId = isInterviewSession && RETELL_INTERVIEW_AGENT_ID
            ? RETELL_INTERVIEW_AGENT_ID
            : RETELL_AGENT_ID;

        // Build dynamic variables based on the type of call
        const dynamicVariables: Record<string, string> = {
            user_name: userName || "Candidate",
            user_id: userId || "",
        };

        let interviewData = interview;

        // If interview object is missing but valid interviewId is present, fetch from Firestore
        if (!interviewData && interviewId) {
            try {
                const doc = await db.collection("interviews").doc(interviewId).get();
                if (doc.exists) {
                    interviewData = doc.data();
                    console.log("Fetched missing interview data from Firestore for id:", interviewId);
                }
            } catch (err) {
                console.error("Failed to fetch interview data:", err);
            }
        }

        // If this is an interview session, add interview-specific variables
        if (isInterviewSession && interviewData) {
            dynamicVariables.role = interviewData.role || role || "Software Engineer";
            dynamicVariables.level = interviewData.level || level || "Junior";
            dynamicVariables.type = interviewData.type || type || "Technical";
            dynamicVariables.questions = Array.isArray(interviewData.questions)
                ? interviewData.questions.join(" ||| ")
                : (questions ? JSON.stringify(questions) : "");
            dynamicVariables.interview_id = interviewId || interviewData.id || "";
        }

        console.log("Creating call with agent:", agentId);
        console.log("Dynamic variables:", dynamicVariables);

        // Create a web call using Retell API
        const response = await fetch("https://api.retellai.com/v2/create-web-call", {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${RETELL_API_KEY}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                agent_id: agentId,
                metadata: {
                    userName,
                    userId,
                    // Use the type from request if available, otherwise fallback to inference
                    type: (type === "interview" || isInterviewSession || !!interviewId) ? "interview" : "generate",
                    interviewId,
                },
                retell_llm_dynamic_variables: dynamicVariables
            }),
        });

        if (!response.ok) {
            const errorData = await response.json();
            console.error("Retell API error:", errorData);
            return NextResponse.json(
                { success: false, error: "Failed to create call" },
                { status: response.status }
            );
        }

        const data = await response.json();

        return NextResponse.json({
            success: true,
            accessToken: data.access_token,
            callId: data.call_id
        });

    } catch (error) {
        console.error("Error creating Retell call:", error);
        return NextResponse.json(
            { success: false, error: "Internal server error" },
            { status: 500 }
        );
    }
}

