import { MatchRules } from '@/types/match';

// ── Rule Registry (data only — no executable logic) ──

type Team = 'player1' | 'player2';

const RULE_REGISTRY: Record<string, Record<string, MatchRules>> = Object.freeze({
    badminton: Object.freeze({
        '21x3': Object.freeze({ bestOf: 3, targetScore: 21, winBy: 2, maxScore: 30, rallyPoint: true, autoEndGame: true, autoEndMatch: true }),
        '21x1': Object.freeze({ bestOf: 1, targetScore: 21, winBy: 2, maxScore: 30, rallyPoint: true, autoEndGame: true, autoEndMatch: true }),
        '15x3': Object.freeze({ bestOf: 3, targetScore: 15, winBy: 2, maxScore: 30, rallyPoint: true, autoEndGame: true, autoEndMatch: true }),
        '15x1': Object.freeze({ bestOf: 1, targetScore: 15, winBy: 2, maxScore: 30, rallyPoint: true, autoEndGame: true, autoEndMatch: true }),
        '30x1': Object.freeze({ bestOf: 1, targetScore: 30, winBy: 1, maxScore: 30, rallyPoint: true, autoEndGame: true, autoEndMatch: true }),
    }),
});

const FALLBACK_RULES: MatchRules = RULE_REGISTRY.badminton['21x3'];

/**
 * Resolve rules from sport + scoringType.
 * Never reads from the match document — pure configuration lookup.
 * Safely falls back to badminton 21x3 if sport or scoringType is unknown.
 */
export function getRuleSet(sport?: string, scoringType?: string): MatchRules {
    const sportRules = RULE_REGISTRY[sport ?? 'badminton'];
    if (!sportRules) return FALLBACK_RULES;
    return sportRules[scoringType ?? '21x3'] ?? FALLBACK_RULES;
}

// ── Rule Predicates (pure functions — no side effects) ──

/**
 * Check if the current game is complete based on scores and rules.
 * 
 * Win conditions:
 *   1. A player reaches targetScore AND leads by at least winBy points.
 *   2. A player reaches maxScore (hard cap) — higher score wins regardless of margin.
 */
export function isGameComplete(
    p1Score: number,
    p2Score: number,
    rules: MatchRules
): { complete: boolean; winner: Team | null } {
    const { targetScore, winBy, maxScore } = rules;

    // Hard cap: if either player reaches maxScore, game ends
    if (p1Score >= maxScore || p2Score >= maxScore) {
        if (p1Score === p2Score) {
            // Tied at max — shouldn't happen in practice, but safe guard
            return { complete: false, winner: null };
        }
        return {
            complete: true,
            winner: p1Score > p2Score ? 'player1' : 'player2',
        };
    }

    // Standard win: reached target and leading by winBy
    if (p1Score >= targetScore && (p1Score - p2Score) >= winBy) {
        return { complete: true, winner: 'player1' };
    }
    if (p2Score >= targetScore && (p2Score - p1Score) >= winBy) {
        return { complete: true, winner: 'player2' };
    }

    return { complete: false, winner: null };
}

/**
 * Check if the match is complete based on games won and rules.
 * A player must win ceil(bestOf / 2) games to win the match.
 */
export function isMatchComplete(
    p1GamesWon: number,
    p2GamesWon: number,
    rules: MatchRules
): { complete: boolean; winner: Team | null } {
    const gamesNeeded = Math.ceil(rules.bestOf / 2);

    if (p1GamesWon >= gamesNeeded) {
        return { complete: true, winner: 'player1' };
    }
    if (p2GamesWon >= gamesNeeded) {
        return { complete: true, winner: 'player2' };
    }

    return { complete: false, winner: null };
}
