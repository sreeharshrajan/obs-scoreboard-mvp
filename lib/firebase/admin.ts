import { initializeApp, getApps, cert, getApp, ServiceAccount } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { getAuth } from "firebase-admin/auth";

const serviceAccount = {
  project_id: process.env.FIREBASE_ADMIN_PROJECT_ID!,
  client_email: process.env.FIREBASE_ADMIN_CLIENT_EMAIL!,
  private_key: process.env.FIREBASE_ADMIN_PRIVATE_KEY!.replace(/\\n/g, "\n"),
} as unknown as ServiceAccount;

const app =
  getApps().length === 0
    ? initializeApp({ credential: cert(serviceAccount) })
    : getApp();

export const adminDb = getFirestore(app);
export const adminAuth = getAuth(app);
