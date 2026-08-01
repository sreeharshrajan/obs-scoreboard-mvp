"use client";

import React, { useEffect, useState, useRef } from "react";
import { db } from "@/lib/firebase/client";
import { collectionGroup, query, onSnapshot, collection, doc } from "firebase/firestore";
import { MatchState } from "@/types/match";

// Modern Components
import Scoreboard from "./score-overlay/Scoreboard";
import SponsorBreakDisplay from "./score-overlay/SponsorBreakDisplay";
import SponsorTickler from "./score-overlay/SponsorTickler";
import MatchInfoDisplay from "./score-overlay/MatchInfoDisplay";
import FullScreenMatchInfo from "./score-overlay/FullScreenMatchInfo";
import ResolutionWrapper from "./score-overlay/ResolutionWrapper";

// Classic Components
import ClassicScoreboard from "./score-overlay/classic/ClassicScoreboard";
import ClassicMatchInfoDisplay from "./score-overlay/classic/ClassicMatchInfoDisplay";
import ClassicSponsorTickler from "./score-overlay/classic/ClassicSponsorTickler";
import ClassicFullScreenMatchInfo from "./score-overlay/classic/ClassicFullScreenMatchInfo";

// BWF Pro Components
import BwfScoreboard from "./score-overlay/bwf/BwfScoreboard";
import BwfSponsorTickler from "./score-overlay/bwf/BwfSponsorTickler";
import BwfFullScreenMatchInfo from "./score-overlay/bwf/BwfFullScreenMatchInfo";

export default function ScoreOverlay({ matchId }: { matchId: string }) {
    const [match, setMatch] = useState<MatchState | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [elapsedDisplay, setElapsedDisplay] = useState<number>(0);

    // Sponsors State
    const [sponsors, setSponsors] = useState<{ id: string, advertUrl: string, name: string }[]>([]);
    const [currentSponsorIndex, setCurrentSponsorIndex] = useState(0);
    const [tournamentId, setTournamentId] = useState<string | null>(null);
    const tournamentIdRef = useRef<string | null>(null);

    useEffect(() => {
        // 1. Realtime Firestore Subscription (Uses specific doc listener when tournamentId is known)
        let docUnsub: (() => void) | null = null;
        if (tournamentIdRef.current) {
            const docRef = doc(db, "tournaments", tournamentIdRef.current, "matches", matchId);
            docUnsub = onSnapshot(docRef, (docSnap) => {
                if (docSnap.exists()) {
                    setMatch(docSnap.data() as MatchState);
                    setError(null);
                    setLoading(false);
                }
            }, (err) => {
                console.error("Firestore Doc Error:", err);
            });
        }

        // 2. Polling Fallback for OBS Browser Sources (guarantees real-time updates even if WebSockets fail in OBS CEF)
        let isMounted = true;
        const pollOverlayData = async () => {
            try {
                const tId = tournamentIdRef.current;
                const url = tId
                    ? `/api/public/overlay/${matchId}?tournamentId=${encodeURIComponent(tId)}`
                    : `/api/public/overlay/${matchId}`;
                const res = await fetch(url, { cache: 'no-store' });
                if (!res.ok) return;
                const data = await res.json();
                if (isMounted && data.match) {
                    setMatch(data.match);
                    if (data.sponsors && data.sponsors.length > 0) {
                        setSponsors(data.sponsors);
                    }
                    if (data.tournamentId) {
                        setTournamentId(data.tournamentId);
                        tournamentIdRef.current = data.tournamentId;
                    }
                    setError(null);
                    setLoading(false);
                }
            } catch (err) {
                console.error("Overlay Polling Error:", err);
            }
        };

        pollOverlayData();
        const pollInterval = setInterval(pollOverlayData, 2000);

        return () => {
            isMounted = false;
            if (docUnsub) docUnsub();
            clearInterval(pollInterval);
        };
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

    // Sponsors Logic: subscribe only when sponsors can be visible to avoid unnecessary reads
    useEffect(() => {
        const shouldSubscribe =
            !!tournamentId &&
            (match?.isSponsorsOverlayActive || match?.status === "break" || match?.showFullScreenMatchDetails);

        if (!shouldSubscribe) {
            return;
        }

        const q = query(collection(db, "tournaments", tournamentId, "sponsors"));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const activeSponsors = snapshot.docs
                .map(d => ({ id: d.id, ...d.data() } as any))
                .filter(s => s.status !== false)
                .sort((a, b) => (a.priority || 99) - (b.priority || 99));
            setSponsors(activeSponsors);
        }, (err) => {
            console.error("Sponsors Firestore listener error:", err);
        });

        return () => unsubscribe();
    }, [tournamentId, match?.isSponsorsOverlayActive, match?.status, match?.showFullScreenMatchDetails]);

    // Carousel Timer
    useEffect(() => {
        const shouldRun = match?.isSponsorsOverlayActive || match?.status === 'break';
        if (!shouldRun || sponsors.length === 0) return;

        const interval = setInterval(() => {
            setCurrentSponsorIndex(prev => (prev + 1) % sponsors.length);
        }, 8000);

        return () => clearInterval(interval);
    }, [match?.isSponsorsOverlayActive, match?.status, sponsors.length]);

    if (loading || error || !match) return null;

    const isClassic = match.overlayTemplate === 'classic';
    const isBwf = match.overlayTemplate === 'bwf';

    return (
        <ResolutionWrapper baseWidth={1920} baseHeight={1080}>
            {/* Layer 1: Full-Screen Break & Sponsor Overlay */}
            <div className="absolute inset-0 z-50 pointer-events-none">
                <SponsorBreakDisplay
                    sponsors={sponsors}
                    currentSponsorIndex={currentSponsorIndex}
                    match={match}
                />
            </div>

            {/* Layer 2: HUD Graphics Layer */}
            <div className="relative w-full h-full p-6 md:p-12 pointer-events-none font-instrument transition-opacity duration-500">
                {isBwf ? (
                    <>
                        {!match.showFullScreenMatchDetails && (
                            <>
                                <BwfSponsorTickler
                                    sponsors={sponsors}
                                    currentSponsorIndex={currentSponsorIndex}
                                    match={match}
                                />
                                <BwfScoreboard
                                    match={match}
                                    elapsedDisplay={elapsedDisplay}
                                />
                            </>
                        )}
                        <BwfFullScreenMatchInfo
                            match={match}
                            sponsors={sponsors}
                            currentSponsorIndex={currentSponsorIndex}
                        />
                    </>
                ) : isClassic ? (
                    <>
                        {!match.showFullScreenMatchDetails && (
                            <>
                                <ClassicSponsorTickler
                                    sponsors={sponsors}
                                    currentSponsorIndex={currentSponsorIndex}
                                    match={match}
                                />
                                <ClassicScoreboard
                                    match={match}
                                    elapsedDisplay={elapsedDisplay}
                                />
                                <ClassicMatchInfoDisplay
                                    match={match}
                                />
                            </>
                        )}
                        <ClassicFullScreenMatchInfo
                            match={match}
                            sponsors={sponsors}
                            currentSponsorIndex={currentSponsorIndex}
                        />
                    </>
                ) : (
                    <>
                        {!match.showFullScreenMatchDetails && (
                            <>
                                <SponsorTickler
                                    sponsors={sponsors}
                                    currentSponsorIndex={currentSponsorIndex}
                                    match={match}
                                />
                                <Scoreboard
                                    match={match}
                                    elapsedDisplay={elapsedDisplay}
                                />
                                <MatchInfoDisplay
                                    match={match}
                                />
                            </>
                        )}
                        <FullScreenMatchInfo
                            match={match}
                            sponsors={sponsors}
                            currentSponsorIndex={currentSponsorIndex}
                        />
                    </>
                )}
            </div>
        </ResolutionWrapper>
    );
}