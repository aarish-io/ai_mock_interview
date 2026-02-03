import React from 'react'
import { Button } from "@/components/ui/button";
import Link from "next/link";
import Image from "next/image";
import InterviewCard from "@/components/InterviewCard";
import { getCurrentUser } from "@/lib/actions/auth.action";
import { getInterviewsByUserId, getCompletedInterviews, getTrendingInterviews } from "@/lib/actions/general.action";

export const dynamic = 'force-dynamic';

const Page = async () => {
    const user = await getCurrentUser();

    // Fetch all dashboard data in parallel
    const [createdInterviews, completedInterviews, trendingInterviews] = await Promise.all([
        getInterviewsByUserId(user?.id!),
        getCompletedInterviews(user?.id!),
        getTrendingInterviews(5),
    ]);

    const hasCreatedInterviews = (createdInterviews?.length ?? 0) > 0;
    const hasCompletedInterviews = (completedInterviews?.length ?? 0) > 0;
    const hasTrendingInterviews = (trendingInterviews?.length ?? 0) > 0;

    return (
        <div className="flex flex-col gap-10 pb-10">
            <section className="card-cta">
                <div className="flex flex-col gap-2 max-w-lg">
                    <h2>Get Interview Ready With AI Powered Production & Practice</h2>
                    <p className="text-primary-100">Practice on real interview questions and get instant feedback</p>

                    <div className="flex gap-4 items-center max-sm:flex-col w-full mt-4">
                        <Button asChild className="btn-primary w-full sm:w-fit">
                            <Link href="/interview">
                                Start Practicing
                            </Link>
                        </Button>
                        <Button asChild variant="outline" className="w-full sm:w-fit border-primary-200 text-primary-200 hover:bg-primary-200 hover:text-dark-100 font-bold rounded-full min-h-10 px-6">
                            <Link href="/resume">
                                Analyze Resume
                            </Link>
                        </Button>
                    </div>
                </div>

                <Image src="/robot.png" alt="robot-dude" className="max-sm:hidden" width={400} height={400} />
            </section>

            {/* Section 1: Your Created Interviews */}
            <section className="flex flex-col gap-6">
                <div className="flex items-center justify-between">
                    <h2>Your Created Interviews</h2>
                    <Link href="/interviews/created" className="text-primary-200 text-sm font-semibold hover:underline">
                        View All
                    </Link>
                </div>
                <div className="interviews-section">
                    {hasCreatedInterviews ? (
                        createdInterviews?.slice(0, 4).map((interview) => (
                            <InterviewCard {...interview} key={interview.id} />
                        ))
                    ) : (
                        <p className="text-light-400">You haven&apos;t generated any interviews yet.</p>
                    )}
                </div>
            </section>

            {/* Section 2: Completed Interviews */}
            <section className="flex flex-col gap-6">
                <div className="flex items-center justify-between">
                    <h2>Completed Interviews</h2>
                    {/* Placeholder link for future view all page */}
                    {/* <Link href="/interviews/completed" className="text-primary-200 text-sm font-semibold hover:underline">View All</Link> */}
                </div>
                <div className="interviews-section">
                    {hasCompletedInterviews ? (
                        completedInterviews?.slice(0, 4).map((interview) => (
                            <InterviewCard {...interview} key={`completed-${interview.id}`} />
                        ))
                    ) : (
                        <p className="text-light-400">You haven&apos;t completed any interviews yet.</p>
                    )}
                </div>
            </section>

            {/* Section 3: Trending Public Interviews */}
            <section className="flex flex-col gap-6">
                <h2>Trending Public Interviews</h2>
                <div className="interviews-section">
                    {hasTrendingInterviews ? (
                        trendingInterviews?.map((interview) => (
                            <InterviewCard {...interview} key={`trending-${interview.id}`} />
                        ))
                    ) : (
                        <p className="text-light-400">No public interviews available right now.</p>
                    )}
                </div>
            </section>
        </div>
    )
}
export default Page
