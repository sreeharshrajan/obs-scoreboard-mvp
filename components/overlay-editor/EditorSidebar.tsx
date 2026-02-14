import React from 'react';
import Link from 'next/link';
import { ArrowLeft, Save, MonitorPlay, Layout } from 'lucide-react';
import { OverlayComponent } from './DraggableItem';

interface EditorSidebarProps {
    tournamentId: string;
    matchId: string;
    isSaving: boolean;
    onSave: () => void;
    orientation: 'landscape' | 'portrait';
    setOrientation: (o: 'landscape' | 'portrait') => void;
    components: OverlayComponent[];
    selectedId: string | null;
    setSelectedId: (id: string | null) => void;
    onUpdateComponent: (id: string, updates: Partial<OverlayComponent>) => void;
}

export function EditorSidebar({
    tournamentId,
    matchId,
    isSaving,
    onSave,
    orientation,
    setOrientation,
    components,
    selectedId,
    setSelectedId,
    onUpdateComponent
}: EditorSidebarProps) {
    const selectedComponent = components.find(c => c.id === selectedId);

    return (
        <aside className="w-80 bg-[#1A1A1A] border-r border-white/5 flex flex-col z-20">
            <div className="p-6 border-b border-white/5">
                <div className="flex items-center gap-3 mb-6">
                    <Link href={`/tournaments/${tournamentId}/matches/${matchId}`} className="p-2 -ml-2 rounded-lg hover:bg-white/5 text-slate-400 hover:text-white transition-colors">
                        <ArrowLeft size={16} />
                    </Link>
                    <div>
                        <h1 className="font-bold text-sm uppercase tracking-widest">Overlay Editor</h1>
                        <p className="text-xs text-slate-500 mt-1">Customize layout & style</p>
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

                {/* ORIENTATION TOGGLE */}
                <div className="bg-black/20 p-1 rounded-lg flex border border-white/5">
                    <button
                        onClick={() => setOrientation('landscape')}
                        className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-md text-[10px] font-bold uppercase tracking-wider transition-colors ${orientation === 'landscape' ? 'bg-[#FF5A09] text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}
                    >
                        <Layout size={14} className="rotate-0" /> Landscape
                    </button>
                    <button
                        onClick={() => setOrientation('portrait')}
                        className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-md text-[10px] font-bold uppercase tracking-wider transition-colors ${orientation === 'portrait' ? 'bg-[#FF5A09] text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}
                    >
                        <Layout size={14} className="rotate-90" /> Portrait
                    </button>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-8">
                {/* COMPONENT LIST */}
                <div>
                    <h3 className="text-[10px] font-bold uppercase tracking-widest text-[#FF5A09] mb-4">Layers ({orientation})</h3>
                    <div className="space-y-2">
                        {components.map(comp => (
                            <button
                                key={comp.id}
                                onClick={() => setSelectedId(comp.id)}
                                className={`w-full flex items-center justify-between p-3 rounded-lg border text-left transition-all ${selectedId === comp.id
                                        ? 'bg-[#FF5A09]/10 border-[#FF5A09] text-white'
                                        : 'bg-white/5 border-transparent hover:bg-white/10 text-slate-400'
                                    }`}
                            >
                                <span className="text-xs font-medium">{comp.label}</span>
                                <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                                    <button
                                        onClick={() => onUpdateComponent(comp.id, { visible: !comp.visible })}
                                        className={`w-2 h-2 rounded-full ${comp.visible ? 'bg-green-500' : 'bg-slate-600'}`}
                                        title="Toggle Visibility"
                                    />
                                </div>
                            </button>
                        ))}
                    </div>
                </div>

                {/* PROPERTIES PANEL */}
                {selectedComponent ? (
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
                ) : (
                    <div className="text-center py-10 text-slate-600 text-xs uppercase tracking-widest italic">
                        Select a component to edit
                    </div>
                )}
            </div>
        </aside>
    );
}
