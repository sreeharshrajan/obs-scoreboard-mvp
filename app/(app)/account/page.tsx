"use client";

import { useState, useEffect, useRef } from "react";
import { updateProfile } from "@/lib/actions/profile-actions";
import { Save, Loader2, Upload, LayoutGrid, Users } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { auth } from "@/lib/firebase/client";
import { Input } from "@/components/ui/Input";
import { FormSkeleton } from "@/components/dashboard/skeletons";
import ErrorFallback from "@/components/dashboard/error-fallback";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

interface UserData {
    id: string;
    displayName: string;
    email: string;
    photoURL: string;
    role: string;
    streamerLogo?: string;
}

export default function AccountPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [fetching, setFetching] = useState(true);
    const [userData, setUserData] = useState<UserData | null>(null);
    const [error, setError] = useState<string | null>(null);

    // Upload State
    const [isUploading, setIsUploading] = useState(false);
    const [isUploadingLogo, setIsUploadingLogo] = useState(false);
    const [photoURL, setPhotoURL] = useState("");
    const [streamerLogo, setStreamerLogo] = useState("");
    const fileInputRef = useRef<HTMLInputElement>(null);
    const logoInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        const fetchUser = async () => {
            try {
                let user = auth.currentUser;
                let token = "";

                if (!user) {
                    await new Promise<void>((resolve) => {
                        const unsub = auth.onAuthStateChanged((u) => {
                            user = u;
                            unsub();
                            resolve();
                        });
                    });
                }

                if (user) {
                    token = await user.getIdToken();
                }

                if (!token || !user) {
                    // Redirect to login if not authenticated (should be handled by middleware/layout generally)
                    throw new Error("Not authenticated");
                }

                const res = await fetch(`/api/users/${user.uid}`, {
                    headers: { Authorization: `Bearer ${token}` }
                });

                if (!res.ok) throw new Error("Failed to fetch user data");
                const data = await res.json();
                setUserData(data);
                setPhotoURL(data.photoURL || "");
                setStreamerLogo(data.streamerLogo || "");
            } catch (err: any) {
                console.error(err);
                setError(err.message || "Failed to load account data");
            } finally {
                setFetching(false);
            }
        };
        fetchUser();
    }, []);


    if (error) {
        return <ErrorFallback error={error} backUrl="/dashboard" backLabel="Back to Dashboard" />;
    }

    if (fetching || !userData) {
        return <FormSkeleton />;
    }

    return (
        <div className="flex-1 w-full max-w-7xl mx-auto px-6 md:px-10 flex flex-col py-6 animate-in fade-in duration-500">
            <form
                action={async (formData) => {
                    setLoading(true);
                    const token = await auth.currentUser?.getIdToken();
                    if (!token) {
                        toast.error("Not authenticated");
                        setLoading(false);
                        return;
                    }

                    const updates = {
                        displayName: formData.get("displayName") as string,
                        photoURL: photoURL,
                        streamerLogo: streamerLogo,
                    };

                    try {
                        await updateProfile(token, updates);
                        router.refresh();
                        toast.success("Profile updated successfully");
                    } catch (e: any) {
                        console.error(e);
                        toast.error(e.message || "Failed to update profile");
                    } finally {
                        setLoading(false);
                    }
                }}
                className="grid grid-cols-1 lg:grid-cols-12 gap-10"
            >
                {/* LEFT COLUMN: User Details */}
                <div className="lg:col-span-7 space-y-6">
                    <div className="bg-slate-50 dark:bg-white/5 p-6 md:p-8 rounded-3xl border border-slate-200 dark:border-white/5 space-y-6">
                        <div className="flex items-center justify-between">
                            <div className="space-y-1">
                                <h3 className="text-lg font-bold text-slate-900 dark:text-white">Account Settings</h3>
                                <p className="text-xs text-slate-500">Manage your personal profile and branding.</p>
                            </div>
                            <div className="flex items-center gap-4">
                                <Link href="/dashboard" className="inline-flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-slate-400 hover:text-[#FF5A09] transition-colors">
                                    <LayoutGrid size={12} /> Dashboard
                                </Link>
                            </div>
                        </div>

                        <Input
                            label="Display Name"
                            name="displayName"
                            defaultValue={userData.displayName}
                            placeholder="Full Name"
                            required
                        />

                        <Input
                            label="Email Address"
                            defaultValue={userData.email}
                            disabled
                            className="text-slate-500 bg-slate-100/50 dark:bg-white/5 cursor-not-allowed border-transparent"
                        />

                        <div className="pt-2">
                            <div className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-slate-200 dark:bg-white/10 text-slate-600 dark:text-slate-300 font-mono">
                                ID: {userData.id}
                            </div>
                        </div>
                    </div>
                </div>

                {/* RIGHT COLUMN: Images & Submit */}
                <div className="lg:col-span-5 space-y-6">
                    <div className="grid grid-cols-2 gap-4">
                        {/* Profile Photo */}
                        <div className="p-6 rounded-[2rem] bg-white dark:bg-[#1A1A1A] border border-slate-200 dark:border-white/5 flex flex-col items-center gap-4 shadow-sm">
                            <div className="relative group cursor-pointer" onClick={() => fileInputRef.current?.click()}>
                                <div className="w-24 h-24 rounded-full overflow-hidden bg-slate-100 dark:bg-white/5 border-2 border-white dark:border-[#2A2A2A] shadow-md relative ring-1 ring-slate-200 dark:ring-white/10">
                                    {photoURL ? (
                                        <Image src={photoURL} alt="Profile" fill className="object-cover" />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center text-slate-300 font-bold text-2xl uppercase">
                                            {userData.displayName?.charAt(0) || "U"}
                                        </div>
                                    )}
                                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all">
                                        <Upload size={16} className="text-white" />
                                    </div>
                                </div>
                                {isUploading && (
                                    <div className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-full z-20">
                                        <Loader2 className="animate-spin text-white" size={24} />
                                    </div>
                                )}
                            </div>
                            <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Profile Photo</span>
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
                                        const uploadRes = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, { method: 'POST', body: formData });
                                        if (!uploadRes.ok) throw new Error("Cloudinary upload failed");
                                        const uploadData = await uploadRes.json();
                                        setPhotoURL(uploadData.secure_url);
                                    } catch (err) { console.error(err); toast.error("Upload failed"); }
                                    finally { setIsUploading(false); }
                                }}
                            />
                        </div>

                        {/* Streamer Logo */}
                        <div className="p-6 rounded-[2rem] bg-white dark:bg-[#1A1A1A] border border-slate-200 dark:border-white/5 flex flex-col items-center gap-4 shadow-sm">
                            <div className="relative group cursor-pointer" onClick={() => logoInputRef.current?.click()}>
                                <div className="w-24 h-24 rounded-xl overflow-hidden bg-slate-100 dark:bg-white/5 border-2 border-dashed border-slate-300 dark:border-white/20 hover:border-slate-400 dark:hover:border-white/30 flex items-center justify-center relative">
                                    {streamerLogo ? (
                                        <Image src={streamerLogo} alt="Logo" fill className="object-contain p-2" />
                                    ) : (
                                        <Upload size={20} className="text-slate-300" />
                                    )}
                                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all">
                                        <Upload size={16} className="text-white" />
                                    </div>
                                </div>
                                {isUploadingLogo && (
                                    <div className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-xl z-20">
                                        <Loader2 className="animate-spin text-white" size={24} />
                                    </div>
                                )}
                            </div>
                            <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Streamer Logo</span>
                            <input
                                type="file"
                                ref={logoInputRef}
                                className="hidden"
                                accept="image/*"
                                onChange={async (e) => {
                                    if (!e.target.files?.[0]) return;
                                    const file = e.target.files[0];
                                    setIsUploadingLogo(true);
                                    try {
                                        const user = auth.currentUser;
                                        const token = await user?.getIdToken();
                                        const sigRes = await fetch('/api/upload', {
                                            method: 'POST',
                                            headers: {
                                                'Authorization': `Bearer ${token}`,
                                                'Content-Type': 'application/json'
                                            },
                                            body: JSON.stringify({ folder: 'obs-scoreboard-logos' })
                                        });
                                        if (!sigRes.ok) throw new Error("Failed to get upload signature");
                                        const { signature, timestamp, cloudName, apiKey } = await sigRes.json();
                                        const formData = new FormData();
                                        formData.append('file', file);
                                        formData.append('api_key', apiKey);
                                        formData.append('timestamp', timestamp);
                                        formData.append('signature', signature);
                                        formData.append('folder', 'obs-scoreboard-logos');
                                        const uploadRes = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, { method: 'POST', body: formData });
                                        if (!uploadRes.ok) throw new Error("Cloudinary upload failed");
                                        const uploadData = await uploadRes.json();
                                        setStreamerLogo(uploadData.secure_url);
                                    } catch (err) { console.error(err); toast.error("Logo upload failed"); }
                                    finally { setIsUploadingLogo(false); }
                                }}
                            />
                        </div>
                    </div>

                    <div className="p-6 rounded-[2rem] bg-slate-50 dark:bg-[#2A2A2A]/20 border border-slate-200 dark:border-white/5 space-y-6">
                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full h-12 rounded-xl bg-[#1A1A1A] dark:bg-white text-white dark:text-[#1A1A1A] font-bold text-[10px] uppercase tracking-[0.2em] flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50"
                        >
                            {loading ? <Loader2 className="animate-spin" size={16} /> : <>Save Changes <Save size={16} /></>}
                        </button>
                    </div>
                </div>
            </form>
        </div>
    );
}
