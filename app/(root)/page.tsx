import React from 'react'
import { Button } from "@/components/ui/button";
import Link from "next/link";
import Image from "next/image";
import InterviewCard from "@/components/InterviewCard";
import { getCurrentUser } from "@/lib/actions/auth.action";
import { getInterviewsByUserId, getLatestInterviews } from "@/lib/actions/general.action";

export const dynamic = 'force-dynamic';

const Page = async () => {
    const user = await getCurrentUser();
    const [userInterviews, LatestInterviews] = await Promise.all([
        getInterviewsByUserId(user?.id!),
        getLatestInterviews({ userId: user?.id! }),
    ]);

    const hasPastInterviews = (userInterviews?.length ?? 0) > 0;
    const hasUpcomingInterviews = (LatestInterviews?.length ?? 0) > 0;

    return (
        <>
            <section className="card-cta">
                <div className="flex flex-col gap-2 max-w-lg">

                    <h2>Get Interview Ready With AI Powered Production & Practic</h2>
                    <p className="text-primary-100">Practice on real interivew questions and get instant feedback</p>

                    <Button asChild className="btn-primary max-sm:w-full">
                        <Link href="/interview">
                            Start Practicing
                        </Link>
                    </Button>
                </div>

                <Image src="/robot.png" alt="robot-dude" className="max-sm:hidden" width={400} height={400} />
            </section>

            <section className="flex flex-col gap-6 mt-8">
                <h2>Your Interviews</h2>
                <div className="interviews-section">
                    {hasPastInterviews ? (
                        userInterviews?.map((interview) => (
                            <InterviewCard {...interview} key={interview.id} />
                        ))
                    ) : (
                        <p>You haven&apos;t scheduled any interviews</p>
                    )}
                </div>
            </section>

            <section className="flex flex-col gap-6 mt-8">
                <h2>Interview Questions</h2>
                <div className="interviews-section">
                    {hasUpcomingInterviews ? (
                        LatestInterviews?.map((interview) => (
                            <InterviewCard {...interview} key={interview.id} />
                        ))
                    ) : (
                        <p>There are no new interviews available</p>
                    )}

                </div>
            </section>
        </>
    )
}
export default Page
