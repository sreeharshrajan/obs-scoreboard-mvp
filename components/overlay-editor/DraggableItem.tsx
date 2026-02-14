import React from 'react';
import { useDraggable } from '@dnd-kit/core';
import { MatchState } from '@/types/match';

// Components
import Scoreboard from "@/components/public/score-overlay/Scoreboard";
import SponsorTickler from "@/components/public/score-overlay/SponsorTickler";
import MatchInfoDisplay from "@/components/public/score-overlay/MatchInfoDisplay";

// Component Types
export type OverlayComponentType = 'scoreboard' | 'sponsors' | 'matchInfo' | 'ticker';

export interface OverlayComponent {
    id: string;
    type: OverlayComponentType;
    position: { x: number; y: number };
    scale: number;
    visible: boolean;
    opacity: number;
    zIndex: number;
    label: string;
}

export interface DraggableItemProps {
    component: OverlayComponent;
    isSelected: boolean;
    onSelect: (id: string) => void;
    match?: MatchState;
    elapsedDisplay?: number;
    sponsors?: any[];
    currentSponsorIndex?: number;
    canvasScale: number;
}

export function DraggableItem({ component, isSelected, onSelect, match, elapsedDisplay = 0, sponsors = [], currentSponsorIndex = 0, canvasScale }: DraggableItemProps) {
    const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
        id: component.id,
    });

    const style: React.CSSProperties = {
        // Adjust the transform based on the scale so the item tracks the mouse 1:1 visually
        transform: transform ? `translate3d(${transform.x / canvasScale}px, ${transform.y / canvasScale}px, 0)` : undefined,
        left: component.position.x,
        top: component.position.y,
        position: 'absolute',
        zIndex: component.zIndex,
        opacity: component.opacity,
        scale: component.scale,
        transformOrigin: 'top left',
        touchAction: 'none', // Critical for dnd-kit standard pointer sensors
    };

    return (
        <div
            ref={setNodeRef}
            style={style}
            {...listeners}
            {...attributes}
            onPointerDown={(e) => {
                e.stopPropagation(); // Stop propagation to prevent canvas deselect
                onSelect(component.id);
                listeners?.onPointerDown?.(e);
            }}
            // Remove transition when dragging to prevent "lag" or "fighting"
            className={`cursor-move ${isSelected ? 'ring-2 ring-[#FF5A09] ring-offset-2 ring-offset-black/50' : 'hover:ring-1 hover:ring-white/20'} ${isDragging ? '' : 'transition-all'}`}
        >
            {/* Visual Representation */}
            <div className="pointer-events-none select-none">
                {component.type === 'scoreboard' && match && (
                    <Scoreboard match={match} elapsedDisplay={elapsedDisplay} />
                )}

                {component.type === 'sponsors' && match && (
                    <div className="relative">
                        {/* We use Tickler here as it's the main on-screen element usually, 
                            or we could render both if needed, but for editor, Tickler is better representative 
                            unless specific 'SponsorBreak' comp is needed. 
                            Since ScoreOverlay renders both, we might want to check logic.
                            ScoreOverlay renders BOTH SponsorBreakDisplay AND SponsorTickler.
                            However, usually they don't show at the same time or overlap.
                            For editing positioning, we probably want the Tickler (bottom bar usually).
                            Let's render SponsorTickler for now as it's the detailed one.
                        */}
                        <SponsorTickler sponsors={sponsors} currentSponsorIndex={currentSponsorIndex} match={match} />
                    </div>
                )}

                {component.type === 'matchInfo' && match && (
                    <MatchInfoDisplay match={match} />
                )}

                {/* Fallback/Placeholder if data missing or type unknown */}
                {(!match && component.type !== 'ticker') && (
                    <div className="bg-slate-800 text-white p-4 rounded shadow-lg min-w-[200px] text-center opacity-50">
                        <div className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-2">{component.label}</div>
                        <div className="text-[10px]">Waiting for match data...</div>
                    </div>
                )}

                {component.type === 'ticker' && (
                    <div className="bg-blue-600 h-10 w-[600px] flex items-center justify-center text-white font-bold uppercase tracking-widest text-xs shadow-lg">
                        Ticker Component (Placeholder)
                    </div>
                )}
            </div>
        </div>
    );
}
