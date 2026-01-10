import {db} from "@/firebase/admin";

export async function getInterviewsByUserId(userId:string):Promise<Interview[] | null>{
    // Return empty array if userId is undefined/null
    if (!userId) return [];

    const interviews = await db.collection('interviews')
        .where('userId','==',userId)
        .orderBy('createdAt','desc')
        .get();

    return interviews.docs.map((doc)=>({
        id : doc.id,
        ...doc.data(),
    })) as Interview[];

}

export async function getLatestInterviews(params:GetLatestInterviewsParams):Promise<Interview[] | null>{
    const {userId,limit=20} = params;

    // If no userId, get all finalized interviews
    if (!userId) {
        const interviews = await db.collection('interviews')
            .orderBy('createdAt','desc')
            .where('finalized','==',true)
            .limit(limit)
            .get();

        return interviews.docs.map((doc)=>({
            id : doc.id,
            ...doc.data(),
        })) as Interview[];
    }

    const interviews = await db.collection('interviews')
        .orderBy('createdAt','desc')
        .where('finalized','==',true)
        .where('userId','!=',userId)
        .limit(limit)
        .get();

    return interviews.docs.map((doc)=>({
        id : doc.id,
        ...doc.data(),
    })) as Interview[];

}

export async function getInterviewsById(id:string):Promise<Interview | null>{
    const interview = await db.collection('interviews')
        .doc(id)
        .get();

    return interview.data() as Interview | null;

}