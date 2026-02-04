import type { Metadata } from "next";
import { AuthProvider } from '@/lib/providers/AuthProvider';
import QueryProvider from '@/lib/providers/QueryProvider';
import { Geist, Instrument_Sans } from "next/font/google";
import "./globals.css";

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
    <html lang="en" className="dark">
      <body className={`${geistSans.variable} ${instrumentSans.variable} font-sans antialiased bg-white dark:bg-[#1A1A1A]`}>
        <QueryProvider>
          <AuthProvider>{children}</AuthProvider>
        </QueryProvider>
      </body>
    </html>
  );
}