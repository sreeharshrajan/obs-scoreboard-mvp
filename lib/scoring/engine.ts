import { MatchState, MatchRules, GameResult } from '@/types/match';
import { isGameComplete, isMatchComplete } from './rules';

// ── Types ──

type Team = 'player1' | 'player2';

/** Immutable context passed through the scoring pipeline */
export interface ScoringContext {
    readonly state: MatchState;
    readonly team: Team;
    readonly delta: number;
    readonly rules: MatchRules;
}

// ── Helper ──

function opponent(team: Team): Team {
    return team === 'player1' ? 'player2' : 'player1';
}

// ── Pipeline Stage 1: Apply Score ──

/**
 * Computes the new rally score for the scoring team.
 * Returns a new context with updated state — no mutation.
 */
export function applyScore(ctx: ScoringContext): ScoringContext {
    const { state, team, delta } = ctx;
    const currentScore = state[team]?.score ?? 0;
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
 * Uses ctx.team and ctx.delta explicitly — does not infer from score state.
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

    const opp = opponent(team);

    return {
        ...ctx,
        state: {
            ...state,
            [team]: {
                ...state[team],
                isServing: true,
            },
            [opp]: {
                ...state[opp],
                isServing: false,
            },
        },
    };
}

// ── Pipeline Stage 3: Apply Game Rule ──

/**
 * Checks if the current game is complete after the score change.
 * If complete: archives a GameResult, increments gamesWon, resets rally scores to 0-0.
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
    const newGameResult: GameResult = {
        gameNumber: gameHistory.length + 1,
        player1Score: p1Score,
        player2Score: p2Score,
        winner,
    };

    const p1GamesWon = (state.player1?.gamesWon ?? 0) + (winner === 'player1' ? 1 : 0);
    const p2GamesWon = (state.player2?.gamesWon ?? 0) + (winner === 'player2' ? 1 : 0);

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
            gameHistory: [...gameHistory, newGameResult],
        },
    };
}

// ── Pipeline Stage 4: Apply Match Rule ──

/**
 * Checks if the match is complete after game updates.
 * If a player has won enough games, sets status to 'completed'.
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

    return {
        ...ctx,
        state: {
            ...state,
            status: 'completed',
        },
    };
}

// ── Pipeline Runner ──

/**
 * Runs the full scoring pipeline: score → serve → game → match.
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
    const initialCtx: ScoringContext = {
        state: JSON.parse(JSON.stringify(state)), // deep clone for immutability
        team,
        delta,
        rules,
    };

    let ctx = initialCtx;
    ctx = applyScore(ctx);
    ctx = applyServeRule(ctx);
    ctx = applyGameRule(ctx);
    ctx = applyMatchRule(ctx);

    return ctx.state;
}
