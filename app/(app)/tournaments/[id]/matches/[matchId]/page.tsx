'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { useParams } from 'next/navigation';
import { MatchState, GameResult } from '@/types/match';
import { getRuleSet, isGameComplete } from '@/lib/scoring/rules';
import { processScoringPipeline, startMatchTimer, pauseMatchTimer, completeMatch, resumeMatch, toggleBreakState, setBreakDuration, undoLastGame } from '@/lib/scoring/engine';
import { validateState } from '@/lib/scoring/validation';
import { getGameStructure } from '@/lib/matchHelpers';
import { auth } from '@/lib/firebase/client';
import { User } from 'firebase/auth';
import { MatchConsoleSkeleton } from "@/components/dashboard/skeletons";
import ErrorFallback from "@/components/dashboard/error-fallback";
import { toast } from "sonner";

// Components
import ConsoleHeader from '@/components/match-console/ConsoleHeader';
import PlayerCard from '@/components/match-console/PlayerCard';
import MatchTimer from '@/components/match-console/MatchTimer';
import QuickActions from '@/components/match-console/QuickActions';
import SetCompletionModal from '@/components/match-console/SetCompletionModal';
import EndMatchModal from '@/components/match-console/EndMatchModal';
import ExportMatchModal from '@/components/match-console/ExportMatchModal';

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
    const [pendingSetCompletion, setPendingSetCompletion] = useState<{
        team: 'player1' | 'player2';
        delta: number;
        winnerName: string;
        winnerTeamLabel: string;
        gameNumber: number;
        p1Name: string;
        p2Name: string;
        potentialP1: number;
        potentialP2: number;
        isMatchPoint: boolean;
    } | null>(null);

    const [isEndMatchModalOpen, setIsEndMatchModalOpen] = useState(false);
    const [isExportModalOpen, setIsExportModalOpen] = useState(false);

    // Track Firebase auth initialization
    const [authReady, setAuthReady] = useState(false);
    useEffect(() => {
        if (auth.currentUser) {
            setAuthReady(true);
            return;
        }
        const unsub = auth.onIdTokenChanged(() => setAuthReady(true));
        return () => unsub();
    }, []);

    // Helper to get token
    const getToken = useCallback(async () => {
        const user = auth.currentUser;
        if (user) {
            return user.getIdToken();
        }
        // Wait for auth initialization
        return new Promise<string>((resolve, reject) => {
            const unsubscribe = auth.onIdTokenChanged((u: User | null) => {
                unsubscribe();
                if (u) {
                    resolve(u.getIdToken());
                } else {
                    reject(new Error("Not authenticated"));
                }
            });
        });
    }, []);

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
            // Sanitize undefined fields so JSON payload is clean
            const cleanData = JSON.parse(JSON.stringify(newData));
            return updateMatch({ tournamentId, matchId, data: cleanData, token });
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
            console.error("Match update mutation error:", err);
            if (context?.previous) {
                queryClient.setQueryData(['match', matchId], context.previous);
            }
            const errorMessage = err instanceof Error ? err.message : String(err);
            toast.error(`Unable to save score: ${errorMessage || 'Changes reverted'}`);
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


    const [breakRemainingDisplay, setBreakRemainingDisplay] = useState<number>(60);

    // 5. Break Countdown Effect
    useEffect(() => {
        if (!match || match.status !== 'break') return;

        const targetDuration = match.breakTimerDuration || 60;
        const calculateBreakRemaining = () => {
            if (!match.breakTimerStartTime) return targetDuration;
            const now = Date.now();
            const elapsedSec = Math.floor((now - match.breakTimerStartTime) / 1000);
            return targetDuration - elapsedSec;
        };

        setBreakRemainingDisplay(calculateBreakRemaining());
        const breakInterval = setInterval(() => {
            setBreakRemainingDisplay(calculateBreakRemaining());
        }, 500);

        return () => clearInterval(breakInterval);
    }, [match]);

    // 6. Match Clock Logic (Runs continuously whenever isTimerRunning is true, regardless of break state)
    useEffect(() => {
        if (!match) return;
        if (!match.isTimerRunning || match.status === 'completed') {
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
    }, [match?.isTimerRunning, match?.timerStartTime, match?.timerElapsed, match?.status]);

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
            currentServer: match.currentServer ?? 'player1',
            player1: match.player1 || { name: 'Player 1', score: 0 },
            player2: match.player2 || { name: 'Player 2', score: 0 }
        };
    }, [match]);


    const handleScore = useCallback((team: 'player1' | 'player2', delta: number) => {
        if (!safeMatch) return;

        const rules = getRuleSet(safeMatch.sport, safeMatch.scoringType);

        // Validate: don't allow scoring on completed matches
        const { valid } = validateState(safeMatch, rules);
        if (!valid) return;

        // Check if adding a point completes the set
        if (delta > 0 && rules.autoEndGame) {
            const currentP1 = safeMatch.player1?.score ?? 0;
            const currentP2 = safeMatch.player2?.score ?? 0;
            const potentialP1 = team === 'player1' ? currentP1 + delta : currentP1;
            const potentialP2 = team === 'player2' ? currentP2 + delta : currentP2;

            const { complete, winner } = isGameComplete(potentialP1, potentialP2, rules);

            if (complete && winner) {
                const { currentGame, p1GamesWon, p2GamesWon } = getGameStructure(safeMatch);
                const winnerName = winner === 'player1'
                    ? (safeMatch.player1?.name || 'Team 1')
                    : (safeMatch.player2?.name || 'Team 2');
                const winnerTeamLabel = winner === 'player1' ? 'Team One' : 'Team Two';

                const winnerPreviousSets = winner === 'player1' ? p1GamesWon : p2GamesWon;
                const setsToWin = Math.ceil(rules.bestOf / 2);
                const isMatchPoint = (winnerPreviousSets + 1) >= setsToWin;

                setPendingSetCompletion({
                    team,
                    delta,
                    winnerName,
                    winnerTeamLabel,
                    gameNumber: currentGame,
                    p1Name: safeMatch.player1?.name || 'Team 1',
                    p2Name: safeMatch.player2?.name || 'Team 2',
                    potentialP1,
                    potentialP2,
                    isMatchPoint,
                });
                return;
            }
        }

        // Run scoring pipeline (pure — returns new state)
        const newState = processScoringPipeline(safeMatch, team, delta, rules);

        optimisticUpdate(newState);
        debouncedMutate(newState);
    }, [safeMatch, optimisticUpdate, debouncedMutate]);


    const handleConfirmSetCompletion = useCallback(() => {
        if (!safeMatch || !pendingSetCompletion) return;

        const rules = getRuleSet(safeMatch.sport, safeMatch.scoringType);
        const newState = processScoringPipeline(
            safeMatch,
            pendingSetCompletion.team,
            pendingSetCompletion.delta,
            rules
        );

        optimisticUpdate(newState);
        debouncedMutate(newState);
        setPendingSetCompletion(null);
    }, [safeMatch, pendingSetCompletion, optimisticUpdate, debouncedMutate]);


    const toggleServer = useCallback((team: 'player1' | 'player2') => {
        if (!safeMatch) return;
        const updates: Partial<MatchState> = {
            currentServer: team,
        };
        optimisticUpdate(updates);
        debouncedMutate(updates);
    }, [safeMatch, optimisticUpdate, debouncedMutate]);


    const handleStopTimer = useCallback(() => {
        if (!safeMatch) return;
        const newState = pauseMatchTimer(safeMatch);
        mutation.mutate(newState);
    }, [safeMatch, mutation]);

    const handleStartTimer = useCallback(() => {
        if (!safeMatch) return;
        const newState = startMatchTimer(safeMatch);
        mutation.mutate(newState);
    }, [safeMatch, mutation]);

    const handleToggleTimer = useCallback(() => {
        if (!safeMatch) return;
        if (safeMatch.isTimerRunning && safeMatch.status !== 'completed') {
            handleStopTimer();
        } else if (safeMatch.status === 'completed') {
            const resumedState = resumeMatch(safeMatch);
            const startedState = startMatchTimer(resumedState);
            mutation.mutate(startedState);
        } else {
            handleStartTimer();
        }
    }, [safeMatch, handleStopTimer, handleStartTimer, mutation]);

    const handleEndMatch = useCallback(() => {
        setIsEndMatchModalOpen(true);
    }, []);

    const handleConfirmEndMatch = useCallback(() => {
        if (!safeMatch) return;
        const newState = completeMatch(safeMatch);
        mutation.mutate(newState);
        setIsEndMatchModalOpen(false);
    }, [safeMatch, mutation]);

    const handleResumeMatch = useCallback(() => {
        if (!safeMatch) return;
        if (safeMatch.status === 'completed') {
            if (!confirm('Are you sure you want to resume this completed match?')) return;
        }
        const newState = resumeMatch(safeMatch);
        mutation.mutate(newState);
    }, [safeMatch, mutation]);

    const handleSelectBreakDuration = useCallback((seconds: number) => {
        if (!safeMatch) return;
        const newState = setBreakDuration(safeMatch, seconds);
        mutation.mutate(newState);
    }, [safeMatch, mutation]);

    const handleToggleBreak = useCallback(() => {
        if (!safeMatch) return;
        const newState = toggleBreakState(safeMatch);
        mutation.mutate(newState);
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

    const handleResetGame = useCallback(() => {
        if (!safeMatch) return;
        const { currentGame, p1GamesWon, p2GamesWon, gameHistory } = getGameStructure(safeMatch);
        const p1Score = safeMatch.player1?.score ?? 0;
        const p2Score = safeMatch.player2?.score ?? 0;

        const isLastGameFinished = gameHistory.length > 0 && p1Score === 0 && p2Score === 0;

        if (isLastGameFinished) {
            const confirmMsg = `Undo/Reset finished Game ${gameHistory.length}?\n\nThis will restore rally scores back to before the winning point so you can correct the score.`;
            if (!confirm(confirmMsg)) return;

            const newState = undoLastGame(safeMatch);
            mutation.mutate(newState);
            toast.info(`Game ${gameHistory.length} restored for score correction.`);
        } else {
            const confirmMsg = `Reset Game ${currentGame} rally score to 0–0?\n\nCurrent rally score: ${p1Score}–${p2Score}\nCompleted games: ${p1GamesWon}–${p2GamesWon}\n\nThis cannot be undone.`;
            if (!confirm(confirmMsg)) return;

            mutation.mutate({
                player1: { ...safeMatch.player1, score: 0 },
                player2: { ...safeMatch.player2, score: 0 },
            });
        }
    }, [safeMatch, mutation]);

    if (isLoading) return <MatchConsoleSkeleton />;
    if (isError || !match || !safeMatch) {
        if (isError) console.error(isError);
        return <ErrorFallback error="Connection Lost or Match Not Found" className="text-red-500" />;
    }

    const isCompleted = safeMatch.status === 'completed';
    const { currentGame, totalGames, p1GamesWon, p2GamesWon, gameHistory: matchGameHistory } =
        getGameStructure(safeMatch);

    const gamesNeeded = Math.ceil(totalGames / 2);
    const isMatchWon = p1GamesWon >= gamesNeeded || p2GamesWon >= gamesNeeded;
    const lastGame = matchGameHistory && matchGameHistory.length > 0 ? matchGameHistory[matchGameHistory.length - 1] : undefined;

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
                onExportMatch={() => setIsExportModalOpen(true)}
            />

            {/* Main Scoreboard Interface */}
            <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-6 min-h-0">

                {/* Team 1 Card */}
                <PlayerCard
                    player={safeMatch.player1}
                    teamLabel="Team One"
                    isServing={safeMatch.currentServer === 'player1'}
                    isCompleted={isCompleted}
                    onScoreChange={(delta) => handleScore('player1', delta)}
                    onToggleServer={() => toggleServer('player1')}
                    matchType={safeMatch.matchType}
                    gamesWon={p1GamesWon}
                    totalGames={totalGames}
                    lastGameScore={lastGame?.player1Score}
                />

                {/* Center Control Column */}
                <div className="lg:col-span-4 h-auto lg:h-auto flex flex-col gap-4">

                    {/* flex-1 min-h-0 allows the timer to compress down instead of stretching the container out */}
                    <div className="flex-1 min-h-0 flex flex-col w-full">
                        <MatchTimer
                            matchDetails={safeMatch}
                            elapsedDisplay={elapsedDisplay}
                            isTimerRunning={safeMatch.isTimerRunning}
                            isCompleted={isCompleted}
                            isMatchWon={isMatchWon}
                            onToggleTimer={handleToggleTimer}
                            formatTime={formatTime}
                            matchStatus={safeMatch.status}
                            isBreak={safeMatch.status === 'break'}
                            onToggleBreak={handleToggleBreak}
                            currentGame={currentGame}
                            totalGames={totalGames}
                            gameHistory={matchGameHistory}
                            breakRemainingDisplay={breakRemainingDisplay}
                            breakDuration={safeMatch.breakTimerDuration || 60}
                            onSelectBreakDuration={handleSelectBreakDuration}
                        />
                    </div>

                    <div className="shrink-0 w-full">
                        <QuickActions
                            onSwap={swapSides}
                            onEndMatch={handleEndMatch}
                            onResumeMatch={handleResumeMatch}
                            onResetGame={handleResetGame}
                            isCompleted={isCompleted}
                            isMatchWon={isMatchWon}
                            currentGame={currentGame}
                        />
                    </div>
                </div>

                {/* Team 2 Card */}
                <PlayerCard
                    player={safeMatch.player2}
                    teamLabel="Team Two"
                    isServing={safeMatch.currentServer === 'player2'}
                    isCompleted={isCompleted}
                    onScoreChange={(delta) => handleScore('player2', delta)}
                    onToggleServer={() => toggleServer('player2')}
                    matchType={safeMatch.matchType}
                    gamesWon={p2GamesWon}
                    totalGames={totalGames}
                    lastGameScore={lastGame?.player2Score}
                />

            </div>

            <SetCompletionModal
                isOpen={!!pendingSetCompletion}
                onClose={() => setPendingSetCompletion(null)}
                onConfirm={handleConfirmSetCompletion}
                winnerName={pendingSetCompletion?.winnerName ?? ''}
                winnerTeamLabel={pendingSetCompletion?.winnerTeamLabel ?? ''}
                gameNumber={pendingSetCompletion?.gameNumber ?? 1}
                p1Name={pendingSetCompletion?.p1Name ?? 'Team 1'}
                p2Name={pendingSetCompletion?.p2Name ?? 'Team 2'}
                p1Score={pendingSetCompletion?.potentialP1 ?? 0}
                p2Score={pendingSetCompletion?.potentialP2 ?? 0}
                isMatchPoint={pendingSetCompletion?.isMatchPoint ?? false}
            />

            <EndMatchModal
                isOpen={isEndMatchModalOpen}
                onClose={() => setIsEndMatchModalOpen(false)}
                onConfirm={handleConfirmEndMatch}
                match={safeMatch}
            />

            <ExportMatchModal
                isOpen={isExportModalOpen}
                onClose={() => setIsExportModalOpen(false)}
                match={safeMatch}
            />
        </div>
    );
}