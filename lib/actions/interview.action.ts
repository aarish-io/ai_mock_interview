import { generateObject } from "ai";
import { googleVertex } from "@ai-sdk/google-vertex";
import { z } from "zod";

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
            model: googleVertex("gemini-1.5-flash"),
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
        // Throw error to let the caller handle it or see the failure logs. 
        // We are strictly avoiding the old fallback logic as per instructions.
        throw error;
    }

    // Default return (should rarely receive here if generateObject works or throws)
    return [];
}
