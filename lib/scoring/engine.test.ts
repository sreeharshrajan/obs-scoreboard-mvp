import { describe, it, expect } from 'vitest';
import { MatchState } from '@/types/match';
import { getRuleSet } from './rules';
import { processScoringPipeline, resetMatchState, startMatchTimer, pauseMatchTimer, completeMatch, resumeMatch, toggleBreakState } from './engine';
import { validateState } from './validation';

function createInitialState(): MatchState {
    return {
        sport: 'badminton',
        scoringType: '21x3',
        player1: { name: 'Player 1', score: 0, gamesWon: 0 },
        player2: { name: 'Player 2', score: 0, gamesWon: 0 },
        currentServer: 'player1',
        isTimerRunning: false,
        timerStartTime: null,
        timerElapsed: 0,
        status: 'live',
        gameHistory: [],
        scoreEvents: [],
        version: 1,
    };
}

describe('Badminton Scoring Engine', () => {
    const rules = getRuleSet('badminton', '21x3');

    it('Scenario 1: 20-20 -> 21-20 is NOT finished (requires winBy 2)', () => {
        let state = createInitialState();
        state.player1.score = 20;
        state.player2.score = 20;

        const nextState = processScoringPipeline(state, 'player1', 1, rules);

        expect(nextState.player1.score).toBe(21);
        expect(nextState.player2.score).toBe(20);
        expect(nextState.gameHistory?.length ?? 0).toBe(0);
        expect(nextState.status).toBe('live');
    });

    it('Scenario 2: 21-19 IS finished (21 points + leading by 2)', () => {
        let state = createInitialState();
        state.player1.score = 20;
        state.player2.score = 19;

        const nextState = processScoringPipeline(state, 'player1', 1, rules);

        expect(nextState.gameHistory?.length).toBe(1);
        expect(nextState.gameHistory![0]).toMatchObject({
            gameNumber: 1,
            player1Score: 21,
            player2Score: 19,
            winner: 'player1',
        });
        expect(nextState.player1.score).toBe(0);
        expect(nextState.player2.score).toBe(0);
        expect(nextState.player1.gamesWon).toBe(1);
        expect(nextState.player2.gamesWon).toBe(0);
    });

    it('Scenario 3: 29-29 -> 30-29 IS finished (hard cap at maxScore 30)', () => {
        let state = createInitialState();
        state.player1.score = 29;
        state.player2.score = 29;

        const nextState = processScoringPipeline(state, 'player1', 1, rules);

        expect(nextState.gameHistory?.length).toBe(1);
        expect(nextState.gameHistory![0]).toMatchObject({
            gameNumber: 1,
            player1Score: 30,
            player2Score: 29,
            winner: 'player1',
        });
        expect(nextState.player1.score).toBe(0);
        expect(nextState.player2.score).toBe(0);
    });

    it('Scenario 4: 0-0 -> 21-0 IS finished (21 points leading by 21)', () => {
        let state = createInitialState();
        state.player1.score = 20;
        state.player2.score = 0;

        const nextState = processScoringPipeline(state, 'player1', 1, rules);

        expect(nextState.gameHistory?.length).toBe(1);
        expect(nextState.gameHistory![0]).toMatchObject({
            gameNumber: 1,
            player1Score: 21,
            player2Score: 0,
            winner: 'player1',
        });
    });

    it('Scenario 5: GamesWon = 1 -> Win second game -> status = completed', () => {
        let state = createInitialState();
        state.isTimerRunning = true;
        state.timerStartTime = Date.now() - 60000;
        state.player1.gamesWon = 1;
        state.player1.score = 20;
        state.player2.score = 15;
        state.gameHistory = [
            { gameNumber: 1, player1Score: 21, player2Score: 18, winner: 'player1' }
        ];

        const nextState = processScoringPipeline(state, 'player1', 1, rules);

        expect(nextState.player1.gamesWon).toBe(2);
        expect(nextState.gameHistory?.length).toBe(2);
        expect(nextState.status).toBe('completed');
        expect(nextState.completedAt).toBeDefined();
        expect(nextState.isTimerRunning).toBe(false);
        expect(nextState.timerStartTime).toBeNull();
    });

    it('Scenario 6: Game 1 win -> Game 2 transition & event sequencing', () => {
        let state = createInitialState();
        state.player1.score = 20;
        state.player2.score = 19;

        // Winning point of Game 1
        const stateAfterGame1 = processScoringPipeline(state, 'player1', 1, rules);

        expect(stateAfterGame1.player1.gamesWon).toBe(1);
        expect(stateAfterGame1.gameHistory?.length).toBe(1);
        expect(stateAfterGame1.player1.score).toBe(0);

        // Verify the 21st point event was recorded with gameNumber 1 and resultingScore 21-19 BEFORE game reset
        const lastEventGame1 = stateAfterGame1.scoreEvents![stateAfterGame1.scoreEvents!.length - 1];
        expect(lastEventGame1.gameNumber).toBe(1);
        expect(lastEventGame1.resultingScore).toEqual({ player1: 21, player2: 19 });

        // First point of Game 2
        const stateGame2Point1 = processScoringPipeline(stateAfterGame1, 'player2', 1, rules);

        expect(stateGame2Point1.gameHistory?.length).toBe(1); // game 1 preserved
        expect(stateGame2Point1.player1.gamesWon).toBe(1);
        expect(stateGame2Point1.player2.score).toBe(1);

        const lastEventGame2 = stateGame2Point1.scoreEvents![stateGame2Point1.scoreEvents!.length - 1];
        expect(lastEventGame2.gameNumber).toBe(2);
        expect(lastEventGame2.team).toBe('player2');
        expect(lastEventGame2.previousScore).toEqual({ player1: 0, player2: 0 });
        expect(lastEventGame2.resultingScore).toEqual({ player1: 0, player2: 1 });
    });

    it('Scenario 7: resetMatchState helper clears scores and sets while preserving metadata', () => {
        let state = createInitialState();
        state.player1.score = 14;
        state.player1.gamesWon = 1;
        state.player2.score = 18;
        state.status = 'live';
        state.tournamentName = 'Championship 2026';
        state.court = 'Court 3';
        state.gameHistory = [
            { gameNumber: 1, player1Score: 21, player2Score: 19, winner: 'player1' }
        ];

        const resetState = resetMatchState(state);

        expect(resetState.player1.score).toBe(0);
        expect(resetState.player1.gamesWon).toBe(0);
        expect(resetState.player2.score).toBe(0);
        expect(resetState.player2.gamesWon).toBe(0);
        expect(resetState.gameHistory).toEqual([]);
        expect(resetState.scoreEvents).toEqual([]);
        expect(resetState.currentServer).toBe('player1');
        expect(resetState.status).toBe('scheduled');
        expect(resetState.tournamentName).toBe('Championship 2026');
        expect(resetState.court).toBe('Court 3');
    });

    it('Scenario 8: completeMatch cleanly stops timer and sets status completed', () => {
        let state = createInitialState();
        state = startMatchTimer(state);
        expect(state.isTimerRunning).toBe(true);

        const completedState = completeMatch(state);
        expect(completedState.status).toBe('completed');
        expect(completedState.isTimerRunning).toBe(false);
        expect(completedState.timerStartTime).toBeNull();
        expect(completedState.completedAt).toBeDefined();
    });

    it('Scenario 9: resumeMatch transitions completed match to live', () => {
        let state = createInitialState();
        state.status = 'completed';

        const resumedState = resumeMatch(state);
        expect(resumedState.status).toBe('live');

        // Verify startMatchTimer works on resumed match
        const startedState = startMatchTimer(resumedState);
        expect(startedState.isTimerRunning).toBe(true);
        expect(startedState.status).toBe('live');
    });

    it('Scenario 10: validateState rejects score mutations on completed matches', () => {
        let state = createInitialState();
        state.status = 'completed';

        const validation = validateState(state, rules);
        expect(validation.valid).toBe(false);
        expect(validation.errors).toContain('Cannot modify score on a completed match');
    });

    it('Scenario 11: timer pause and resume accumulates elapsed time without reset', () => {
        let state = createInitialState();
        state.timerElapsed = 100;

        const startedState = startMatchTimer(state);
        expect(startedState.isTimerRunning).toBe(true);

        const pausedState = pauseMatchTimer(startedState);
        expect(pausedState.isTimerRunning).toBe(false);
        expect(pausedState.timerElapsed).toBeGreaterThanOrEqual(100);
    });
});
