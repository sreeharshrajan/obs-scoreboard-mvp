'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { useParams } from 'next/navigation';
import { MatchState } from '@/types/match';
import { auth } from '@/lib/firebase/client';
import { User } from 'firebase/auth';
import { MatchConsoleSkeleton } from "@/components/dashboard/skeletons";
import ErrorFallback from "@/components/dashboard/error-fallback";

// Components
import ConsoleHeader from '@/components/match-console/ConsoleHeader';
import PlayerCard from '@/components/match-console/PlayerCard';
import MatchTimer from '@/components/match-console/MatchTimer';
import QuickActions from '@/components/match-console/QuickActions';

// --- Fetchers ---
const fetchMatch = async (tournamentId: string, matchId: string, token: string): Promise<MatchState> => {
    const res = await fetch(`/api/tournaments/${tournamentId}/matches/${matchId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
    });
    if (!res.ok) throw new Error('Failed to fetch match data');
    return res.json();
};

const fetchTournament = async (tournamentId: string, token: string) => {
    const res = await fetch(`/api/tournaments/${tournamentId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
    });
    if (!res.ok) throw new Error('Failed to fetch tournament data');
    return res.json();
};

const updateMatch = async ({ tournamentId, matchId, data, token }: { tournamentId: string; matchId: string; data: Partial<MatchState>; token: string }) => {
    const res = await fetch(`/api/tournaments/${tournamentId}/matches/${matchId}`, {
        method: 'PATCH',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Failed to update match');
    return res.json();
};

// --- Custom Hook for Debouncing ---
function useDebouncedMutation(
    mutationFn: (variables: Partial<MatchState>) => Promise<any>,
    delay: number = 500
) {
    const timeoutRef = useRef<NodeJS.Timeout | null>(null);
    const pendingUpdatesRef = useRef<Partial<MatchState>>({});

    const debouncedMutate = useCallback((updates: Partial<MatchState>) => {
        // Merge updates into pending
        pendingUpdatesRef.current = { ...pendingUpdatesRef.current, ...updates };
        if (updates.player1) {
            pendingUpdatesRef.current.player1 = {
                ...(pendingUpdatesRef.current.player1 || {}),
                ...updates.player1
            };
        }
        if (updates.player2) {
            pendingUpdatesRef.current.player2 = {
                ...(pendingUpdatesRef.current.player2 || {}),
                ...updates.player2
            };
        }


        if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
        }

        timeoutRef.current = setTimeout(() => {
            mutationFn(pendingUpdatesRef.current);
            pendingUpdatesRef.current = {};
            timeoutRef.current = null;
        }, delay);
    }, [mutationFn, delay]);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            if (timeoutRef.current) clearTimeout(timeoutRef.current);
        };
    }, []);

    return debouncedMutate;
}


// --- Main Component ---

export default function MatchConsole() {
    const params = useParams();
    const tournamentId = params.id as string;
    const matchId = params.matchId as string;
    const queryClient = useQueryClient();
    const containerRef = useRef<HTMLDivElement>(null);

    const [elapsedDisplay, setElapsedDisplay] = useState<number>(0);
    const [isFullscreen, setIsFullscreen] = useState(false);

    // Helper to get token
    const getToken = async () => {
        const user = auth.currentUser;
        if (!user) {
            return new Promise<string>((resolve, reject) => {
                const unsubscribe = auth.onIdTokenChanged(async (user: User | null) => {
                    unsubscribe();
                    if (user) {
                        resolve(await user.getIdToken());
                    } else {
                        reject(new Error("Not authenticated"));
                    }
                });
            });
        }
        return user.getIdToken();
    };

    // 1. Data Query: Match
    const { data: match, isLoading: isMatchLoading, isError: isMatchError } = useQuery<MatchState>({
        queryKey: ['match', matchId],
        queryFn: async () => {
            const token = await getToken();
            return fetchMatch(tournamentId, matchId, token);
        },
        refetchInterval: 2000,
        enabled: !!matchId && !!tournamentId,
        retry: (failureCount, error) => {
            if (error.message === "Not authenticated") return false;
            return failureCount < 3;
        }
    });

    // 2. Data Query: Tournament
    const { data: tournament, isLoading: isTournamentLoading } = useQuery({
        queryKey: ['tournament', tournamentId],
        queryFn: async () => {
            const token = await getToken();
            return fetchTournament(tournamentId, token);
        },
        enabled: !!tournamentId,
    });

    // 2.5. Data Query: User Profile (for Logo Sync)
    const { data: userProfile } = useQuery({
        queryKey: ['userProfile'],
        queryFn: async () => {
            const user = auth.currentUser;
            if (!user) return null;
            const token = await user.getIdToken();
            const res = await fetch(`/api/users/${user.uid}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (!res.ok) return null;
            return res.json();
        },
        staleTime: 1000 * 60 * 5, // Cache for 5 min
    });

    const isLoading = isMatchLoading || isTournamentLoading;
    const isError = isMatchError;

    // 3. Mutation Logic
    const mutation = useMutation({
        mutationFn: async (newData: Partial<MatchState>) => {
            const token = await getToken();
            return updateMatch({ tournamentId, matchId, data: newData, token });
        },
        onMutate: async (newData) => {
            await queryClient.cancelQueries({ queryKey: ['match', matchId] });
            const previous = queryClient.getQueryData<MatchState>(['match', matchId]);

            if (previous) {
                queryClient.setQueryData<MatchState>(['match', matchId], (old) => {
                    if (!old) return previous;
                    const merged = { ...old, ...newData };
                    if (newData.player1) merged.player1 = { ...old.player1, ...newData.player1 };
                    if (newData.player2) merged.player2 = { ...old.player2, ...newData.player2 };
                    return merged;
                });
            }
            return { previous };
        },
        onError: (err, newData, context) => {
            if (context?.previous) {
                queryClient.setQueryData(['match', matchId], context.previous);
            }
        },
        onSettled: () => {
            queryClient.invalidateQueries({ queryKey: ['match', matchId] });
        },
    });

    // Wrapper for debounced calls (specifically for rapid score/server updates)
    const debouncedMutate = useDebouncedMutation(mutation.mutateAsync, 500);


    // 4. Sync Info to Match Doc (Tournament Logo + Streamer Logo)
    useEffect(() => {
        if (match) {
            const updates: Partial<MatchState> = {};
            let hasUpdates = false;

            // Sync Tournament Info
            if (tournament) {
                if (tournament.name && match.tournamentName !== tournament.name) {
                    updates.tournamentName = tournament.name;
                    hasUpdates = true;
                }
                if (tournament.category && match.category !== tournament.category) {
                    updates.category = tournament.category;
                    hasUpdates = true;
                }
                if (tournament.logo && match.tournamentLogo !== tournament.logo) {
                    updates.tournamentLogo = tournament.logo;
                    hasUpdates = true;
                }
            }

            // Sync Streamer Logo
            if (userProfile?.streamerLogo && match.streamerLogo !== userProfile.streamerLogo) {
                updates.streamerLogo = userProfile.streamerLogo;
                hasUpdates = true;
            }

            if (hasUpdates) {
                mutation.mutate(updates);
            }
        }
    }, [tournament, match, mutation, userProfile]);


    // 5. Timer & Clock Logic
    useEffect(() => {
        if (!match) return;
        if (!match.isTimerRunning) {
            setElapsedDisplay(match.timerElapsed || 0);
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
    }, [match?.isTimerRunning, match?.timerStartTime, match?.timerElapsed]);

    // Fullscreen Logic
    const toggleFullscreen = useCallback(() => {
        if (!document.fullscreenElement) {
            containerRef.current?.requestFullscreen().catch((err) => {
                console.error(`Error attempting to enable full-screen mode: ${err.message}`);
            });
        } else {
            document.exitFullscreen();
        }
    }, []);

    useEffect(() => {
        const handler = () => setIsFullscreen(!!document.fullscreenElement);
        document.addEventListener('fullscreenchange', handler);
        return () => document.removeEventListener('fullscreenchange', handler);
    }, []);

    const formatTime = useCallback((seconds: number) => {
        const safeSeconds = isNaN(seconds) ? 0 : Math.max(0, seconds);
        const m = Math.floor(safeSeconds / 60);
        const s = Math.floor(safeSeconds % 60);
        return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    }, []);


    // Optimistic Updater Helper
    const optimisticUpdate = useCallback((newData: Partial<MatchState>) => {
        queryClient.setQueryData<MatchState>(['match', matchId], (old) => {
            if (!old) return old;
            const merged = { ...old, ...newData };
            if (newData.player1) merged.player1 = { ...old.player1, ...newData.player1 };
            if (newData.player2) merged.player2 = { ...old.player2, ...newData.player2 };
            return merged;
        });
    }, [queryClient, matchId]);


    // --- Handlers ---

    // Memoize the safeMatch object so it doesn't change reference purely due to re-renders (unless data changes)
    const safeMatch = useMemo(() => {
        if (!match) return null;
        return {
            ...match,
            player1: match.player1 || { name: 'Player 1', score: 0, isServing: true },
            player2: match.player2 || { name: 'Player 2', score: 0, isServing: false }
        };
    }, [match]);


    const handleScore = useCallback((team: 'player1' | 'player2', delta: number) => {
        if (!safeMatch) return;
        const currentScore = safeMatch[team]?.score || 0;
        const newScore = Math.max(0, currentScore + delta);

        // Optimistic Update immediately
        const updates = { [team]: { ...safeMatch[team], score: newScore } };
        optimisticUpdate(updates);

        // Debounced Server Update
        debouncedMutate(updates);
    }, [safeMatch, optimisticUpdate, debouncedMutate]);


    const toggleServer = useCallback((team: 'player1' | 'player2') => {
        if (!safeMatch) return;
        const updates: Partial<MatchState> = {
            player1: { ...safeMatch.player1, isServing: team === 'player1' },
            player2: { ...safeMatch.player2, isServing: team === 'player2' },
            serverNumber: 1 as 1
        };
        optimisticUpdate(updates);
        debouncedMutate(updates);
    }, [safeMatch, optimisticUpdate, debouncedMutate]);


    const handleStopTimer = useCallback(() => {
        if (!safeMatch || !safeMatch.timerStartTime) return;
        const now = Date.now();
        const additionalSeconds = (now - safeMatch.timerStartTime) / 1000;
        mutation.mutate({
            isTimerRunning: false,
            timerElapsed: (safeMatch.timerElapsed || 0) + additionalSeconds,
            timerStartTime: null
        });
    }, [safeMatch, mutation]);

    const handleStartTimer = useCallback(() => {
        mutation.mutate({
            isTimerRunning: true,
            timerStartTime: Date.now(),
            status: 'live'
        });
    }, [mutation]);

    const handleToggleTimer = useCallback(() => {
        if (!safeMatch) return;
        safeMatch.isTimerRunning ? handleStopTimer() : handleStartTimer();
    }, [safeMatch, handleStopTimer, handleStartTimer]);

    const handleEndMatch = useCallback(() => {
        if (safeMatch?.isTimerRunning) handleStopTimer();
        mutation.mutate({
            status: 'completed'
        });
    }, [safeMatch, handleStopTimer, mutation]);

    const handleToggleBreak = useCallback(() => {
        if (!safeMatch) return;
        if (safeMatch.status === 'break') {
            mutation.mutate({ status: 'live' });
        } else {
            mutation.mutate({ status: 'break' });
        }
    }, [safeMatch, mutation]);

    const handleUpdateMatch = useCallback((updates: Partial<MatchState>) => {
        mutation.mutate(updates);
    }, [mutation]);

    const swapSides = useCallback(() => {
        if (!safeMatch) return;
        mutation.mutate({
            player1: safeMatch.player2,
            player2: safeMatch.player1
        });
    }, [safeMatch, mutation]);

    /* 
    // Reset Not used in UI currently but kept for reference or future use
    const resetMatch = () => {
        if (!confirm('Are you sure you want to reset the match?')) return;
        if (!match) return;
        mutation.mutate({
            player1: { ...match.player1, score: 0, isServing: true },
            player2: { ...match.player2, score: 0, isServing: false },
            isTimerRunning: false,
            timerElapsed: 0,
            timerStartTime: null,
            serverNumber: 1,
            status: 'scheduled'
        });
    };
    */

    if (isLoading) return <MatchConsoleSkeleton />;
    if (isError || !match || !safeMatch) {
        if (isError) console.error(isError);
        return <ErrorFallback error="Connection Lost or Match Not Found" className="text-red-500" />;
    }

    const isCompleted = safeMatch.status === 'completed';

    return (
        <div
            ref={containerRef}
            className="w-full h-full bg-[#FDFDFD] dark:bg-[#1A1A1A] p-4 lg:p-8 flex flex-col gap-6"
        >
            <ConsoleHeader
                match={safeMatch}
                isSyncing={mutation.isPending}
                isFullscreen={isFullscreen}
                onToggleFullscreen={toggleFullscreen}
                tournamentId={tournamentId}
                matchId={matchId}
                onUpdateMatch={handleUpdateMatch}
            />

            {/* Main Scoreboard Interface */}
            <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-6 min-h-0">

                {/* Team 1 Card */}
                <PlayerCard
                    player={safeMatch.player1}
                    teamLabel="Team One"
                    isServing={safeMatch.player1.isServing}
                    isCompleted={isCompleted}
                    onScoreChange={(delta) => handleScore('player1', delta)}
                    onToggleServer={() => toggleServer('player1')}
                    matchType={safeMatch.matchType}
                />

                {/* Center Control Column */}
                <div className="lg:col-span-4 flex flex-col gap-6">
                    <MatchTimer
                        matchDetails={safeMatch}
                        elapsedDisplay={elapsedDisplay}
                        isTimerRunning={safeMatch.isTimerRunning}
                        isCompleted={isCompleted}
                        onToggleTimer={handleToggleTimer}
                        formatTime={formatTime}
                        matchStatus={safeMatch.status}
                        isBreak={safeMatch.status === 'break'}
                        onToggleBreak={handleToggleBreak}
                    />

                    <QuickActions
                        onSwap={swapSides}
                        onEndMatch={handleEndMatch}
                        isCompleted={isCompleted}
                    />
                </div>

                {/* Team 2 Card */}
                <PlayerCard
                    player={safeMatch.player2}
                    teamLabel="Team Two"
                    isServing={safeMatch.player2.isServing}
                    isCompleted={isCompleted}
                    onScoreChange={(delta) => handleScore('player2', delta)}
                    onToggleServer={() => toggleServer('player2')}
                    matchType={safeMatch.matchType}
                />

            </div>
        </div>
    );
}