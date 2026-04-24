import { initializeApp, getApp, getApps } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut, User, onAuthStateChanged as firebaseOnAuthStateChanged } from 'firebase/auth';
import { getFirestore, doc, getDocFromServer, setDoc, serverTimestamp } from 'firebase/firestore';
import firebaseConfig from '../config/firebase-config.json';

// --- MOCK AUTH SYSTEM ---
export interface MockUser extends Partial<User> {
  uid: string;
  email: string;
  displayName: string;
  photoURL: string;
  isDemo?: boolean;
}

const MOCK_USER: MockUser = {
  uid: 'dhan-guardian-node-001',
  email: 'guardian@dhanrakshak.ai',
  displayName: 'Guardian_Sentinel',
  photoURL: 'https://lh3.googleusercontent.com/d/1aRuPE1caAF55hSyaB479McO6dpk80NJ9',
  isDemo: true
};

let mockUserListener: ((user: User | null) => void) | null = null;
let currentMockUser: User | null = null;

// Initialize Firebase defensively
let app;
try {
  if (!getApps().length) {
    app = initializeApp(firebaseConfig);
  } else {
    app = getApp();
  }
} catch (e) {
  console.warn("Firebase: Initialization failed. Entering Autonomous Demo Mode.", e);
}

export const auth = app ? getAuth(app) : ({} as any);
export const db = (app && firebaseConfig.projectId) ? getFirestore(app, firebaseConfig.firestoreDatabaseId) : ({} as any);
export const googleProvider = new GoogleAuthProvider();

// Custom Auth Listener that combines Firebase + Mock
export const onAuthStateChanged = (authInstance: any, callback: (user: User | null) => void) => {
  mockUserListener = callback;
  
  // Also listen to real firebase if it exists
  const unsub = firebaseOnAuthStateChanged(authInstance, (user) => {
    if (!currentMockUser) {
      callback(user);
    }
  });

  return () => {
    unsub();
    mockUserListener = null;
  };
};

export const signInWithMock = () => {
  currentMockUser = MOCK_USER as User;
  if (mockUserListener) {
    mockUserListener(currentMockUser);
  }
};

// --- Firestore Error Handling ---
export interface FirestoreErrorInfo {
  error: string;
  operationType: 'create' | 'update' | 'delete' | 'list' | 'get' | 'write';
  path: string | null;
  authInfo: {
    userId: string;
    email: string;
    emailVerified: boolean;
    isAnonymous: boolean;
    providerInfo: { providerId: string; displayName: string; email: string; }[];
  }
}

export function handleFirestoreError(error: any, operationType: FirestoreErrorInfo['operationType'], path: string | null = null): never {
  const user = auth.currentUser;
  const errorInfo: FirestoreErrorInfo = {
    error: error.message || 'Unknown Firestore error',
    operationType,
    path,
    authInfo: {
      userId: user?.uid || 'anonymous',
      email: user?.email || 'none',
      emailVerified: user?.emailVerified || false,
      isAnonymous: user?.isAnonymous || true,
      providerInfo: user?.providerData.map(p => ({
        providerId: p.providerId,
        displayName: p.displayName || '',
        email: p.email || ''
      })) || []
    }
  };
  throw new Error(JSON.stringify(errorInfo));
}

// Connection test
async function testConnection() {
  try {
    console.log("Firebase: Testing connection...");
    await getDocFromServer(doc(db, 'test', 'connection'));
    console.log("Firebase: Connection established.");
  } catch (error: any) {
    if (error.message?.includes('the client is offline')) {
      console.warn("Firebase: Client is offline. Check net connection.");
    } else {
      console.error("Firebase: Connection test failed:", error);
    }
  }
}
testConnection();

export const ensureUserProfile = async (user: User) => {
  try {
    const userRef = doc(db, 'users', user.uid);
    await setDoc(userRef, {
      uid: user.uid,
      email: user.email,
      displayName: user.displayName,
      photoURL: user.photoURL,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    }, { merge: true });
  } catch (error) {
    handleFirestoreError(error, 'write', `users/${user.uid}`);
  }
};

export const signInWithGoogle = async () => {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    if (result.user) {
      await ensureUserProfile(result.user);
    }
    return result;
  } catch (error) {
    console.error("Firebase: Google Sign-In Error:", error);
    throw error;
  }
};
export const logout = () => {
  currentMockUser = null;
  if (mockUserListener) mockUserListener(null);
  return signOut(auth);
};
