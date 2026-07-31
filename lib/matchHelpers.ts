import { MatchState, GameResult } from "@/types/match";
import { getRuleSet } from "@/lib/scoring/rules";

export interface Sponsor {
    id: string;
    name: string;
    note?: string;
    priority?: number;
    status?: boolean;
    advertUrl: string;
    createdAt?: number;
}

/**
 * Safely resolves the active sponsor from array and index
 */
export function getActiveSponsor(
    sponsors: Sponsor[] = [],
    currentSponsorIndex: number = 0,
    isOverlayActive: boolean = true
): Sponsor | null {
    if (!isOverlayActive || !sponsors || sponsors.length === 0) {
        return null;
    }
    const safeIndex = ((currentSponsorIndex % sponsors.length) + sponsors.length) % sponsors.length;
    return sponsors[safeIndex] || null;
}

export interface GameScoreBox {
    gameNumber: number;
    p1Score: number | string;
    p2Score: number | string;
    isCurrent: boolean;
    isCompleted: boolean;
    p1Winner?: boolean;
    p2Winner?: boolean;
}

export interface MatchDetailsData {
    p1Name: string;
    p1Name2?: string;
    p2Name: string;
    p2Name2?: string;
    p1Score: number;
    p2Score: number;
    p1Serving: boolean;
    p2Serving: boolean;
    p1GamesWon: number;
    p2GamesWon: number;
    currentGame: number;
    totalGames: number;
    gameHistory: GameResult[];
    gameScores: GameScoreBox[];
    tournamentName: string;
    matchCategory: string;
    courtName: string;
    matchType?: string;
    activeSponsor: Sponsor | null;
}

/**
 * Extracts and normalizes match display details for overlays
 */
export function getMatchDetails(
    match: MatchState,
    sponsors: Sponsor[] = [],
    currentSponsorIndex: number = 0
): MatchDetailsData {
    const p1Name = match.player1?.name || "Player 1";
    const p1Name2 = match.player1?.name2;
    const p2Name = match.player2?.name || "Player 2";
    const p2Name2 = match.player2?.name2;

    const p1Score = match.player1?.score || 0;
    const p2Score = match.player2?.score || 0;
    const currentServer = match.currentServer ?? (match.player1?.isServing ? 'player1' : 'player2');
    const p1Serving = currentServer === 'player1';
    const p2Serving = currentServer === 'player2';

    const tournamentName = match.tournamentName || "TOURNAMENT MATCH";
    const matchCategory = match.matchCategory || match.category || "GENERAL";
    const courtName = match.court || "COURT 1";
    const matchType = match.matchType || match.scoringType;

    const activeSponsor = getActiveSponsor(
        sponsors,
        currentSponsorIndex,
        !!match.isSponsorsOverlayActive
    );

    const { currentGame, totalGames, p1GamesWon, p2GamesWon, gameHistory } =
        getGameStructure(match);

    const gameScores = getPerGameScores(match);

    return {
        p1Name,
        p1Name2,
        p2Name,
        p2Name2,
        p1Score,
        p2Score,
        p1Serving,
        p2Serving,
        p1GamesWon,
        p2GamesWon,
        currentGame,
        totalGames,
        gameHistory,
        gameScores,
        tournamentName,
        matchCategory,
        courtName,
        matchType,
        activeSponsor,
    };
}

// ── Game Structure Helper (read-only, for display) ──

/**
 * Derives game structure info from match state.
 * currentGame is derived from gameHistory length — never stored.
 * Safe for legacy documents that lack gameHistory or gamesWon fields.
 */
export function getGameStructure(match: MatchState): {
    currentGame: number;
    totalGames: number;
    p1GamesWon: number;
    p2GamesWon: number;
    gameHistory: GameResult[];
} {
    const gameHistory = match.gameHistory ?? [];
    const rules = getRuleSet(match.sport, match.scoringType);
    const totalGames = rules.bestOf;

    const rawCurrentGame = gameHistory.length + 1;
    const currentGame = Math.min(rawCurrentGame, totalGames);

    return {
        currentGame,
        totalGames,
        p1GamesWon: match.player1?.gamesWon ?? 0,
        p2GamesWon: match.player2?.gamesWon ?? 0,
        gameHistory,
    };
}

/**
 * Returns score per game for each set in the match (e.g. Game 1, Game 2, Game 3).
 * For completed games, shows archived scores from gameHistory.
 * For the active game, shows current rally scores from match.player1/player2.
 * For future unplayed games, shows '-'.
 */
export function getPerGameScores(match: MatchState): GameScoreBox[] {
    const gameHistory = match.gameHistory ?? [];
    const rules = getRuleSet(match.sport, match.scoringType);
    const totalGames = rules.bestOf;
    const isCompleted = match.status === 'completed';
    const currentGameNumber = Math.min(gameHistory.length + 1, totalGames);

    const boxes: GameScoreBox[] = [];

    for (let g = 1; g <= totalGames; g++) {
        if (g <= gameHistory.length) {
            const h = gameHistory[g - 1];
            boxes.push({
                gameNumber: g,
                p1Score: h.player1Score,
                p2Score: h.player2Score,
                isCurrent: false,
                isCompleted: true,
                p1Winner: h.winner === 'player1',
                p2Winner: h.winner === 'player2',
            });
        } else if (g === currentGameNumber && !isCompleted) {
            boxes.push({
                gameNumber: g,
                p1Score: match.player1?.score ?? 0,
                p2Score: match.player2?.score ?? 0,
                isCurrent: true,
                isCompleted: false,
            });
        } else {
            boxes.push({
                gameNumber: g,
                p1Score: '-',
                p2Score: '-',
                isCurrent: false,
                isCompleted: false,
            });
        }
    }

    return boxes;
}

