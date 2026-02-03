import { ArrowUpRight } from "lucide-react";
import Link from "next/link";

interface StatsCardProps {
    title: string;
    value: number | string | undefined;
    icon: React.ReactNode;
    color: "blue" | "orange" | "dark";
    isPrimary?: boolean;
    link?: string;
}

export function StatsCard({ title, value, icon, color, isPrimary, link }: StatsCardProps) {
    const colorClasses = {
        blue: "bg-blue-500/10 text-blue-500",
        orange: "bg-[#FF5A09]/10 text-[#FF5A09]",
        dark: "bg-slate-100 dark:bg-white/10 text-slate-900 dark:text-white",
    };

    return (
        <Link href={link ?? "#"} className={`
            p-4 sm:p-5 md:p-6 rounded-[1.5rem] sm:rounded-[2rem] border transition-all duration-500 group relative flex flex-col justify-between overflow-hidden 
            ${isPrimary
                ? 'bg-[#1A1A1A] dark:bg-white text-white dark:text-[#1A1A1A] border-transparent shadow-xl shadow-black/5'
                : 'bg-white dark:bg-[#2A2A2A]/40 border-slate-200 dark:border-white/5 hover:border-[#FF5A09]/30'
            }
        `}>
            <div className="flex justify-between items-start relative z-10">
                <div className={`
                    /* Responsive Icon Container */
                    w-8 h-8 sm:w-9 sm:h-9 
                    rounded-xl flex items-center justify-center transition-transform group-hover:rotate-12 duration-500 
                    ${isPrimary ? 'bg-[#FF5A09] text-white' : colorClasses[color]}
                `}>
                    {/* Scale icon down slightly for mobile */}
                    <div className="scale-90 sm:scale-100">
                        {icon}
                    </div>
                </div>

                {/* Keep arrow visible on touch devices or hover */}
                <ArrowUpRight size={14} className="opacity-20 sm:opacity-0 group-hover:opacity-40 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all" />
            </div>

            <div className="relative z-10 mt-3 sm:mt-4">
                <p className={`
                    text-[7px] sm:text-[8px] 
                    font-bold uppercase tracking-[0.15em] sm:tracking-[0.2em] mb-0.5 
                    ${isPrimary ? 'opacity-60' : 'text-slate-400'}
                `}>
                    {title}
                </p>
                <p className="text-3xl sm:text-4xl font-instrument tracking-tighter leading-none">
                    {value || 0}
                </p>
            </div>

            {/* Subtle background glow for Primary card on mobile */}
            {isPrimary && (
                <div className="absolute -right-4 -bottom-4 w-16 h-16 bg-[#FF5A09]/10 blur-2xl rounded-full pointer-events-none" />
            )}
        </Link>
    );
}