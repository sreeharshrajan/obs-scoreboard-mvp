import { describe, it, expect } from 'vitest';
import { MatchState } from '@/types/match';
import { getPerGameScores, getMatchDetails, swapMatchSides } from './matchHelpers';

function createMockMatch(overrides?: Partial<MatchState>): MatchState {

    return {
        sport: 'badminton',
        scoringType: '21x3',
        player1: { name: 'Player 1', score: 10, gamesWon: 0 },
        player2: { name: 'Player 2', score: 8, gamesWon: 0 },
        currentServer: 'player1',
        isTimerRunning: true,
        timerStartTime: Date.now(),
        timerElapsed: 120,
        status: 'live',
        gameHistory: [],
        scoreEvents: [],
        version: 1,
        ...overrides,
    };
}

describe('matchHelpers - getPerGameScores', () => {
    it('returns only current game box when match is in Game 1 and no prior games completed', () => {
        const match = createMockMatch();
        const scores = getPerGameScores(match);

        expect(scores).toHaveLength(1);
        expect(scores[0]).toEqual({
            gameNumber: 1,
            p1Score: 10,
            p2Score: 8,
            isCurrent: true,
            isCompleted: false,
        });
    });

    it('returns completed Game 1 and active Game 2 boxes, hiding unplayed Set 3', () => {
        const match = createMockMatch({
            player1: { name: 'Player 1', score: 5, gamesWon: 1 },
            player2: { name: 'Player 2', score: 3, gamesWon: 0 },
            gameHistory: [
                { gameNumber: 1, player1Score: 21, player2Score: 18, winner: 'player1' },
            ],
        });

        const scores = getPerGameScores(match);

        expect(scores).toHaveLength(2);
        expect(scores[0]).toEqual({
            gameNumber: 1,
            p1Score: 21,
            p2Score: 18,
            isCurrent: false,
            isCompleted: true,
            p1Winner: true,
            p2Winner: false,
        });
        expect(scores[1]).toEqual({
            gameNumber: 2,
            p1Score: 5,
            p2Score: 3,
            isCurrent: true,
            isCompleted: false,
        });
    });

    it('returns only 2 completed game boxes when match is completed 2-0, hiding unplayed Set 3', () => {
        const match = createMockMatch({
            status: 'completed',
            player1: { name: 'Player 1', score: 0, gamesWon: 2 },
            player2: { name: 'Player 2', score: 0, gamesWon: 0 },
            gameHistory: [
                { gameNumber: 1, player1Score: 21, player2Score: 18, winner: 'player1' },
                { gameNumber: 2, player1Score: 21, player2Score: 15, winner: 'player1' },
            ],
        });

        const scores = getPerGameScores(match);

        expect(scores).toHaveLength(2);
        expect(scores[0].gameNumber).toBe(1);
        expect(scores[1].gameNumber).toBe(2);
    });

    it('returns all 3 game boxes when all 3 sets are played', () => {
        const match = createMockMatch({
            status: 'completed',
            player1: { name: 'Player 1', score: 0, gamesWon: 2 },
            player2: { name: 'Player 2', score: 0, gamesWon: 1 },
            gameHistory: [
                { gameNumber: 1, player1Score: 21, player2Score: 18, winner: 'player1' },
                { gameNumber: 2, player1Score: 19, player2Score: 21, winner: 'player2' },
                { gameNumber: 3, player1Score: 21, player2Score: 14, winner: 'player1' },
            ],
        });

        const scores = getPerGameScores(match);

        expect(scores).toHaveLength(3);
    });

    it('ignores corrupted player.gamesWon in state when gameHistory is present', () => {
        const match = createMockMatch({
            player1: { name: 'Player 1', score: 14, gamesWon: 0 },
            player2: { name: 'Player 2', score: 15, gamesWon: 2 }, // Corrupted gamesWon=2 in document
            gameHistory: [
                { gameNumber: 1, player1Score: 9, player2Score: 15, winner: 'player2' },
            ],
        });

        const details = getMatchDetails(match);
        expect(details.p2GamesWon).toBe(1); // Derived correctly from gameHistory
        expect(details.currentGame).toBe(2);
    });

    it('hides 3rd set box when a player wins 2-0 even if status is still live', () => {
        const match = createMockMatch({
            status: 'live',
            player1: { name: 'Player 1', score: 0, gamesWon: 2 },
            player2: { name: 'Player 2', score: 0, gamesWon: 0 },
            gameHistory: [
                { gameNumber: 1, player1Score: 21, player2Score: 18, winner: 'player1' },
                { gameNumber: 2, player1Score: 21, player2Score: 15, winner: 'player1' },
            ],
        });

        const scores = getPerGameScores(match);
        expect(scores).toHaveLength(2);

        const details = getMatchDetails(match);
        expect(details.currentGame).toBe(2);
    });
});

describe('matchHelpers - swapMatchSides', () => {
    it('swaps player names, current scores, games won, current server, game history, and score events', () => {
        const match = createMockMatch({
            player1: { name: 'Alice', name2: 'Amy', score: 14, gamesWon: 1 },
            player2: { name: 'Bob', name2: 'Ben', score: 8, gamesWon: 0 },
            currentServer: 'player1',
            gameHistory: [
                { gameNumber: 1, player1Score: 21, player2Score: 18, winner: 'player1' }
            ],
            scoreEvents: [
                {
                    timestamp: 1000,
                    elapsedTime: 10,
                    gameNumber: 1,
                    team: 'player1',
                    delta: 1,
                    previousScore: { player1: 0, player2: 0 },
                    resultingScore: { player1: 1, player2: 0 }
                }
            ]
        });

        const updates = swapMatchSides(match);

        expect(updates.player1).toEqual({ name: 'Bob', name2: 'Ben', score: 8, gamesWon: 0 });
        expect(updates.player2).toEqual({ name: 'Alice', name2: 'Amy', score: 14, gamesWon: 1 });
        expect(updates.currentServer).toBe('player2');
        expect(updates.gameHistory).toEqual([
            { gameNumber: 1, player1Score: 18, player2Score: 21, winner: 'player2' }
        ]);
        expect(updates.scoreEvents).toEqual([
            {
                timestamp: 1000,
                elapsedTime: 10,
                gameNumber: 1,
                team: 'player2',
                delta: 1,
                previousScore: { player1: 0, player2: 0 },
                resultingScore: { player1: 0, player2: 1 }
            }
        ]);
    });
});


