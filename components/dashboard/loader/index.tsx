import { cn } from "@/lib/utils";

interface DashboardLoaderProps {
    className?: string;
    message?: string;
}

const DashboardLoader = ({ className, message = "Loading..." }: DashboardLoaderProps) => (
    <div className={cn("flex-1 w-full h-full min-h-[300px] flex items-center justify-center bg-transparent", className)}>
        <div className="flex flex-col items-center gap-4">
            <div className="animate-spin w-8 h-8 border-2 border-[#FF5A09] border-t-transparent rounded-full shadow-lg shadow-[#FF5A09]/20" />
            <span className="text-[10px] font-bold uppercase tracking-[0.3em] text-[#FF5A09]/80 animate-pulse">{message}</span>
        </div>
    </div>
);

export default DashboardLoader;