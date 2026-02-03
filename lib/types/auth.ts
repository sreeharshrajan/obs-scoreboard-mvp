// lib/types/auth.ts
export type AuthContext = {
    uid: string;
    email: string | null;
    roles: {
        isAdmin: boolean;
    };
};
