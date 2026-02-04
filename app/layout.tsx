import type { Metadata } from "next";
import { Toaster } from "sonner";
import { AuthProvider } from '@/lib/providers/AuthProvider';
import QueryProvider from '@/lib/providers/QueryProvider';
import { Geist, Instrument_Sans } from "next/font/google";
import "./globals.css";
import ThemeProvider from '@/lib/providers/ThemeProvider';

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const instrumentSans = Instrument_Sans({
  variable: "--font-instrument",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "ScoreStreamer | Professional OBS Broadcast Control",
  description: "Elite score management for modern racquet sports.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${instrumentSans.variable} font-sans antialiased bg-white dark:bg-[#1A1A1A]`}>
        <ThemeProvider>
          <QueryProvider>
            <AuthProvider>{children}</AuthProvider>
            <Toaster position="top-center" richColors />
          </QueryProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}