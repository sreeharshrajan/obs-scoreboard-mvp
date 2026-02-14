import React, { useRef, useEffect, useState } from 'react';
import { DndContext, useSensor, useSensors, PointerSensor, DragEndEvent } from '@dnd-kit/core';
import { restrictToParentElement } from '@dnd-kit/modifiers';
import { OverlayComponent, DraggableItem } from './DraggableItem';
import { MatchState } from '@/types/match';

interface EditorCanvasProps {
    width: number;
    height: number;
    orientation: 'landscape' | 'portrait';
    components: OverlayComponent[];
    selectedId: string | null;
    onSelect: (id: string | null) => void;
    onDragEnd: (event: DragEndEvent) => void;
    match: MatchState | undefined;
    elapsedDisplay: number;
    sponsors: any[];
    currentSponsorIndex: number;
}

export function EditorCanvas({ width, height, orientation, components, selectedId, onSelect, onDragEnd, match, elapsedDisplay, sponsors, currentSponsorIndex }: EditorCanvasProps) {
    const containerRef = useRef<HTMLDivElement>(null);
    const [scale, setScale] = useState(1);

    const canvasWidth = width;
    const canvasHeight = height;

    // Auto-scale logic to fit ~70vh (or available space)
    useEffect(() => {
        const handleResize = () => {
            if (containerRef.current) {
                const { clientWidth, clientHeight } = containerRef.current;
                const padding = 40; // Space around canvas
                const availableWidth = clientWidth - padding;
                const availableHeight = clientHeight - padding;

                const scaleX = availableWidth / canvasWidth;
                const scaleY = availableHeight / canvasHeight;

                // Fit maintain aspect ratio
                setScale(Math.min(scaleX, scaleY, 1)); // Cap at 1x if it fits
            }
        };

        handleResize(); // Initial calc
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, [orientation, canvasWidth, canvasHeight]);

    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: {
                distance: 5,
            },
        })
    );

    return (
        <main className="flex-1 bg-[#0A0A0A] overflow-hidden relative flex items-center justify-center p-10">
            <div ref={containerRef} className="relative w-full h-full flex items-center justify-center">
                <div
                    className="relative bg-chess-pattern border border-white/10 shadow-2xl overflow-hidden transition-all duration-300 ease-out"
                    style={{
                        width: `${canvasWidth}px`,
                        height: `${canvasHeight}px`,
                        transform: `scale(${scale})`,
                        transformOrigin: 'center',
                    }}
                    onPointerDown={() => onSelect(null)} // Deselect when clicking canvas background
                >
                    {/* GUIDE GRID */}
                    <div className="absolute inset-0 pointer-events-none opacity-10"
                        style={{ backgroundImage: 'linear-gradient(#333 1px, transparent 1px), linear-gradient(90deg, #333 1px, transparent 1px)', backgroundSize: '100px 100px' }}
                    />

                    <DndContext
                        sensors={sensors}
                        modifiers={[restrictToParentElement]}
                        onDragEnd={onDragEnd}
                    >
                        {components.filter(c => c.visible).map((component) => (
                            <DraggableItem
                                key={component.id}
                                component={component}
                                isSelected={selectedId === component.id}
                                onSelect={(id) => onSelect(id)}
                                match={match}
                                elapsedDisplay={elapsedDisplay}
                                sponsors={sponsors}
                                currentSponsorIndex={currentSponsorIndex}
                            />
                        ))}
                    </DndContext>
                </div>
            </div>

            {/* HELP TEXT */}
            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 bg-black/50 backdrop-blur px-4 py-2 rounded-full text-slate-400 text-[10px] uppercase font-bold tracking-widest pointer-events-none">
                {canvasWidth} x {canvasHeight} ({orientation}) • Scale: {scale.toFixed(2)}x
            </div>
        </main>
    );
}
