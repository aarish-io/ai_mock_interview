'use client'

import React, {useEffect, useState} from 'react'
import Image from "next/image";
import {cn} from "@/lib/utils";
import {useRouter} from "next/navigation";
import {vapi} from "@/lib/vapi.sdk";

enum CallStatus{
    INACTIVE = "INACTIVE",
    CONNECTING = "CONNECTING",
    ACTIVE = "ACTIVE",
    FINISHED = "FINISHED",
}

interface SavedMessages{
    role:'user' | 'system' | 'assistant',
    content: string;
}

// Your Vapi Assistant ID from dashboard (via env variable)
const VAPI_ASSISTANT_ID = process.env.NEXT_PUBLIC_VAPI_ASSISTANT_ID!;

const Agent = ({userName,userId,type,interviewId,questions}:AgentProps) => {
    const router = useRouter();
    const [isSpeaking, setIsSpeaking] = useState(false);
    const [callStatus, setCallStatus] = useState<CallStatus>(CallStatus.INACTIVE);
    const [messages, setMessages] = useState<SavedMessages[]>([])
    const [callEnded, setCallEnded] = useState(false);
    const [micPermission, setMicPermission] = useState<'granted' | 'denied' | 'prompt' | 'unknown'>('unknown');

    // Check microphone permission on mount
    useEffect(() => {
        const checkMicPermission = async () => {
            try {
                const result = await navigator.permissions.query({ name: 'microphone' as PermissionName });
                setMicPermission(result.state as 'granted' | 'denied' | 'prompt');
                result.onchange = () => {
                    setMicPermission(result.state as 'granted' | 'denied' | 'prompt');
                };
            } catch (error) {
                console.log("Could not check mic permission:", error);
            }
        };
        checkMicPermission();
    }, []);

    useEffect(() => {
        const onCallStart =()=> {
            console.log("Call started");
            setCallStatus(CallStatus.ACTIVE);
        };
        const onCallEnd =()=> {
            console.log("Call ended");
            setCallStatus(CallStatus.FINISHED);
            setCallEnded(true);
        };
        const onMessage = (message:Message)=>{
            if(message.type ==='transcript' && message.transcriptType === 'final'){
                const newMessage = { role: message.role, content: message.transcript };
                setMessages((prev) => [...prev, newMessage]);
            }
        }
        const onSpeechStart = ()=> setIsSpeaking(true);
        const onSpeechEnd = ()=> setIsSpeaking(false);

        const onError = (error:Error)=> {
            console.log("Vapi Error:", error);
        };

        vapi.on('call-start', onCallStart);
        vapi.on('call-end', onCallEnd);
        vapi.on('message', onMessage);
        vapi.on('speech-start', onSpeechStart);
        vapi.on('speech-end', onSpeechEnd);
        vapi.on('error', onError);

        return () => {
            vapi.off('call-start', onCallStart);
            vapi.off('call-end', onCallEnd);
            vapi.off('message', onMessage);
            vapi.off('speech-start', onSpeechStart);
            vapi.off('speech-end', onSpeechEnd);
            vapi.off('error', onError);
        };

    }, []);

    // Handle redirect after call ends - with a delay to allow user to see what happened
    useEffect(() => {
        if (callStatus === CallStatus.FINISHED && callEnded) {
            const timer = setTimeout(() => {
                router.push('/');
            }, 3000);
            return () => clearTimeout(timer);
        }
    }, [callStatus, callEnded, router]);

    const handleCall = async () => {
        setCallStatus(CallStatus.CONNECTING);
        setCallEnded(false);

        // Request microphone permission first
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            stream.getTracks().forEach(track => track.stop());
            setMicPermission('granted');
        } catch (error) {
            console.error("Microphone permission denied:", error);
            setMicPermission('denied');
            setCallStatus(CallStatus.INACTIVE);
            alert("Microphone access is required for the call. Please allow microphone access and try again.");
            return;
        }

        // Using Assistant ID from Vapi dashboard
        try {
            await vapi.start(VAPI_ASSISTANT_ID, {
                variableValues: {
                    username: userName,
                    userid: userId
                }
            });
        } catch (error) {
            console.error("Failed to start Vapi call:", error);
            setCallStatus(CallStatus.INACTIVE);
        }
    }

    const handleDisconnect = async()=>{
        setCallStatus(CallStatus.FINISHED);
        setCallEnded(true);
        await vapi.stop();
    }

    const latestMessage = messages[messages.length-1]?.content;
    const isCallInactiveOrFinished = callStatus === CallStatus.INACTIVE || callStatus === CallStatus.FINISHED;

    return (
        <>
            <div className="call-view">
                <div className="card-interviewer">
                    <div className="avatar">
                        <Image src="/ai-avatar.png" alt="vapi" height={54} width={65} className="object-cover"/>
                        {isSpeaking && <span className="animate-speak"/>}
                    </div>
                    <h3>AI Interviewer</h3>
                </div>

                <div className="card-border">
                    <div className="card-content">
                        <Image src="/user-avatar.png" alt="vapi" height={540} width={540} className="object-cover rounded-full size-[120px]"/>
                        <h3>{userName}</h3>
                    </div>

                </div>
            </div>

            {/* Microphone status indicator */}
            {micPermission === 'denied' && (
                <div className="text-center p-3 bg-red-900/50 rounded-lg mb-4">
                    <p className="text-red-300">⚠️ Microphone access denied. Please enable it in browser settings.</p>
                </div>
            )}

            {/* Show call ended message */}
            {callEnded && (
                <div className="text-center p-4 bg-dark-200 rounded-lg mb-4">
                    <p className="text-light-100">Call ended. Redirecting to home...</p>
                </div>
            )}

            {messages.length>0 && !callEnded && (
                <div className="transcript-border">
                    <div className="transcript">
                        <p key={latestMessage} className={cn('transition-opacity duration-500 opacity-0','animate-fade-in opacity-100')}>
                            {latestMessage}</p>
                    </div>
                </div>
            )}

            <div className="w-full justify-center flex">
                {callStatus !== CallStatus.ACTIVE ? (
                    <button className="relative btn-call" onClick={handleCall} disabled={callEnded}>
                        <span className={cn('absolute animate-ping rounded-full opacity-75', callStatus !== CallStatus.CONNECTING && 'hidden')}/>

                        <span>
                            {callEnded ? 'Redirecting...' : (isCallInactiveOrFinished ? 'Call' : '....')}
                        </span>

                    </button>
                ) : (
                    <button className="btn-disconnect" onClick={handleDisconnect}>
                        End
                    </button>
                )}
            </div>
        </>
    )
}
export default Agent

