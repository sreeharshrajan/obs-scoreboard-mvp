"use client";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { ArrowRight, ChevronLeft } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { auth } from "@/lib/firebase/client";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";

const tournamentSchema = z.object({
    name: z.string().min(3, "Name must be at least 3 characters"),
    location: z.string().min(3, "Location must be at least 3 characters"),
    startDate: z.string().min(1, "Date is required"),
    category: z.string(),
    scoringType: z.string(),
});

type TournamentFormValues = z.infer<typeof tournamentSchema>;

export default function NewTournament() {
    const router = useRouter();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [serverError, setServerError] = useState<string | null>(null);

    // Set default date to today (YYYY-MM-DD format for input type="date")
    const today = new Date().toISOString().split('T')[0];

    const { register, handleSubmit, formState: { errors } } = useForm<TournamentFormValues>({
        resolver: zodResolver(tournamentSchema),
        defaultValues: {
            category: "Singles",
            scoringType: "21x3",
            startDate: today
        }
    });

    const onSubmit = async (data: TournamentFormValues) => {
        setIsSubmitting(true);
        setServerError(null);

        try {
            const userId = auth.currentUser?.uid;
            if (!userId) throw new Error("You must be logged in");

            const response = await fetch("/api/tournaments", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ ...data, userId }),
            });

            const result = await response.json();

            if (result.success) {
                router.push(`/dashboard/tournaments/${result.data.id}`);
            } else {
                setServerError(result.error || "Something went wrong");
            }
        } catch (error: any) {
            setServerError(error.message);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="flex-1 w-full max-w-7xl mx-auto px-6 md:px-10 flex flex-col py-6 animate-in fade-in duration-500">
            <div className="flex items-center justify-between mb-8">
                <Link href="/dashboard" className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400 hover:text-[#FF5A09] transition-colors group">
                    <ChevronLeft size={14} className="group-hover:-translate-x-1 transition-transform" />
                    Back to Dashboard
                </Link>
            </div>

            <header className="mb-10">
                <h1 className="text-3xl md:text-4xl font-instrument font-medium tracking-tight">
                    Create <span className="italic font-light text-[#FF5A09]">Tournament.</span>
                </h1>
            </header>

            <form onSubmit={handleSubmit(onSubmit)} className="grid grid-cols-1 lg:grid-cols-12 gap-10">
                <div className="lg:col-span-7 space-y-5">
                    <Input
                        label="Tournament Name"
                        placeholder="e.g. City Open 2026"
                        error={errors.name?.message}
                        {...register("name")}
                    />

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        <Input
                            label="Location"
                            placeholder="Venue name"
                            error={errors.location?.message}
                            {...register("location")}
                        />
                        <Input
                            label="Start Date"
                            type="date"
                            error={errors.startDate?.message}
                            {...register("startDate")}
                        />
                    </div>
                    {serverError && <p className="text-red-500 text-xs font-bold uppercase tracking-widest">{serverError}</p>}
                </div>

                <div className="lg:col-span-5">
                    <div className="p-6 rounded-[2rem] bg-slate-50 dark:bg-[#2A2A2A]/20 border border-slate-200 dark:border-white/5 space-y-6">
                        <div className="space-y-4">
                            <Select label="Category" {...register("category")} options={[
                                { label: "Singles", value: "Singles" },
                                { label: "Doubles", value: "Doubles" },
                                { label: "Mixed Doubles", value: "Mixed Doubles" },
                            ]} />
                            <Select label="Scoring Format" {...register("scoringType")} options={[
                                { label: "Best of 3 (21 Points)", value: "21x3" },
                                { label: "Best of 3 (15 Points)", value: "15x3" },
                                { label: "Single Game (30 Points)", value: "30x1" },
                            ]} />
                        </div>

                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="w-full h-12 rounded-xl bg-[#1A1A1A] dark:bg-white text-white dark:text-[#1A1A1A] font-bold text-[10px] uppercase tracking-[0.2em] flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50"
                        >
                            {isSubmitting ? "Creating..." : <>Create Tournament <ArrowRight size={14} /></>}
                        </button>
                    </div>
                </div>
            </form>
        </div>
    );
}