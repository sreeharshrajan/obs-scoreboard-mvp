// components/shared/ThemeToggle.tsx
'use client';
import { useEffect, useState } from 'react';
import { useThemeStore } from '@/lib/stores/themeStore';
import { Sun, Moon } from 'lucide-react';

export default function ThemeToggle() {
    const { theme, toggleTheme } = useThemeStore();
    const [mounted, setMounted] = useState(false);

    // Ensure the component only renders after hydration to avoid SSR mismatch
    useEffect(() => {
        setMounted(true);
    }, []);

    if (!mounted) {
        // Render a placeholder button without icon to match server output
        return (
            <button
                aria-label="Toggle theme"
                className="flex items-center gap-1 p-2 rounded-full hover:bg-slate-100 dark:hover:bg-white/10 transition-colors"
            />
        );
    }

    return (
        <button
            onClick={toggleTheme}
            aria-label="Toggle theme"
            className="flex items-center gap-1 p-2 rounded-full hover:bg-slate-100 dark:hover:bg-white/10 transition-colors"
        >
            {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
        </button>
    );
}
