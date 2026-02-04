"use client";

import { use, useState, useEffect } from "react";
import { updateUser } from "@/lib/actions/user-actions";
import { ChevronLeft, Save, Loader2, UserCircle, Upload, AlertCircle } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { auth } from "@/lib/firebase/client";

interface UserData {
    id: string;
    displayName: string;
    email: string;
    photoURL: string;
    role: string;
}

export default function EditUser({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params);
    const [loading, setLoading] = useState(false);
    const [fetching, setFetching] = useState(true);
    const [userData, setUserData] = useState<UserData | null>(null);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchUser = async () => {
            try {
                const user = auth.currentUser;
                let token = "";
                if (user) token = await user.getIdToken();

                // Fallback if token not immediately available
                if (!token) {
                    await new Promise<void>((resolve) => {
                        const unsub = auth.onAuthStateChanged(async (u) => {
                            if (u) token = await u.getIdToken();
                            unsub();
                            resolve();
                        });
                    });
                }

                if (!token) throw new Error("Not authenticated");

                // We can reuse the existing API or fetch directly if we had a dedicated single user endpoint
                // Since there is no specific single user API in the file list I saw, I'll assume we might need to add one
                // OR just use the list endpoint with a filter if efficient, but a direct fetch is better.
                // EXISTING API: /api/users/[id] (implied by DELETE existing in previous file, let's verify existence)

                const res = await fetch(`/api/users/${id}`, {
                    headers: { Authorization: `Bearer ${token}` }
                });

                if (!res.ok) throw new Error("Failed to fetch user");
                const data = await res.json();
                setUserData(data);
            } catch (err) {
                console.error(err);
                setError("Failed to load user data");
            } finally {
                setFetching(false);
            }
        };
        fetchUser();
    }, [id]);


    if (error) {
        return (
            <div className="p-10 text-center flex flex-col items-center gap-4">
                <div className="bg-red-500/10 p-4 rounded-full">
                    <AlertCircle className="text-red-500" size={32} />
                </div>
                <h3 className="text-lg font-bold">Error</h3>
                <p className="text-slate-500">{error}</p>
                <Link href="/users" className="text-blue-500 hover:underline">Return to Directory</Link>
            </div>
        );
    }

    if (fetching || !userData) {
        return (
            <div className="p-10 text-center">
                <Loader2 className="animate-spin mx-auto text-[#FF5A09]" />
                <p className="mt-2 text-slate-500 text-xs uppercase tracking-widest font-bold">Loading User Profile...</p>
            </div>
        );
    }

    return (
        <div className="max-w-xl mx-auto py-10 px-6 animate-in fade-in slide-in-from-bottom-4">
            <Link
                href="/users"
                className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-8 hover:text-black dark:hover:text-white transition-colors"
            >
                <ChevronLeft size={14} /> Back to Directory
            </Link>

            <h1 className="text-3xl font-instrument mb-8">Edit User Profile</h1>

            <form
                action={async (formData) => {
                    setLoading(true);
                    const updates = {
                        displayName: formData.get("displayName") as string,
                        photoURL: formData.get("photoURL") as string,
                        role: formData.get("role") as string,
                    };
                    await updateUser(id, updates);
                }}
                className="space-y-8"
            >
                {/* Image Preview & Input */}
                <div className="flex flex-col items-center gap-6">
                    <div className="relative group">
                        <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-slate-100 dark:border-white/10 shadow-xl relative">
                            {userData.photoURL ? (
                                <Image
                                    src={userData.photoURL}
                                    alt="Profile"
                                    fill
                                    className="object-cover"
                                // Fallback handling would be ideal here in a real app
                                />
                            ) : (
                                <div className="w-full h-full bg-slate-100 dark:bg-white/5 flex items-center justify-center">
                                    <UserCircle size={64} className="text-slate-300" />
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="w-full space-y-2">
                        <label htmlFor="photoURL" className="text-[10px] font-bold uppercase tracking-widest text-slate-400 block text-center">
                            Profile Image URL
                        </label>
                        <input
                            id="photoURL"
                            name="photoURL"
                            defaultValue={userData.photoURL || ""}
                            placeholder="https://..."
                            className="w-full h-12 px-4 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 outline-none focus:border-[#FF5A09] transition-colors text-sm text-center"
                        />
                        <p className="text-[10px] text-slate-400 text-center">Paste a direct link to an image (JPG, PNG, GIF)</p>
                    </div>
                </div>

                <div className="space-y-4">
                    <div className="space-y-2">
                        <label
                            htmlFor="displayName"
                            className="text-[10px] font-bold uppercase tracking-widest text-slate-400"
                        >
                            Display Name
                        </label>
                        <input
                            id="displayName"
                            name="displayName"
                            defaultValue={userData.displayName}
                            placeholder="Full Name"
                            className="w-full h-14 px-4 rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 focus:ring-2 focus:ring-[#FF5A09] outline-none transition-all"
                            required
                        />
                    </div>

                    <div className="space-y-2">
                        <label
                            htmlFor="email"
                            className="text-[10px] font-bold uppercase tracking-widest text-slate-400"
                        >
                            Email Address (Read Only)
                        </label>
                        <input
                            id="email"
                            defaultValue={userData.email}
                            disabled
                            className="w-full h-14 px-4 rounded-2xl border border-slate-100 dark:border-white/5 bg-slate-50 dark:bg-white/5 text-slate-500 cursor-not-allowed outline-none"
                        />
                    </div>

                    <div className="space-y-2">
                        <label
                            htmlFor="role"
                            className="text-[10px] font-bold uppercase tracking-widest text-slate-400"
                        >
                            Role
                        </label>
                        <select
                            id="role"
                            name="role"
                            defaultValue={userData.role || "User"}
                            className="w-full h-14 px-4 rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 outline-none focus:border-[#FF5A09] transition-colors appearance-none"
                        >
                            <option value="User">User</option>
                            <option value="Moderator">Moderator</option>
                            <option value="Admin">Admin</option>
                        </select>
                    </div>
                </div>

                <button
                    disabled={loading}
                    className="w-full h-14 bg-[#FF5A09] text-white rounded-2xl font-bold uppercase tracking-widest text-[11px] flex items-center justify-center gap-2 hover:shadow-lg hover:shadow-[#FF5A09]/20 transition-all disabled:opacity-50 mt-8"
                >
                    {loading ? <Loader2 className="animate-spin" size={16} /> : <Save size={16} />}
                    Save Profile
                </button>
            </form>
        </div>
    );
}
