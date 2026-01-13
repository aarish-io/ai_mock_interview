'use server';


import {auth,db} from "@/firebase/admin";
import {cookies} from "next/headers";

const ONE_WEEK = 60*60*24*7;

export async function signUp(params:SignUpParams){
    const {uid,email,name} = params;

    try {
        const userRecord = await db.collection('user').doc(uid).get();
        if(userRecord.exists){
            return {
                success:false,
                message:"User already exists, Please sign In",
            }
        }
        await db.collection('user').doc(uid).set({
            name,email
        })

        return{
            success:true,
            message:"User created successfully",
        }
    }
    catch(e:any){
        console.error("error creating user",e);

        if(e.code === 'auth/email-already-exists'){
            return{
                success:false,
                message:"Email already exists",
            }
        }

        return{
            success:false,
            message:"Error creating user",
        }
    }
}

export async function setSessionCookie(idToken:string){
    const cookieStore = await cookies();

    const sessionCookie = await auth.createSessionCookie(idToken,{
        expiresIn : ONE_WEEK * 1000,
    })

    cookieStore.set("session",sessionCookie,{
        httpOnly:true,
        maxAge: ONE_WEEK,
        secure : process.env.NODE_ENV === "production",
        path : "/",
        sameSite : "lax"
    })


}

export async function signIn(params:SignInParams){
    const {email,idToken} = params;

    try {

        const userRecord = await auth.getUserByEmail(email);

        if(!userRecord){
            return {
                success:false,
                message:"User not found, please sign up",
            }
        }

        await setSessionCookie(idToken);

        return {
            success:true,
            message:"User signed in successfully",
        }

    }
    catch (e){
        console.error("Error signing in",e);
        return {
            success:false,
            message:"Error signing in",
        }
    }
}

export async function  getCurrentUser(): Promise<User|null>{
    const cookieStore = await cookies();

    const sessionCookie = cookieStore.get('session')?.value;

    if(!sessionCookie){
        return null;
    }

    try {
        const decodeClaims = await auth.verifySessionCookie(sessionCookie,true);

        const userRecord = await db.collection('user').doc(decodeClaims.uid).get();

        if(!userRecord) return null;

        return {
            ...userRecord.data(),
            id : userRecord.id
        } as User;

    }
    catch (e){
        console.log(e);

        return null;
    }
}

export async function isAuthenticated(){
    const user = await getCurrentUser();

    return !!user;
}

