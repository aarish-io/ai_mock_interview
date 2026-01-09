import {generateText} from "ai";
import {google} from "@ai-sdk/google";
import {getRandomInterviewCover} from "@/lib/utils";
import {db} from "@/firebase/admin";

export async function GET(){
    return Response.json({success:true, message:"VAPI Generate"},{status:200});
}

export async function POST(request:Request){
    try {
        const body = await request.json();

        // Support both old parameter names and new ones from Vapi Tool
        const type = body.type || body.interviewType || "Mixed";
        const role = body.role || body.jobRole || "Developer";
        const level = body.level || body.experienceLevel || "Junior";
        const techstack = body.techstack || body.techStack || "JavaScript";
        const amount = body.amount || body.numberOfQuestions || 5;
        const userid = body.userid || body.userId || "";

        console.log("Generating interview with params:", { type, role, level, techstack, amount, userid });

        const {text:questions} = await generateText({
            model:google("gemini-2.0-flash-001"),
            prompt:`Prepare questions for a job interview.
            The job role is ${role}.
            The job experience level is ${level}.
            The tech stack used in the job is: ${techstack}.
            The focus between behavioural and technical questions should lean towards: ${type}.
            The amount of questions required is: ${amount}.
            Please return only the questions, without any additional text.
            The questions are going to be read by a voice assistant so do not use "/" or "*" or any other special characters which might break the voice assistant.
            Return the questions formatted like this:
            ["Question 1", "Question 2", "Question 3"]
            
            Thank you! <3
        `,
        });

        console.log("Generated questions:", questions);

        const interview = {
            role,type,level,
            techstack: techstack,
            questions:JSON.parse(questions),
            userId:userid,
            finalized:true,
            coverImage:getRandomInterviewCover(),
            createdAt: new Date().toISOString(),
        }

        await db.collection('interviews').add(interview);

        return Response.json({success:true},{status:200});
    }
    catch (e){
        console.error("Error generating interview:", e);
        return Response.json({success:false, error: String(e)},{status:500});
    }
}