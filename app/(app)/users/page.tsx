"use client";
import { useEffect, useState } from "react";
import { Mail, Search, ArrowRight, UserCircle, X, Calendar, Fingerprint, CheckCircle2, Trash2, UserPlus, KeyRound, Power } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { auth } from "@/lib/firebase/client";
import { AdminGuard } from "@/components/auth/AdminGuard";
import GridSkeleton from "@/components/dashboard/grid-skeleton";
import { CreateUserModal } from "@/components/users/CreateUserModal";
import { AssignmentPanel } from "@/components/users/AssignmentPanel";
import { useAuthStore } from "@/lib/stores/authStore";

// Interface (kept same as your code)
interface User {
    id: string;
    displayName: string | null;
    email: string | null;
    photoURL: string | null;
    role?: "organizer" | "staff" | "viewer" | "Admin" | "User";
    isActive?: boolean;
    lastLoginAt?: string | null;
    createdAt?: { toDate: () => Date } | any; // Type adjustment for serializable data
}

export default function UserListing() {
    const { profile } = useAuthStore();
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const [currentUid, setCurrentUid] = useState<string | null>(null);
    const [selectedUser, setSelectedUser] = useState<User | null>(null);
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

    const isSuperAdmin = profile?.roles?.isSuperAdmin ?? false;

    const fetchUsers = async () => {
        setLoading(true);
        const user = auth.currentUser;
        if (!user) return;
        setCurrentUid(user.uid);

        try {
            const token = await user.getIdToken();
            const res = await fetch("/api/users", {
                headers: { Authorization: `Bearer ${token}` },
            });

            if (res.ok) {
                const data = await res.json();
                const parsedData = data.map((u: User) => ({
                    ...u,
                    createdAt: u.createdAt ? { toDate: () => new Date(u.createdAt) } : null
                }));
                setUsers(parsedData);
            }
        } catch (err) {
            console.error("Fetch users error:", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchUsers();
    }, []);

    // --- NEW: Delete Handler ---
    const handleDeleteUser = async (userId: string) => {
        if (!confirm("Are you sure you want to permanently delete this user? This action cannot be undone.")) {
            return;
        }

        const user = auth.currentUser;
        if (!user) return;

        try {
            const token = await user.getIdToken();
            const res = await fetch(`/api/users/${userId}`, {
                method: "DELETE",
                headers: { Authorization: `Bearer ${token}` },
            });

            if (!res.ok) {
                const errorData = await res.json();
                alert(errorData.error || "Failed to delete user");
                return;
            }

            // UI Update: Remove user from state
            setUsers((prev) => prev.filter((u) => u.id !== userId));
            setSelectedUser(null); // Close modal
            alert("User deleted successfully.");

        } catch (error) {
            console.error("Error deleting user:", error);
            alert("An unexpected error occurred.");
        }
    };

    const filteredUsers = users.filter(user =>
        user.displayName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.email?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <AdminGuard>
            <div className="flex-1 w-full max-w-7xl mx-auto px-6 md:px-10 flex flex-col py-6 space-y-8 animate-in fade-in duration-500 relative">

                {/* Top Action Bar */}
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
                    <div className="relative w-full max-w-md">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                        <input
                            type="text"
                            placeholder="Search by name or email..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full h-11 pl-12 pr-4 rounded-xl bg-white dark:bg-[#2A2A2A]/40 border border-slate-200 dark:border-white/5 outline-none focus:border-[#FF5A09]/50 transition-all text-sm"
                        />
                    </div>

                    {isSuperAdmin && (
                        <button
                            onClick={() => setIsCreateModalOpen(true)}
                            className="h-11 px-5 rounded-xl bg-[#FF5A09] text-white text-xs font-bold uppercase tracking-widest hover:shadow-lg hover:shadow-[#FF5A09]/30 transition-all flex items-center justify-center gap-2"
                        >
                            <UserPlus size={16} /> Create User Account
                        </button>
                    )}
                </div>

                <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
                    {loading ? (
                        <GridSkeleton />
                    ) : filteredUsers.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pb-10">
                            {filteredUsers.map((user) => (
                                <UserCard
                                    key={user.id}
                                    user={user}
                                    isYou={user.id === currentUid}
                                    onClick={() => setSelectedUser(user)}
                                />
                            ))}
                        </div>
                    ) : (
                        <div className="h-64 flex flex-col items-center justify-center border-2 border-dashed border-slate-100 dark:border-white/5 rounded-4xl">
                            <p className="text-slate-400 text-xs font-bold uppercase tracking-widest">No users found</p>
                        </div>
                    )}
                </div>

                {selectedUser && (
                    <UserModal
                        user={selectedUser}
                        isCurrentUser={selectedUser.id === currentUid}
                        isSuperAdmin={isSuperAdmin}
                        onClose={() => setSelectedUser(null)}
                        onDelete={() => handleDeleteUser(selectedUser.id)}
                        onUserUpdated={fetchUsers}
                    />
                )}

                {isCreateModalOpen && (
                    <CreateUserModal
                        onClose={() => setIsCreateModalOpen(false)}
                        onUserCreated={fetchUsers}
                    />
                )}
            </div>
        </AdminGuard>
    );
}

function UserCard({ user, isYou, onClick }: { user: User; isYou: boolean; onClick: () => void }) {
    const roleColors: Record<string, string> = {
        Admin: "bg-red-500/10 text-red-500",
        Moderator: "bg-[#FF5A09]/10 text-[#FF5A09]",
        User: "bg-blue-500/10 text-blue-500",
    };

    return (
        <div
            onClick={onClick}
            className="group cursor-pointer p-6 rounded-4xl bg-white dark:bg-[#2A2A2A]/40 border border-slate-200 dark:border-white/5 hover:border-[#FF5A09]/30 transition-all duration-500 flex flex-col justify-between h-56 relative overflow-hidden"
        >
            <div className="relative z-10">
                <div className="flex justify-between items-start mb-4">
                    <div className="flex gap-2">
                        <div className={`px-2.5 py-1 rounded-lg text-[8px] font-bold uppercase tracking-wider ${roleColors[user.role || "User"]}`}>
                            {user.role || "User"}
                        </div>
                        {isYou && (
                            <div className="px-2.5 py-1 rounded-lg text-[8px] font-bold uppercase tracking-wider bg-emerald-500/10 text-emerald-500">
                                You
                            </div>
                        )}
                    </div>
                    <ArrowRight size={16} className="text-slate-300 opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
                </div>

                <div className="flex items-center gap-3 mb-2">
                    {user.photoURL ? (
                        <div className="relative w-10 h-10">
                            <Image src={user.photoURL} alt={user.displayName || "User"} fill className="rounded-full object-cover border border-slate-100" />
                        </div>
                    ) : (
                        <UserCircle size={40} className="text-slate-200" />
                    )}
                    <h3 className="text-xl font-instrument font-medium tracking-tight group-hover:text-[#FF5A09] transition-colors line-clamp-1">
                        {user.displayName || "Anonymous User"}
                    </h3>
                </div>

                <div className="space-y-1.5 mt-2">
                    <div className="flex items-center gap-2 text-[10px] text-slate-400 font-bold uppercase tracking-widest">
                        <Mail size={12} className="text-slate-300" /> {user.email}
                    </div>
                </div>
            </div>

            <div className="flex justify-between items-center relative z-10 pt-4 border-t border-slate-50 dark:border-white/5 mt-auto">
                <div className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-[#FF5A09]" />
                    <span className="text-[9px] font-bold uppercase tracking-widest text-slate-400">
                        View Details
                    </span>
                </div>
            </div>
            <div className="absolute -right-4 -bottom-4 w-24 h-24 bg-[#FF5A09]/5 blur-3xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity" />
        </div>
    );
}

// Update Modal to accept onDelete and show delete button
function UserModal({
    user,
    isCurrentUser,
    isSuperAdmin,
    onClose,
    onDelete,
    onUserUpdated
}: {
    user: User;
    isCurrentUser: boolean;
    isSuperAdmin: boolean;
    onClose: () => void;
    onDelete: () => void;
    onUserUpdated: () => void;
}) {
    const [isDeleting, setIsDeleting] = useState(false);
    const [isUpdatingActive, setIsUpdatingActive] = useState(false);
    const [resetMsg, setResetMsg] = useState<string | null>(null);

    const handleConfirmDelete = async () => {
        setIsDeleting(true);
        await onDelete();
        setIsDeleting(false);
    };

    const handleToggleActive = async () => {
        setIsUpdatingActive(true);
        try {
            const authUser = auth.currentUser;
            if (!authUser) return;
            const token = await authUser.getIdToken();

            const res = await fetch(`/api/admin/users/${user.id}`, {
                method: "PATCH",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({ isActive: !(user.isActive !== false) })
            });

            if (res.ok) {
                onUserUpdated();
            } else {
                const errData = await res.json();
                alert(errData.error || "Failed to update account status");
            }
        } catch (err) {
            console.error("Toggle active error:", err);
        } finally {
            setIsUpdatingActive(false);
        }
    };

    const handleResetPassword = async () => {
        setResetMsg("Generating link...");
        try {
            const authUser = auth.currentUser;
            if (!authUser) return;
            const token = await authUser.getIdToken();

            const res = await fetch(`/api/admin/users/${user.id}`, {
                method: "PATCH",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({ resetPassword: true })
            });

            if (res.ok) {
                const data = await res.json();
                if (data.resetLink) {
                    alert(`Password Reset Link:\n\n${data.resetLink}`);
                    setResetMsg("Reset link generated.");
                } else {
                    setResetMsg("Reset email sent.");
                }
            } else {
                setResetMsg("Failed to reset password.");
            }
        } catch (err) {
            console.error("Password reset error:", err);
            setResetMsg("Failed to generate link.");
        }
    };

    const isActive = user.isActive !== false;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-end bg-black/40 backdrop-blur-sm animate-in fade-in duration-300">
            <div className="absolute inset-0" onClick={onClose} />

            <div className="relative w-full max-w-lg h-[96vh] mr-4 bg-white dark:bg-[#1A1A1A] rounded-4xl shadow-2xl shadow-black/50 overflow-hidden flex flex-col animate-in slide-in-from-right duration-500">

                <button
                    onClick={onClose}
                    aria-label="Close modal"
                    className="absolute top-8 right-8 p-2 rounded-full bg-slate-100 dark:bg-white/5 hover:bg-[#FF5A09]/10 hover:text-[#FF5A09] transition-all z-20"
                >
                    <X size={20} />
                </button>

                <div className="p-10 flex-1 overflow-y-auto space-y-8 custom-scrollbar">
                    <div className="space-y-6 text-center flex flex-col items-center pt-8">
                        <div className="relative">
                            {user.photoURL ? (
                                <div className="relative w-28 h-28">
                                    <Image src={user.photoURL} alt={user.displayName || "User"} fill className="rounded-4xl object-cover shadow-2xl" />
                                </div>
                            ) : (
                                <div className="w-28 h-28 rounded-4xl bg-slate-100 dark:bg-white/5 flex items-center justify-center border border-slate-200 dark:border-white/5">
                                    <UserCircle size={60} className="text-slate-300" />
                                </div>
                            )}
                            <div className={`absolute -bottom-2 -right-2 p-2 rounded-xl shadow-lg ${isActive ? 'bg-emerald-500 text-white' : 'bg-red-500 text-white'}`}>
                                <CheckCircle2 size={16} />
                            </div>
                        </div>

                        <div>
                            <div className="flex justify-center gap-2 mb-3">
                                <div className="inline-block px-3 py-1 rounded-full text-[9px] font-bold uppercase tracking-widest bg-[#FF5A09]/10 text-[#FF5A09]">
                                    {user.role || "Platform User"}
                                </div>
                                <div className={`inline-block px-3 py-1 rounded-full text-[9px] font-bold uppercase tracking-widest ${isActive ? 'bg-emerald-500/10 text-emerald-500' : 'bg-red-500/10 text-red-500'}`}>
                                    {isActive ? "Active" : "Inactive"}
                                </div>
                            </div>
                            <h2 className="text-4xl font-instrument font-medium tracking-tight italic">{user.displayName || "Anonymous"}</h2>
                            <p className="text-slate-400 text-sm mt-1">{user.email}</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 gap-4">
                        <ModalStat icon={<Fingerprint size={16} />} label="System ID" value={user.id} />
                        <ModalStat icon={<Mail size={16} />} label="Primary Email" value={user.email || "N/A"} />
                        <ModalStat icon={<Calendar size={16} />} label="Join Date" value={user.createdAt?.toDate ? user.createdAt.toDate().toLocaleDateString() : 'Recently'} />
                    </div>

                    {/* ASSIGNMENT PANEL for Super Admin view */}
                    {isSuperAdmin && (
                        <AssignmentPanel userId={user.id} userName={user.displayName || user.email || "User"} />
                    )}

                    {!isCurrentUser && (
                        <div className="pt-6 flex flex-col gap-3">
                            {isSuperAdmin && (
                                <>
                                    <button
                                        onClick={handleResetPassword}
                                        className="h-12 w-full rounded-2xl border border-slate-200 dark:border-white/10 font-bold text-[10px] uppercase tracking-[0.2em] hover:bg-slate-50 dark:hover:bg-white/5 transition-all flex items-center justify-center gap-2"
                                    >
                                        <KeyRound size={14} className="text-[#FF5A09]" />
                                        {resetMsg || "Reset Password"}
                                    </button>

                                    <button
                                        onClick={handleToggleActive}
                                        disabled={isUpdatingActive}
                                        className={`h-12 w-full rounded-2xl border font-bold text-[10px] uppercase tracking-[0.2em] transition-all flex items-center justify-center gap-2 ${isActive
                                                ? "border-amber-500/30 text-amber-500 bg-amber-500/5 hover:bg-amber-500 hover:text-white"
                                                : "border-emerald-500/30 text-emerald-500 bg-emerald-500/5 hover:bg-emerald-500 hover:text-white"
                                            }`}
                                    >
                                        <Power size={14} />
                                        {isActive ? "Deactivate Account" : "Activate Account"}
                                    </button>
                                </>
                            )}

                            <Link
                                href={`/users/${user.id}/edit`}
                                className="h-14 w-full rounded-2xl bg-[#1A1A1A] dark:bg-white text-white dark:text-[#1A1A1A] font-bold text-[10px] uppercase tracking-[0.2em] hover:scale-[1.01] active:scale-[0.99] transition-all flex items-center justify-center"
                            >
                                Edit User Account
                            </Link>

                            {/* DELETE BUTTON */}
                            {isSuperAdmin && (
                                <button
                                    onClick={handleConfirmDelete}
                                    disabled={isDeleting}
                                    className="h-14 w-full rounded-2xl border border-red-500/20 text-red-500 bg-red-500/5 font-bold text-[10px] uppercase tracking-[0.2em] hover:bg-red-500 hover:text-white transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {isDeleting ? (
                                        <span>Deleting...</span>
                                    ) : (
                                        <>
                                            <Trash2 size={14} /> Delete User
                                        </>
                                    )}
                                </button>
                            )}
                        </div>
                    )}
                </div>

                <div className="p-6 bg-slate-50 dark:bg-white/5 text-center">
                    <p className="text-[9px] font-bold uppercase tracking-widest text-slate-400">Security Cleared Admin View</p>
                </div>
            </div>
        </div>
    );
}

function ModalStat({ icon, label, value }: { icon: React.ReactNode, label: string, value: string }) {
    return (
        <div className="flex items-center gap-4 p-4 rounded-2xl bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/5">
            <div className="text-[#FF5A09]">{icon}</div>
            <div>
                <p className="text-[8px] font-bold uppercase tracking-widest text-slate-400">{label}</p>
                <p className="text-xs font-medium truncate max-w-50">{value}</p>
            </div>
        </div>
    );
}