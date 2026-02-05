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
        <div className="flex-1 w-full max-w-4xl mx-auto px-6 md:px-10 flex flex-col py-6 space-y-8">
            <div className="space-y-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-8 w-48" />
            </div>

            <div className="bg-white dark:bg-[#1A1A1A] p-6 md:p-8 rounded-3xl border border-slate-200 dark:border-white/5 space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                        <Skeleton className="h-4 w-24" />
                        <Skeleton className="h-12 w-full rounded-xl" />
                    </div>
                    <div className="space-y-2">
                        <Skeleton className="h-4 w-24" />
                        <Skeleton className="h-12 w-full rounded-xl" />
                    </div>
                </div>
                <div className="space-y-2">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-12 w-full rounded-xl" />
                </div>
                <div className="space-y-2">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-12 w-full rounded-xl" />
                </div>
                <div className="flex justify-end pt-4">
                    <Skeleton className="h-16 w-40 rounded-3xl" />
                </div>
            </div>
        </div>
    );
}
