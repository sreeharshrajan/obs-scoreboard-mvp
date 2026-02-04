// lib/providers/ThemeProvider.tsx
'use client';
import { useEffect } from 'react';
import { useThemeStore } from '@/lib/stores/themeStore';

export default function ThemeProvider({ children }: { children: React.ReactNode }) {
    const { theme } = useThemeStore();

    useEffect(() => {
        const root = document.documentElement;
        if (theme === 'dark') {
            root.classList.add('dark');
        } else {
            root.classList.remove('dark');
        }
    }, [theme]);

    return <>{children}</>;
}
