export interface PlayerState {
    name: string;
    name2?: string; // For doubles/mixed
    isServing: boolean;
    score: number;
}

export type MatchStatus = 'scheduled' | 'live' | 'completed' | 'break';

export interface MatchState {
    sport: 'badminton';
    player1: PlayerState;
    player2: PlayerState;
    isTimerRunning: boolean;
    timerStartTime: number | null;
    timerElapsed: number;
    isSponsorsOverlayActive?: boolean;
    showTournamentLogo?: boolean;
    showStreamerLogo?: boolean;
    showMatchInfo?: boolean;

    // New Fields
    matchTime?: string;
    matchType?: 'Intermediate' | 'Beginner' | 'Advanced' | 'Singles' | 'Doubles' | 'Mixed Doubles';
    ageGroup?: string;
    court?: string;
    matchCategory?: string;
    roundType?: 'Round robin' | 'Knockout';
    scoringType?: '15x3' | '15x1' | '21x3' | '21x1' | '30x1';

    // UI/Meta
    tournamentName?: string;
    tournamentLogo?: string;
    category?: string; // Legacy/General category
    status: MatchStatus;

    serverNumber?: 1 | 2;
    streamerLogo?: string;

    // Overlay Configuration
    overlayConfig?: {
        version: number;
        activeOrientation?: 'landscape' | 'portrait';
        resolutions?: {
            landscape?: { width: number; height: number };
            portrait?: { width: number; height: number };
        };
        layouts?: {
            landscape?: {
                id: string;
                type: 'scoreboard' | 'sponsors' | 'matchInfo' | 'ticker';
                position: { x: number; y: number };
                scale: number;
                visible: boolean;
                opacity: number;
                zIndex: number;
            }[];
            portrait?: {
                id: string;
                type: 'scoreboard' | 'sponsors' | 'matchInfo' | 'ticker';
                position: { x: number; y: number };
                scale: number;
                visible: boolean;
                opacity: number;
                zIndex: number;
            }[];
        };
        // Legacy: For backward compatibility during migration
        components?: any[];
    };
}

export interface Match extends MatchState {
    id: string;
    startTime?: string;
}
