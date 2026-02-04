import React, { forwardRef } from "react";

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
    label: string;
    options: { label: string; value: string }[];
    error?: string;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
    ({ label, options, className, error, ...props }, ref) => {
        return (
            <div className="space-y-1.5 w-full text-left">
                <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 ml-1">
                    {label}
                </label>
                <div className="relative">
                    <select
                        {...props}
                        ref={ref}
                        className={`w-full h-11 px-4 rounded-xl bg-white dark:bg-[#2A2A2A]/40 border ${error ? "border-red-500/50" : "border-slate-200 dark:border-white/5"} outline-none focus:border-[#FF5A09]/50 transition-all text-[11px] font-bold uppercase tracking-wider cursor-pointer appearance-none ${className}`}
                    >
                        {options.map((opt) => (
                            <option key={opt.value} value={opt.value}>{opt.label}</option>
                        ))}
                    </select>
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                        <svg width="10" height="6" viewBox="0 0 10 6" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M1 1L5 5L9 1" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                    </div>
                </div>
                {error && <p className="text-[9px] text-red-500 font-bold uppercase ml-1">{error}</p>}
            </div>
        );
    }
);

Select.displayName = "Select";