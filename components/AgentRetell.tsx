'use client'

import React, { useEffect, useState } from 'react'
import Image from "next/image";
import { cn } from "@/lib/utils";
import { useRouter } from "next/navigation";
import { retellClient } from "@/lib/retell.sdk";

enum CallStatus {
    INACTIVE = "INACTIVE",
    CONNECTING = "CONNECTING",
    ACTIVE = "ACTIVE",
    FINISHED = "FINISHED",
}

interface SavedMessages {
    role: 'user' | 'system' | 'assistant',
    content: string;
}

const AgentRetell = ({ userName, userId, type, interviewId, questions }: AgentProps) => {
    const router = useRouter();
    const [isSpeaking, setIsSpeaking] = useState(false);
    const [isUserSpeaking, setIsUserSpeaking] = useState(false);
    const [callStatus, setCallStatus] = useState<CallStatus>(CallStatus.INACTIVE);
    const [messages, setMessages] = useState<SavedMessages[]>([]);
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
        // Retell event listeners
        const onCallStarted = () => {
            console.log("Retell call started");
            setCallStatus(CallStatus.ACTIVE);
        };

        const onCallEnded = () => {
            console.log("Retell call ended");
            setCallStatus(CallStatus.FINISHED);
            setCallEnded(true);
        };

        const onAgentStartTalking = () => {
            setIsSpeaking(true);
        };

        const onAgentStopTalking = () => {
            setIsSpeaking(false);
        };

        const onUpdate = (update: any) => {
            // Handle transcript updates
            if (update.transcript) {
                const newMessage = {
                    role: update.transcript.role === 'agent' ? 'assistant' : 'user',
                    content: update.transcript.content
                } as SavedMessages;
                setMessages(prev => [...prev, newMessage]);

                if (update.transcript.role === 'user') {
                    setIsUserSpeaking(true);
                    // Reset user speaking state after 2 seconds of silence
                    setTimeout(() => {
                        setIsUserSpeaking(false);
                    }, 2000);
                }
            }
        };

        const onError = (error: any) => {
            console.error("Retell error:", error);
            setCallEnded(true);
        };

        retellClient.on("call_started", onCallStarted);
        retellClient.on("call_ended", onCallEnded);
        retellClient.on("agent_start_talking", onAgentStartTalking);
        retellClient.on("agent_stop_talking", onAgentStopTalking);
        retellClient.on("update", onUpdate);
        retellClient.on("error", onError);

        return () => {
            retellClient.off("call_started", onCallStarted);
            retellClient.off("call_ended", onCallEnded);
            retellClient.off("agent_start_talking", onAgentStartTalking);
            retellClient.off("agent_stop_talking", onAgentStopTalking);
            retellClient.off("update", onUpdate);
            retellClient.off("error", onError);
        };
    }, []);

    // Handle redirect after call ends
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

        try {
            // Get access token from our API
            const response = await fetch('/api/retell/create-call', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    userName,
                    userId,
                    type,
                    interviewId,
                    questions
                })
            });

            const data = await response.json();

            if (!data.success || !data.accessToken) {
                throw new Error('Failed to get access token');
            }

            // Start the Retell call with the access token
            await retellClient.startCall({
                accessToken: data.accessToken,
            });

        } catch (error) {
            console.error("Failed to start Retell call:", error);
            setCallStatus(CallStatus.INACTIVE);
            alert("Failed to start call. Please try again.");
        }
    };

    const handleDisconnect = async () => {
        setCallStatus(CallStatus.FINISHED);
        setCallEnded(true);
        retellClient.stopCall();
    };

    const latestMessage = messages[messages.length - 1]?.content;
    const isCallInactiveOrFinished = callStatus === CallStatus.INACTIVE || callStatus === CallStatus.FINISHED;

    return (
        <>
            <div className="call-view">
                <div className="card-interviewer">
                    <div className="avatar">
                        <Image src="/ai-avatar.png" alt="retell" height={54} width={65} className="object-cover" />
                        {isSpeaking && <span className="animate-speak" />}
                    </div>
                    <h3>AI Interviewer</h3>
                </div>

                <div className="card-border">
                    <div className="card-content">
                        <div className="avatar">
                            <Image src="/user-avatar.png" alt="user" height={540} width={540} className="object-cover rounded-full size-[120px]" />
                            {isUserSpeaking && <span className="animate-speak" />}
                        </div>
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

            <div className="w-full justify-center flex">
                {callStatus !== CallStatus.ACTIVE ? (
                    <button className="relative btn-call" onClick={handleCall} disabled={callEnded}>
                        <span className={cn('absolute animate-ping rounded-full opacity-75', callStatus !== CallStatus.CONNECTING && 'hidden')} />
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

export default AgentRetell
