'use server';

import { google } from '@ai-sdk/google';
import { generateObject } from 'ai';
import { z } from 'zod';
import PDFParser from "pdf2json";

const analysisSchema = z.object({
    atsScore: z.number().describe('ATS score from 0 to 100 based on keyword matching and formatting'),
    summary: z.string().describe('Professional summary of the candidate'),
    strongPoints: z.array(z.string()).describe('List of strong points in the resume'),
    weaknesses: z.array(z.string()).describe('List of weaknesses or missing critical areas'),
    skills: z.array(z.string()).describe('List of technical and soft skills extracted'),
    improvements: z.array(z.string()).describe('Specific actionable improvements to increase ATS score'),
});

export type ResumeAnalysis = z.infer<typeof analysisSchema>;

export async function analyzeResume(formData: FormData) {
    try {
        const file = formData.get('resume') as File;

        if (!file) {
            throw new Error('No file uploaded');
        }

        if (file.type !== 'application/pdf') {
            throw new Error('Only PDF files are supported');
        }

        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        // Parse PDF using pdf2json
        const resumeText = await new Promise<string>((resolve, reject) => {
            const pdfParser = new PDFParser(null, 1); // 1 = Text Content Only

            pdfParser.on("pdfParser_dataError", (errData: any) => {
                console.error("PDF Parser Error:", errData);
                reject(new Error(errData.parserError));
            });

            pdfParser.on("pdfParser_dataReady", () => {
                // getRawTextContent() returns text. 
                // Note: pdf2json types might be tricky, casting as any if needed or using public method
                const text = (pdfParser as any).getRawTextContent();
                resolve(text);
            });

            pdfParser.parseBuffer(buffer);
        });

        if (!resumeText || resumeText.trim().length < 50) {
            throw new Error('Could not extract sufficient text from PDF. It might be an image-only PDF.');
        }

        // Analyze with Gemini
        const { object } = await generateObject({
            model: google('models/gemini-2.5-flash'),
            schema: analysisSchema,
            prompt: `
        You are an expert AI Resume Analyzer and ATS (Applicant Tracking System) specialist.
        Analyze the following resume text for a Software Engineering / Tech role.
        
        Resume Text:
        "${resumeText.slice(0, 10000)}" 
        
        Provide:
        1. An ATS Score (0-100) based on content, keywords, and structure.
        2. A professional summary.
        3. Key strengths and weaknesses.
        4. Extracted skills.
        5. Specific improvements to help the candidate get hired.
      `,
        });

        return { success: true, data: object };

    } catch (error: any) {
        console.error("Resume analysis error:", error);
        return { success: false, error: error.message };
    }
}
