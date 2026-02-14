import React, { useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Save, MonitorPlay, Layout, ChevronLeft, ChevronRight, Eye, EyeOff, Layers } from 'lucide-react';
import { OverlayComponent } from './DraggableItem';

interface EditorSidebarProps {
    tournamentId: string;
    matchId: string;
    isSaving: boolean;
    onSave: () => void;
    components: OverlayComponent[];
    selectedId: string | null;
    setSelectedId: (id: string | null) => void;
    onUpdateComponent: (id: string, updates: Partial<OverlayComponent>) => void;
}

// Icon mapping for component types
const getComponentIcon = (type: string) => {
    switch (type) {
        case 'scoreboard': return '🎯';
        case 'sponsors': return '💼';
        case 'matchInfo': return 'ℹ️';
        case 'ticker': return '📰';
        default: return '📦';
    }
};

export function EditorSidebar({
    tournamentId,
    matchId,
    isSaving,
    onSave,
    components,
    selectedId,
    setSelectedId,
    onUpdateComponent
}: EditorSidebarProps) {
    const [isCollapsed, setIsCollapsed] = useState(false);
    const selectedComponent = components.find(c => c.id === selectedId);

    return (
        <aside className={`bg-[#1A1A1A] border-r border-white/5 flex flex-col z-20 transition-all duration-300 ease-in-out ${isCollapsed ? 'w-16' : 'w-80'}`}>
            {/* Header */}
            <div className={`border-b border-white/5 ${isCollapsed ? 'p-3' : 'p-6'} transition-all duration-300`}>
                {!isCollapsed ? (
                    <>
                        <div className="flex items-center gap-3 mb-6">
                            <Link href={`/tournaments/${tournamentId}/matches/${matchId}`} className="p-2 -ml-2 rounded-lg hover:bg-white/5 text-slate-400 hover:text-white transition-colors" title="Back to Match">
                                <ArrowLeft size={16} />
                            </Link>
                            <div>
                                <h1 className="font-bold text-sm uppercase tracking-widest">Overlay Editor</h1>
                                <p className="text-xs text-slate-500 mt-1">Customize layout &amp; style</p>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3 mb-6">
                            <button
                                onClick={onSave}
                                disabled={isSaving}
                                className="flex items-center justify-center gap-2 h-10 rounded-lg bg-[#FF5A09] hover:bg-[#FF5A09]/90 text-white text-xs font-bold uppercase tracking-widest transition-colors disabled:opacity-50"
                            >
                                {isSaving ? 'Saving...' : <><Save size={14} /> Save</>}
                            </button>
                            <Link
                                href={`/overlay/matches/${matchId}`}
                                target="_blank"
                                className="flex items-center justify-center gap-2 h-10 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 text-xs font-bold uppercase tracking-widest transition-colors"
                            >
                                <MonitorPlay size={14} /> Preview
                            </Link>
                        </div>
                    </>
                ) : (
                    <div className="space-y-3">
                        <Link
                            href={`/tournaments/${tournamentId}/matches/${matchId}`}
                            className="flex items-center justify-center p-2 rounded-lg hover:bg-white/5 text-slate-400 hover:text-white transition-colors"
                            title="Back to Match"
                        >
                            <ArrowLeft size={16} />
                        </Link>
                        <button
                            onClick={onSave}
                            disabled={isSaving}
                            className="w-full flex items-center justify-center p-2 rounded-lg bg-[#FF5A09] hover:bg-[#FF5A09]/90 text-white transition-colors disabled:opacity-50"
                            title="Save"
                        >
                            <Save size={16} />
                        </button>
                        <Link
                            href={`/overlay/matches/${matchId}`}
                            target="_blank"
                            className="w-full flex items-center justify-center p-2 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 transition-colors"
                            title="Preview"
                        >
                            <MonitorPlay size={16} />
                        </Link>
                    </div>
                )}

                {/* Collapse Toggle */}
                <button
                    onClick={() => setIsCollapsed(!isCollapsed)}
                    className={`flex items-center justify-center w-full h-8 rounded-lg bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-all ${isCollapsed ? 'mt-3' : 'mt-0'}`}
                    title={isCollapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
                >
                    {isCollapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
                </button>
            </div>

            {/* Content */}
            <div className={`flex-1 overflow-y-auto ${isCollapsed ? 'p-2' : 'p-6'} space-y-8 transition-all duration-300`}>
                {!isCollapsed ? (
                    <>
                        {/* COMPONENT LIST - EXPANDED */}
                        <div>
                            <div className="space-y-2">
                                {components.map(comp => (
                                    <div
                                        key={comp.id}
                                        onClick={() => setSelectedId(comp.id)}
                                        className={`w-full flex items-center justify-between p-3 rounded-lg border text-left transition-all cursor-pointer ${selectedId === comp.id
                                            ? 'bg-[#FF5A09]/10 border-[#FF5A09] text-white'
                                            : 'bg-white/5 border-transparent hover:bg-white/10 text-slate-400'
                                            }`}
                                    >
                                        <span className="text-xs font-medium">{comp.label}</span>
                                        <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                                            <div
                                                onClick={() => onUpdateComponent(comp.id, { visible: !comp.visible })}
                                                className={`w-2 h-2 rounded-full cursor-pointer ${comp.visible ? 'bg-green-500' : 'bg-slate-600'}`}
                                                title="Toggle Visibility"
                                            />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* PROPERTIES PANEL */}
                        {selectedComponent && (
                            <div className="animate-in fade-in slide-in-from-left-4 duration-300">
                                <h3 className="text-[10px] font-bold uppercase tracking-widest text-[#FF5A09] mb-4">Properties: {selectedComponent.label}</h3>

                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-[10px] uppercase font-bold text-slate-500 mb-2">Scale ({selectedComponent.scale.toFixed(1)}x)</label>
                                        <input
                                            type="range"
                                            min="0.5"
                                            max="2"
                                            step="0.1"
                                            value={selectedComponent.scale}
                                            onChange={(e) => onUpdateComponent(selectedComponent.id, { scale: parseFloat(e.target.value) })}
                                            className="w-full accent-[#FF5A09]"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-[10px] uppercase font-bold text-slate-500 mb-2">Opacity ({Math.round(selectedComponent.opacity * 100)}%)</label>
                                        <input
                                            type="range"
                                            min="0"
                                            max="1"
                                            step="0.1"
                                            value={selectedComponent.opacity}
                                            onChange={(e) => onUpdateComponent(selectedComponent.id, { opacity: parseFloat(e.target.value) })}
                                            className="w-full accent-[#FF5A09]"
                                        />
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-[10px] uppercase font-bold text-slate-500 mb-2">X Position</label>
                                            <input
                                                type="number"
                                                value={selectedComponent.position.x}
                                                onChange={(e) => onUpdateComponent(selectedComponent.id, { position: { ...selectedComponent.position, x: parseInt(e.target.value) || 0 } })}
                                                className="w-full bg-white/5 border border-white/10 rounded px-2 py-1 text-xs"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-[10px] uppercase font-bold text-slate-500 mb-2">Y Position</label>
                                            <input
                                                type="number"
                                                value={selectedComponent.position.y}
                                                onChange={(e) => onUpdateComponent(selectedComponent.id, { position: { ...selectedComponent.position, y: parseInt(e.target.value) || 0 } })}
                                                className="w-full bg-white/5 border border-white/10 rounded px-2 py-1 text-xs"
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </>
                ) : (
                    <>
                        {/* COMPONENT LIST - COLLAPSED (ICONS ONLY) */}
                        <div className="space-y-2">
                            {components.map(comp => (
                                <div key={comp.id} className="relative">
                                    <div
                                        onClick={() => setSelectedId(comp.id)}
                                        className={`w-full flex items-center justify-center p-2 rounded-lg border transition-all relative cursor-pointer ${selectedId === comp.id
                                            ? 'bg-[#FF5A09]/10 border-[#FF5A09] text-white'
                                            : 'bg-white/5 border-transparent hover:bg-white/10 text-slate-400'
                                            }`}
                                        title={comp.label}
                                    >
                                        <span className="text-lg">{getComponentIcon(comp.type)}</span>
                                        {/* Visibility indicator */}
                                        <div
                                            className={`absolute top-1 right-1 w-1.5 h-1.5 rounded-full cursor-pointer ${comp.visible ? 'bg-green-500' : 'bg-slate-600'}`}
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                onUpdateComponent(comp.id, { visible: !comp.visible });
                                            }}
                                        />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </>
                )}
            </div>
        </aside>
    );
}
