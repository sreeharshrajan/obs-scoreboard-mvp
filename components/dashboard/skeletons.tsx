import { Skeleton } from "@/components/ui/skeleton";

export function SplitLayoutSkeleton() {
    return (
        <div className="flex-1 w-full max-w-7xl mx-auto px-6 md:px-10 flex flex-col py-6 space-y-8">
            {/* Mobile/Header area */}
            <div className="md:hidden space-y-4">
                <Skeleton className="h-8 w-3/4" />
                <Skeleton className="h-6 w-1/2" />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                {/* Left Column (Sidebar) */}
                <div className="lg:col-span-4 space-y-4">
                    <Skeleton className="h-[400px] w-full rounded-3xl" />
                    <div className="grid grid-cols-2 gap-4">
                        <Skeleton className="h-32 w-full rounded-3xl" />
                        <Skeleton className="h-32 w-full rounded-3xl" />
                    </div>
                </div>

                {/* Right Column (Main Content) */}
                <div className="lg:col-span-8 space-y-6">
                    <Skeleton className="h-12 w-full rounded-xl" />
                    <Skeleton className="h-[500px] w-full rounded-4xl" />
                </div>
            </div>
        </div>
    );
}

export function MatchConsoleSkeleton() {
    return (
        <div className="w-full h-full bg-[#FDFDFD] dark:bg-[#1A1A1A] p-4 lg:p-8 flex flex-col gap-6 overflow-hidden">
            {/* Header */}
            <div className="flex justify-between items-center h-16">
                <div className="flex items-center gap-4">
                    <Skeleton className="h-10 w-10 rounded-full" />
                    <div className="space-y-2">
                        <Skeleton className="h-4 w-32" />
                        <Skeleton className="h-3 w-24" />
                    </div>
                </div>
                <Skeleton className="h-10 w-32 rounded-full" />
            </div>

            {/* Main Grid */}
            <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-6 min-h-0">
                {/* Player 1 */}
                <div className="lg:col-span-4 h-full">
                    <Skeleton className="h-full w-full rounded-[2.5rem]" />
                </div>

                {/* Center Controls */}
                <div className="lg:col-span-4 flex flex-col gap-6 h-full">
                    <Skeleton className="h-48 w-full rounded-[2.5rem]" />
                    <Skeleton className="flex-1 w-full rounded-[2.5rem]" />
                </div>

                {/* Player 2 */}
                <div className="lg:col-span-4 h-full">
                    <Skeleton className="h-full w-full rounded-[2.5rem]" />
                </div>
            </div>
        </div>
    );
}

export function FormSkeleton() {
    return (
        <div className="flex-1 w-full max-w-7xl mx-auto px-4 md:px-6 flex flex-col py-2 space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 h-full">
                {/* Left Column Skeleton */}
                <div className="lg:col-span-7 flex flex-col h-full">
                    <div className="bg-slate-50 dark:bg-white/5 p-5 rounded-3xl border border-slate-200 dark:border-white/5 space-y-6 flex-1">
                        <div className="flex justify-between items-center">
                            <Skeleton className="h-6 w-32" />
                            <Skeleton className="h-4 w-16" />
                        </div>

                        {/* Time & Basic Info */}
                        <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-2">
                                <Skeleton className="h-3 w-16" />
                                <Skeleton className="h-10 w-full rounded-xl" />
                            </div>
                            <div className="space-y-2">
                                <Skeleton className="h-3 w-10" />
                                <Skeleton className="h-10 w-full rounded-xl" />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-2">
                                <Skeleton className="h-3 w-20" />
                                <Skeleton className="h-10 w-full rounded-xl" />
                            </div>
                            <div className="space-y-2">
                                <Skeleton className="h-3 w-12" />
                                <Skeleton className="h-10 w-full rounded-xl" />
                            </div>
                        </div>

                        <div className="h-px w-full bg-slate-200 dark:bg-white/5" />

                        {/* Meta Info: Category, Round, Scoring, Status */}
                        <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-2">
                                <Skeleton className="h-3 w-16" />
                                <Skeleton className="h-10 w-full rounded-xl" />
                            </div>
                            <div className="space-y-2">
                                <Skeleton className="h-3 w-12" />
                                <Skeleton className="h-10 w-full rounded-xl" />
                            </div>
                            <div className="space-y-2 col-span-2">
                                <Skeleton className="h-3 w-16" />
                                <Skeleton className="h-10 w-full rounded-xl" />
                            </div>
                            <div className="space-y-2 col-span-2">
                                <Skeleton className="h-3 w-14" />
                                <Skeleton className="h-10 w-full rounded-xl" />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right Column Skeleton */}
                <div className="lg:col-span-5 flex flex-col h-full">
                    <div className="p-5 rounded-[2rem] bg-white dark:bg-[#1A1A1A] border border-slate-200 dark:border-white/5 flex flex-col gap-6 shadow-sm flex-1">
                        <div className="flex justify-center">
                            <Skeleton className="h-5 w-16" />
                        </div>

                        <div className="space-y-4 flex-1 flex flex-col justify-center">
                            <div className="space-y-2">
                                <Skeleton className="h-3 w-16" />
                                <Skeleton className="h-12 w-full rounded-xl" />
                            </div>

                            <div className="flex items-center gap-4">
                                <div className="h-px flex-1 bg-slate-100 dark:bg-white/5" />
                                <Skeleton className="h-3 w-6" />
                                <div className="h-px flex-1 bg-slate-100 dark:bg-white/5" />
                            </div>

                            <div className="space-y-2 text-right">
                                <div className="flex justify-end">
                                    <Skeleton className="h-3 w-16" />
                                </div>
                                <Skeleton className="h-12 w-full rounded-xl" />
                            </div>
                        </div>

                        <Skeleton className="h-10 w-full rounded-xl" />
                    </div>
                </div>
            </div>
        </div>
    );
}
