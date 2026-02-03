"use client";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "@/lib/firebase/client";
import { GamepadDirectional, ArrowRight, Loader2, AlertCircle } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import type { User } from "firebase/auth";
import { FirebaseError } from "firebase/app";

const authSchema = z.object({
  email: z.string().email("Please enter a valid email"),
  password: z.string().min(1, "Password is required"),
});

type AuthFormValues = z.infer<typeof authSchema>;

export default function SignIn() {
  const router = useRouter();
  const [serverError, setServerError] = useState<string | null>(null);

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<AuthFormValues>({
    resolver: zodResolver(authSchema),
  });

  const createSession = async (user: User) => {
    const idToken = await user.getIdToken();
    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ idToken }),
    });
    return res.ok;
  };

  const onSubmit = async (data: AuthFormValues) => {
    setServerError(null);
    try {
      const result = await signInWithEmailAndPassword(auth, data.email, data.password);
      const sessionCreated = await createSession(result.user);

      if (sessionCreated) {
        router.push("/dashboard");
      } else {
        setServerError("Could not sign you in. Please try again.");
      }
    } catch (err: unknown) {
      if (err instanceof FirebaseError) {
        switch (err.code) {
          case "auth/user-not-found":
          case "auth/wrong-password":
          case "auth/invalid-credential":
            setServerError("Incorrect email or password.");
            break;
          case "auth/too-many-requests":
            setServerError("Too many failed attempts. Please try again later.");
            break;
          default:
            setServerError("Authentication failed. Please try again.");
        }
      } else {
        setServerError("Something went wrong. Please check your connection.");
      }
    }
  };

  return (
    <div className="h-screen w-full flex items-center justify-center bg-[#FDFDFD] dark:bg-[#1A1A1A] text-[#1A1A1A] dark:text-[#EAEAEA] relative overflow-hidden font-sans">

      <div className="absolute top-0 right-[-5%] w-[40%] h-[40%] bg-[#FF5A09]/5 blur-[100px] rounded-full pointer-events-none" />
      <div className="absolute bottom-0 left-[-5%] w-[40%] h-[40%] bg-[#be4f0c]/5 blur-[100px] rounded-full pointer-events-none" />

      <div className="w-full max-w-[400px] relative z-10 px-6">

        <div className="flex flex-col items-center mb-10">
          <Link href="/" className="group mb-6">
            <div className="w-12 h-12 rounded-2xl border border-[#FF5A09]/20 flex items-center justify-center bg-white dark:bg-[#2A2A2A] shadow-sm transition-all duration-500 group-hover:scale-110">
              <GamepadDirectional size={22} className="text-[#FF5A09]" />
            </div>
          </Link>

          <h1 className="text-3xl md:text-4xl font-instrument font-medium tracking-tight text-center">
            Score<span className="italic font-light text-[#FF5A09]">Streamer.</span>
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-2 text-center">
            Sign in to manage your tournament overlays
          </p>
        </div>

        {serverError && (
          <div className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center gap-3 text-red-500 text-sm animate-in fade-in slide-in-from-top-1">
            <AlertCircle size={18} /> {serverError}
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-1">
            <label className="text-xs font-semibold ml-1 text-slate-500 uppercase tracking-wider">Email Address</label>
            <input
              {...register("email")}
              type="email"
              placeholder="name@example.com"
              className={`w-full h-12 px-4 rounded-xl bg-slate-50 dark:bg-white/5 border ${errors.email ? 'border-red-500/50' : 'border-slate-200 dark:border-white/10'} outline-none text-sm transition-all focus:border-[#FF5A09]/50`}
            />
            {errors.email && <p className="text-xs text-red-500 mt-1 ml-1">{errors.email.message}</p>}
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold ml-1 text-slate-500 uppercase tracking-wider">Password</label>
            <input
              {...register("password")}
              type="password"
              placeholder="Enter your password"
              className={`w-full h-12 px-4 rounded-xl bg-slate-50 dark:bg-white/5 border ${errors.password ? 'border-red-500/50' : 'border-slate-200 dark:border-white/10'} outline-none text-sm transition-all focus:border-[#FF5A09]/50`}
            />
            {errors.password && <p className="text-xs text-red-500 mt-1 ml-1">{errors.password.message}</p>}
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full h-12 rounded-xl bg-[#1A1A1A] dark:bg-white text-white dark:text-[#1A1A1A] font-bold text-xs uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-[#333] dark:hover:bg-slate-200 transition-all disabled:opacity-50"
          >
            {isSubmitting ? <Loader2 size={16} className="animate-spin" /> : <>Sign In <ArrowRight size={16} /></>}
          </button>
        </form>

        <footer className="mt-10 text-center">
          <p className="text-sm text-slate-500">
            Don&apos;t have an account? <Link href="/signup" className="text-[#FF5A09] font-semibold hover:underline underline-offset-4">Create one</Link>
          </p>
        </footer>
      </div>
    </div>
  );
}