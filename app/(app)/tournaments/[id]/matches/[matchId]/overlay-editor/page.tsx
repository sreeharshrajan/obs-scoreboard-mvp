"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { DragEndEvent } from '@dnd-kit/core';
import { auth } from '@/lib/firebase/client';
import { useQuery } from '@tanstack/react-query';
import { useParams } from 'next/navigation';
import { toast } from 'sonner';

import { EditorSidebar } from '@/components/overlay-editor/EditorSidebar';
import { EditorCanvas } from '@/components/overlay-editor/EditorCanvas';
import { OverlayComponent } from '@/components/overlay-editor/DraggableItem';

import { db } from '@/lib/firebase/client';
import { collection, query, onSnapshot } from 'firebase/firestore';

const DEFAULT_COMPONENTS: OverlayComponent[] = [
    { id: 'scoreboard', type: 'scoreboard', position: { x: 50, y: 850 }, scale: 1, visible: true, opacity: 1, zIndex: 10, label: 'Scoreboard' },
    { id: 'sponsors', type: 'sponsors', position: { x: 1400, y: 50 }, scale: 1, visible: true, opacity: 1, zIndex: 5, label: 'Sponsors Carousel' },
    { id: 'ticker', type: 'ticker', position: { x: 0, y: 1000 }, scale: 1, visible: false, opacity: 1, zIndex: 1, label: 'News Ticker' },
    { id: 'matchInfo', type: 'matchInfo', position: { x: 50, y: 50 }, scale: 1, visible: true, opacity: 1, zIndex: 1, label: 'Match Info' },
];

export default function OverlayEditor() {
    const params = useParams();
    const matchId = params.matchId as string;
    const tournamentId = params.id as string;

    // State
    const [landscapeComponents, setLandscapeComponents] = useState<OverlayComponent[]>(DEFAULT_COMPONENTS);
    const [selectedId, setSelectedId] = useState<string | null>(null);
    const [isSaving, setIsSaving] = useState(false);

    // Live Data State
    const [elapsedDisplay, setElapsedDisplay] = useState<number>(0);
    const [sponsors, setSponsors] = useState<{ id: string, advertUrl: string, name: string }[]>([]);
    const [currentSponsorIndex, setCurrentSponsorIndex] = useState(0);

    // Derived State
    const components = landscapeComponents;
    const setComponents = setLandscapeComponents;

    // Fetch Match Data
    const { data: match, isLoading } = useQuery({
        queryKey: ['match', matchId],
        queryFn: async () => {
            const user = auth.currentUser;
            if (!user) throw new Error("Not authenticated");
            const token = await user.getIdToken();
            const res = await fetch(`/api/tournaments/${tournamentId}/matches/${matchId}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (!res.ok) throw new Error('Failed to fetch match');
            return res.json();
        },
    });

    // Timer Logic
    useEffect(() => {
        if (!match) return;

        if (!match.isTimerRunning) {
            const val = match.timerElapsed || 0;
            setElapsedDisplay(prev => (prev !== val ? val : prev));
            return;
        }

        const calculateTime = () => {
            const now = Date.now();
            const startTime = match.timerStartTime ?? now;
            return (match.timerElapsed || 0) + (now - startTime) / 1000;
        };

        setElapsedDisplay(calculateTime());
        const timerInterval = setInterval(() => {
            setElapsedDisplay(calculateTime());
        }, 100);

        return () => clearInterval(timerInterval);
    }, [match?.isTimerRunning, match?.timerStartTime, match?.timerElapsed, match]);

    // Sponsors Logic
    useEffect(() => {
        if (!tournamentId) return;

        const q = query(collection(db, "tournaments", tournamentId, "sponsors"));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const activeSponsors = snapshot.docs
                .map(d => ({ id: d.id, ...d.data() } as any))
                .filter(s => s.status === true)
                .sort((a, b) => (a.priority || 99) - (b.priority || 99));
            setSponsors(activeSponsors);
        });

        return () => unsubscribe();
    }, [tournamentId]);

    // Carousel Timer
    useEffect(() => {
        if (sponsors.length === 0) return;

        const interval = setInterval(() => {
            setCurrentSponsorIndex(prev => (prev + 1) % sponsors.length);
        }, 8000);

        return () => clearInterval(interval);
    }, [sponsors.length]);

    // Load initial state
    useEffect(() => {
        if (match?.overlayConfig) {
            // Force landscape layout load
            if (match.overlayConfig.layouts) {
                if (match.overlayConfig.layouts.landscape) setLandscapeComponents(match.overlayConfig.layouts.landscape);
            } else if (match.overlayConfig.components) {
                setLandscapeComponents(match.overlayConfig.components);
            }
        }
    }, [match]);

    const handleDragEnd = useCallback((event: DragEndEvent) => {
        const { active, delta } = event;
        setComponents((prev) =>
            prev.map((comp) => {
                if (comp.id === active.id) {
                    return {
                        ...comp,
                        position: {
                            x: Math.round(comp.position.x + delta.x),
                            y: Math.round(comp.position.y + delta.y),
                        },
                    };
                }
                return comp;
            })
        );
    }, [setComponents]);

    const handleUpdateComponent = (id: string, updates: Partial<OverlayComponent>) => {
        setComponents(prev => prev.map(c => c.id === id ? { ...c, ...updates } : c));
    };

    const handleSave = async () => {
        setIsSaving(true);
        try {
            const user = auth.currentUser;
            if (!user) throw new Error("Not authenticated");
            const token = await user.getIdToken();

            const res = await fetch(`/api/tournaments/${tournamentId}/matches/${matchId}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({
                    overlayConfig: {
                        version: 2,
                        activeOrientation: 'landscape',
                        resolutions: {
                            landscape: { width: 1920, height: 1080 },
                            portrait: { width: 1080, height: 1920 }
                        },
                        layouts: {
                            landscape: landscapeComponents,
                        }
                    }
                }),
            });

            if (!res.ok) throw new Error("Failed to save");
            toast.success("Overlay configuration saved");
        } catch (error) {
            console.error(error);
            toast.error("Failed to save configuration");
        } finally {
            setIsSaving(false);
        }
    };

    const canvasWidth = 1920;
    const canvasHeight = 1080;

    if (isLoading) return <div className="flex h-screen items-center justify-center text-slate-400">Loading editor...</div>;

    return (
        <div className="flex w-full max-w-[1800px] h-full md:h-[79vh] border border-white/10 rounded-xl overflow-hidden shadow-2xl bg-[#0A0A0A]">
            <EditorSidebar
                tournamentId={tournamentId}
                matchId={matchId}
                isSaving={isSaving}
                onSave={handleSave}
                components={components}
                selectedId={selectedId}
                setSelectedId={setSelectedId}
                onUpdateComponent={handleUpdateComponent}
            />

            <EditorCanvas
                width={canvasWidth}
                height={canvasHeight}
                orientation="landscape"
                components={components}
                selectedId={selectedId}
                onSelect={setSelectedId}
                onDragEnd={handleDragEnd}
                match={match}
                elapsedDisplay={elapsedDisplay}
                sponsors={sponsors}
                currentSponsorIndex={currentSponsorIndex}
            />
        </div>
    );
}
