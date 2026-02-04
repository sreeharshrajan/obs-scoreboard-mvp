"use client";

import React, { useEffect, useState } from "react";
import { Activity, Clock } from "lucide-react";
import { db } from "@/lib/firebase/client";
import { collectionGroup, query, onSnapshot, collection } from "firebase/firestore";
import clsx from 'clsx';
import { MatchState } from "@/types/match";

export default function ScoreOverlay({ matchId }: { matchId: string }) {
    const [match, setMatch] = useState<MatchState | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [elapsedDisplay, setElapsedDisplay] = useState<number>(0);

    // Sponsors State
    const [sponsors, setSponsors] = useState<{ id: string, advertUrl: string, name: string }[]>([]);
    const [currentSponsorIndex, setCurrentSponsorIndex] = useState(0);
    const [tournamentId, setTournamentId] = useState<string | null>(null);

    useEffect(() => {
        // collectionGroup allows finding the matchId across any tournament path
        const q = query(collectionGroup(db, "matches"));

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const matchDoc = snapshot.docs.find(d => d.id === matchId);
            if (matchDoc) {
                setMatch(matchDoc.data() as MatchState);
                // Extract tournamentId from reference path: tournaments/{id}/matches/{matchId}
                if (matchDoc.ref.parent.parent) {
                    setTournamentId(matchDoc.ref.parent.parent.id);
                }
                setError(null);
            } else {
                setError("Match not found");
            }
            setLoading(false);
        }, (err) => {
            console.error("Firestore Error:", err);
            setError(err.message);
            setLoading(false);
        });

        return () => unsubscribe();
    }, [matchId]);

    // Timer Logic
    useEffect(() => {
        if (!match) return;

        if (!match.isTimerRunning) {
            const val = match.timerElapsed || 0;
            setElapsedDisplay(prev => (prev !== val ? val : prev));
            return;
        }

        const calculateTime = () => {
            const now = Date.now();
            const startTime = match.timerStartTime ?? now;
            return (match.timerElapsed || 0) + (now - startTime) / 1000;
        };

        setElapsedDisplay(calculateTime());
        const timerInterval = setInterval(() => {
            setElapsedDisplay(calculateTime());
        }, 100);

        return () => clearInterval(timerInterval);
    }, [match?.isTimerRunning, match?.timerStartTime, match?.timerElapsed, match]);

    // Sponsors Logic
    useEffect(() => {
        const shouldFetch = match?.isSponsorsOverlayActive || match?.status === 'break';
        if (!tournamentId || !shouldFetch) return;

        const q = query(collection(db, "tournaments", tournamentId, "sponsors")); // Consider filtering by status here if possible or client side
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const activeSponsors = snapshot.docs
                .map(d => ({ id: d.id, ...d.data() } as any))
                .filter(s => s.status === true)
                .sort((a, b) => (a.priority || 99) - (b.priority || 99)); // Basic sort
            setSponsors(activeSponsors);
        });

        return () => unsubscribe();
    }, [tournamentId, match?.isSponsorsOverlayActive, match?.status]);

    // Carousel Timer
    useEffect(() => {
        const shouldRun = match?.isSponsorsOverlayActive || match?.status === 'break';
        if (!shouldRun || sponsors.length === 0) return;

        const interval = setInterval(() => {
            setCurrentSponsorIndex(prev => (prev + 1) % sponsors.length);
        }, 8000); // 8 seconds per slide

        return () => clearInterval(interval);
    }, [match?.isSponsorsOverlayActive, match?.status, sponsors.length]);


    const formatTime = (seconds: number) => {
        const safeSeconds = isNaN(seconds) ? 0 : Math.max(0, seconds);
        const m = Math.floor(safeSeconds / 60);
        const s = Math.floor(safeSeconds % 60);
        return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    };

    if (loading || error || !match) return null; // Keep OBS clean on error/loading

    // Render Sponsors Overlay
    // Render Sponsor Cards Logic
    const showSponsors = (match.isSponsorsOverlayActive || match.status === 'break') && sponsors.length > 0;

    // Handle Badminton Schema
    const p1Name = match.player1?.name2
        ? `${match.player1.name} / ${match.player1.name2}`
        : match.player1?.name || "Player 1";
    const p2Name = match.player2?.name2
        ? `${match.player2.name} / ${match.player2.name2}`
        : match.player2?.name || "Player 2";
    const p1Score = match.player1?.score || 0;
    const p2Score = match.player2?.score || 0;
    const p1Serving = match.player1?.isServing ?? false;
    const p2Serving = match.player2?.isServing ?? false;

    const isLive = match.status === "live" || match.isTimerRunning;

    return (
        <div
            className="fixed inset-0 p-8 pointer-events-none font-instrument transition-opacity duration-500"
            style={{ transform: `scale(${match.overlayScale || 1})`, transformOrigin: 'center' }}
        >
            {/* TOP LEFT: Scoreboard (Badminton Style) */}
            <div className="absolute top-8 left-8 flex items-stretch bg-black/90 text-white rounded-xl overflow-hidden shadow-2xl border border-white/10 backdrop-blur-md animate-in fade-in slide-in-from-left-4">
                <div className={clsx("flex flex-col items-center justify-center px-2 min-w-[80px]", isLive ? 'bg-[#FF5A09]' : 'bg-slate-900')}>
                    {match.showTournamentLogo !== false && match.tournamentLogo ? (
                        <img src={match.tournamentLogo} alt="Logo" className="w-12 h-12 object-contain mb-1" />
                    ) : (
                        isLive ? <Activity size={24} className="text-white" /> : <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500">{match.status || 'OFF'}</span>
                    )}
                    {(match.status === 'break') && <span className="text-[8px] font-bold uppercase text-white animate-pulse mt-1">BREAK</span>}
                </div>

                <div className="flex flex-col divide-y divide-white/10">
                    {/* Player 1 */}
                    <div className="flex items-center justify-between min-w-[300px] px-4 py-2 gap-4 relative overflow-hidden">
                        <div className="flex items-center gap-2">
                            {p1Serving && <div className="w-2 h-2 bg-[#FF5A09] rounded-full animate-pulse shadow-[0_0_8px_#FF5A09]" />}
                            <div className="flex flex-col">
                                <span className={clsx("text-sm font-black uppercase tracking-tight", p1Serving ? "text-white" : "text-white/70")}>{p1Name}</span>
                            </div>
                        </div>
                        <span className="text-3xl font-black tabular-nums text-[#FF5A09]">{p1Score}</span>
                    </div>

                    {/* Player 2 */}
                    <div className="flex items-center justify-between min-w-[300px] px-4 py-2 gap-4 relative overflow-hidden">
                        <div className="flex items-center gap-2">
                            {p2Serving && <div className="w-2 h-2 bg-[#FF5A09] rounded-full animate-pulse shadow-[0_0_8px_#FF5A09]" />}
                            <div className="flex flex-col">
                                <span className={clsx("text-sm font-black uppercase tracking-tight", p2Serving ? "text-white" : "text-white/70")}>{p2Name}</span>
                            </div>
                        </div>
                        <span className="text-3xl font-black tabular-nums text-[#FF5A09]">{p2Score}</span>
                    </div>
                </div>

                {/* Timer Section (New) */}
                <div className="flex flex-col items-center justify-center px-4 bg-white/5 border-l border-white/10 min-w-[90px]">
                    <Clock size={12} className="text-white/40 mb-1" />
                    <span className="text-xl font-mono font-bold tracking-tight">{formatTime(elapsedDisplay)}</span>
                </div>
            </div>

            {/* TOP RIGHT: Logos */}
            <div className="absolute top-8 right-8 flex items-center gap-4">
                {match.showStreamerLogo !== false && match.streamerLogo && (
                    <img src={match.streamerLogo} alt="Streamer Logo" className="h-16 w-auto object-contain drop-shadow-md" />
                )}
            </div>

            {/* BOTTOM RIGHT: Extra Info Popup */}
            {match.showMatchInfo !== false && (match.matchCategory || match.category || match.tournamentName) && (
                <div className="absolute bottom-12 right-12 animate-in slide-in-from-right-8 duration-500">
                    <div className="bg-black/90 text-white px-6 py-4 rounded-2xl shadow-2xl flex items-center gap-4 border border-white/10 backdrop-blur-md">
                        <div className="flex flex-col gap-0.5 text-right">
                            <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#FF5A09] mb-1">{match.tournamentName || "Tournament"}</span>
                            <div className="flex flex-col">
                                <span className="text-sm font-black uppercase tracking-tight text-white">{match.matchCategory || match.category || "Match"}</span>
                                <div className="flex items-center justify-end gap-2 text-[9px] font-bold text-white/40 uppercase tracking-widest mt-1">
                                    {match.roundType && <span>{match.roundType}</span>}
                                    {match.roundType && match.ageGroup && <span>•</span>}
                                    {match.ageGroup && <span>{match.ageGroup}</span>}
                                    {(match.roundType || match.ageGroup) && match.court && <span>•</span>}
                                    {match.court && <span>{match.court}</span>}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}