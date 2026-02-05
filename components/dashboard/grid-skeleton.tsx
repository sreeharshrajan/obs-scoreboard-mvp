import { Skeleton } from "@/components/ui/skeleton";

export default function GridSkeleton() {
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pb-10">
            {[...Array(6)].map((_, i) => (
                <div key={i} className="h-56 rounded-[2rem] bg-white dark:bg-[#2A2A2A]/40 border border-slate-200 dark:border-white/5 p-6 flex flex-col justify-between relative overflow-hidden">
                    <div className="space-y-4 relative z-10">
                        <div className="flex justify-between">
                            <Skeleton className="h-5 w-16 rounded-lg" />
                            <Skeleton className="h-4 w-4 rounded-full" />
                        </div>
                        <Skeleton className="h-8 w-3/4 rounded-lg" />
                        <div className="space-y-2">
                            <Skeleton className="h-3 w-1/2 rounded-md" />
                            <Skeleton className="h-3 w-1/3 rounded-md" />
                        </div>
                    </div>
                    <div className="pt-4 border-t border-slate-50 dark:border-white/5 relative z-10">
                        <Skeleton className="h-3 w-1/4 rounded-md" />
                    </div>
                </div>
            ))}
        </div>
    );
}
