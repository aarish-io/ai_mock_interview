import { generateObject, generateText } from "ai";
import { google } from "@ai-sdk/google";
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
            model: google("models/gemini-2.5-flash"),
            schema: z.object({
                questions: z.array(z.string()).min(1).max(amount * 2),
            }),
            prompt: `Generate exactly ${amount} professional interview questions for a ${level} ${role} position.
    Tech stack: ${techstack.join(", ")}.
    Question type: ${type}.
    
    The questions should be challenging and relevant to the specified level and tech stack.`,
        });

        if (object.questions && object.questions.length > 0) {
            console.log("Successfully generated questions using generateObject:", object.questions);
            return object.questions.slice(0, amount);
        }
    } catch (error) {
        console.error("Error using generateObject, falling back to manual parsing:", error);
    }

    // Fallback to manual generation if generateObject fails
    // This provides extra robustness
    try {
        const { text: questions } = await generateText({
            model: google("models/gemini-2.5-flash"),
            prompt: `Generate exactly ${amount} interview questions for a ${level} ${role} position.
    Tech stack: ${techstack.join(", ")}.
    Question type: ${type}.
    
    IMPORTANT: Return ONLY a valid JSON array of strings. No explanations, no markdown, no extra text.
    Example format: ["Question 1?", "Question 2?", "Question 3?"]
    
    Your response must start with [ and end with ]`,
        });

        console.log("Raw AI response: " + questions);

        // Clean the response - remove any markdown code blocks
        let cleanedQuestions = questions.trim();
        cleanedQuestions = cleanedQuestions.replace(/```json\s*/gi, '').replace(/```\s*/g, '');
        cleanedQuestions = cleanedQuestions.trim();

        // Try to extract JSON array from the response
        try {
            // First, try direct parsing
            const parsed = JSON.parse(cleanedQuestions);
            if (Array.isArray(parsed) && parsed.length > 0) {
                console.log("Successfully parsed questions:", parsed);
                return parsed;
            }
        } catch {
            console.log("Direct parsing failed, trying extraction...");
        }

        // If direct parsing fails, try to extract JSON array from the text
        const jsonMatch = cleanedQuestions.match(/\[[\s\S]*?\]/);
        if (jsonMatch) {
            try {
                const parsed = JSON.parse(jsonMatch[0]);
                if (Array.isArray(parsed) && parsed.length > 0) {
                    console.log("Successfully extracted and parsed questions:", parsed);
                    return parsed;
                }
            } catch {
                console.error("Failed to parse extracted JSON:", jsonMatch[0]);
            }
        }

        // If all parsing fails, create questions from the text lines
        console.error("Could not parse questions as JSON, falling back to text split");
        const lines = cleanedQuestions
            .split('\n')
            .map(line => line.trim())
            .filter(line => line.length > 10 && (line.includes('?') || line.match(/^\d+\./)))
            .map(line => line.replace(/^\d+[\.\)]\s*/, '').replace(/^["'-]\s*/, '').replace(/\s*["'-]$/, '').trim())
            .filter(line => line.length > 0);

        if (lines.length > 0) {
            console.log("Fallback questions:", lines);
            return lines.slice(0, amount);
        }
    } catch (fallbackError) {
        console.error("Fallback generation failed:", fallbackError);
    }

    // Last resort - return default questions
    console.error("All parsing failed, returning default questions");
    return [
        `What experience do you have with ${techstack[0] || 'programming'}?`,
        `Tell me about a challenging project you worked on as a ${role}.`,
        `How do you approach problem-solving in your development work?`,
        `What are your strengths as a ${level} developer?`,
        `Where do you see yourself in 5 years?`
    ].slice(0, amount);
}

