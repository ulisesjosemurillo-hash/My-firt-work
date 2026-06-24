import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, signInWithPopup, signInWithRedirect, signOut } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import firebaseConfig from "../firebase-applet-config.json";

// Initialize Firebase App
const app = initializeApp(firebaseConfig);

// Initialize services
export const db = getFirestore(app, (firebaseConfig as any).firestoreDatabaseId); /* CRITICAL: The app will break without this line */
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

// Standard Login trigger
export const loginWithGoogle = async () => {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    return result.user;
  } catch (error) {
    console.error("Error during authentication with Google:", error);
    throw error;
  }
};

// Redirect Login trigger (for iframes / sandboxes)
export const loginWithGoogleRedirect = async () => {
  try {
    await signInWithRedirect(auth, googleProvider);
  } catch (error) {
    console.error("Error during authentication with Google Redirect:", error);
    throw error;
  }
};

// Logout trigger
export const logoutFromApp = async () => {
  try {
    await signOut(auth);
  } catch (error) {
    console.error("Error signing out:", error);
    throw error;
  }
};

// Firestore Error handler complying with FirestoreErrorInfo
export enum OperationType {
  CREATE = "create",
  UPDATE = "update",
  DELETE = "delete",
  LIST = "list",
  GET = "get",
  WRITE = "write",
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid || null,
      email: auth.currentUser?.email || null,
      emailVerified: auth.currentUser?.emailVerified || null,
      isAnonymous: auth.currentUser?.isAnonymous || null,
      tenantId: auth.currentUser?.tenantId || null,
      providerInfo: auth.currentUser?.providerData?.map((provider) => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || [],
    },
    operationType,
    path,
  };
  console.error("Firestore Error: ", JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

import { doc, setDoc, getDoc } from "firebase/firestore";

export const saveAgendaToFirestore = async (agendaData: any) => {
    if (!auth.currentUser) return;
    const uid = auth.currentUser.uid;
    const docRef = doc(db, "users", uid);
    try {
        await setDoc(docRef, { agendaData }, { merge: true });
    } catch (error) {
        if (error instanceof Error && error.message.includes("offline")) {
            console.warn("Firestore save failed (offline).");
            return;
        }
        handleFirestoreError(error, OperationType.UPDATE, `users/${uid}`);
    }
};

export const loadAgendaFromFirestore = async () => {
    if (!auth.currentUser) return {};
    const uid = auth.currentUser.uid;
    const docRef = doc(db, "users", uid);
    try {
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
            return docSnap.data().agendaData || {};
        }
        return {};
    } catch (error) {
        if (error instanceof Error && error.message.includes("offline")) {
            console.warn("Firestore load failed (offline).");
            return {};
        }
        try {
           handleFirestoreError(error, OperationType.GET, `users/${uid}`);
        } catch (e) {
           console.error(e);
        }
        return {};
    }
};

// Expose them to window objects for index.html to access
(window as any).saveAgendaToFirestore = saveAgendaToFirestore;
(window as any).loadAgendaFromFirestore = loadAgendaFromFirestore;
