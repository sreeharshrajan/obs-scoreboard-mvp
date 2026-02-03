"use client";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { createUserWithEmailAndPassword, updateProfile } from "firebase/auth";
import { auth } from "@/lib/firebase/client";
import { GamepadDirectional, AlertCircle, Loader2, ArrowRight } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

const signupSchema = z.object({
  name: z.string().min(2, "Full name is required"),
  email: z.string().email("Please enter a valid email"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

export default function SignUp() {
  const router = useRouter();
  const [serverError, setServerError] = useState<string | null>(null);

  const { register, handleSubmit, setError, formState: { errors, isSubmitting } } = useForm({
    resolver: zodResolver(signupSchema),
  });

  const onSubmit = async (data: any) => {
    setServerError(null);
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, data.email, data.password);
      await updateProfile(userCredential.user, {
        displayName: data.name
      });
      router.push("/dashboard");
    } catch (err: any) {
      if (err.code === "auth/email-already-in-use") {
        setError("email", { message: "This email is already registered." });
      } else if (err.code === "auth/weak-password") {
        setError("password", { message: "Password is too weak." });
      } else {
        setServerError("An error occurred during sign up. Please try again.");
      }
    }
  };

  return (
    <div className="h-screen w-full flex items-center justify-center bg-[#FDFDFD] dark:bg-[#1A1A1A] text-[#1A1A1A] dark:text-[#EAEAEA] relative overflow-hidden font-sans">

      {/* Background Accents */}
      <div className="absolute top-0 right-[-5%] w-[40%] h-[40%] bg-[#FF5A09]/5 blur-[100px] rounded-full pointer-events-none" />
      <div className="absolute bottom-0 left-[-5%] w-[40%] h-[40%] bg-[#be4f0c]/5 blur-[100px] rounded-full pointer-events-none" />

      <div className="w-full max-w-[400px] relative z-10 px-6">

        {/* Header Section */}
        <div className="flex flex-col items-center mb-10">
          <Link href="/" className="group relative mb-6">
            <div className="w-12 h-12 rounded-2xl border border-[#FF5A09]/20 flex items-center justify-center bg-white dark:bg-[#2A2A2A] shadow-sm transition-all duration-500 group-hover:rotate-[360deg] group-hover:border-[#FF5A09]/50">
              <GamepadDirectional size={22} className="text-[#FF5A09]" />
            </div>
          </Link>

          <h1 className="text-3xl md:text-4xl font-instrument font-medium tracking-tight leading-none text-center">
            Score<span className="italic font-light text-[#FF5A09]">Streamer.</span>
          </h1>
          <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-slate-400 mt-3 flex items-center gap-2">
            Create your account
          </p>
        </div>

        {serverError && (
          <div className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center gap-3 text-red-500 text-[10px] font-bold uppercase tracking-wider">
            <AlertCircle size={14} /> {serverError}
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
          <div className="space-y-1">
            <input
              {...register("name")}
              placeholder="Full Name"
              className={`w-full h-12 px-4 rounded-xl bg-slate-50 dark:bg-white/5 border ${errors.name ? 'border-red-500/50' : 'border-slate-200 dark:border-white/10'} outline-none text-sm transition-all focus:border-[#FF5A09]/50`}
            />
            {errors.name && <p className="text-[9px] font-bold text-red-500 uppercase px-1">{errors.name.message as string}</p>}
          </div>

          <div className="space-y-1">
            <input
              {...register("email")}
              placeholder="Email Address"
              className={`w-full h-12 px-4 rounded-xl bg-slate-50 dark:bg-white/5 border ${errors.email ? 'border-red-500/50' : 'border-slate-200 dark:border-white/10'} outline-none text-sm transition-all focus:border-[#FF5A09]/50`}
            />
            {errors.email && <p className="text-[9px] font-bold text-red-500 uppercase px-1">{errors.email.message as string}</p>}
          </div>

          <div className="space-y-1">
            <input
              {...register("password")}
              type="password"
              placeholder="Password"
              className={`w-full h-12 px-4 rounded-xl bg-slate-50 dark:bg-white/5 border ${errors.password ? 'border-red-500/50' : 'border-slate-200 dark:border-white/10'} outline-none text-sm transition-all focus:border-[#FF5A09]/50`}
            />
            {errors.password && <p className="text-[9px] font-bold text-red-500 uppercase px-1">{errors.password.message as string}</p>}
          </div>

          <button
            disabled={isSubmitting}
            className="w-full h-12 rounded-xl bg-[#1A1A1A] dark:bg-white text-white dark:text-[#1A1A1A] font-bold text-[11px] uppercase tracking-[0.2em] flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 shadow-lg shadow-black/5 mt-4"
          >
            {isSubmitting ? <Loader2 size={16} className="animate-spin" /> : <>Sign Up <ArrowRight size={14} /></>}
          </button>
        </form>

        <footer className="mt-10 text-center">
          <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
            Already have an account? <Link href="/signin" className="text-[#FF5A09] hover:underline decoration-[#FF5A09]/30 underline-offset-4 transition-all">Sign In</Link>
          </p>
        </footer>
      </div>
    </div>
  );
}