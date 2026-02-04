"use client";

import React, { useState, useEffect } from "react";
import { Plus, Trash2, Edit3, ImageIcon, ToggleLeft, ToggleRight } from "lucide-react";
import { db } from "@/lib/firebase/client";
import { collection, addDoc, updateDoc, deleteDoc, doc, onSnapshot, query, orderBy } from "firebase/firestore";
import Image from "next/image";
import { clsx } from "clsx";
import SponsorModal, { Sponsor } from "./SponsorModal"; // Import component and type

interface SponsorsTabProps {
    tournamentId: string;
}

export default function SponsorsTab({ tournamentId }: SponsorsTabProps) {
    const [sponsors, setSponsors] = useState<Sponsor[]>([]);
    const [loading, setLoading] = useState(true);
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [editingSponsor, setEditingSponsor] = useState<Sponsor | null>(null);

    // 1. Subscribe to Sponsors Live
    useEffect(() => {
        if (!tournamentId) return;
        const q = query(collection(db, "tournaments", tournamentId, "sponsors"), orderBy("priority", "asc"));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Sponsor));
            setSponsors(data);
            setLoading(false);
        });
        return () => unsubscribe();
    }, [tournamentId]);

    // 2. Handlers
    const handleSave = async (data: Partial<Sponsor>) => {
        try {
            if (editingSponsor) {
                // Update
                await updateDoc(doc(db, "tournaments", tournamentId, "sponsors", editingSponsor.id), {
                    ...data
                });
            } else {
                // Create
                await addDoc(collection(db, "tournaments", tournamentId, "sponsors"), {
                    ...data,
                    createdAt: Date.now()
                });
            }
            setIsAddModalOpen(false);
            setEditingSponsor(null);
        } catch (error) {
            console.error("Error saving sponsor:", error);
            alert("Failed to save sponsor.");
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm("Are you sure you want to delete this sponsor?")) return;
        try {
            await deleteDoc(doc(db, "tournaments", tournamentId, "sponsors", id));
        } catch (error) {
            console.error("Error deleting sponsor:", error);
        }
    };

    const handleToggleStatus = async (item: Sponsor) => {
        try {
            await updateDoc(doc(db, "tournaments", tournamentId, "sponsors", item.id), {
                status: !item.status
            });
        } catch (error) {
            console.error("Error toggling status:", error);
        }
    };

    const openEdit = (item: Sponsor) => {
        setEditingSponsor(item);
        setIsAddModalOpen(true);
    };

    const openAdd = () => {
        setEditingSponsor(null);
        setIsAddModalOpen(true);
    };

    if (loading) return <div className="p-10 text-center text-slate-400">Loading Sponsors...</div>;

    return (
        <div className="flex flex-col gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-xl font-bold text-slate-900 dark:text-white">Sponsors & Ads</h2>
                    <p className="text-sm text-slate-500 dark:text-slate-400">Manage advertisements displayed during breaks.</p>
                </div>
                <button
                    onClick={openAdd}
                    className="flex items-center gap-2 px-6 py-3 bg-[#FF5A09] text-white rounded-xl font-bold text-xs uppercase tracking-wider hover:bg-[#E04F08] transition-all shadow-lg shadow-[#FF5A09]/20"
                >
                    <Plus size={16} /> Add Sponsor
                </button>
            </div>

            {/* List */}
            {sponsors.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 bg-slate-50 dark:bg-white/5 rounded-3xl border border-dashed border-slate-200 dark:border-white/10">
                    <div className="w-16 h-16 bg-slate-100 dark:bg-white/5 rounded-full flex items-center justify-center mb-4">
                        <ImageIcon size={24} className="text-slate-300" />
                    </div>
                    <p className="text-slate-400 font-medium text-sm">No sponsors added yet.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {sponsors.map(sponsor => (
                        <div key={sponsor.id} className="bg-white dark:bg-[#1A1A1A] border border-slate-200 dark:border-white/5 rounded-3xl p-4 flex flex-col gap-4 shadow-sm group hover:border-[#FF5A09]/30 transition-all">
                            {/* Image Header */}
                            <div className="relative aspect-video rounded-2xl overflow-hidden bg-slate-100 dark:bg-black/20">
                                <Image
                                    src={sponsor.advertUrl}
                                    alt={sponsor.name}
                                    fill
                                    className="object-cover group-hover:scale-105 transition-transform duration-500"
                                />
                                <div className="absolute top-2 right-2 flex gap-2">
                                    <button
                                        onClick={() => handleToggleStatus(sponsor)}
                                        className={clsx(
                                            "w-8 h-8 rounded-full flex items-center justify-center backdrop-blur-md transition-colors",
                                            sponsor.status ? "bg-green-500/90 text-white" : "bg-black/50 text-slate-400"
                                        )}
                                        title="Toggle Active Status"
                                    >
                                        {sponsor.status ? <ToggleRight size={18} /> : <ToggleLeft size={18} />}
                                    </button>
                                </div>
                            </div>

                            {/* Details */}
                            <div className="flex items-start justify-between px-1">
                                <div>
                                    <h3 className="font-bold text-slate-900 dark:text-white truncate pr-2">{sponsor.name}</h3>
                                    {sponsor.note && <p className="text-xs text-slate-400 line-clamp-1">{sponsor.note}</p>}
                                </div>
                                <div className="flex items-center gap-1">
                                    <button
                                        onClick={() => openEdit(sponsor)}
                                        className="p-2 text-slate-400 hover:text-[#FF5A09] hover:bg-[#FF5A09]/5 rounded-lg transition-colors"
                                    >
                                        <Edit3 size={16} />
                                    </button>
                                    <button
                                        onClick={() => handleDelete(sponsor.id)}
                                        className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-500/5 rounded-lg transition-colors"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            </div>

                            <div className="flex items-center gap-4 text-[10px] font-bold uppercase tracking-widest text-slate-400 px-1">
                                <span>Priority: {sponsor.priority}</span>
                                <span className={sponsor.status ? "text-green-500" : "text-slate-500"}>{sponsor.status ? "Active" : "Inactive"}</span>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Modal */}
            <SponsorModal
                isOpen={isAddModalOpen}
                onClose={() => setIsAddModalOpen(false)}
                onSave={handleSave}
                initialData={editingSponsor}
            />
        </div>
    );
}
