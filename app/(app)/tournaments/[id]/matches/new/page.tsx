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
        <div className="flex-1 w-full max-w-4xl mx-auto px-6 md:px-10 flex flex-col py-6 animate-in fade-in duration-500">
            <div className="mb-8 text-left">
                <Link href={`/tournaments/${tournamentId}`} className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-slate-400 hover:text-[#FF5A09] transition-colors mb-4">
                    <ChevronLeft size={14} /> Back to Tournament
                </Link>
                <h1 className="text-3xl font-instrument font-medium">Schedule New Match</h1>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                <div className="bg-white dark:bg-[#1A1A1A] p-6 md:p-8 rounded-3xl border border-slate-200 dark:border-white/5 shadow-sm space-y-8 text-left">

                    {/* Time & Basic Info */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <Input
                            type="time"
                            label="Match Time"
                            {...register("matchTime")}
                        />
                        <Select
                            label="Type of Match"
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

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <Input
                            label="Age Group"
                            placeholder="e.g. Under 19, Over 40"
                            {...register("ageGroup")}
                        />
                        <Select
                            label="Court Details"
                            {...register("court")}
                            options={Array.from({ length: 12 }, (_, i) => ({
                                label: `Court ${String(i + 1).padStart(2, '0')}`,
                                value: `Court ${String(i + 1).padStart(2, '0')}`
                            }))}
                        />
                    </div>

                    <div className="h-px w-full bg-slate-200 dark:bg-white/5" />

                    {/* Players Section */}
                    <div className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 relative items-start">
                            <div className="space-y-4">
                                <Input
                                    label={isDoubles ? "Player 1 (Partner 1)" : "Player 1"}
                                    placeholder="Full Name"
                                    error={errors.player1?.name?.message}
                                    {...register("player1.name")}
                                    className="text-lg font-bold"
                                />
                                {isDoubles && (
                                    <Input
                                        label="Player 1 (Partner 2)"
                                        placeholder="Full Name"
                                        error={errors.player1?.name2?.message}
                                        {...register("player1.name2")}
                                        className="text-lg font-bold"
                                    />
                                )}
                            </div>

                            <div className="hidden md:flex absolute left-1/2 top-[44px] -translate-x-1/2 items-center justify-center w-8 h-8 rounded-full bg-slate-200 dark:bg-white/10 text-[10px] font-bold text-slate-500 italic z-10 transition-colors">
                                VS
                            </div>

                            <div className="space-y-4">
                                <Input
                                    label={isDoubles ? "Player 2 (Partner 1)" : "Player 2"}
                                    placeholder="Full Name"
                                    error={errors.player2?.name?.message}
                                    {...register("player2.name")}
                                    className="text-lg font-bold text-right"
                                />
                                {isDoubles && (
                                    <Input
                                        label="Player 2 (Partner 2)"
                                        placeholder="Full Name"
                                        error={errors.player2?.name2?.message}
                                        {...register("player2.name2")}
                                        className="text-lg font-bold text-right"
                                    />
                                )}
                            </div>
                        </div>
                        {isDoubles && (errors.player1?.name2 || errors.player2?.name2) && (
                            <p className="text-[9px] text-red-500 font-bold uppercase text-center bg-red-500/5 py-2 rounded-lg">
                                Partner names are required for Doubles/Mixed matches
                            </p>
                        )}
                    </div>

                    <div className="h-px w-full bg-slate-200 dark:bg-white/5" />

                    {/* Meta Info */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <Input
                            label="Match Category"
                            placeholder="e.g. Mens Singles"
                            {...register("matchCategory")}
                        />
                        <Select
                            label="Round Type"
                            {...register("roundType")}
                            options={[
                                { label: "Round robin", value: "Round robin" },
                                { label: "Knockout", value: "Knockout" }
                            ]}
                        />
                        <Select
                            label="Scoring System"
                            {...register("scoringType")}
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

                <div className="flex justify-end pt-4">
                    <button
                        type="submit"
                        disabled={isSubmitting}
                        className="w-full md:w-auto px-10 h-16 bg-[#FF5A09] text-white rounded-3xl font-bold uppercase tracking-widest text-[11px] flex items-center justify-center gap-3 hover:shadow-2xl hover:shadow-[#FF5A09]/30 transition-all hover:scale-[1.02] active:scale-95 disabled:opacity-50"
                    >
                        {isSubmitting ? <Loader2 className="animate-spin" size={18} /> : <Swords size={18} />}
                        Schedule Match
                    </button>
                </div>
            </form>
        </div>
    );
}