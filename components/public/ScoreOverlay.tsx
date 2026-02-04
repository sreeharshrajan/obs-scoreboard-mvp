"use client";

import React, { useEffect, useState } from "react";
import { db } from "@/lib/firebase/client";
import { collectionGroup, query, onSnapshot, collection } from "firebase/firestore";
import { MatchState } from "@/types/match";

// Components
import Scoreboard from "./score-overlay/Scoreboard";
import SponsorBreakDisplay from "./score-overlay/SponsorBreakDisplay";
import SponsorTickler from "./score-overlay/SponsorTickler";
import MatchInfoDisplay from "./score-overlay/MatchInfoDisplay";

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

    if (loading || error || !match) return null; // Keep OBS clean on error/loading

    return (
        <div
            className="fixed inset-0 p-8 pointer-events-none font-instrument transition-opacity duration-500"
            style={{ transform: `scale(${match.overlayScale || 1})`, transformOrigin: 'center' }}
        >
            <SponsorBreakDisplay
                sponsors={sponsors}
                currentSponsorIndex={currentSponsorIndex}
                match={match}
            />

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
        </div>
    );
}