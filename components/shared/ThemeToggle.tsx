"use client";

import React, { useState, useEffect, useRef } from "react";
import { useTheme } from "next-themes";
import { Sun, Moon, Monitor, Check } from "lucide-react";

export default function ThemeToggle() {
    const [isOpen, setIsOpen] = useState(false);
    const [mounted, setMounted] = useState(false);
    const { theme, setTheme } = useTheme();
    const dropdownRef = useRef(null);

    // Avoid hydration mismatch by only rendering after mount
    useEffect(() => {
        setMounted(true);
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    if (!mounted) return <div className="w-10 h-10" />; // Placeholder to prevent layout shift

    const options = [
        { value: "light", label: "Light", icon: Sun },
        { value: "dark", label: "Dark", icon: Moon },
        { value: "system", label: "System", icon: Monitor },
    ];

    const CurrentIcon = options.find((opt) => opt.value === theme)?.icon || Monitor;

    return (
        <div className="relative" ref={dropdownRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center justify-center w-10 h-10 rounded-xl transition-all 
                   bg-slate-100 dark:bg-white/5 hover:bg-slate-200 dark:hover:bg-white/10
                   border border-slate-200 dark:border-white/10"
                aria-label="Select theme"
            >
                <CurrentIcon size={18} className="text-slate-700 dark:text-slate-200" />
            </button>

            {isOpen && (
                <div className="absolute right-0 mt-2 w-36 overflow-hidden rounded-xl z-50
                        bg-white dark:bg-[#1A1A1A] 
                        border border-slate-200 dark:border-white/10 
                        shadow-xl shadow-black/10 animate-in fade-in zoom-in-95 duration-100">
                    <div className="p-1">
                        {options.map((opt) => (
                            <button
                                key={opt.value}
                                onClick={() => {
                                    setTheme(opt.value);
                                    setIsOpen(false);
                                }}
                                className={`flex w-full items-center justify-between px-3 py-2 text-sm rounded-lg transition-colors
                    ${theme === opt.value
                                        ? 'bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400'
                                        : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/5'
                                    }`}
                            >
                                <div className="flex items-center gap-2">
                                    <opt.icon size={16} />
                                    {opt.label}
                                </div>
                                {theme === opt.value && <Check size={14} strokeWidth={3} />}
                            </button>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}