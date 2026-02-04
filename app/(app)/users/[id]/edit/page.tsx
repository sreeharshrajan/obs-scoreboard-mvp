"use client";

import { use, useState, useEffect, useRef } from "react";
import { updateUser } from "@/lib/actions/user-actions";
import { Save, Loader2, Upload, AlertCircle } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { auth } from "@/lib/firebase/client";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import DashboardLoader from "@/components/dashboard/loader";
import ErrorFallback from "@/components/dashboard/error-fallback";

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
    const [isUploading, setIsUploading] = useState(false);
    const [photoURL, setPhotoURL] = useState("");
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        const fetchUser = async () => {
            try {
                const user = auth.currentUser;
                let token = "";
                if (user) token = await user.getIdToken();

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

                const res = await fetch(`/api/users/${id}`, {
                    headers: { Authorization: `Bearer ${token}` }
                });

                if (!res.ok) throw new Error("Failed to fetch user");
                const data = await res.json();
                setUserData(data);
                setPhotoURL(data.photoURL || "");
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
        return <ErrorFallback error={error} backUrl="/users" backLabel="Back to Directory" />;
    }

    if (fetching || !userData) {
        return <DashboardLoader message="Loading User..." />;
    }

    return (
        <form
            action={async (formData) => {
                setLoading(true);
                const token = await auth.currentUser?.getIdToken();
                if (!token) {
                    alert("Not authenticated");
                    setLoading(false);
                    return;
                }

                const updates = {
                    displayName: formData.get("displayName") as string,
                    photoURL: formData.get("photoURL") as string,
                    role: formData.get("role") as string,
                };

                try {
                    await updateUser(token, id, updates);
                } catch (e) {
                    console.error(e);
                    alert("Failed to update user");
                } finally {
                    setLoading(false);
                }
            }}
            className="h-full flex flex-col"
        >
            <input type="hidden" name="photoURL" value={photoURL} />

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-full">
                {/* LEFT COLUMN: Profile Sidebar */}
                <div className="lg:col-span-4 flex flex-col gap-6">
                    <div className="bg-white dark:bg-[#1A1A1A] rounded-2xl md:rounded-3xl border border-slate-200 dark:border-white/5 p-6 md:p-8 flex flex-col items-center gap-6 shadow-sm h-full max-h-[500px]">
                        <div className="relative group shrink-0">
                            <div className="w-32 h-32 md:w-48 md:h-48 rounded-full overflow-hidden bg-slate-100 dark:bg-white/5 border-4 border-white dark:border-[#2A2A2A] shadow-2xl relative ring-1 ring-slate-200 dark:ring-white/10">
                                {photoURL ? (
                                    <Image
                                        src={photoURL}
                                        alt="Profile"
                                        fill
                                        className="object-cover"
                                    />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center text-slate-300 font-bold text-5xl uppercase">
                                        {userData.displayName?.charAt(0) || "U"}
                                    </div>
                                )}

                                <div
                                    className="absolute inset-0 bg-black/40 backdrop-blur-sm flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 cursor-pointer"
                                    onClick={() => fileInputRef.current?.click()}
                                >
                                    <Upload size={32} className="text-white mb-2" />
                                    <span className="text-xs font-bold text-white uppercase tracking-widest">Change Photo</span>
                                </div>
                            </div>

                            {isUploading && (
                                <div className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-full z-20">
                                    <Loader2 className="animate-spin text-white" size={32} />
                                </div>
                            )}

                            <button
                                type="button"
                                onClick={() => fileInputRef.current?.click()}
                                className="absolute bottom-2 right-2 w-10 h-10 rounded-full bg-black dark:bg-white text-white dark:text-black flex items-center justify-center shadow-lg hover:scale-110 transition-transform md:hidden"
                            >
                                <Upload size={16} />
                            </button>
                        </div>

                        <div className="text-center space-y-2">
                            <h3 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">{userData.displayName}</h3>
                            <div className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 dark:bg-white/5 text-slate-800 dark:text-slate-200 font-mono">
                                {userData.id}
                            </div>
                            <p className="text-xs text-slate-400 max-w-[200px] mx-auto pt-2">
                                Click the image to upload a new profile photo. JPG, PNG or GIF recommended.
                            </p>
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
                                        headers: { Authorization: `Bearer ${token}` }
                                    });
                                    if (!sigRes.ok) throw new Error("Failed to get upload signature");
                                    const { signature, timestamp, cloudName, apiKey } = await sigRes.json();

                                    const formData = new FormData();
                                    formData.append('file', file);
                                    formData.append('api_key', apiKey);
                                    formData.append('timestamp', timestamp);
                                    formData.append('signature', signature);
                                    formData.append('folder', 'obs-scoreboard-users');

                                    const uploadRes = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
                                        method: 'POST',
                                        body: formData
                                    });

                                    if (!uploadRes.ok) throw new Error("Cloudinary upload failed");
                                    const uploadData = await uploadRes.json();

                                    setPhotoURL(uploadData.secure_url);
                                } catch (err) {
                                    console.error(err);
                                    alert("Upload failed");
                                } finally {
                                    setIsUploading(false);
                                }
                            }}
                        />
                    </div>
                </div>

                {/* RIGHT COLUMN: Edit Form */}
                <div className="lg:col-span-8 flex flex-col gap-6">
                    <div className="bg-white dark:bg-[#1A1A1A] rounded-2xl md:rounded-3xl border border-slate-200 dark:border-white/5 p-6 md:p-10 shadow-sm flex-1">
                        <div className="space-y-8 max-w-2xl">
                            <div>
                                <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-1">Account Details</h2>
                                <p className="text-sm text-slate-500 dark:text-slate-400">Update your personal information and roles.</p>
                            </div>

                            <div className="space-y-6">
                                <Input
                                    label="Display Name"
                                    name="displayName"
                                    id="displayName"
                                    defaultValue={userData.displayName}
                                    placeholder="Full Name"
                                    required
                                    className="bg-slate-50 dark:bg-black/20 border-slate-200 dark:border-white/5"
                                />

                                <Input
                                    label="Email Address"
                                    id="email"
                                    defaultValue={userData.email}
                                    disabled
                                    className="text-slate-500 bg-slate-100/50 dark:bg-white/5 cursor-not-allowed border-transparent"
                                />

                                <div className="pt-2">
                                    <Select
                                        label="Role Permission"
                                        id="role"
                                        name="role"
                                        defaultValue={userData.role || "User"}
                                        options={[
                                            { label: "User", value: "User" },
                                            { label: "Moderator", value: "Moderator" },
                                            { label: "Admin", value: "Admin" },
                                        ]}
                                        className="bg-slate-50 dark:bg-black/20 border-slate-200 dark:border-white/5"
                                    />
                                    <p className="text-[10px] text-slate-400 mt-2 ml-1">
                                        * Admin roles grant full access to tournament management.
                                    </p>
                                </div>
                            </div>

                            <div className="pt-8 flex items-center gap-4">
                                <button
                                    disabled={loading}
                                    type="submit"
                                    className="h-12 px-8 bg-black dark:bg-white text-white dark:text-black rounded-xl font-bold text-xs uppercase tracking-wider flex items-center gap-3 hover:scale-[1.02] active:scale-[0.98] transition-all shadow-lg hover:shadow-xl disabled:opacity-50 disabled:scale-100 disabled:shadow-none"
                                >
                                    {loading ? <Loader2 className="animate-spin" size={16} /> : <Save size={16} />}
                                    Save Changes
                                </button>

                                <Link
                                    href="/users"
                                    className="h-12 px-6 rounded-xl font-bold text-xs uppercase tracking-wider flex items-center gap-2 text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-white/5 transition-all"
                                >
                                    Cancel
                                </Link>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </form>
    );
}
