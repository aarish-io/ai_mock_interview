import { generateObject } from "ai";
import { createVertex } from "@ai-sdk/google-vertex";
import { z } from "zod";

// Parse service account credentials from environment variable
const credentials = JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_JSON || "{}");

// Create Vertex AI provider with explicit credentials
const vertex = createVertex({
    project: credentials.project_id,
    location: "us-central1",
    googleAuthOptions: {
        credentials: {
            client_email: credentials.client_email,
            private_key: credentials.private_key,
        },
    },
});

interface GenerateInterviewQuestionsParams {
    role: string;
    level: string;
    type: string;
    techstack: string[];
    amount: number;
}

export async function generateInterviewQuestions(params: GenerateInterviewQuestionsParams): Promise<string[]> {
    const { role, level, type, techstack, amount } = params;

    try {
        const { object } = await generateObject({
            model: vertex("gemini-1.5-flash"),
            schema: z.object({
                questions: z.array(z.string()).min(1).max(amount * 2),
            }),
            prompt: `Generate exactly ${amount} professional interview questions for a ${level} ${role} position.
    Tech stack: ${techstack.join(", ")}.
    Question type: ${type}.
    
    The questions should be challenging and relevant to the specified level and tech stack.`,
        });

        if (object.questions && object.questions.length > 0) {
            console.log("Successfully generated questions using generateObject (Vertex AI):", object.questions);
            return object.questions.slice(0, amount);
        }
    } catch (error) {
        console.error("Error using Vertex AI generateObject:", error);
        throw error;
    }

    return [];
}
