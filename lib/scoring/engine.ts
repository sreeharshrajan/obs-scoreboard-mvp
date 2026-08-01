import { MatchState, MatchRules, GameResult, ScoreEvent, BreakEvent } from '@/types/match';
import { isGameComplete, isMatchComplete } from './rules';

// ── Types ──

type Team = 'player1' | 'player2';

/** Immutable context passed through the scoring pipeline */
export interface ScoringContext {
    readonly state: MatchState;
    readonly team: Team;
    readonly delta: number;
    readonly rules: MatchRules;
    readonly previousState: MatchState;
}

// ── Pipeline Stage 1: Apply Score ──

/**
 * Computes the new rally score for the scoring team.
 * Returns a new context with updated state — no mutation.
 */
export function applyScore(ctx: ScoringContext): ScoringContext {
    const { state, team, delta } = ctx;
    const currentScore = state[team]?.score ?? 0;

    // Handle score reduction (delta < 0) immediately after a game was archived into gameHistory
    if (delta < 0 && currentScore === 0 && (state.gameHistory?.length ?? 0) > 0) {
        const gameHistory = state.gameHistory ?? [];
        const lastGame = gameHistory[gameHistory.length - 1];
        const newHistory = gameHistory.slice(0, -1);
        const winner = lastGame.winner;

        const p1GamesWon = newHistory.filter(g => g.winner === 'player1').length;
        const p2GamesWon = newHistory.filter(g => g.winner === 'player2').length;

        const restoredP1 = team === 'player1' ? Math.max(0, lastGame.player1Score + delta) : lastGame.player1Score;
        const restoredP2 = team === 'player2' ? Math.max(0, lastGame.player2Score + delta) : lastGame.player2Score;

        return {
            ...ctx,
            state: {
                ...state,
                isTimerRunning: false,
                timerStartTime: null,
                player1: {
                    ...state.player1,
                    score: restoredP1,
                    gamesWon: p1GamesWon,
                },
                player2: {
                    ...state.player2,
                    score: restoredP2,
                    gamesWon: p2GamesWon,
                },
                gameHistory: newHistory,
            },
        };
    }

    const newScore = Math.max(0, currentScore + delta);

    return {
        ...ctx,
        state: {
            ...state,
            [team]: {
                ...state[team],
                score: newScore,
            },
        },
    };
}

// ── Pipeline Stage 2: Apply Serve Rule ──

/**
 * Rally point rule: the team that scored (delta > 0) becomes the server.
 * Sets currentServer as single source of truth.
 * 
 * Only applies when:
 *   - rules.rallyPoint is true
 *   - delta > 0 (a point was scored, not a correction)
 */
export function applyServeRule(ctx: ScoringContext): ScoringContext {
    const { state, team, delta, rules } = ctx;

    if (!rules.rallyPoint || delta <= 0) {
        return ctx;
    }

    return {
        ...ctx,
        state: {
            ...state,
            currentServer: team,
        },
    };
}

// ── Pipeline Stage 3: Record Score Event ──

/**
 * Records a ScoreEvent into state.scoreEvents.
 * Must run BEFORE applyGameRule so game-winning rally scores are preserved in event history!
 */
export function recordScoreEvent(ctx: ScoringContext): ScoringContext {
    const { state, team, delta, previousState } = ctx;

    // Calculate current match timer elapsed time
    const now = Date.now();
    const elapsedTime = state.isTimerRunning && state.timerStartTime
        ? (state.timerElapsed || 0) + (now - state.timerStartTime) / 1000
        : (state.timerElapsed || 0);

    const gameHistory = state.gameHistory ?? [];
    const currentGameNumber = gameHistory.length + 1;

    const event: ScoreEvent = {
        timestamp: now,
        elapsedTime,
        gameNumber: currentGameNumber,
        team,
        delta,
        previousScore: {
            player1: previousState.player1?.score ?? 0,
            player2: previousState.player2?.score ?? 0,
        },
        resultingScore: {
            player1: state.player1?.score ?? 0,
            player2: state.player2?.score ?? 0,
        },
    };

    const existingEvents = state.scoreEvents ?? [];

    return {
        ...ctx,
        state: {
            ...state,
            scoreEvents: [...existingEvents, event],
        },
    };
}

// ── Pipeline Stage 4: Apply Game Rule ──

/**
 * Checks if the current game is complete after the score change.
 * If complete: archives a GameResult with completedAt timestamp, increments gamesWon, resets rally scores to 0-0.
 * 
 * Only applies when rules.autoEndGame is true.
 */
export function applyGameRule(ctx: ScoringContext): ScoringContext {
    const { state, rules } = ctx;

    if (!rules.autoEndGame) {
        return ctx;
    }

    const p1Score = state.player1?.score ?? 0;
    const p2Score = state.player2?.score ?? 0;

    const { complete, winner } = isGameComplete(p1Score, p2Score, rules);

    if (!complete || !winner) {
        return ctx;
    }

    const gameHistory = state.gameHistory ?? [];
    const now = Date.now();

    const newGameResult: GameResult = {
        gameNumber: gameHistory.length + 1,
        player1Score: p1Score,
        player2Score: p2Score,
        winner,
        completedAt: now,
    };

    const newGameHistory = [...gameHistory, newGameResult];
    const p1GamesWon = newGameHistory.filter(g => g.winner === 'player1').length;
    const p2GamesWon = newGameHistory.filter(g => g.winner === 'player2').length;

    return {
        ...ctx,
        state: {
            ...state,
            player1: {
                ...state.player1,
                score: 0,
                gamesWon: p1GamesWon,
            },
            player2: {
                ...state.player2,
                score: 0,
                gamesWon: p2GamesWon,
            },
            gameHistory: newGameHistory,
        },
    };
}

// ── Pipeline Stage 5: Apply Match Rule ──

/**
 * Checks if the match is complete after game updates.
 * If a player has won enough games, sets status to 'completed' and sets completedAt timestamp.
 * 
 * Only applies when rules.autoEndMatch is true.
 */
export function applyMatchRule(ctx: ScoringContext): ScoringContext {
    const { state, rules } = ctx;

    if (!rules.autoEndMatch) {
        return ctx;
    }

    const p1GamesWon = state.player1?.gamesWon ?? 0;
    const p2GamesWon = state.player2?.gamesWon ?? 0;

    const { complete } = isMatchComplete(p1GamesWon, p2GamesWon, rules);

    if (!complete) {
        return ctx;
    }

    const now = Date.now();
    const additionalSeconds = (state.isTimerRunning && state.timerStartTime)
        ? (now - state.timerStartTime) / 1000
        : 0;

    return {
        ...ctx,
        state: {
            ...state,
            isTimerRunning: false,
            timerStartTime: null,
            timerElapsed: (state.timerElapsed || 0) + additionalSeconds,
        },
    };
}

// ── Pipeline Runner ──

/**
 * Runs the full scoring pipeline: score → serve → event log → game → match → version increment.
 * Each stage is a pure function that returns a new immutable context.
 * 
 * @param state  Current match state (not mutated)
 * @param team   The team that scored
 * @param delta  Score change (+1 for point, -1 for correction)
 * @param rules  Resolved match rules
 * @returns      New match state after all rules applied
 */
export function processScoringPipeline(
    state: MatchState,
    team: Team,
    delta: number,
    rules: MatchRules
): MatchState {
    const clonedState: MatchState = JSON.parse(JSON.stringify(state));

    const initialCtx: ScoringContext = {
        state: clonedState,
        team,
        delta,
        rules,
        previousState: clonedState,
    };

    let ctx = initialCtx;
    ctx = applyScore(ctx);
    ctx = applyServeRule(ctx);
    ctx = recordScoreEvent(ctx);
    ctx = applyGameRule(ctx);
    ctx = applyMatchRule(ctx);

    const finalState = ctx.state;
    finalState.version = (state.version ?? 0) + 1;

    return finalState;
}

// ── Domain State Transitions (Pure Functions) ──

/**
 * Starts the match timer and transitions scheduled/break status to 'live'.
 */
export function startMatchTimer(state: MatchState): MatchState {
    if (state.status === 'completed') {
        return state; // Cannot start timer directly on completed match without resuming
    }

    if (state.isTimerRunning) {
        return state; // Already running
    }

    const now = Date.now();
    const newStatus = (state.status === 'scheduled' || state.status === 'break') ? 'live' : state.status;

    return {
        ...state,
        isTimerRunning: true,
        timerStartTime: now,
        status: newStatus,
        version: (state.version ?? 0) + 1,
    };
}

/**
 * Pauses the match timer and accumulates elapsed time.
 */
export function pauseMatchTimer(state: MatchState): MatchState {
    if (!state.isTimerRunning || !state.timerStartTime) {
        return state;
    }

    const now = Date.now();
    const additionalSeconds = (now - state.timerStartTime) / 1000;

    return {
        ...state,
        isTimerRunning: false,
        timerStartTime: null,
        timerElapsed: (state.timerElapsed || 0) + additionalSeconds,
        version: (state.version ?? 0) + 1,
    };
}

/**
 * Completes a match, cleanly stopping timer if running and recording completedAt.
 */
export function completeMatch(state: MatchState): MatchState {
    let newState = state.isTimerRunning ? pauseMatchTimer(state) : state;
    const now = Date.now();

    return {
        ...newState,
        status: 'completed',
        isTimerRunning: false,
        timerStartTime: null,
        completedAt: newState.completedAt || now,
        version: (newState.version ?? 0) + 1,
    };
}

/**
 * Resumes a completed or paused match back to 'live'.
 */
export function resumeMatch(state: MatchState): MatchState {
    if (state.status !== 'completed' && state.status !== 'break') {
        return state;
    }

    return {
        ...state,
        status: 'live',
        version: (state.version ?? 0) + 1,
    };
}

/**
 * Toggles break status and initializes/clears break timer state.
 */
export function toggleBreakState(state: MatchState, defaultBreakDuration: number = 60): MatchState {
    if (state.status === 'completed') return state;

    const isStartingBreak = state.status !== 'break';
    const now = Date.now();

    // Calculate current match elapsed time for the break event log
    const elapsedTime = state.isTimerRunning && state.timerStartTime
        ? (state.timerElapsed || 0) + (now - state.timerStartTime) / 1000
        : (state.timerElapsed || 0);

    const breakEvent: BreakEvent = {
        type: isStartingBreak ? 'break_start' : 'break_end',
        timestamp: now,
        elapsedTime,
        ...(isStartingBreak ? { durationSeconds: state.breakTimerDuration || defaultBreakDuration } : {}),
    };

    const existingBreakEvents = state.breakEvents ?? [];

    return {
        ...state,
        status: isStartingBreak ? 'break' : 'live',
        breakTimerDuration: isStartingBreak ? (state.breakTimerDuration || defaultBreakDuration) : undefined,
        breakTimerStartTime: isStartingBreak ? now : null,
        breakTimerElapsed: isStartingBreak ? 0 : undefined,
        breakEvents: [...existingBreakEvents, breakEvent],
        version: (state.version ?? 0) + 1,
    };
}

/**
 * Sets custom break timer duration.
 */
export function setBreakDuration(state: MatchState, durationSeconds: number): MatchState {
    const now = Date.now();
    return {
        ...state,
        breakTimerDuration: durationSeconds,
        breakTimerStartTime: state.status === 'break' ? now : state.breakTimerStartTime,
        breakTimerElapsed: 0,
        version: (state.version ?? 0) + 1,
    };
}

/**
 * Undoes the last finished game from history, restoring scores and gamesWon count.
 */
export function undoLastGame(state: MatchState): MatchState {
    const gameHistory = state.gameHistory ?? [];
    if (gameHistory.length === 0) {
        return {
            ...state,
            player1: { ...state.player1, score: 0 },
            player2: { ...state.player2, score: 0 },
            version: (state.version ?? 0) + 1,
        };
    }

    const lastGame = gameHistory[gameHistory.length - 1];
    const newHistory = gameHistory.slice(0, -1);
    const winner = lastGame.winner;

    const p1GamesWon = newHistory.filter(g => g.winner === 'player1').length;
    const p2GamesWon = newHistory.filter(g => g.winner === 'player2').length;

    // Restore rally scores to point before winning point
    const restoredP1Score = winner === 'player1' ? Math.max(0, lastGame.player1Score - 1) : lastGame.player1Score;
    const restoredP2Score = winner === 'player2' ? Math.max(0, lastGame.player2Score - 1) : lastGame.player2Score;

    return {
        ...state,
        status: state.status === 'completed' ? 'live' : state.status,
        isTimerRunning: false,
        timerStartTime: null,
        player1: {
            ...state.player1,
            score: restoredP1Score,
            gamesWon: p1GamesWon,
        },
        player2: {
            ...state.player2,
            score: restoredP2Score,
            gamesWon: p2GamesWon,
        },
        gameHistory: newHistory,
        version: (state.version ?? 0) + 1,
    };
}

// ── Shared Administrative Reset Helper ──

/**
 * Resets a match to its initial editable scoring state while preserving
 * all tournament, court, category, player, fixture, and scheduling information.
 */
export function resetMatchState(existingMatch: MatchState): MatchState {
    return {
        ...existingMatch,
        player1: {
            ...existingMatch.player1,
            score: 0,
            gamesWon: 0,
        },
        player2: {
            ...existingMatch.player2,
            score: 0,
            gamesWon: 0,
        },
        currentServer: 'player1',
        gameHistory: [],
        scoreEvents: [],
        breakEvents: [],
        status: 'scheduled',
        isTimerRunning: false,
        timerStartTime: null,
        timerElapsed: 0,
        completedAt: undefined,
        version: (existingMatch.version ?? 0) + 1,
    };
}

