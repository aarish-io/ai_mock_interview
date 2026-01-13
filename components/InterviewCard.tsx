import React from 'react'
import dayjs from "dayjs";
import Image from "next/image";
import { getRandomInterviewCover } from "@/lib/utils";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import DisplayTechIcons from "@/components/DisplayTechIcons";

const InterviewCard = ({ id, userId, role, type, techstack, createdAt, feedback }: InterviewCardProps) => {

    const normalisedType = /mix/gi.test(type) ? "Mixed" : type;
    const formattedDate = dayjs(feedback?.createdAt || createdAt || Date.now()).format('MMM D, YYYY');
    return (
        <div className="card-border max-sm:w-full min-h-96 w-[360px] ">
            <div className="card-interview">
                <div>
                    <div className="absolute right-0 top-0 w-fit py-2 px-4 rounded-bl-lg bg-light-600">
                        <p className="badge-text">{normalisedType}</p>
                    </div>
                    <Image src={getRandomInterviewCover()} alt="cover" width={90} height={90}
                        className="object-fit rounded-full size-[90px]" />

                    <h3 className="mt-5 capitalize">
                        {role} Interview
                    </h3>

                    <div className="flex flex-row gap-5 mt-3">
                        <div className="flex flex-row gap-2">
                            <Image src="/calendar.svg" alt="calendar" width={22} height={22} />
                            <p>{formattedDate}</p>
                        </div>

                        <div className="flex flex-row gap-2">
                            <Image src="/star.svg" alt="star" width={22} height={22} />
                            <p>{feedback?.overallScore || "---"}/100</p>
                        </div>
                    </div>

                    <p className="line-clamp-2">
                        {feedback?.overallFeedback || "No feedback yet. Take test to improve the score"}
                    </p>
                </div>

                <div className="flex flex-row gap-2 justify-between">
                    <DisplayTechIcons techStack={techstack} />

                    <Button className="btn-primary">
                        <Link href={feedback ? `/interview/${id}/feedback` : `/interview/${id}`}>
                            {feedback ? "View Feedback" : "Take Test"}
                        </Link>
                    </Button>
                </div>
            </div>
        </div>
    )
}
export default InterviewCard
