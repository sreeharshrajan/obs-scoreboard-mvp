// lib/types/auth.ts
import type { UserRole } from "./permissions";

export type AuthContext = {
    uid: string;
    email: string | null;
    roles: {
        isSuperAdmin: boolean;
        isOrganizer: boolean;
        isStaff: boolean;
        /** @deprecated Use isSuperAdmin || isOrganizer instead */
        isAdmin: boolean;
    };
    /** Raw role value from Firestore `users/{uid}.role` */
    userRole: UserRole | null;
    /** Organization scope — single value for now, multi-tenant later */
    organizationId: string | null;
};
