// stores/authStore.ts
import { create } from "zustand";
import { User } from "firebase/auth";
import type { UserRole } from "@/lib/types/permissions";

interface UserProfile {
  role: UserRole | null;
  organizationId: string | null;
  isActive: boolean;
  mustChangePassword: boolean;
  roles: {
    isSuperAdmin: boolean;
    isOrganizer: boolean;
    isStaff: boolean;
    isAdmin: boolean;
  };
}

interface AuthState {
  user: User | null;
  loading: boolean;
  profile: UserProfile | null;
  setUser: (user: User | null) => void;
  setLoading: (loading: boolean) => void;
  setUserProfile: (profile: UserProfile) => void;
  clearProfile: () => void;
}

const DEFAULT_PROFILE: UserProfile = {
  role: null,
  organizationId: null,
  isActive: true,
  mustChangePassword: false,
  roles: {
    isSuperAdmin: false,
    isOrganizer: false,
    isStaff: false,
    isAdmin: false,
  },
};

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  loading: true,
  profile: null,
  setUser: (user) => set({ user }),
  setLoading: (loading) => set({ loading }),
  setUserProfile: (profile) => set({ profile }),
  clearProfile: () => set({ profile: null }),
}));

