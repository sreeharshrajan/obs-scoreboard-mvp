import React, { useState, useRef, useEffect } from "react";
import { X, Upload, Loader2, ToggleRight, ToggleLeft } from "lucide-react";
import Image from "next/image";
import { clsx } from "clsx";
import { auth } from "@/lib/firebase/client";

// Duplicate interface to avoid circular deps or complex refactors for now
export interface Sponsor {
    id: string;
    name: string;
    note?: string;
    priority: number;
    status: boolean; // Active/Inactive
    advertUrl: string;
    createdAt: number;
}

interface SponsorModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (data: Partial<Sponsor>) => Promise<void>;
    initialData: Sponsor | null;
}

export default function SponsorModal({ isOpen, onClose, onSave, initialData }: SponsorModalProps) {
    const [formData, setFormData] = useState<Partial<Sponsor>>({
        name: "",
        note: "",
        priority: 1,
        status: true,
        advertUrl: ""
    });
    const [uploading, setUploading] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (initialData) {
            setFormData({
                name: initialData.name,
                note: initialData.note,
                priority: initialData.priority,
                status: initialData.status,
                advertUrl: initialData.advertUrl
            });
        } else {
            setFormData({
                name: "",
                note: "",
                priority: 1,
                status: true,
                advertUrl: ""
            });
        }
    }, [initialData, isOpen]);

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
            uploadFormData.append('folder', 'obs-scoreboard-sponsors');

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

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.name || !formData.advertUrl) {
            alert("Name and Image are required!");
            return;
        }

        setIsSaving(true);
        try {
            await onSave(formData);
        } finally {
            setIsSaving(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
            <div className="bg-white dark:bg-[#1A1A1A] rounded-3xl w-full max-w-lg shadow-2xl animate-in zoom-in-95 duration-200 flex flex-col max-h-[85vh]">

                {/* Fixed Header */}
                <div className="flex-none flex items-center justify-between p-6 md:p-8 border-b border-slate-100 dark:border-white/5">
                    <h3 className="text-xl font-bold text-slate-900 dark:text-white">
                        {initialData ? "Edit Sponsor" : "Add New Sponsor"}
                    </h3>
                    <button onClick={onClose} className="p-2 hover:bg-slate-100 dark:hover:bg-white/5 rounded-full transition-colors">
                        <X size={20} className="text-slate-400" />
                    </button>
                </div>

                {/* Scrollable Content */}
                <div className="flex-1 overflow-y-auto p-6 md:p-8">
                    <form id="sponsor-form" onSubmit={handleSubmit} className="space-y-6">
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
                    </form>
                </div>

                {/* Fixed Footer */}
                <div className="flex-none p-6 md:p-8 border-t border-slate-100 dark:border-white/5">
                    <button
                        form="sponsor-form"
                        type="submit"
                        disabled={uploading || isSaving}
                        className="w-full h-14 bg-black dark:bg-white text-white dark:text-black rounded-xl font-bold text-sm uppercase tracking-wider hover:scale-[1.02] active:scale-[0.98] transition-all shadow-xl disabled:opacity-50 disabled:scale-100 flex items-center justify-center gap-2"
                    >
                        {isSaving ? <Loader2 className="animate-spin" size={16} /> : (initialData ? "Save Changes" : "Create Sponsor")}
                    </button>
                </div>
            </div>
        </div>
    );
}
