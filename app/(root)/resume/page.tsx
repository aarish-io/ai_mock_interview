'use client';

import React, { useState, useTransition } from 'react';
import { Button } from "@/components/ui/button";
import { Upload, FileText, CheckCircle, AlertCircle, Loader2, Sparkles } from 'lucide-react';
import { analyzeResume, type ResumeAnalysis } from '@/lib/actions/resume.action';
import { toast } from 'sonner';

const ResumePage = () => {
    const [file, setFile] = useState<File | null>(null);
    const [analysis, setAnalysis] = useState<ResumeAnalysis | null>(null);
    const [isPending, startTransition] = useTransition();

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const selectedFile = e.target.files[0];
            if (selectedFile.type !== 'application/pdf') {
                toast.error("Please upload a PDF file");
                return;
            }
            setFile(selectedFile);
            setAnalysis(null); // Reset previous analysis
        }
    };

    const handleAnalyze = () => {
        if (!file) return;

        startTransition(async () => {
            const formData = new FormData();
            formData.append('resume', file);

            const result = await analyzeResume(formData);

            if (result.success && result.data) {
                setAnalysis(result.data);
                toast.success("Resume analyzed successfully!");
            } else {
                toast.error(result.error || "Failed to analyze resume");
            }
        });
    };

    return (
        <div className="flex flex-col gap-10 pb-10">
            <section className="card-cta relative overflow-hidden">
                <div className="flex flex-col gap-2 max-w-lg z-10">
                    <h2>AI Resume Analyzer (Beta) 🚀</h2>
                    <p className="text-primary-100">
                        Upload your resume to get an instant ATS score, skill extraction, and personalized improvement tips powered by Gemini AI.
                    </p>
                </div>
                {/* Decorative background element */}
                <div className="absolute right-0 top-0 h-full w-1/3 bg-white/5 opacity-20 transform skew-x-12" />
            </section>

            <div className="flex flex-col lg:flex-row gap-8 items-start">

                {/* LEFT: Upload Section */}
                <section className="w-full lg:w-1/3 flex flex-col gap-6">
                    <div className={`p-8 border-2 border-dashed rounded-2xl flex flex-col items-center justify-center text-center gap-4 transition-colors relative ${file ? 'border-success-100/50 bg-success-100/5' : 'border-primary-200/30 bg-dark-200 hover:border-primary-200/60'}`}>
                        <div className={`p-4 rounded-full ${file ? 'bg-success-100/10' : 'bg-primary-200/10'}`}>
                            {file ? <CheckCircle className="size-8 text-success-100" /> : <Upload className="size-8 text-primary-200" />}
                        </div>
                        <div>
                            <p className="text-lg font-semibold text-white">
                                {file ? "Resume Selected" : "Upload Resume (PDF)"}
                            </p>
                            <p className="text-sm text-light-400">
                                {file ? "Drag & drop to replace" : "Drag & drop or click to browse"}
                            </p>
                        </div>
                        <input
                            type="file"
                            accept="application/pdf"
                            onChange={handleFileChange}
                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                        />
                    </div>

                    {file && (
                        <div className="flex items-center gap-3 p-4 bg-dark-200 rounded-xl border border-primary-200/20">
                            <FileText className="size-6 text-primary-200" />
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-white truncate">{file.name}</p>
                                <p className="text-xs text-light-400">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                            </div>
                            <Button
                                onClick={handleAnalyze}
                                disabled={isPending}
                                className="btn-primary"
                            >
                                {isPending ? <Loader2 className="animate-spin" /> : "Analyze"}
                            </Button>
                        </div>
                    )}
                </section>

                {/* RIGHT: Results Section */}
                <section className="w-full lg:w-2/3">
                    {isPending && (
                        <div className="flex flex-col items-center justify-center h-64 gap-4 text-center animate-fadeIn">
                            <Loader2 className="size-12 animate-spin text-primary-200" />
                            <p className="text-lg text-white font-medium">Analyzing your resume...</p>
                            <p className="text-sm text-light-400">Extracting skills, checking ATS compatibility, and generating feedback.</p>
                        </div>
                    )}

                    {!isPending && !analysis && !file && (
                        <div className="flex flex-col items-center justify-center h-64 gap-4 text-center text-light-400 border border-dark-200 rounded-2xl bg-dark-200/50">
                            <Sparkles className="size-10 opacity-20" />
                            <p>Upload a resume to see the magic happen.</p>
                        </div>
                    )}

                    {analysis && !isPending && (
                        <div className="flex flex-col gap-6 animate-fadeIn">

                            {/* Score Card */}
                            <div className="p-6 rounded-2xl bg-gradient-to-r from-dark-200 to-dark-300 border border-primary-200/20 flex flex-col sm:flex-row items-center gap-6">
                                <div className="relative size-32 flex-none">
                                    <svg className="size-full -rotate-90" viewBox="0 0 36 36">
                                        {/* Background Circle */}
                                        <path className="text-dark-100" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="currentColor" strokeWidth="3" />
                                        {/* Progress Circle */}
                                        <path
                                            className={`${analysis.atsScore >= 70 ? 'text-success-100' : analysis.atsScore >= 50 ? 'text-yellow-500' : 'text-destructive-100'} transition-all duration-1000 ease-out`}
                                            d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                                            fill="none"
                                            stroke="currentColor"
                                            strokeWidth="3"
                                            strokeDasharray={`${analysis.atsScore}, 100`}
                                        />
                                    </svg>
                                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                                        <span className="text-3xl font-bold text-white">{analysis.atsScore}</span>
                                        <span className="text-[10px] uppercase text-light-400 font-bold">ATS Score</span>
                                    </div>
                                </div>
                                <div>
                                    <h3 className="mb-2">Professional Summary</h3>
                                    <p className="text-light-100 text-sm leading-relaxed">{analysis.summary}</p>
                                </div>
                            </div>

                            {/* Skills */}
                            <div className="p-6 rounded-2xl bg-dark-200 border border-dark-100">
                                <h3 className="mb-4 flex items-center gap-2">
                                    <Sparkles className="size-5 text-primary-200" /> Extracted Skills
                                </h3>
                                <div className="flex flex-wrap gap-2">
                                    {analysis.skills.map((skill, i) => (
                                        <span key={i} className="px-3 py-1 rounded-full bg-primary-200/10 text-primary-200 text-sm font-medium border border-primary-200/20">
                                            {skill}
                                        </span>
                                    ))}
                                </div>
                            </div>

                            {/* Improvements */}
                            <div className="grid md:grid-cols-2 gap-6">
                                <div className="p-6 rounded-2xl bg-dark-200 border border-dark-100">
                                    <h3 className="mb-4 flex items-center gap-2 text-success-100">
                                        <CheckCircle className="size-5" /> Strong Points
                                    </h3>
                                    <ul className="space-y-2">
                                        {analysis.strongPoints.map((point, i) => (
                                            <li key={i} className="flex gap-2 text-sm text-light-100">
                                                <span className="text-success-100 mt-1">•</span> {point}
                                            </li>
                                        ))}
                                    </ul>
                                </div>

                                <div className="p-6 rounded-2xl bg-dark-200 border border-dark-100">
                                    <h3 className="mb-4 flex items-center gap-2 text-destructive-100">
                                        <AlertCircle className="size-5" /> Improvements
                                    </h3>
                                    <ul className="space-y-2">
                                        {analysis.improvements.map((point, i) => (
                                            <li key={i} className="flex gap-2 text-sm text-light-100">
                                                <span className="text-destructive-100 mt-1">•</span> {point}
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            </div>

                        </div>
                    )}
                </section>
            </div>
        </div>
    )
}

export default ResumePage;
