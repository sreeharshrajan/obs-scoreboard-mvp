interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
    label: string;
    options: { label: string; value: string }[];
}

export function Select({ label, options, className, ...props }: SelectProps) {
    return (
        <div className="space-y-1.5 w-full">
            <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 ml-1">
                {label}
            </label>
            <select
                {...props}
                className={`w-full h-11 px-4 rounded-xl bg-white dark:bg-[#2A2A2A]/40 border border-slate-200 dark:border-white/5 outline-none focus:border-[#FF5A09]/50 transition-all text-[11px] font-bold uppercase tracking-wider cursor-pointer appearance-none ${className}`}
            >
                {options.map((opt) => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
            </select>
        </div>
    );
}