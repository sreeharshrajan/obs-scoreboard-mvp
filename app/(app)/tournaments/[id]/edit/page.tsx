"use client";

import { use, useEffect, useState, useRef } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { ArrowRight, ChevronLeft, Upload, Loader2, Save, LayoutGrid, Monitor } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { auth } from "@/lib/firebase/client";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import Image from "next/image";
import { FormSkeleton } from "@/components/dashboard/skeletons";
import ErrorFallback from "@/components/dashboard/error-fallback";

const tournamentSchema = z.object({
    name: z.string().min(3, "Name must be at least 3 characters"),
    location: z.string().min(3, "Location must be at least 3 characters"),
    startDate: z.string().min(1, "Start Date is required"),
    endDate: z.string().min(1, "End Date is required"),
    type: z.string(),
    logo: z.string().optional(),
    status: z.string().optional(),
});

type TournamentFormValues = z.infer<typeof tournamentSchema>;

export default function EditTournament({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params);
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Upload State
    const [logoUrl, setLogoUrl] = useState("");
    const [isUploading, setIsUploading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const { register, handleSubmit, setValue, reset, formState: { errors } } = useForm<TournamentFormValues>({
        resolver: zodResolver(tournamentSchema),
        defaultValues: {
            type: "Individual",
        }
    });

    useEffect(() => {
        const fetchTournament = async () => {
            try {
                const user = auth.currentUser;
                let token = "";

                if (user) {
                    token = await user.getIdToken();
                } else {
                    await new Promise<void>((resolve) => {
                        const unsub = auth.onAuthStateChanged(async (u) => {
                            if (u) token = await u.getIdToken();
                            unsub();
                            resolve();
                        });
                    });
                }

                if (!token && auth.currentUser) token = await auth.currentUser.getIdToken();
                if (!token) throw new Error("Not authenticated");

                const res = await fetch(`/api/tournaments/${id}`, {
                    headers: { Authorization: `Bearer ${token}` }
                });

                if (!res.ok) throw new Error("Failed to load tournament");
                const data = await res.json();

                reset({
                    name: data.name,
                    location: data.location,
                    startDate: data.startDate ? data.startDate.split('T')[0] : "",
                    endDate: data.endDate ? data.endDate.split('T')[0] : "",
                    type: data.type || "Individual",
                    logo: data.logo,
                    status: data.status,
                });

                if (data.logo) setLogoUrl(data.logo);

            } catch (err: any) {
                console.error(err);
                setError(err.message || "Failed to load tournament");
            } finally {
                setIsLoading(false);
            }
        };

        fetchTournament();
    }, [id, reset]);


    const onSubmit = async (data: TournamentFormValues) => {
        setIsSaving(true);
        try {
            const user = auth.currentUser;
            if (!user) throw new Error("Unauthorized");
            const token = await user.getIdToken();

            const res = await fetch(`/api/tournaments/${id}`, {
                method: "PATCH",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                },
                body: JSON.stringify(data)
            });

            if (!res.ok) throw new Error("Failed to update tournament");

            router.push(`/tournaments/${id}`);
            router.refresh();

        } catch (err: any) {
            console.error(err);
            alert("Failed to save changes");
        } finally {
            setIsSaving(false);
        }
    };


    if (error) return <ErrorFallback error={error} backUrl={`/tournaments/${id}`} backLabel="Back to Dashboard" />;
    if (isLoading) return <FormSkeleton />;

    return (
        <div className="flex-1 w-full max-w-7xl mx-auto px-6 md:px-10 flex flex-col py-6 animate-in fade-in duration-500">

            <form onSubmit={handleSubmit(onSubmit)} className="grid grid-cols-1 lg:grid-cols-12 gap-10">
                {/* LEFT COLUMN: Event Details */}
                <div className="lg:col-span-7 space-y-6">
                    <div className="bg-slate-50 dark:bg-white/5 p-6 md:p-8 rounded-3xl border border-slate-200 dark:border-white/5 space-y-6">
                        <div className="flex items-center justify-between">
                            <div className="space-y-1">
                                <h3 className="text-lg font-bold text-slate-900 dark:text-white">Event Details</h3>
                                <p className="text-xs text-slate-500">Update information about the tournament.</p>
                            </div>
                            <div className="flex items-center gap-4">
                                <Link href="/dashboard" className="inline-flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-slate-400 hover:text-[#FF5A09] transition-colors">
                                    <LayoutGrid size={12} /> Dashboard
                                </Link>
                                <Link href={`/tournaments/${id}`} className="inline-flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-slate-400 hover:text-[#FF5A09] transition-colors">
                                    <Monitor size={12} /> Console
                                </Link>
                            </div>
                        </div>

                        <Input
                            label="Tournament Name"
                            placeholder="e.g. City Open 2026"
                            error={errors.name?.message}
                            {...register("name")}
                        />

                        <Input
                            label="Location"
                            placeholder="Venue name"
                            error={errors.location?.message}
                            {...register("location")}
                        />

                        <div className="grid grid-cols-2 gap-5">
                            <Input
                                label="Start Date"
                                type="date"
                                error={errors.startDate?.message}
                                {...register("startDate")}
                            />
                            <Input
                                label="End Date"
                                type="date"
                                error={errors.endDate?.message}
                                {...register("endDate")}
                            />
                        </div>

                        <Select
                            label="Tournament Type"
                            {...register("type")}
                            options={[
                                { label: "Individual Championship", value: "Individual" },
                                { label: "Team Championship", value: "Team" }
                            ]}
                        />

                        <Select
                            label="Status"
                            {...register("status")}
                            options={[
                                { label: "Draft", value: "draft" },
                                { label: "Upcoming", value: "Upcoming" }, // Match API default
                                { label: "Active", value: "active" },
                                { label: "Completed", value: "completed" }
                            ]}
                        />
                    </div>
                </div>

                {/* RIGHT COLUMN: Logo & Submit */}
                <div className="lg:col-span-5 space-y-6">
                    {/* Logo Upload Card */}
                    <div className="p-6 md:p-8 rounded-[2rem] bg-white dark:bg-[#1A1A1A] border border-slate-200 dark:border-white/5 flex flex-col items-center gap-6 shadow-sm">
                        <div
                            className="relative group cursor-pointer"
                            onClick={() => fileInputRef.current?.click()}
                        >
                            <div className="w-40 h-40 rounded-full overflow-hidden bg-slate-100 dark:bg-white/5 border-4 border-white dark:border-[#2A2A2A] shadow-xl relative ring-1 ring-slate-200 dark:ring-white/10">
                                {logoUrl ? (
                                    <Image
                                        src={logoUrl}
                                        alt="Logo"
                                        fill
                                        className="object-cover"
                                    />
                                ) : (
                                    <div className="w-full h-full flex flex-col items-center justify-center text-slate-300 gap-2">
                                        <Upload size={32} />
                                        <span className="text-[10px] font-bold uppercase tracking-widest">Upload Logo</span>
                                    </div>
                                )}

                                <div className="absolute inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300">
                                    <span className="text-xs font-bold text-white uppercase tracking-widest">Change</span>
                                </div>
                            </div>

                            {isUploading && (
                                <div className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-full z-20">
                                    <Loader2 className="animate-spin text-white" size={32} />
                                </div>
                            )}
                        </div>

                        <input
                            type="file"
                            ref={fileInputRef}
                            className="hidden"
                            accept="image/*"
                            onChange={async (e) => {
                                if (!e.target.files?.[0]) return;
                                const file = e.target.files[0];
                                setIsUploading(true);
                                try {
                                    const user = auth.currentUser;
                                    const token = await user?.getIdToken();

                                    const sigRes = await fetch('/api/upload', {
                                        method: 'POST',
                                        headers: {
                                            'Authorization': `Bearer ${token}`,
                                            'Content-Type': 'application/json'
                                        },
                                        body: JSON.stringify({ folder: 'obs-scoreboard-tournaments' })
                                    });

                                    if (!sigRes.ok) throw new Error("Failed to get signature");
                                    const { signature, timestamp, cloudName, apiKey } = await sigRes.json();

                                    const formData = new FormData();
                                    formData.append('file', file);
                                    formData.append('api_key', apiKey);
                                    formData.append('timestamp', timestamp);
                                    formData.append('signature', signature);
                                    formData.append('folder', 'obs-scoreboard-tournaments');

                                    const uploadRes = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
                                        method: 'POST',
                                        body: formData
                                    });

                                    if (!uploadRes.ok) throw new Error("Upload failed");
                                    const data = await uploadRes.json();

                                    setLogoUrl(data.secure_url);
                                    setValue("logo", data.secure_url);
                                } catch (err) {
                                    console.error(err);
                                    alert("Upload failed. Please try again.");
                                } finally {
                                    setIsUploading(false);
                                }
                            }}
                        />

                        <div className="text-center space-y-1">
                            <p className="text-sm font-bold text-slate-900 dark:text-white">Tournament Logo</p>
                            <p className="text-xs text-slate-400 max-w-[200px] mx-auto">
                                Recommended size: 400x400px (Square).
                            </p>
                        </div>
                    </div>

                    <div className="p-6 rounded-[2rem] bg-slate-50 dark:bg-[#2A2A2A]/20 border border-slate-200 dark:border-white/5 space-y-6">
                        <button
                            type="submit"
                            disabled={isSaving}
                            className="w-full h-12 rounded-xl bg-[#1A1A1A] dark:bg-white text-white dark:text-[#1A1A1A] font-bold text-[10px] uppercase tracking-[0.2em] flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50"
                        >
                            {isSaving ? <Loader2 className="animate-spin" size={16} /> : <>Save Changes <Save size={16} /></>}
                        </button>
                    </div>
                </div>
            </form>
        </div>
    );
}