"use client";

import { use, useState, useEffect, useRef } from "react";
import { updateUser } from "@/lib/actions/user-actions";
import { ChevronLeft, Save, Loader2, Upload, AlertCircle } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { auth } from "@/lib/firebase/client";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";

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
        return (
            <div className="p-8">
                <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-xl border border-red-200 dark:border-red-800 flex items-center gap-3">
                    <AlertCircle className="text-red-500" size={20} />
                    <p className="text-red-700 dark:text-red-300 font-medium">{error}</p>
                </div>
                <Link href="/users" className="mt-4 inline-block text-sm text-slate-500 hover:text-black dark:hover:text-white transition-colors">
                    &larr; Back to Users
                </Link>
            </div>
        );
    }

    if (fetching || !userData) {
        return (
            <div className="h-full flex items-center justify-center min-h-[400px]">
                <Loader2 className="animate-spin text-slate-300" size={32} />
            </div>
        );
    }

    return (
        <div className="max-w-3xl mx-auto p-6 md:p-10 space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <Link
                        href="/users"
                        className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-widest text-slate-400 mb-2 hover:text-black dark:hover:text-white transition-colors"
                    >
                        <ChevronLeft size={12} /> Back to Directory
                    </Link>
                    <h1 className="text-2xl font-semibold tracking-tight text-slate-900 dark:text-white">
                        Edit User
                    </h1>
                </div>
            </div>

            <div className="bg-white dark:bg-[#1A1A1A] border border-slate-200 dark:border-white/5 rounded-2xl p-6 md:p-8 shadow-sm">
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
                    className="space-y-8"
                >
                    <input type="hidden" name="photoURL" value={photoURL} />

                    {/* Profile Image Section */}
                    <div className="flex flex-row items-center gap-6 pb-6 border-b border-slate-100 dark:border-white/5">
                        <div className="relative group shrink-0">
                            <div className="w-20 h-20 rounded-full overflow-hidden bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 relative">
                                {photoURL ? (
                                    <Image
                                        src={photoURL}
                                        alt="Profile"
                                        fill
                                        className="object-cover"
                                    />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center text-slate-300 font-bold text-2xl uppercase">
                                        {userData.displayName?.charAt(0) || "U"}
                                    </div>
                                )}

                                <div
                                    className="absolute inset-0 bg-black/50 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                                    onClick={() => fileInputRef.current?.click()}
                                >
                                    <Upload size={16} className="text-white" />
                                </div>
                            </div>

                            {isUploading && (
                                <div className="absolute inset-0 flex items-center justify-center bg-white/80 dark:bg-black/80 rounded-full z-10">
                                    <Loader2 className="animate-spin text-slate-400" size={16} />
                                </div>
                            )}
                        </div>

                        <div className="flex-1 space-y-1">
                            <h3 className="font-medium text-sm">Profile Photo</h3>
                            <div className="flex items-center gap-3">
                                <button
                                    type="button"
                                    onClick={() => fileInputRef.current?.click()}
                                    className="text-xs font-semibold text-[#FF5A09] hover:underline"
                                >
                                    Upload New
                                </button>
                                {photoURL && (
                                    <button
                                        type="button"
                                        onClick={() => setPhotoURL("")}
                                        className="text-xs font-semibold text-red-500 hover:underline"
                                    >
                                        Remove
                                    </button>
                                )}
                            </div>
                            <p className="text-[10px] text-slate-400">
                                Recommended: Square JPG, PNG, or GIF, at least 100x100.
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
                                    // 1. Get Signature
                                    const user = auth.currentUser;
                                    const token = await user?.getIdToken();
                                    const sigRes = await fetch('/api/upload', {
                                        method: 'POST',
                                        headers: { Authorization: `Bearer ${token}` }
                                    });
                                    if (!sigRes.ok) throw new Error("Failed to get upload signature");
                                    const { signature, timestamp, cloudName, apiKey } = await sigRes.json();

                                    // 2. Upload to Cloudinary
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

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <Input
                            label="Display Name"
                            name="displayName"
                            id="displayName"
                            defaultValue={userData.displayName}
                            placeholder="Full Name"
                            required
                        />

                        <Input
                            label="Email Address"
                            id="email"
                            defaultValue={userData.email}
                            disabled
                            className="text-slate-500 bg-slate-50 dark:bg-white/5 cursor-not-allowed"
                        />

                        <div className="md:col-span-2">
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
                            />
                        </div>
                    </div>

                    <div className="flex justify-end pt-4 border-t border-slate-100 dark:border-white/5">
                        <button
                            disabled={loading}
                            type="submit"
                            className="h-10 px-6 bg-black dark:bg-white text-white dark:text-black rounded-xl font-bold text-xs uppercase tracking-wider flex items-center gap-2 hover:opacity-90 transition-opacity disabled:opacity-50"
                        >
                            {loading ? <Loader2 className="animate-spin" size={14} /> : <Save size={14} />}
                            Save Changes
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
