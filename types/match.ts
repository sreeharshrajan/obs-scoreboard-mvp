export interface PlayerState {
    name: string;
    name2?: string; // For doubles/mixed
    isServing: boolean;
    score: number;
    gamesWon?: number; // Games won in this match (0, 1, or 2). Defaults to 0 for legacy docs.
}

export type MatchStatus = 'scheduled' | 'live' | 'completed' | 'break';

// Structured per-game result — stored in MatchState.gameHistory
export interface GameResult {
    gameNumber: number;
    player1Score: number;
    player2Score: number;
    winner: 'player1' | 'player2';
}

// Configurable sport rules — runtime only, never persisted.
// Derived from sport + scoringType via getRuleSet().
export interface MatchRules {
    bestOf: number;          // e.g. 3
    targetScore: number;     // e.g. 21
    winBy: number;           // e.g. 2 (deuce rule)
    maxScore: number;        // e.g. 30 (hard cap)
    rallyPoint: boolean;     // true = rally winner serves next
    autoEndGame: boolean;    // true = game ends automatically on win condition
    autoEndMatch: boolean;   // true = match ends automatically when bestOf reached
}

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

    // Match Config
    matchTime?: string;
    matchType?: 'Intermediate' | 'Beginner' | 'Advanced' | 'Singles' | 'Doubles' | 'Mixed Doubles';
    ageGroup?: string;
    court?: string;
    matchCategory?: string;
    roundType?: 'Round robin' | 'Knockout';
    scoringType?: '15x3' | '15x1' | '21x3' | '21x1' | '30x1';

    // Game Structure — derived currentGame = (gameHistory?.length ?? 0) + 1
    gameHistory?: GameResult[];

    // UI/Meta
    tournamentName?: string;
    tournamentLogo?: string;
    category?: string; // Legacy/General category
    status: MatchStatus;

    serverNumber?: 1 | 2;
    overlayScale?: number;
    overlayTemplate?: 'default' | 'classic' | 'bwf';
    streamerLogo?: string;
    showFullScreenMatchDetails?: boolean;

    // Sponsor Options
    sponsorDisplayMode?: 'card' | 'logoOnly';
    sponsorPosition?: 'left' | 'center' | 'right';
    sponsorLogoSize?: 'sm' | 'md' | 'lg' | 'xl';
}

export interface Match extends MatchState {
    id: string;
    startTime?: string;
}
