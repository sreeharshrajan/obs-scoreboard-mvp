"use client";

import { use, useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { ChevronLeft, Swords, Loader2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { auth } from "@/lib/firebase/client";
import { toast } from "sonner";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";

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
}).refine((data) => {
    if ((data.matchType === "Doubles" || data.matchType === "Mixed Doubles")) {
        return !!data.player1.name2 && !!data.player2.name2;
    }
    return true;
}, {
    message: "Partner names are required for Doubles/Mixed matches",
    path: ["player1", "name2"] // Generic path, handled in UI
});

type MatchFormValues = z.infer<typeof matchSchema>;

export default function NewMatch({ params }: { params: Promise<{ id: string }> }) {
    const { id: tournamentId } = use(params);
    const router = useRouter();
    const [isSubmitting, setIsSubmitting] = useState(false);

    const { register, handleSubmit, watch, formState: { errors } } = useForm<MatchFormValues>({
        resolver: zodResolver(matchSchema),
        defaultValues: {
            player1: { name: "", name2: "" },
            player2: { name: "", name2: "" },
            matchType: "Singles",
            roundType: "Round robin",
            scoringType: "21x3",
            court: "Court 01",
        }
    });

    const matchType = watch("matchType");
    const isDoubles = matchType === "Doubles" || matchType === "Mixed Doubles";

    const onSubmit = async (values: MatchFormValues) => {
        setIsSubmitting(true);
        try {
            const user = auth.currentUser;
            if (!user) throw new Error("Unauthorized");
            const token = await user.getIdToken();

            const res = await fetch(`/api/tournaments/${tournamentId}/matches`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                },
                body: JSON.stringify({
                    ...values,
                    player1: { ...values.player1, score: 0, isServing: true },
                    player2: { ...values.player2, score: 0, isServing: false },
                    status: "scheduled",
                    isTimerRunning: false,
                    timerElapsed: 0,
                    timerStartTime: null,
                    sport: "badminton"
                })
            });

            if (!res.ok) throw new Error("Failed to create match");

            toast.success("Match scheduled successfully");
            router.push(`/tournaments/${tournamentId}`);
            router.refresh();
        } catch (err: any) {
            console.error(err);
            toast.error(err.message || "Failed to schedule match");
        } finally {
            setIsSubmitting(false);
        }
    };

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
                            <Link href={`/tournaments/${tournamentId}`} className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-widest text-slate-400 hover:text-[#FF5A09] transition-colors">
                                <ChevronLeft size={12} /> Back
                            </Link>
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
                                className="col-span-2"
                                options={[
                                    { label: "Best of 3 (21 Pts)", value: "21x3" },
                                    { label: "1 Set (21 Pts)", value: "21x1" },
                                    { label: "Best of 3 (15 Pts)", value: "15x3" },
                                    { label: "1 Set (15 Pts)", value: "15x1" },
                                    { label: "1 Set (30 Pts)", value: "30x1" }
                                ]}
                            />
                        </div>
                    </div>
                </div>

                {/* RIGHT COLUMN: Players & Submit */}
                <div className="lg:col-span-5 flex flex-col h-full">
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
                                disabled={isSubmitting}
                                className="w-full h-10 rounded-xl bg-[#FF5A09] text-white font-bold text-[10px] uppercase tracking-[0.2em] flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 shadow-lg shadow-[#FF5A09]/20"
                            >
                                {isSubmitting ? <Loader2 className="animate-spin" size={14} /> : <Swords size={14} />}
                                Schedule
                            </button>
                        </div>
                    </div>
                </div>
            </form>
        </div>
    );
}