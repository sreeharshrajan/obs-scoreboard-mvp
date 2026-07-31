import { MatchState } from "@/types/match";

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

export interface MatchDetailsData {
    p1Name: string;
    p1Name2?: string;
    p2Name: string;
    p2Name2?: string;
    p1Score: number;
    p2Score: number;
    p1Serving: boolean;
    p2Serving: boolean;
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
    const p1Serving = match.player1?.isServing ?? false;
    const p2Serving = match.player2?.isServing ?? false;

    const tournamentName = match.tournamentName || "TOURNAMENT MATCH";
    const matchCategory = match.matchCategory || match.category || "GENERAL";
    const courtName = match.court || "COURT 1";
    const matchType = match.matchType || match.scoringType;

    const activeSponsor = getActiveSponsor(
        sponsors,
        currentSponsorIndex,
        !!match.isSponsorsOverlayActive
    );

    return {
        p1Name,
        p1Name2,
        p2Name,
        p2Name2,
        p1Score,
        p2Score,
        p1Serving,
        p2Serving,
        tournamentName,
        matchCategory,
        courtName,
        matchType,
        activeSponsor,
    };
}
