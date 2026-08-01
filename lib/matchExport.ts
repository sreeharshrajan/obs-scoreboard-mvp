import { MatchState, ScoreEvent, BreakEvent, GameResult } from '@/types/match';
import { getGameStructure } from '@/lib/matchHelpers';

// ── Types ──

export interface SetTimelineGroup {
    gameNumber: number;
    p1SetsBefore: number;
    p2SetsBefore: number;
    setScoreBefore: string;
    gameResult?: {
        player1Score: number;
        player2Score: number;
        winner: string;
        completedAt: string | null;
    };
    events: Array<MatchExportData['timeline'][number]>;
}

export interface MatchExportData {
    matchInfo: {
        tournament: string;
        court: string;
        matchType: string;
        scoringType: string;
        status: string;
        totalDuration: string;
        totalDurationSeconds: number;
        completedAt: string | null;
    };
    players: {
        player1: { name: string; partner?: string; gamesWon: number; finalScore: number };
        player2: { name: string; partner?: string; gamesWon: number; finalScore: number };
    };
    winner: string | null;
    gameResults: Array<{
        gameNumber: number;
        player1Score: number;
        player2Score: number;
        winner: string;
        completedAt: string | null;
    }>;
    timeline: Array<{
        time: string;
        elapsedSeconds: number;
        game: number;
        eventType: 'point' | 'break_start' | 'break_end';
        player: string;
        scoreChange: string;
        p1Score: number;
        p2Score: number;
        p1Sets: number;
        p2Sets: number;
        setScore: string;
        detail: string;
    }>;
    setGroups: SetTimelineGroup[];
    breakSummary: {
        totalBreaks: number;
        totalBreakDuration: string;
        breaks: Array<{
            startTime: string;
            endTime: string | null;
            durationSeconds: number;
            targetDuration: number;
        }>;
    };
}

// ── Helpers ──

function formatElapsed(seconds: number): string {
    const safeSeconds = Math.max(0, Math.round(seconds));
    const h = Math.floor(safeSeconds / 3600);
    const m = Math.floor((safeSeconds % 3600) / 60);
    const s = safeSeconds % 60;
    if (h > 0) {
        return `${h}h ${m.toString().padStart(2, '0')}m ${s.toString().padStart(2, '0')}s`;
    }
    return `${m}m ${s.toString().padStart(2, '0')}s`;
}

function formatTimestamp(ts: number): string {
    return new Date(ts).toLocaleString('en-IN', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: true,
    });
}

function formatTimeMMSS(seconds: number): string {
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}

function getPlayerName(match: MatchState, team: 'player1' | 'player2'): string {
    const p = match[team];
    if (!p) return team === 'player1' ? 'Player 1' : 'Player 2';
    return [p.name, p.name2].filter(Boolean).join(' & ');
}

// ── Core: Build Export Data ──

export function buildExportData(match: MatchState): MatchExportData {
    const p1Name = getPlayerName(match, 'player1');
    const p2Name = getPlayerName(match, 'player2');
    const { p1GamesWon, p2GamesWon, gameHistory } = getGameStructure(match);

    const totalSeconds = match.timerElapsed || 0;
    const winner = p1GamesWon > p2GamesWon ? p1Name : p2GamesWon > p1GamesWon ? p2Name : null;

    // Build unified timeline from score events + break events
    const scoreEvents = match.scoreEvents ?? [];
    const breakEvents = match.breakEvents ?? [];

    type RawTimelineEntry = {
        time: string;
        elapsedSeconds: number;
        game: number;
        eventType: 'point' | 'break_start' | 'break_end';
        player: string;
        scoreChange: string;
        p1Score: number;
        p2Score: number;
        detail: string;
    };
    const rawTimeline: RawTimelineEntry[] = [];

    // Add score events
    for (const evt of scoreEvents) {
        rawTimeline.push({
            time: formatTimeMMSS(evt.elapsedTime),
            elapsedSeconds: evt.elapsedTime,
            game: evt.gameNumber,
            eventType: 'point',
            player: evt.team === 'player1' ? p1Name : p2Name,
            scoreChange: evt.delta > 0 ? `+${evt.delta}` : `${evt.delta}`,
            p1Score: evt.resultingScore.player1,
            p2Score: evt.resultingScore.player2,
            detail: `${evt.resultingScore.player1}-${evt.resultingScore.player2}`,
        });
    }

    // Add break events
    for (const brk of breakEvents) {
        const gameAtBreak = (match.gameHistory ?? []).filter(g =>
            g.completedAt && g.completedAt <= brk.timestamp
        ).length + 1;

        rawTimeline.push({
            time: formatTimeMMSS(brk.elapsedTime),
            elapsedSeconds: brk.elapsedTime,
            game: gameAtBreak,
            eventType: brk.type,
            player: '—',
            scoreChange: '—',
            p1Score: 0,
            p2Score: 0,
            detail: brk.type === 'break_start'
                ? `Break started (${brk.durationSeconds ?? 60}s)`
                : 'Break ended',
        });
    }

    // Sort by elapsed time
    rawTimeline.sort((a, b) => a.elapsedSeconds - b.elapsedSeconds);

    // Populate set count (p1Sets, p2Sets, setScore) for each entry
    type TimelineEntry = MatchExportData['timeline'][number];
    const timeline: TimelineEntry[] = rawTimeline.map((evt) => {
        const completedPriorGames = gameHistory.filter(g => g.gameNumber < evt.game);
        const p1Sets = completedPriorGames.filter(g => g.winner === 'player1').length;
        const p2Sets = completedPriorGames.filter(g => g.winner === 'player2').length;
        return {
            ...evt,
            p1Sets,
            p2Sets,
            setScore: `${p1Sets}-${p2Sets}`,
        };
    });

    // Group timeline entries into setGroups
    const setMap = new Map<number, SetTimelineGroup>();

    for (const entry of timeline) {
        if (!setMap.has(entry.game)) {
            const priorGames = gameHistory.filter(g => g.gameNumber < entry.game);
            const p1SetsBefore = priorGames.filter(g => g.winner === 'player1').length;
            const p2SetsBefore = priorGames.filter(g => g.winner === 'player2').length;
            const gResult = gameHistory.find(g => g.gameNumber === entry.game);

            setMap.set(entry.game, {
                gameNumber: entry.game,
                p1SetsBefore,
                p2SetsBefore,
                setScoreBefore: `${p1SetsBefore}-${p2SetsBefore}`,
                gameResult: gResult ? {
                    player1Score: gResult.player1Score,
                    player2Score: gResult.player2Score,
                    winner: gResult.winner === 'player1' ? p1Name : p2Name,
                    completedAt: gResult.completedAt ? formatTimestamp(gResult.completedAt) : null,
                } : undefined,
                events: [],
            });
        }
        setMap.get(entry.game)!.events.push(entry);
    }
    const setGroups = Array.from(setMap.values()).sort((a, b) => a.gameNumber - b.gameNumber);

    // Build break summary (pair start/end events)
    const breakPairs: MatchExportData['breakSummary']['breaks'] = [];
    const startStack: BreakEvent[] = [];
    for (const brk of breakEvents) {
        if (brk.type === 'break_start') {
            startStack.push(brk);
        } else if (brk.type === 'break_end' && startStack.length > 0) {
            const start = startStack.pop()!;
            breakPairs.push({
                startTime: formatTimestamp(start.timestamp),
                endTime: formatTimestamp(brk.timestamp),
                durationSeconds: Math.round((brk.timestamp - start.timestamp) / 1000),
                targetDuration: start.durationSeconds ?? 60,
            });
        }
    }
    // Handle unclosed breaks
    for (const orphanStart of startStack) {
        breakPairs.push({
            startTime: formatTimestamp(orphanStart.timestamp),
            endTime: null,
            durationSeconds: Math.round((Date.now() - orphanStart.timestamp) / 1000),
            targetDuration: orphanStart.durationSeconds ?? 60,
        });
    }

    const totalBreakDuration = breakPairs.reduce((sum, b) => sum + b.durationSeconds, 0);

    return {
        matchInfo: {
            tournament: match.tournamentName || 'Unknown Tournament',
            court: match.court || 'Court 1',
            matchType: match.matchType || 'General',
            scoringType: match.scoringType || '21x3',
            status: match.status,
            totalDuration: formatElapsed(totalSeconds),
            totalDurationSeconds: totalSeconds,
            completedAt: match.completedAt ? formatTimestamp(match.completedAt) : null,
        },
        players: {
            player1: {
                name: match.player1?.name || 'Player 1',
                partner: match.player1?.name2,
                gamesWon: p1GamesWon,
                finalScore: match.player1?.score ?? 0,
            },
            player2: {
                name: match.player2?.name || 'Player 2',
                partner: match.player2?.name2,
                gamesWon: p2GamesWon,
                finalScore: match.player2?.score ?? 0,
            },
        },
        winner,
        gameResults: gameHistory.map((g) => ({
            gameNumber: g.gameNumber,
            player1Score: g.player1Score,
            player2Score: g.player2Score,
            winner: g.winner === 'player1' ? p1Name : p2Name,
            completedAt: g.completedAt ? formatTimestamp(g.completedAt) : null,
        })),
        timeline,
        setGroups,
        breakSummary: {
            totalBreaks: breakPairs.length,
            totalBreakDuration: formatElapsed(totalBreakDuration),
            breaks: breakPairs,
        },
    };
}

// ── Formatters ──

export function generateTextSummary(data: MatchExportData): string {
    const lines: string[] = [];
    const divider = '═'.repeat(56);
    const thinDivider = '─'.repeat(56);

    lines.push(divider);
    lines.push('  MATCH SUMMARY REPORT');
    lines.push(divider);
    lines.push('');

    // Match info
    lines.push(`  Tournament:    ${data.matchInfo.tournament}`);
    lines.push(`  Court:         ${data.matchInfo.court}`);
    lines.push(`  Match Type:    ${data.matchInfo.matchType}`);
    lines.push(`  Scoring:       ${data.matchInfo.scoringType}`);
    lines.push(`  Status:        ${data.matchInfo.status.toUpperCase()}`);
    lines.push(`  Duration:      ${data.matchInfo.totalDuration}`);
    if (data.matchInfo.completedAt) {
        lines.push(`  Completed:     ${data.matchInfo.completedAt}`);
    }
    lines.push('');

    // Result
    lines.push(thinDivider);
    if (data.winner) {
        lines.push(`  🏆 WINNER: ${data.winner}`);
    } else {
        lines.push('  ⚔️  Match in progress / No winner decided');
    }
    lines.push(thinDivider);
    lines.push('');

    // Players & Final Score
    const p1 = data.players.player1;
    const p2 = data.players.player2;
    const p1Display = p1.partner ? `${p1.name} & ${p1.partner}` : p1.name;
    const p2Display = p2.partner ? `${p2.name} & ${p2.partner}` : p2.name;

    lines.push(`  ${p1Display}`);
    lines.push(`    Sets Won: ${p1.gamesWon}    Current Score: ${p1.finalScore}`);
    lines.push('');
    lines.push(`  ${p2Display}`);
    lines.push(`    Sets Won: ${p2.gamesWon}    Current Score: ${p2.finalScore}`);
    lines.push('');

    // Game-by-game breakdown
    if (data.gameResults.length > 0) {
        lines.push(thinDivider);
        lines.push('  SET-BY-SET RESULTS');
        lines.push(thinDivider);
        lines.push('');

        for (const g of data.gameResults) {
            lines.push(`  Set ${g.gameNumber}: ${g.player1Score} - ${g.player2Score}  →  Winner: ${g.winner}`);
            if (g.completedAt) {
                lines.push(`    Completed at: ${g.completedAt}`);
            }
        }
        lines.push('');
    }

    // Break Summary
    if (data.breakSummary.totalBreaks > 0) {
        lines.push(thinDivider);
        lines.push('  BREAK SUMMARY');
        lines.push(thinDivider);
        lines.push('');
        lines.push(`  Total Breaks: ${data.breakSummary.totalBreaks}`);
        lines.push(`  Total Break Time: ${data.breakSummary.totalBreakDuration}`);
        lines.push('');

        for (let i = 0; i < data.breakSummary.breaks.length; i++) {
            const b = data.breakSummary.breaks[i];
            lines.push(`  Break ${i + 1}:`);
            lines.push(`    Started:  ${b.startTime}`);
            lines.push(`    Ended:    ${b.endTime ?? 'Still active'}`);
            lines.push(`    Duration: ${formatElapsed(b.durationSeconds)} (target: ${formatElapsed(b.targetDuration)})`);
        }
        lines.push('');
    }

    // Scoring Timeline Grouped by Sets
    if (data.setGroups.length > 0) {
        lines.push(thinDivider);
        lines.push('  SCORING TIMELINE (GROUPED BY SETS)');
        lines.push(thinDivider);
        lines.push('');

        for (const group of data.setGroups) {
            const groupPoints = group.events.filter(e => e.eventType === 'point');
            if (groupPoints.length === 0) continue;

            const resStr = group.gameResult
                ? ` (Final: ${group.gameResult.player1Score}-${group.gameResult.player2Score}, Winner: ${group.gameResult.winner})`
                : ' (In Progress)';

            lines.push(`  ── SET ${group.gameNumber}${resStr} ──`);
            lines.push(`  ${'Time'.padEnd(8)} ${'Player'.padEnd(24)} ${'Δ'.padEnd(4)} ${'Rally'.padEnd(10)} ${'Set Score'.padEnd(10)}`);
            lines.push(`  ${'─'.repeat(8)} ${'─'.repeat(24)} ${'─'.repeat(4)} ${'─'.repeat(10)} ${'─'.repeat(10)}`);

            for (const e of groupPoints) {
                const playerTruncated = e.player.length > 22 ? e.player.substring(0, 22) + '..' : e.player;
                lines.push(
                    `  ${e.time.padEnd(8)} ${playerTruncated.padEnd(24)} ${e.scoreChange.padEnd(4)} ${e.detail.padEnd(10)} ${e.setScore.padEnd(10)}`
                );
            }
            lines.push('');
        }
    }

    lines.push(divider);
    lines.push(`  Generated: ${new Date().toLocaleString()}`);
    lines.push(divider);

    return lines.join('\n');
}

export function generateCSV(data: MatchExportData): string {
    const rows: string[] = [];

    // Header with set count included
    rows.push('Time,Elapsed (s),Game,Event Type,Player,Score Change,P1 Score,P2 Score,P1 Sets,P2 Sets,Set Score,Detail');

    for (const e of data.timeline) {
        const escapedPlayer = `"${e.player.replace(/"/g, '""')}"`;
        const escapedDetail = `"${e.detail.replace(/"/g, '""')}"`;
        rows.push(
            `${e.time},${Math.round(e.elapsedSeconds)},${e.game},${e.eventType},${escapedPlayer},${e.scoreChange},${e.p1Score},${e.p2Score},${e.p1Sets},${e.p2Sets},"${e.setScore}",${escapedDetail}`
        );
    }

    return rows.join('\n');
}

export function generateJSON(data: MatchExportData): string {
    return JSON.stringify(data, null, 2);
}

// ── Download Trigger ──

export function downloadFile(content: string, filename: string, mimeType: string): void {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

export function exportMatchSummary(match: MatchState, format: 'csv' | 'txt' | 'json'): void {
    const data = buildExportData(match);

    const p1Name = (match.player1?.name || 'P1').replace(/\s+/g, '_');
    const p2Name = (match.player2?.name || 'P2').replace(/\s+/g, '_');
    const dateStr = new Date().toISOString().split('T')[0];
    const baseFilename = `match_${p1Name}_vs_${p2Name}_${dateStr}`;

    switch (format) {
        case 'txt': {
            const content = generateTextSummary(data);
            downloadFile(content, `${baseFilename}_summary.txt`, 'text/plain;charset=utf-8');
            break;
        }
        case 'csv': {
            const content = generateCSV(data);
            downloadFile(content, `${baseFilename}_timeline.csv`, 'text/csv;charset=utf-8');
            break;
        }
        case 'json': {
            const content = generateJSON(data);
            downloadFile(content, `${baseFilename}_data.json`, 'application/json;charset=utf-8');
            break;
        }
    }
}
