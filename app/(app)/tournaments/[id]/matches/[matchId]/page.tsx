'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import {
    Pause, Play, RefreshCw, Trophy, Clock,
    ZoomIn, ZoomOut, Activity, ArrowRightLeft,
    Trash2, Wifi, ChevronUp, ChevronDown, RotateCcw, Maximize, Minimize
} from 'lucide-react';
import clsx from 'clsx';
import { MatchState, PlayerState } from '@/types/match';
import { auth } from '@/lib/firebase/client';
import { User } from 'firebase/auth';
import DashboardLoader from "@/components/dashboard/loader";
import ErrorFallback from "@/components/dashboard/error-fallback";

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

// --- Helper Component: LiveInput ---
const LiveInput = ({
    value,
    onCommit,
    className,
    placeholder,
    ...props
}: {
    value: string;
    onCommit: (val: string) => void;
    className?: string;
    placeholder?: string;
} & React.InputHTMLAttributes<HTMLInputElement>) => {
    const [localValue, setLocalValue] = useState(value);

    useEffect(() => {
        setLocalValue(value);
    }, [value]);

    const handleBlur = () => {
        if (localValue !== value) onCommit(localValue);
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            e.currentTarget.blur();
        }
    };

    return (
        <input
            {...props}
            value={localValue}
            onChange={(e) => setLocalValue(e.target.value)}
            onBlur={handleBlur}
            onKeyDown={handleKeyDown}
            className={className}
            placeholder={placeholder}
        />
    );
};

// --- Main Component ---

export default function AdminPanel() {
    const params = useParams();
    const tournamentId = params.id as string;
    const matchId = params.matchId as string;
    const queryClient = useQueryClient();
    const [currentTime, setCurrentTime] = useState<string>("");
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

    // 4. Sync Tournament Info to Match Doc (for Overlay)
    useEffect(() => {
        if (tournament && match) {
            const shouldUpdate =
                (tournament.name && match.tournamentName !== tournament.name) ||
                (tournament.category && match.category !== tournament.category);

            if (shouldUpdate) {
                mutation.mutate({
                    tournamentName: tournament.name,
                    category: tournament.category
                });
            }
        }
    }, [tournament, match, mutation]);


    // 5. Timer & Clock Logic
    useEffect(() => {
        setCurrentTime(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
        const clockInterval = setInterval(() => {
            setCurrentTime(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
        }, 1000);
        return () => clearInterval(clockInterval);
    }, []);

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
    const toggleFullscreen = () => {
        if (!document.fullscreenElement) {
            document.documentElement.requestFullscreen();
            setIsFullscreen(true);
        } else {
            if (document.exitFullscreen) {
                document.exitFullscreen();
                setIsFullscreen(false);
            }
        }
    };

    useEffect(() => {
        const handleChange = () => {
            setIsFullscreen(!!document.fullscreenElement);
        };
        document.addEventListener('fullscreenchange', handleChange);
        return () => document.removeEventListener('fullscreenchange', handleChange);
    }, []);

    const formatTime = (seconds: number) => {
        const safeSeconds = isNaN(seconds) ? 0 : Math.max(0, seconds);
        const m = Math.floor(safeSeconds / 60);
        const s = Math.floor(safeSeconds % 60);
        return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    };

    // --- Handlers ---
    const handleScore = (team: 'player1' | 'player2', delta: number) => {
        if (!match) return;
        const currentScore = match[team]?.score || 0;
        const newScore = Math.max(0, currentScore + delta);
        mutation.mutate({ [team]: { ...match[team], score: newScore } });
    };

    const toggleServer = (team: 'player1' | 'player2') => {
        if (!match) return;
        mutation.mutate({
            player1: { ...match.player1, isServing: team === 'player1' },
            player2: { ...match.player2, isServing: team === 'player2' },
            serverNumber: 1
        });
    };

    const handleStopTimer = () => {
        if (!match || !match.timerStartTime) return;
        const now = Date.now();
        const additionalSeconds = (now - match.timerStartTime) / 1000;
        mutation.mutate({
            isTimerRunning: false,
            timerElapsed: (match.timerElapsed || 0) + additionalSeconds,
            timerStartTime: null
        });
    };

    const handleStartTimer = () => {
        mutation.mutate({
            isTimerRunning: true,
            timerStartTime: Date.now(),
            status: 'live' // Automatically set to live when timer starts
        });
    };

    const handleEndMatch = () => {
        if (safeMatch.isTimerRunning) handleStopTimer();
        mutation.mutate({
            status: 'completed'
        });
    };

    const swapSides = () => {
        if (!match) return;
        mutation.mutate({
            player1: match.player2,
            player2: match.player1
        });
    };

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

    if (isLoading) return <DashboardLoader message="Initializing System..." className="bg-slate-950 text-blue-500 font-mono" />;
    if (isError || !match) {
        if (isError) console.error(isError);
        return <ErrorFallback error="Connection Lost or Match Not Found" className="bg-slate-950 text-red-500 font-mono" />;
    }

    // Ensure default values
    const safeMatch = {
        ...match,
        player1: match.player1 || { name: 'Player 1', score: 0, isServing: true },
        player2: match.player2 || { name: 'Player 2', score: 0, isServing: false }
    };

    return (
        <div className="w-full h-full bg-slate-950 text-slate-200 font-sans selection:bg-blue-500/30 flex items-center justify-center p-4">

            {/* Inner Dashboard Container */}
            <div className="w-full max-w-7xl h-full bg-slate-950/50 rounded-3xl border border-slate-800 shadow-2xl relative overflow-hidden flex flex-col backdrop-blur-sm">

                {/* Header with Clock & Tournament Info */}
                <div className="shrink-0 min-h-[4rem] flex flex-wrap items-center justify-between px-6 py-2 border-b border-slate-800/50 bg-slate-900/20 gap-4">
                    <div className="flex items-center gap-4">
                        <div className="flex flex-col justify-center gap-0.5">
                            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                                {tournament?.name || safeMatch.tournamentName || "Tournament"}
                            </span>
                            <span className="text-sm font-bold text-slate-200 tracking-tight">
                                {safeMatch.matchCategory || safeMatch.category || "Match Category"} <span className="text-slate-700 mx-1">|</span> <span className="text-slate-400 font-medium">{safeMatch.roundType || "Match Round"}</span>
                            </span>
                        </div>
                        {safeMatch.matchTime && (
                            <div className="hidden sm:flex items-center gap-2 bg-blue-500/10 border border-blue-500/20 px-2 py-1 rounded text-[10px] font-bold text-blue-400 uppercase tracking-wider">
                                <Clock size={10} /> {safeMatch.matchTime}
                            </div>
                        )}
                        {safeMatch.ageGroup && (
                            <div className="hidden sm:flex items-center gap-2 bg-slate-800 border border-slate-700 px-2 py-1 rounded text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                                {safeMatch.ageGroup}
                            </div>
                        )}
                    </div>

                    <div className="flex items-center gap-3">
                        <div className={clsx(
                            "px-3 py-1.5 rounded-lg border text-[10px] font-black uppercase tracking-widest flex items-center gap-2",
                            safeMatch.status === 'live' ? "bg-red-500/10 border-red-500/30 text-red-500" :
                                safeMatch.status === 'completed' ? "bg-green-500/10 border-green-500/30 text-green-500" :
                                    "bg-slate-800 border-slate-700 text-slate-400"
                        )}>
                            {safeMatch.status === 'live' && <span className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse" />}
                            {safeMatch.status || 'Scheduled'}
                        </div>
                        <button
                            onClick={toggleFullscreen}
                            className="p-2 rounded-lg bg-slate-900/50 border border-slate-800 text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                            title={isFullscreen ? "Exit Fullscreen" : "Enter Fullscreen"}
                        >
                            {isFullscreen ? <Minimize size={14} /> : <Maximize size={14} />}
                        </button>
                        <div className="flex items-center gap-2 bg-slate-900/50 px-3 py-1.5 rounded-lg border border-slate-800">
                            <Clock size={12} className="text-slate-500" />
                            <span className="font-mono text-xs font-bold text-slate-300">{currentTime || "--:--"}</span>
                        </div>
                    </div>
                </div>
                {/* Background Grid Decoration */}
                <div className="absolute inset-0 opacity-5 pointer-events-none bg-[radial-gradient(#ffffff_1px,transparent_1px)] [background-size:16px_16px]" />

                <main className="flex-1 p-6 grid grid-cols-1 lg:grid-cols-12 gap-6 h-full min-h-0 overflow-y-auto">

                    {/* === LEFT COLUMN: Player 1 === */}
                    <div className="lg:col-span-4 flex flex-col h-full min-h-[400px] bg-slate-900/40 rounded-3xl border border-slate-800/60 relative overflow-hidden group hover:border-slate-700/60 transition-colors">
                        <div className={clsx(
                            "absolute inset-0 border-2 rounded-3xl transition-all duration-300 pointer-events-none z-10",
                            safeMatch.player1.isServing ? "border-blue-500/50 shadow-[inset_0_0_20px_rgba(59,130,246,0.1)]" : "border-transparent"
                        )} />

                        <div className="flex-1 p-6 flex flex-col z-0 relative justify-between">
                            <div className="flex items-start justify-between">
                                <div className="w-full">
                                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">
                                        Team 1
                                    </label>
                                    <div className="flex flex-col gap-1">
                                        <LiveInput
                                            value={safeMatch.player1.name}
                                            onCommit={(val) => mutation.mutate({ player1: { ...safeMatch.player1, name: val } })}
                                            className="bg-transparent border-b border-dashed border-slate-700 hover:border-slate-500 focus:border-blue-500 py-1 text-xl font-bold text-white focus:outline-none transition-all placeholder:text-slate-700 w-full"
                                            placeholder="PLAYER 1"
                                        />
                                        {(safeMatch.matchType === "Doubles" || safeMatch.matchType === "Mixed Doubles" || safeMatch.player1.name2) && (
                                            <LiveInput
                                                value={safeMatch.player1.name2 || ""}
                                                onCommit={(val) => mutation.mutate({ player1: { ...safeMatch.player1, name2: val } })}
                                                className="bg-transparent border-b border-dashed border-slate-700 hover:border-slate-500 focus:border-blue-500 py-1 text-xl font-bold text-white focus:outline-none transition-all placeholder:text-slate-700 w-full"
                                                placeholder="PLAYER 2"
                                            />
                                        )}
                                    </div>
                                </div>
                            </div>

                            <div className="flex flex-col items-center justify-center gap-6 my-8">
                                <div className="text-9xl leading-none font-mono font-black tracking-tighter text-white tabular-nums drop-shadow-2xl select-none">
                                    {safeMatch.player1.score}
                                </div>

                                <div className="flex items-center gap-4">
                                    <button
                                        onClick={() => handleScore('player1', -1)}
                                        className="w-16 h-12 rounded-xl bg-slate-800 border border-slate-700 hover:bg-slate-700 hover:border-slate-600 text-slate-400 hover:text-white transition-all active:scale-95 flex items-center justify-center"
                                    >
                                        <ChevronDown size={24} />
                                    </button>
                                    <button
                                        onClick={() => handleScore('player1', 1)}
                                        className="w-24 h-16 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-600 shadow-lg shadow-blue-500/20 hover:shadow-blue-500/40 text-white transition-all active:scale-95 flex items-center justify-center"
                                    >
                                        <ChevronUp size={32} />
                                    </button>
                                </div>
                            </div>

                            <button
                                onClick={() => toggleServer('player1')}
                                className={clsx(
                                    "w-full py-4 mt-2 rounded-xl text-sm font-bold uppercase tracking-[0.2em] transition-all border flex items-center justify-center gap-3 shadow-lg",
                                    safeMatch.player1.isServing
                                        ? "bg-blue-600 border-blue-500 text-white shadow-blue-500/20"
                                        : "bg-slate-800 border-slate-700 text-slate-500 hover:text-slate-300 hover:bg-slate-700"
                                )}
                            >
                                {safeMatch.player1.isServing && <span className="w-2 h-2 rounded-full bg-white animate-pulse" />}
                                {safeMatch.player1.isServing
                                    ? `Serving (${safeMatch.player1.score % 2 === 0 ? "R" : "L"})`
                                    : "Serve"}
                            </button>
                        </div>
                    </div>

                    {/* === CENTER COLUMN: Details & Controls === */}
                    <div className="lg:col-span-4 flex flex-col gap-4 h-full min-h-0">

                        {/* TIMER */}
                        <div className="flex-[2] bg-slate-900/40 rounded-3xl border border-slate-800/60 p-4 flex flex-col items-center justify-center relative overflow-hidden">
                            <div className="flex flex-col items-center gap-4 z-10 w-full">
                                <div className="flex items-center gap-2 text-slate-500">
                                    <Clock size={12} />
                                    <span className="text-[10px] font-bold uppercase tracking-widest">Match Timer</span>
                                </div>

                                <div className={clsx(
                                    "text-7xl font-mono font-medium tracking-tighter tabular-nums transition-colors duration-300",
                                    safeMatch.isTimerRunning ? "text-white drop-shadow-[0_0_20px_rgba(255,255,255,0.15)]" : "text-slate-600"
                                )}>
                                    {formatTime(elapsedDisplay)}
                                </div>

                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={() => safeMatch.isTimerRunning ? handleStopTimer() : handleStartTimer()}
                                        className={clsx(
                                            "h-10 w-32 rounded-xl font-bold text-xs uppercase tracking-widest flex items-center justify-center gap-2 transition-all shadow-lg",
                                            safeMatch.isTimerRunning
                                                ? "bg-red-500/10 text-red-400 border border-red-500/30 hover:bg-red-500/20"
                                                : "bg-green-500 hover:bg-green-400 text-white border border-green-400 shadow-green-500/20"
                                        )}
                                    >
                                        {safeMatch.isTimerRunning ? <Pause size={14} fill="currentColor" /> : <Play size={14} fill="currentColor" />}
                                        {safeMatch.isTimerRunning ? "Stop" : "Start"}
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* MATCH INFO */}
                        <div className="bg-slate-900/40 rounded-3xl border border-slate-800/60 p-4 grid grid-cols-2 gap-3">
                            <div className="space-y-1">
                                <span className="text-[8px] font-bold text-slate-500 uppercase tracking-widest block">Court</span>
                                <span className="text-xs font-bold text-slate-200">{safeMatch.court || 'TBD'}</span>
                            </div>
                            <div className="space-y-1">
                                <span className="text-[8px] font-bold text-slate-500 uppercase tracking-widest block">Scoring</span>
                                <span className="text-xs font-bold text-slate-200">{safeMatch.scoringType || '21x3'}</span>
                            </div>
                            <div className="space-y-1">
                                <span className="text-[8px] font-bold text-slate-500 uppercase tracking-widest block">Match Type</span>
                                <span className="text-xs font-bold text-slate-200">{safeMatch.matchType || 'Singles'}</span>
                            </div>
                            <div className="space-y-1">
                                <button
                                    onClick={handleEndMatch}
                                    disabled={safeMatch.status === 'completed'}
                                    className="w-full h-8 rounded-lg bg-[#FF5A09] text-white text-[9px] font-bold uppercase tracking-widest hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50 disabled:grayscale"
                                >
                                    End Match
                                </button>
                            </div>
                        </div>

                        {/* CONTROLS (Swap / Reset / Scale) */}
                        <div className="bg-slate-900/40 rounded-3xl border border-slate-800/60 p-3 flex flex-col gap-3">
                            <div className="flex items-center justify-between gap-2">
                                <button
                                    onClick={swapSides}
                                    className="flex-1 flex items-center justify-center gap-2 py-2 rounded-xl bg-slate-800 border border-slate-700 text-slate-300 hover:text-white hover:bg-slate-700 hover:border-slate-600 transition-all text-[10px] font-bold uppercase tracking-wide"
                                >
                                    <ArrowRightLeft size={12} /> Swap sides
                                </button>
                                <button
                                    onClick={resetMatch}
                                    className="flex-1 flex items-center justify-center gap-2 py-2 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 hover:bg-red-500/20 transition-all text-[10px] font-bold uppercase tracking-wide"
                                >
                                    <RotateCcw size={12} /> Reset Match
                                </button>
                            </div>

                            <div className="flex items-center gap-2 bg-slate-950/50 p-2 rounded-xl border border-slate-800">
                                <ZoomOut size={12} className="text-slate-600" />
                                <input
                                    type="range"
                                    min="0.5"
                                    max="2.0"
                                    step="0.1"
                                    value={safeMatch.overlayScale || 1}
                                    onChange={(e) => mutation.mutate({ overlayScale: parseFloat(e.target.value) })}
                                    className="w-full h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-blue-500"
                                />
                                <ZoomIn size={12} className="text-slate-600" />
                            </div>

                            <div className="flex items-center justify-between px-2 text-[9px] font-mono text-slate-500 uppercase">
                                <span className={clsx("flex items-center gap-1", mutation.isPending ? "text-yellow-500" : "text-green-500")}>
                                    <Wifi size={8} /> {mutation.isPending ? "Syncing" : "Cloud Active"}
                                </span>
                                <span>StreamScore v2.0</span>
                            </div>
                        </div>

                    </div>

                    {/* === RIGHT COLUMN: Player 2 === */}
                    <div className="lg:col-span-4 flex flex-col h-full min-h-[400px] bg-slate-900/40 rounded-3xl border border-slate-800/60 relative overflow-hidden group hover:border-slate-700/60 transition-colors">
                        <div className={clsx(
                            "absolute inset-0 border-2 rounded-3xl transition-all duration-300 pointer-events-none z-10",
                            safeMatch.player2.isServing ? "border-orange-500/50 shadow-[inset_0_0_20px_rgba(249,115,22,0.1)]" : "border-transparent"
                        )} />

                        <div className="flex-1 p-6 flex flex-col z-0 relative justify-between">
                            <div className="flex items-start justify-between">
                                <div className="w-full">
                                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1 text-right">
                                        Team 2
                                    </label>
                                    <div className="flex flex-col gap-1">
                                        <LiveInput
                                            value={safeMatch.player2.name}
                                            onCommit={(val) => mutation.mutate({ player2: { ...safeMatch.player2, name: val } })}
                                            className="bg-transparent border-b border-dashed border-slate-700 hover:border-slate-500 focus:border-orange-500 py-1 text-xl font-bold text-white focus:outline-none transition-all placeholder:text-slate-700 w-full text-right"
                                            placeholder="PLAYER 1"
                                        />
                                        {(safeMatch.matchType === "Doubles" || safeMatch.matchType === "Mixed Doubles" || safeMatch.player2.name2) && (
                                            <LiveInput
                                                value={safeMatch.player2.name2 || ""}
                                                onCommit={(val) => mutation.mutate({ player2: { ...safeMatch.player2, name2: val } })}
                                                className="bg-transparent border-b border-dashed border-slate-700 hover:border-slate-500 focus:border-orange-500 py-1 text-xl font-bold text-white focus:outline-none transition-all placeholder:text-slate-700 w-full text-right"
                                                placeholder="PLAYER 2"
                                            />
                                        )}
                                    </div>
                                </div>
                            </div>

                            <div className="flex flex-col items-center justify-center gap-6 my-8">
                                <div className="text-9xl leading-none font-mono font-black tracking-tighter text-white tabular-nums drop-shadow-2xl select-none">
                                    {safeMatch.player2.score}
                                </div>

                                <div className="flex items-center gap-4">
                                    <button
                                        onClick={() => handleScore('player2', -1)}
                                        className="w-16 h-12 rounded-xl bg-slate-800 border border-slate-700 hover:bg-slate-700 hover:border-slate-600 text-slate-400 hover:text-white transition-all active:scale-95 flex items-center justify-center"
                                    >
                                        <ChevronDown size={24} />
                                    </button>
                                    <button
                                        onClick={() => handleScore('player2', 1)}
                                        className="w-24 h-16 rounded-2xl bg-gradient-to-br from-orange-500 to-red-600 shadow-lg shadow-orange-500/20 hover:shadow-orange-500/40 text-white transition-all active:scale-95 flex items-center justify-center"
                                    >
                                        <ChevronUp size={32} />
                                    </button>
                                </div>
                            </div>

                            <button
                                onClick={() => toggleServer('player2')}
                                className={clsx(
                                    "w-full py-4 mt-2 rounded-xl text-sm font-bold uppercase tracking-[0.2em] transition-all border flex items-center justify-center gap-3 shadow-lg",
                                    safeMatch.player2.isServing
                                        ? "bg-orange-500 border-orange-600 text-white shadow-orange-500/20"
                                        : "bg-slate-800 border-slate-700 text-slate-500 hover:text-slate-300 hover:bg-slate-700"
                                )}
                            >
                                {safeMatch.player2.isServing && <span className="w-2 h-2 rounded-full bg-white animate-pulse" />}
                                {safeMatch.player2.isServing
                                    ? `Serving (${safeMatch.player2.score % 2 === 0 ? "R" : "L"})`
                                    : "Serve"}
                            </button>
                        </div>
                    </div>
                </main>
            </div>
        </div>
    );
}