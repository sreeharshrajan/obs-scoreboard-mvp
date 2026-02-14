import React, { useRef, useEffect, useState, useCallback } from 'react';
import { DndContext, useSensor, useSensors, PointerSensor, DragEndEvent } from '@dnd-kit/core';
import { DraggableItem, OverlayComponent } from './DraggableItem';
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

export function EditorCanvas({
    width,
    height,
    orientation,
    components,
    selectedId,
    onSelect,
    onDragEnd,
    match,
    elapsedDisplay,
    sponsors,
    currentSponsorIndex
}: EditorCanvasProps) {
    const containerRef = useRef<HTMLDivElement>(null);
    const canvasRef = useRef<HTMLDivElement>(null);
    const [scale, setScale] = useState(1);

    // Memoize dimensions to prevent unnecessary recalculations
    const canvasWidth = width;
    const canvasHeight = height;

    // Optimized resize handler with debouncing via RAF
    useEffect(() => {
        let rafId: number;

        const handleResize = () => {
            rafId = requestAnimationFrame(() => {
                if (!containerRef.current) return;

                const { clientWidth, clientHeight } = containerRef.current;
                const padding = 40;
                const availableWidth = clientWidth - padding;
                const availableHeight = clientHeight - padding;

                const scaleX = availableWidth / canvasWidth;
                const scaleY = availableHeight / canvasHeight;

                setScale(Math.min(scaleX, scaleY, 1));
            });
        };

        handleResize();
        window.addEventListener('resize', handleResize);

        return () => {
            window.removeEventListener('resize', handleResize);
            cancelAnimationFrame(rafId);
        };
    }, [canvasWidth, canvasHeight]);

    // Optimized sensor configuration
    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: {
                distance: 3, // Reduced from 5px - makes dragging more responsive
            },
        })
    );

    // Memoized drag handler with scale adjustment
    const handleDragEnd = useCallback((event: DragEndEvent) => {
        const { delta } = event;

        // Since DraggableItem divides transform by scale for visual tracking,
        // we need to divide delta by scale to get the actual position change
        const adjustedEvent = {
            ...event,
            delta: {
                x: delta.x / scale,
                y: delta.y / scale
            }
        };

        onDragEnd(adjustedEvent);
    }, [scale, onDragEnd]);

    // Handle canvas background clicks (deselect)
    const handleCanvasClick = useCallback((e: React.MouseEvent) => {
        // Only deselect if clicking directly on canvas, not on children
        if (e.target === canvasRef.current) {
            onSelect(null);
        }
    }, [onSelect]);

    // Filter visible components once
    const visibleComponents = components.filter(c => c.visible);

    return (
        <main className="flex-1 bg-[#0A0A0A] overflow-hidden relative flex items-center justify-center p-10">
            <div
                ref={containerRef}
                className="relative w-full h-full flex items-center justify-center"
            >
                <div
                    ref={canvasRef}
                    className="relative bg-chess-pattern border border-white/10 shadow-2xl overflow-hidden transition-transform duration-200 ease-out"
                    style={{
                        width: `${canvasWidth}px`,
                        height: `${canvasHeight}px`,
                        transform: `scale(${scale})`,
                        transformOrigin: 'center',
                    }}
                    onClick={handleCanvasClick}
                    role="region"
                    aria-label="Canvas editor"
                >
                    {/* Guide grid - extracted for clarity */}
                    <div
                        className="absolute inset-0 pointer-events-none opacity-10"
                        style={{
                            backgroundImage: 'linear-gradient(#333 1px, transparent 1px), linear-gradient(90deg, #333 1px, transparent 1px)',
                            backgroundSize: '100px 100px'
                        }}
                        aria-hidden="true"
                    />

                    <DndContext
                        sensors={sensors}
                        onDragEnd={handleDragEnd}
                    >
                        {visibleComponents.map((component) => (
                            <DraggableItem
                                key={component.id}
                                component={component}
                                isSelected={selectedId === component.id}
                                onSelect={onSelect}
                                match={match}
                                elapsedDisplay={elapsedDisplay}
                                sponsors={sponsors}
                                currentSponsorIndex={currentSponsorIndex}
                                canvasScale={scale}
                            />
                        ))}
                    </DndContext>
                </div>
            </div>

            {/* Canvas info overlay */}
            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 bg-black/50 backdrop-blur px-4 py-2 rounded-full text-slate-400 text-[10px] uppercase font-bold tracking-widest pointer-events-none select-none">
                {canvasWidth} × {canvasHeight} ({orientation}) • Scale: {scale.toFixed(2)}×
            </div>
        </main>
    );
}