import React from 'react';
import { useDraggable } from '@dnd-kit/core';
import { Image as ImageIcon } from 'lucide-react';

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

interface DraggableItemProps {
    component: OverlayComponent;
    isSelected: boolean;
    onSelect: (id: string) => void;
}

export function DraggableItem({ component, isSelected, onSelect }: DraggableItemProps) {
    const { attributes, listeners, setNodeRef, transform } = useDraggable({
        id: component.id,
    });

    const style: React.CSSProperties = {
        transform: transform ? `translate3d(${transform.x}px, ${transform.y}px, 0)` : undefined,
        left: component.position.x,
        top: component.position.y,
        position: 'absolute',
        zIndex: component.zIndex,
        opacity: component.opacity,
        scale: component.scale,
    };

    return (
        <div
            ref={setNodeRef}
            style={style}
            {...listeners}
            {...attributes}
            onPointerDown={(e) => {
                onSelect(component.id);
                listeners?.onPointerDown?.(e);
            }}
            className={`cursor-move p-2 border-2 ${isSelected ? 'border-[#FF5A09] bg-[#FF5A09]/10' : 'border-transparent hover:border-slate-300'} rounded-lg transition-colors group`}
        >
            {/* Visual Representation Placeholder */}
            <div className="bg-slate-800 text-white p-4 rounded shadow-lg min-w-[200px] text-center select-none pointer-events-none">
                <div className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-2">{component.label}</div>
                {component.type === 'scoreboard' && (
                    <div className="flex justify-between items-center gap-4">
                        <div className="font-bold text-xl">21</div>
                        <div className="text-xs">VS</div>
                        <div className="font-bold text-xl">19</div>
                    </div>
                )}
                {component.type === 'sponsors' && (
                    <div className="h-10 bg-white/10 flex items-center justify-center">
                        <ImageIcon size={16} />
                    </div>
                )}
                {component.type === 'matchInfo' && (
                    <div className="text-xs text-left">
                        <div>Men's Singles</div>
                        <div>Finals</div>
                    </div>
                )}
                {component.type === 'ticker' && (
                    <div className="bg-blue-600 h-6 w-full mt-2"></div>
                )}
            </div>
        </div>
    );
}
