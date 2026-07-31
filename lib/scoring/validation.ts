import { MatchState, MatchRules } from '@/types/match';

/**
 * Validates match state consistency before persisting.
 * Returns validation result with a list of error messages if invalid.
 * 
 * Checks:
 *   - Scores are non-negative
 *   - gamesWon does not exceed the maximum possible
 *   - gameHistory length does not exceed bestOf
 *   - Completed matches should not accept further score mutations
 */
export function validateState(
    state: MatchState,
    rules: MatchRules
): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    const p1Score = state.player1?.score ?? 0;
    const p2Score = state.player2?.score ?? 0;
    const p1GamesWon = state.player1?.gamesWon ?? 0;
    const p2GamesWon = state.player2?.gamesWon ?? 0;
    const historyLength = state.gameHistory?.length ?? 0;
    const gamesNeeded = Math.ceil(rules.bestOf / 2);

    // Score bounds
    if (p1Score < 0) errors.push('Player 1 score cannot be negative');
    if (p2Score < 0) errors.push('Player 2 score cannot be negative');

    // Games won bounds
    if (p1GamesWon > gamesNeeded) {
        errors.push(`Player 1 gamesWon (${p1GamesWon}) exceeds maximum (${gamesNeeded})`);
    }
    if (p2GamesWon > gamesNeeded) {
        errors.push(`Player 2 gamesWon (${p2GamesWon}) exceeds maximum (${gamesNeeded})`);
    }

    // History bounds
    if (historyLength > rules.bestOf) {
        errors.push(`gameHistory length (${historyLength}) exceeds bestOf (${rules.bestOf})`);
    }

    // Completed match guard
    if (state.status === 'completed') {
        errors.push('Cannot modify score on a completed match');
    }

    return {
        valid: errors.length === 0,
        errors,
    };
}
