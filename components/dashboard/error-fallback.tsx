"use client";

import { AlertCircle, RefreshCcw } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

interface ErrorFallbackProps {
    error?: string;
    retry?: () => void;
    backUrl?: string;
    backLabel?: string;
    className?: string;
}

export default function ErrorFallback({
    error = "Something went wrong",
    retry,
    backUrl,
    backLabel = "Go Back",
    className
}: ErrorFallbackProps) {
    return (
        <div className={cn("flex-1 w-full h-full min-h-[400px] flex flex-col items-center justify-center p-8 text-center", className)}>
            <div className="bg-red-50 dark:bg-red-900/10 p-4 rounded-full border border-red-100 dark:border-red-900/20 mb-6 shadow-sm">
                <AlertCircle className="text-red-500" size={32} />
            </div>

            <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Error Occurred</h3>

            <p className="text-slate-500 dark:text-slate-400 max-w-sm text-sm leading-relaxed mb-8">
                {error}
            </p>

            <div className="flex items-center gap-3">
                {retry && (
                    <button
                        onClick={retry}
                        className="px-6 py-2.5 bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-white/10 hover:border-slate-300 transition-all flex items-center gap-2"
                    >
                        <RefreshCcw size={14} />
                        Retry
                    </button>
                )}

                {backUrl && (
                    <Link
                        href={backUrl}
                        className="px-6 py-2.5 bg-black dark:bg-white text-white dark:text-black rounded-xl text-xs font-bold uppercase tracking-wider hover:scale-105 active:scale-95 transition-all shadow-lg hover:shadow-xl"
                    >
                        {backLabel}
                    </Link>
                )}
            </div>
        </div>
    );
}
