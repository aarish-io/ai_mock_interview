import { NextResponse } from "next/server";

const RETELL_API_KEY = process.env.RETELL_API_KEY!;
const RETELL_AGENT_ID = process.env.NEXT_PUBLIC_RETELL_AGENT_ID!;

export async function POST(request: Request) {
    try {
        const { userName, userId, type, interviewId, questions } = await request.json();

        // Create a web call using Retell API
        const response = await fetch("https://api.retellai.com/v2/create-web-call", {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${RETELL_API_KEY}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                agent_id: RETELL_AGENT_ID,
                metadata: {
                    userName,
                    userId,
                    type,
                    interviewId,
                    questions: questions ? JSON.stringify(questions) : undefined
                },
                retell_llm_dynamic_variables: {
                    user_name: userName || "User",
                    user_id: userId || "",
                }
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

