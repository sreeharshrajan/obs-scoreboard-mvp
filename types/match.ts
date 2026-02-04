export interface PlayerState {
    name: string;
    score: number;
    isServing: boolean;
}

export interface MatchState {
    sport: 'badminton'; // Restricted to badminton
    player1: PlayerState;
    player2: PlayerState;
    isTimerRunning: boolean;
    timerStartTime: number | null;
    timerElapsed: number;
    serverNumber?: 1 | 2; // Kept optional, but specific to doubles logic if we add it later
    tournamentName?: string;
    category?: string;
    scoringType?: string;
    court?: string;
    overlayScale?: number;
    status?: string;
    streamerLogo?: string;
}
