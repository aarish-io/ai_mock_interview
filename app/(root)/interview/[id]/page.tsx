import React from 'react'
import {getInterviewsById} from "@/lib/action/general.action";
import {redirect} from "next/navigation";
import Image from "next/image";
import {getRandomInterviewCover} from "@/lib/utils";
import DisplayTechIcons from "@/components/DisplayTechIcons";
import AgentRetell from "@/components/AgentRetell";
import {getCurrentUser} from "@/lib/action/auth.action";

const Page =async ({params}:RouteParams) => {
    const {id} = await params;
    const interview = await getInterviewsById(id);
    const user = await getCurrentUser();

    if(!interview) redirect('/');

    return (
        <>
            <div className="flex flex-row gap-4 justify-between">
                <div className="flex flex-row gap-4 items-center max-sm:flex-col">
                    <div className="flex flex-row gap-4 items-center">
                        <Image src={getRandomInterviewCover()} alt="cover-image" height={40} width={40}
                               className="rounded-full object-cover size-[40px]"/>
                        <h3 className="capitalize">{interview.role} Interview</h3>
                    </div>

                    <DisplayTechIcons techStack={interview.techstack}/>
                </div>
                <p className="capitalize bg-dark-300 px-4 py-2 h-fit rounded-lg">{interview.type}</p>
            </div>
            <AgentRetell 
                   userName={user?.name}
                   userId={user?.id}
                   type="interview"
                   interviewId={id}
                   questions={interview.questions}
                   interview={interview}
            />

        </>
    )
}
export default Page
