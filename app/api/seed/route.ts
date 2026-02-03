import { NextResponse } from 'next/server';
import { db } from "@/firebase/admin";
import { getCurrentUser } from "@/lib/actions/auth.action";
import { randomUUID } from "crypto";

export async function GET() {
    try {
        const currentUser = await getCurrentUser();
        const userId = currentUser?.id;

        console.log("Seeding data... User:", userId);

        const techStacks = [
            ["React", "Next.js", "TypeScript", "TailwindCSS"],
            ["Node.js", "Express", "MongoDB", "Redis"],
            ["Python", "Django", "PostgreSQL", "Docker"],
            ["Java", "Spring Boot", "AWS", "Microservices"],
            ["DevOps", "Kubernetes", "Terraform", "CI/CD"],
            ["Mobile", "React Native", "Firebase", "Redux"],
            ["Data Science", "Python", "Pandas", "Scikit-learn"],
            ["Go", "gRPC", "PostgreSQL", "Kafka"]
        ];

        const roles = [
            "Frontend Developer", "Backend Engineer", "Full Stack Developer", "Senior Java Engineer",
            "DevOps Specialist", "Mobile App Developer", "Data Scientist", "Go Developer"
        ];

        // 1. Create Trending/Public Interviews (Created by 'mock_user')
        const trendingIds: string[] = [];

        for (let i = 0; i < 8; i++) {
            const docRef = db.collection('interviews').doc();
            const mockInterview = {
                id: docRef.id,
                userId: `mock_user_${Math.floor(Math.random() * 1000)}`, // Random other user
                role: roles[i % roles.length],
                level: i % 2 === 0 ? "Mid-Level" : "Senior",
                techstack: techStacks[i % techStacks.length],
                questions: ["Explain the event loop", "What is closure?", "Explain DI principles", 'How to optimize DB queries?'], // Simple placeholders
                createdAt: new Date(Date.now() - Math.floor(Math.random() * 1000000000)).toISOString(), // Random past date
                finalized: true,
                type: "Technical",
                stats: {
                    totalAttempts: Math.floor(Math.random() * 50) + 5, // Random popularity
                    averageScore: Math.floor(Math.random() * 40) + 60, // 60-100
                    highestScore: 98,
                    lowestScore: 45,
                    lastUpdated: new Date().toISOString()
                }
            };

            await docRef.set(mockInterview);
            trendingIds.push(docRef.id);
            console.log(`Created Trending Interview: ${docRef.id}`);
        }

        if (userId) {
            // 2. Create 'Created' Interviews for Current User
            for (let i = 0; i < 4; i++) {
                const docRef = db.collection('interviews').doc();
                const myInterview = {
                    id: docRef.id,
                    userId: userId,
                    role: roles[(i + 2) % roles.length],
                    level: "Junior",
                    techstack: techStacks[(i + 2) % techStacks.length],
                    questions: ["What is a Promise?", "Explain useEffect"],
                    createdAt: new Date().toISOString(),
                    finalized: true,
                    type: "Technical",
                    stats: {
                        totalAttempts: 0,
                        averageScore: 0,
                        lastUpdated: new Date().toISOString()
                    }
                };
                await docRef.set(myInterview);
                console.log(`Created User Interview: ${docRef.id}`);
            }

            // 3. Create 'Completed' Interviews (Feedbacks) for Current User
            // User takes some of the Trending interviews
            for (let i = 0; i < 4; i++) {
                const interviewId = trendingIds[i];
                const feedbackId = `${interviewId}_${userId}`;
                const score = Math.floor(Math.random() * 30) + 70; // 70-100

                await db.collection('user_feedbacks').doc(feedbackId).set({
                    id: feedbackId,
                    interviewId: interviewId,
                    userId: userId,
                    overallScore: score,
                    overallFeedback: "Good attempt. Your technical knowledge is solid but work on communication.",
                    answers: [
                        { question: "Explain the event loop", score: score, feedback: "Correct", userAnswer: "It handles async callbacks...", strengths: ["clarity"], improvements: ["depth"] }
                    ],
                    createdAt: new Date().toISOString()
                });
                console.log(`Created Feedback: ${feedbackId}`);
            }
        }

        return NextResponse.json({
            success: true,
            message: `Seeded successfully! Check your dashboard. Seeding for user: ${userId || 'Guest'}`
        });

    } catch (error: any) {
        console.error("Seeding Error:", error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
