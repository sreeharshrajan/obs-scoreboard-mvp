"use client";

import React, { useEffect, useState } from "react";
import { db } from "@/lib/firebase/client";
import { collectionGroup, query, onSnapshot, collection } from "firebase/firestore";
import { MatchState } from "@/types/match";

// Modern Components
import Scoreboard from "./score-overlay/Scoreboard";
import SponsorBreakDisplay from "./score-overlay/SponsorBreakDisplay";
import SponsorTickler from "./score-overlay/SponsorTickler";
import MatchInfoDisplay from "./score-overlay/MatchInfoDisplay";

// Classic Components
import ClassicScoreboard from "./score-overlay/classic/ClassicScoreboard";
import ClassicMatchInfoDisplay from "./score-overlay/classic/ClassicMatchInfoDisplay";
import ClassicSponsorTickler from "./score-overlay/classic/ClassicSponsorTickler";

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

        const q = query(collection(db, "tournaments", tournamentId, "sponsors"));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const activeSponsors = snapshot.docs
                .map(d => ({ id: d.id, ...d.data() } as any))
                .filter(s => s.status === true)
                .sort((a, b) => (a.priority || 99) - (b.priority || 99));
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
        }, 8000);

        return () => clearInterval(interval);
    }, [match?.isSponsorsOverlayActive, match?.status, sponsors.length]);

    if (loading || error || !match) return null;

    const isClassic = match.overlayTemplate === 'classic';

    return (
        <div className="relative w-screen h-screen overflow-hidden p-6 md:p-12 pointer-events-none font-instrument transition-opacity duration-500">
            <SponsorBreakDisplay
                sponsors={sponsors}
                currentSponsorIndex={currentSponsorIndex}
                match={match}
            />

            {isClassic ? (
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
            ) : (
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
        </div>
    );
}