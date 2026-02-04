import React, { forwardRef } from "react";

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
    label: string;
    error?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
    ({ label, error, className, ...props }, ref) => {
        return (
            <div className="space-y-1.5 w-full text-left">
                <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 ml-1">
                    {label}
                </label>
                <input
                    {...props}
                    ref={ref}
                    className={`w-full h-11 px-4 rounded-xl bg-white dark:bg-[#2A2A2A]/40 border ${error ? "border-red-500/50" : "border-slate-200 dark:border-white/5"
                        } outline-none focus:border-[#FF5A09]/50 transition-all text-sm shadow-sm ${className}`}
                />
                {error && <p className="text-[9px] text-red-500 font-bold uppercase ml-1">{error}</p>}
            </div>
        );
    }
);

Input.displayName = "Input";