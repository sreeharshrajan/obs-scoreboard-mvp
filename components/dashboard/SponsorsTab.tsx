"use client";

import React, { useState, useEffect, useRef } from "react";
import { Plus, Trash2, Edit3, Save, X, ImageIcon, Loader2, Upload, ToggleLeft, ToggleRight, MoreVertical } from "lucide-react";
import { db, auth } from "@/lib/firebase/client"; // Assumes firebase client exports
import { collection, addDoc, updateDoc, deleteDoc, doc, onSnapshot, query, orderBy } from "firebase/firestore";
import Image from "next/image";
import { clsx } from "clsx";

interface Sponsor {
    id: string;
    name: string;
    note?: string;
    priority: number;
    status: boolean; // Active/Inactive
    advertUrl: string;
    createdAt: number;
}

interface SponsorsTabProps {
    tournamentId: string;
}

export default function SponsorsTab({ tournamentId }: SponsorsTabProps) {
    const [sponsors, setSponsors] = useState<Sponsor[]>([]);
    const [loading, setLoading] = useState(true);
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [editingSponsor, setEditingSponsor] = useState<Sponsor | null>(null);

    // Form State
    const [formData, setFormData] = useState<Partial<Sponsor>>({
        name: "",
        note: "",
        priority: 1,
        status: true,
        advertUrl: ""
    });
    const [uploading, setUploading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Helper to Reset Form
    const resetForm = () => {
        setFormData({
            name: "",
            note: "",
            priority: 1,
            status: true,
            advertUrl: ""
        });
        setEditingSponsor(null);
    };

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
    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.name || !formData.advertUrl) {
            alert("Name and Image are required!");
            return;
        }

        try {
            if (editingSponsor) {
                // Update
                await updateDoc(doc(db, "tournaments", tournamentId, "sponsors", editingSponsor.id), {
                    ...formData
                });
            } else {
                // Create
                await addDoc(collection(db, "tournaments", tournamentId, "sponsors"), {
                    ...formData,
                    createdAt: Date.now()
                });
            }
            setIsAddModalOpen(false);
            resetForm();
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

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files?.[0]) return;
        const file = e.target.files[0];
        setUploading(true);

        try {
            // Get Signature
            const user = auth.currentUser;
            const token = await user?.getIdToken();
            const sigRes = await fetch('/api/upload', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ folder: 'obs-scoreboard-sponsors' })
            });

            if (!sigRes.ok) throw new Error("Failed to get upload signature");
            const { signature, timestamp, cloudName, apiKey } = await sigRes.json();

            // Upload to Cloudinary
            const uploadFormData = new FormData();
            uploadFormData.append('file', file);
            uploadFormData.append('api_key', apiKey);
            uploadFormData.append('timestamp', timestamp);
            uploadFormData.append('signature', signature);
            uploadFormData.append('folder', 'obs-scoreboard-sponsors'); // Separate folder

            const uploadRes = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
                method: 'POST',
                body: uploadFormData
            });

            if (!uploadRes.ok) throw new Error("Cloudinary upload failed");
            const uploadData = await uploadRes.json();

            setFormData(prev => ({ ...prev, advertUrl: uploadData.secure_url }));
        } catch (err) {
            console.error(err);
            alert("Image upload failed");
        } finally {
            setUploading(false);
        }
    };

    const openEdit = (item: Sponsor) => {
        setEditingSponsor(item);
        setFormData({
            name: item.name,
            note: item.note,
            priority: item.priority,
            status: item.status,
            advertUrl: item.advertUrl
        });
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
                    onClick={() => { resetForm(); setIsAddModalOpen(true); }}
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
            {isAddModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
                    <div className="bg-white dark:bg-[#1A1A1A] rounded-3xl w-full max-w-lg p-6 md:p-8 shadow-2xl animate-in zoom-in-95 duration-200">
                        <div className="flex items-center justify-between mb-8">
                            <h3 className="text-xl font-bold text-slate-900 dark:text-white">
                                {editingSponsor ? "Edit Sponsor" : "Add New Sponsor"}
                            </h3>
                            <button onClick={() => setIsAddModalOpen(false)} className="p-2 hover:bg-slate-100 dark:hover:bg-white/5 rounded-full transition-colors">
                                <X size={20} className="text-slate-400" />
                            </button>
                        </div>

                        <form onSubmit={handleSave} className="space-y-6">
                            {/* Image Upload Area */}
                            <div className="space-y-2">
                                <label className="text-xs font-bold uppercase tracking-widest text-slate-500">Advertisement Image</label>
                                <div
                                    onClick={() => fileInputRef.current?.click()}
                                    className="relative aspect-video rounded-2xl border-2 border-dashed border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 flex flex-col items-center justify-center cursor-pointer hover:border-[#FF5A09]/50 transition-colors overflow-hidden group"
                                >
                                    {formData.advertUrl ? (
                                        <Image src={formData.advertUrl} alt="Preview" fill className="object-cover" />
                                    ) : (
                                        <div className="flex flex-col items-center gap-2 text-slate-400 group-hover:text-[#FF5A09] transition-colors">
                                            {uploading ? <Loader2 size={24} className="animate-spin" /> : <Upload size={24} />}
                                            <span className="text-xs font-bold uppercase tracking-widest">Click to Upload</span>
                                        </div>
                                    )}
                                    {uploading && <div className="absolute inset-0 bg-black/50 flex items-center justify-center"><Loader2 className="text-white animate-spin" /></div>}
                                </div>
                                <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleFileUpload} />
                            </div>

                            <div className="space-y-4">
                                <div>
                                    <label className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-2 block">Name</label>
                                    <input
                                        type="text"
                                        required
                                        value={formData.name}
                                        onChange={e => setFormData({ ...formData, name: e.target.value })}
                                        className="w-full h-12 px-4 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 focus:border-[#FF5A09] outline-none transition-colors"
                                        placeholder="Sponsor Name"
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-2 block">Priority (Order)</label>
                                        <input
                                            type="number"
                                            min="1"
                                            value={formData.priority}
                                            onChange={e => setFormData({ ...formData, priority: parseInt(e.target.value) || 1 })}
                                            className="w-full h-12 px-4 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 focus:border-[#FF5A09] outline-none transition-colors"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-2 block">Status</label>
                                        <div className="flex items-center gap-4 h-12 px-4 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10">
                                            <span className={clsx("text-xs font-bold uppercase transition-colors", formData.status ? "text-green-500" : "text-slate-400")}>
                                                {formData.status ? "Active" : "Inactive"}
                                            </span>
                                            <button
                                                type="button"
                                                onClick={() => setFormData({ ...formData, status: !formData.status })}
                                                className="ml-auto"
                                            >
                                                {formData.status ? <ToggleRight size={24} className="text-green-500" /> : <ToggleLeft size={24} className="text-slate-400" />}
                                            </button>
                                        </div>
                                    </div>
                                </div>

                                <div>
                                    <label className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-2 block">Note (Optional)</label>
                                    <textarea
                                        value={formData.note}
                                        onChange={e => setFormData({ ...formData, note: e.target.value })}
                                        className="w-full h-24 p-4 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 focus:border-[#FF5A09] outline-none transition-colors resize-none"
                                        placeholder="Internal notes..."
                                    />
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={uploading}
                                className="w-full h-14 bg-black dark:bg-white text-white dark:text-black rounded-xl font-bold text-sm uppercase tracking-wider hover:scale-[1.02] active:scale-[0.98] transition-all shadow-xl disabled:opacity-50 disabled:scale-100"
                            >
                                {editingSponsor ? "Save Changes" : "Create Sponsor"}
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
