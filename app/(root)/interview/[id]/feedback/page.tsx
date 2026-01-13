import { db } from "@/firebase/admin";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { CheckCircle2, AlertCircle, Home, RefreshCcw } from "lucide-react";

export const dynamic = 'force-dynamic';

interface PageProps {
    params: {
        id: string;
    };
}

export default async function FeedbackPage({ params }: PageProps) {
    const interviewId = params.id;
    const interviewDoc = await db.collection("interviews").doc(interviewId).get();
    const interviewData = interviewDoc.data();

    if (!interviewDoc || !interviewData.feedback) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center p-10 text-center">
                <RefreshCcw className="w-12 h-12 text-primary animate-spin mb-4" />
                <h2 className="text-2xl font-bold">Analysis in Progress...</h2>
                <p className="text-gray-500 mt-2">Our AI is currently analyzing your interview transcript.</p>
                <p className="text-gray-500">Please refresh this page in a few moments.</p>
                <Button onClick={() => window.location.reload()} className="mt-6" variant="outline">
                    Refresh Page
                </Button>
            </div>
        );
    }

    const { feedback, role, level } = interviewData;
    // 2. Extract Data
    const overallScore = feedback.overallScore;
    const overallFeedback = feedback.overallFeedback;
    // 3. UI Layout
    return (
        <div className="min-h-screen bg-gray-50/50 p-6 md:p-10">
            <div className="max-w-4xl mx-auto space-y-8">
                {/* Header Section */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div>
                        <h1 className="text-3xl font-extrabold tracking-tight">Interview Feedback</h1>
                        <p className="text-gray-500 text-lg">{role} • {level}</p>
                    </div>
                    <Link href="/dashboard">
                        <Button variant="outline" className="gap-2">
                            <Home className="w-4 h-4" /> Back to Dashboard
                        </Button>
                    </Link>
                </div>
                {/* Overall Score Card */}
                <div className="bg-white border rounded-xl p-8 shadow-sm flex flex-col items-center text-center relative overflow-hidden">
                    <div className={`absolute top-0 left-0 w-full h-1 ${overallScore >= 80 ? 'bg-green-500' : overallScore >= 50 ? 'bg-yellow-500' : 'bg-red-500'
                        }`} />
                    <h2 className="text-gray-500 font-medium uppercase tracking-wider text-sm">Overall Performance</h2>
                    <div className={`mt-4 text-7xl font-black ${overallScore >= 80 ? 'text-green-600' : overallScore >= 50 ? 'text-yellow-600' : 'text-red-600'
                        }`}>
                        {overallScore}
                        <span className="text-2xl text-gray-400 font-normal">/100</span>
                    </div>
                    <p className="mt-6 text-gray-700 max-w-2xl leading-relaxed text-lg">
                        {overallFeedback}
                    </p>
                </div>
                {/* Feedback List */}
                <h3 className="text-xl font-bold mt-10">Detailed Analysis</h3>
                <div className="space-y-6">
                    {feedback.answers.map((answer: any, index: number) => (
                        <div key={index} className="bg-white border rounded-xl p-6 shadow-sm transition-all hover:shadow-md">
                            {/* Question Header */}
                            <div className="flex justify-between items-start gap-4 mb-4">
                                <h4 className="font-semibold text-lg text-gray-900 leading-snug">
                                    <span className="text-primary mr-2">Q{index + 1}.</span>
                                    {answer.question}
                                </h4>
                                <span className={`shrink-0 px-3 py-1 rounded-full text-sm font-bold border ${answer.score >= 80 ? 'bg-green-50 text-green-700 border-green-200' :
                                    answer.score >= 50 ? 'bg-yellow-50 text-yellow-700 border-yellow-200' :
                                        'bg-red-50 text-red-700 border-red-200'
                                    }`}>
                                    {answer.score}/100
                                </span>
                            </div>
                            {/* User Answer */}
                            <div className="bg-slate-50 border border-slate-100 p-4 rounded-lg mb-4">
                                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">Your Answer</span>
                                <p className="italic text-slate-700">{answer.userAnswer}</p>
                            </div>
                            {/* AI Feedback */}
                            <div className="mb-6">
                                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">Feedback</span>
                                <p className="text-gray-700 leading-relaxed">{answer.feedback}</p>
                            </div>
                            {/* Strengths & Improvements Grid */}
                            <div className="grid md:grid-cols-2 gap-4 pt-4 border-t">
                                <div className="bg-green-50/50 p-4 rounded-lg border border-green-100">
                                    <h5 className="flex items-center gap-2 font-bold text-green-700 mb-2 text-sm uppercase">
                                        <CheckCircle2 className="w-4 h-4" /> Strengths
                                    </h5>
                                    <ul className="space-y-1">
                                        {answer.strengths?.map((s: string, i: number) => (
                                            <li key={i} className="text-sm text-green-800 flex items-start gap-2">
                                                <span className="mt-1.5 w-1 h-1 rounded-full bg-green-500 shrink-0" />
                                                {s}
                                            </li>
                                        )) || <li className="text-sm text-gray-400 italic">None identified</li>}
                                    </ul>
                                </div>
                                <div className="bg-amber-50/50 p-4 rounded-lg border border-amber-100">
                                    <h5 className="flex items-center gap-2 font-bold text-amber-700 mb-2 text-sm uppercase">
                                        <AlertCircle className="w-4 h-4" /> Improvements
                                    </h5>
                                    <ul className="space-y-1">
                                        {answer.improvements?.map((s: string, i: number) => (
                                            <li key={i} className="text-sm text-amber-800 flex items-start gap-2">
                                                <span className="mt-1.5 w-1 h-1 rounded-full bg-amber-500 shrink-0" />
                                                {s}
                                            </li>
                                        )) || <li className="text-sm text-gray-400 italic">None identified</li>}
                                    </ul>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
                <div className="flex justify-center pt-8 pb-10 gap-4">
                    <Link href={`/interview/${interviewId}`}>
                        <Button size="lg" className="px-8 btn-secondary">Retake Interview</Button>
                    </Link>
                    <Link href="/dashboard">
                        <Button size="lg" className="px-8">Start New Interview</Button>
                    </Link>
                </div>
            </div>
        </div>
    );
}
