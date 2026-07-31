"use client";

import { use, useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { ChevronLeft, Save, Loader2, RotateCcw, AlertTriangle } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { auth } from "@/lib/firebase/client";
import { FormSkeleton } from "@/components/dashboard/skeletons";
import ErrorFallback from "@/components/dashboard/error-fallback";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { toast } from "sonner";
import { resetMatchState } from "@/lib/scoring/engine";
import { MatchState } from "@/types/match";

const matchSchema = z.object({
    player1: z.object({
        name: z.string().min(1, "Player 1 Name is required"),
        name2: z.string().optional(),
    }),
    player2: z.object({
        name: z.string().min(1, "Player 2 Name is required"),
        name2: z.string().optional(),
    }),
    matchTime: z.string().optional(),
    matchType: z.enum(["Intermediate", "Beginner", "Advanced", "Singles", "Doubles", "Mixed Doubles"]),
    ageGroup: z.string().optional(),
    court: z.string().optional(),
    matchCategory: z.string().optional(),
    roundType: z.enum(["Round robin", "Knockout"]).optional(),
    scoringType: z.enum(["15x3", "15x1", "21x3", "21x1", "30x1"]).optional(),
    status: z.enum(["scheduled", "live", "completed"]).optional(),
}).refine((data) => {
    if ((data.matchType === "Doubles" || data.matchType === "Mixed Doubles")) {
        return !!data.player1.name2 && !!data.player2.name2;
    }
    return true;
}, {
    message: "Partner names are required for Doubles/Mixed matches",
    path: ["player1", "name2"]
});

type MatchFormValues = z.infer<typeof matchSchema>;

export default function EditMatch({ params }: { params: Promise<{ id: string; matchId: string }> }) {
    const { id: tournamentId, matchId } = use(params);
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [rawMatch, setRawMatch] = useState<MatchState | null>(null);

    const { register, handleSubmit, reset, watch, formState: { errors } } = useForm<MatchFormValues>({
        resolver: zodResolver(matchSchema),
    });

    const matchType = watch("matchType");
    const isDoubles = matchType === "Doubles" || matchType === "Mixed Doubles";

    useEffect(() => {
        const fetchMatch = async () => {
            try {
                const user = auth.currentUser;
                let token = "";
                if (user) token = await user.getIdToken();
                else {
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

                const res = await fetch(`/api/tournaments/${tournamentId}/matches/${matchId}`, {
                    headers: { Authorization: `Bearer ${token}` }
                });

                if (!res.ok) throw new Error("Failed to load match");
                const data = await res.json();
                setRawMatch(data);

                reset({
                    player1: {
                        name: data.player1?.name || "",
                        name2: data.player1?.name2 || ""
                    },
                    player2: {
                        name: data.player2?.name || "",
                        name2: data.player2?.name2 || ""
                    },
                    matchTime: data.matchTime || "",
                    matchType: data.matchType || "Singles",
                    ageGroup: data.ageGroup || "",
                    court: data.court || "Court 01",
                    matchCategory: data.matchCategory || "",
                    roundType: data.roundType || "Round robin",
                    scoringType: data.scoringType || "21x3",
                    status: data.status || "scheduled"
                });

            } catch (err: any) {
                console.error(err);
                setError(err.message || "Failed to load match");
                toast.error("Failed to load match data");
            } finally {
                setIsLoading(false);
            }
        };

        fetchMatch();
    }, [tournamentId, matchId, reset]);

    const onSubmit = async (data: MatchFormValues) => {
        setIsSaving(true);
        try {
            const user = auth.currentUser;
            if (!user) throw new Error("Unauthorized");
            const token = await user.getIdToken();

            const res = await fetch(`/api/tournaments/${tournamentId}/matches/${matchId}`, {
                method: "PATCH",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                },
                body: JSON.stringify(data)
            });

            if (!res.ok) throw new Error("Failed to update match");

            toast.success("Match updated successfully");
            router.push(`/tournaments/${tournamentId}`);
            router.refresh();

        } catch (err: any) {
            console.error(err);
            toast.error("Failed to save changes");
        } finally {
            setIsSaving(false);
        }
    };

    const handleFullMatchReset = async () => {
        if (!rawMatch) return;

        const confirmMsg = "Reset this match?\n\nThis will:\n• Clear all rally scores\n• Remove completed game history\n• Remove score event history\n• Reset the server\n• Return the match to its initial state\n\nTournament, fixture, player, and scheduling information will be preserved.\n\nThis action cannot be undone.";
        if (!confirm(confirmMsg)) return;

        setIsSaving(true);
        try {
            const user = auth.currentUser;
            if (!user) throw new Error("Unauthorized");
            const token = await user.getIdToken();

            const resetData = resetMatchState(rawMatch);

            const res = await fetch(`/api/tournaments/${tournamentId}/matches/${matchId}`, {
                method: "PATCH",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                },
                body: JSON.stringify(resetData)
            });

            if (!res.ok) throw new Error("Failed to reset match");

            toast.success("Match reset to initial state");
            router.push(`/tournaments/${tournamentId}/matches/${matchId}`);
            router.refresh();
        } catch (err: any) {
            console.error(err);
            toast.error("Failed to reset match");
        } finally {
            setIsSaving(false);
        }
    };

    if (error) return <ErrorFallback error={error} backUrl={`/tournaments/${tournamentId}`} backLabel="Back to Tournament" />;
    if (isLoading) return <FormSkeleton />;

    return (
        <div className="flex-1 w-full max-w-7xl mx-auto px-4 md:px-6 flex flex-col py-2 animate-in fade-in duration-500">
            <form onSubmit={handleSubmit(onSubmit)} className="grid grid-cols-1 lg:grid-cols-12 gap-5 h-full">
                {/* LEFT COLUMN: Match Details */}
                <div className="lg:col-span-7 flex flex-col h-full">
                    <div className="bg-slate-50 dark:bg-white/5 p-5 rounded-3xl border border-slate-200 dark:border-white/5 space-y-3 flex-1">
                        <div className="flex items-center justify-between">
                            <div className="space-y-0.5">
                                <h3 className="text-base font-bold text-slate-900 dark:text-white">Match Details</h3>
                                <p className="text-[10px] text-slate-500">Configure match settings.</p>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="text-[10px] font-mono text-slate-400 bg-slate-100 dark:bg-white/5 py-0.5 px-2 rounded-lg">ID: {matchId.slice(0, 8)}</span>
                                <Link href={`/tournaments/${tournamentId}`} className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-widest text-slate-400 hover:text-[#FF5A09] transition-colors">
                                    <ChevronLeft size={12} /> Back
                                </Link>
                            </div>
                        </div>

                        {/* Time & Basic Info */}
                        <div className="grid grid-cols-2 gap-3">
                            <Input
                                type="time"
                                label="Match Time"
                                {...register("matchTime")}
                            />
                            <Select
                                label="Type"
                                {...register("matchType")}
                                options={[
                                    { label: "Singles", value: "Singles" },
                                    { label: "Doubles", value: "Doubles" },
                                    { label: "Mixed Doubles", value: "Mixed Doubles" },
                                    { label: "Beginner", value: "Beginner" },
                                    { label: "Intermediate", value: "Intermediate" },
                                    { label: "Advanced", value: "Advanced" }
                                ]}
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            <Input
                                label="Age Group"
                                placeholder="e.g. U19"
                                {...register("ageGroup")}
                            />
                            <Select
                                label="Court"
                                {...register("court")}
                                options={Array.from({ length: 12 }, (_, i) => ({
                                    label: `Court ${String(i + 1).padStart(2, '0')}`,
                                    value: `Court ${String(i + 1).padStart(2, '0')}`
                                }))}
                            />
                        </div>

                        <div className="h-px w-full bg-slate-200 dark:bg-white/5" />

                        {/* Meta Info */}
                        <div className="grid grid-cols-2 gap-3">
                            <Input
                                label="Category"
                                placeholder="e.g. MS"
                                {...register("matchCategory")}
                            />
                            <Select
                                label="Round"
                                {...register("roundType")}
                                options={[
                                    { label: "Round robin", value: "Round robin" },
                                    { label: "Knockout", value: "Knockout" }
                                ]}
                            />
                            <Select
                                label="Scoring"
                                {...register("scoringType")}
                                options={[
                                    { label: "Best of 3 (21 Pts)", value: "21x3" },
                                    { label: "1 Set (21 Pts)", value: "21x1" },
                                    { label: "Best of 3 (15 Pts)", value: "15x3" },
                                    { label: "1 Set (15 Pts)", value: "15x1" },
                                    { label: "1 Set (30 Pts)", value: "30x1" }
                                ]}
                            />
                            <Select
                                label="Status"
                                {...register("status")}
                                options={[
                                    { label: "Scheduled", value: "scheduled" },
                                    { label: "Live / In Progress", value: "live" },
                                    { label: "Completed", value: "completed" }
                                ]}
                            />
                        </div>
                    </div>
                </div>

                {/* RIGHT COLUMN: Players & Submit & Danger Zone */}
                <div className="lg:col-span-5 flex flex-col h-full gap-4">
                    {/* Combined Players & Action Card */}
                    <div className="p-5 rounded-[2rem] bg-white dark:bg-[#1A1A1A] border border-slate-200 dark:border-white/5 flex flex-col gap-4 shadow-sm flex-1">
                        <div className="space-y-0.5 text-center">
                            <h3 className="text-base font-bold text-slate-900 dark:text-white">Players</h3>
                        </div>

                        <div className="space-y-2 flex-1 flex flex-col justify-center">
                            <div className="space-y-2">
                                <Input
                                    label={isDoubles ? "Player 1 (Partner 1)" : "Player 1"}
                                    placeholder="Full Name"
                                    error={errors.player1?.name?.message}
                                    {...register("player1.name")}
                                    className="text-base font-bold"
                                />
                                {isDoubles && (
                                    <Input
                                        label="Partner Name"
                                        placeholder="Partner Name"
                                        error={errors.player1?.name2?.message}
                                        {...register("player1.name2")}
                                        className="text-base font-bold"
                                    />
                                )}
                            </div>

                            <div className="flex items-center gap-4 py-1">
                                <div className="h-px flex-1 bg-slate-100 dark:bg-white/5" />
                                <span className="text-[10px] font-bold text-slate-400 italic">VS</span>
                                <div className="h-px flex-1 bg-slate-100 dark:bg-white/5" />
                            </div>

                            <div className="space-y-2">
                                <Input
                                    label={isDoubles ? "Player 2 (Partner 1)" : "Player 2"}
                                    placeholder="Full Name"
                                    error={errors.player2?.name?.message}
                                    {...register("player2.name")}
                                    className="text-base font-bold text-right"
                                />
                                {isDoubles && (
                                    <Input
                                        label="Partner Name"
                                        placeholder="Partner Name"
                                        error={errors.player2?.name2?.message}
                                        {...register("player2.name2")}
                                        className="text-base font-bold text-right"
                                    />
                                )}
                            </div>
                        </div>

                        {isDoubles && (errors.player1?.name2 || errors.player2?.name2) && (
                            <p className="text-[9px] text-red-500 font-bold uppercase text-center bg-red-500/5 py-1 rounded-lg">
                                Partner names required
                            </p>
                        )}

                        <div className="pt-2">
                            <button
                                type="submit"
                                disabled={isSaving}
                                className="w-full h-10 rounded-xl bg-[#FF5A09] text-white font-bold text-[10px] uppercase tracking-[0.2em] flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 shadow-lg shadow-[#FF5A09]/20"
                            >
                                {isSaving ? <Loader2 className="animate-spin" size={14} /> : <Save size={14} />}
                                Save Changes
                            </button>
                        </div>
                    </div>

                    {/* Danger Zone / Admin Actions */}
                    <div className="p-4 rounded-[2rem] bg-red-500/5 border border-red-500/10 flex flex-col gap-2">
                        <div className="flex items-center gap-2 text-red-600 dark:text-red-400 font-bold text-xs">
                            <AlertTriangle size={14} />
                            <span>Administrative Actions</span>
                        </div>
                        <p className="text-[10px] text-slate-500">
                            Reset all match scores, completed games, and event logs while keeping player and match info intact.
                        </p>
                        <button
                            type="button"
                            onClick={handleFullMatchReset}
                            disabled={isSaving}
                            className="mt-1 w-full h-9 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-600 dark:text-red-400 font-bold text-[10px] uppercase tracking-wider flex items-center justify-center gap-2 transition-all disabled:opacity-50"
                        >
                            <RotateCcw size={12} />
                            Reset Match State
                        </button>
                    </div>
                </div>
            </form>
        </div>
    );
}

