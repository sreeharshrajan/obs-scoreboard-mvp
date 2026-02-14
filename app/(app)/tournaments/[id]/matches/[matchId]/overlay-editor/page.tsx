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

const DEFAULT_COMPONENTS: OverlayComponent[] = [
    { id: 'scoreboard', type: 'scoreboard', position: { x: 50, y: 850 }, scale: 1, visible: true, opacity: 1, zIndex: 10, label: 'Scoreboard' },
    { id: 'sponsors', type: 'sponsors', position: { x: 1400, y: 50 }, scale: 1, visible: true, opacity: 1, zIndex: 5, label: 'Sponsors Carousel' },
    { id: 'ticker', type: 'ticker', position: { x: 0, y: 1000 }, scale: 1, visible: false, opacity: 1, zIndex: 1, label: 'News Ticker' },
    { id: 'matchInfo', type: 'matchInfo', position: { x: 50, y: 50 }, scale: 1, visible: true, opacity: 1, zIndex: 1, label: 'Match Info' },
];

const DEFAULT_PORTRAIT_COMPONENTS: OverlayComponent[] = [
    { id: 'scoreboard', type: 'scoreboard', position: { x: 50, y: 1600 }, scale: 1.2, visible: true, opacity: 1, zIndex: 10, label: 'Scoreboard' },
    { id: 'sponsors', type: 'sponsors', position: { x: 50, y: 50 }, scale: 1, visible: true, opacity: 1, zIndex: 5, label: 'Sponsors Carousel' },
    { id: 'ticker', type: 'ticker', position: { x: 0, y: 1800 }, scale: 1, visible: false, opacity: 1, zIndex: 1, label: 'News Ticker' },
    { id: 'matchInfo', type: 'matchInfo', position: { x: 50, y: 400 }, scale: 1, visible: true, opacity: 1, zIndex: 1, label: 'Match Info' },
];

export default function OverlayEditor() {
    const params = useParams();
    const matchId = params.matchId as string;
    const tournamentId = params.id as string;

    // State
    const [orientation, setOrientation] = useState<'landscape' | 'portrait'>('landscape');
    const [landscapeComponents, setLandscapeComponents] = useState<OverlayComponent[]>(DEFAULT_COMPONENTS);
    const [portraitComponents, setPortraitComponents] = useState<OverlayComponent[]>(DEFAULT_PORTRAIT_COMPONENTS);
    const [selectedId, setSelectedId] = useState<string | null>(null);
    const [isSaving, setIsSaving] = useState(false);

    // Derived State
    const components = orientation === 'landscape' ? landscapeComponents : portraitComponents;
    const setComponents = useCallback((param: OverlayComponent[] | ((prev: OverlayComponent[]) => OverlayComponent[])) => {
        if (orientation === 'landscape') {
            setLandscapeComponents(param);
        } else {
            setPortraitComponents(param);
        }
    }, [orientation]);

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

    // Load initial state
    useEffect(() => {
        if (match?.overlayConfig) {
            if (match.overlayConfig.activeOrientation) {
                setOrientation(match.overlayConfig.activeOrientation);
            }
            if (match.overlayConfig.layouts) {
                if (match.overlayConfig.layouts.landscape) setLandscapeComponents(match.overlayConfig.layouts.landscape);
                if (match.overlayConfig.layouts.portrait) setPortraitComponents(match.overlayConfig.layouts.portrait);
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
                        activeOrientation: orientation,
                        resolutions: {
                            landscape: { width: 1920, height: 1080 },
                            portrait: { width: 1080, height: 1920 }
                        },
                        layouts: {
                            landscape: landscapeComponents,
                            portrait: portraitComponents
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

    // Auto-detect orientation on load if not set in config
    useEffect(() => {
        if (!match?.overlayConfig?.activeOrientation) {
            const isPortrait = window.innerHeight > window.innerWidth;
            if (isPortrait) {
                setOrientation('portrait');
            }
        }
    }, [match]);

    const canvasWidth = orientation === 'landscape' ? 1920 : 1080;
    const canvasHeight = orientation === 'landscape' ? 1080 : 1920;

    if (isLoading) return <div className="flex h-screen items-center justify-center text-slate-400">Loading editor...</div>;

    return (
        <div className="flex w-full max-w-[1800px] h-full md:h-[79vh] border border-white/10 rounded-xl overflow-hidden shadow-2xl bg-[#0A0A0A]">
            <EditorSidebar
                tournamentId={tournamentId}
                matchId={matchId}
                isSaving={isSaving}
                onSave={handleSave}
                orientation={orientation}
                setOrientation={setOrientation}
                components={components}
                selectedId={selectedId}
                setSelectedId={setSelectedId}
                onUpdateComponent={handleUpdateComponent}
            />

            <EditorCanvas
                width={canvasWidth}
                height={canvasHeight}
                orientation={orientation}
                components={components}
                selectedId={selectedId}
                onSelect={setSelectedId}
                onDragEnd={handleDragEnd}
            />
        </div>
    );
}
