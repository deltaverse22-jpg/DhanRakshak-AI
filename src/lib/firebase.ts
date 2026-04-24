// --- MOCK AUTH SYSTEM (Pure Mock, Firebase removed) ---
export interface User {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  emailVerified: boolean;
  isAnonymous: boolean;
  providerData: any[];
}

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
  isDemo: true,
  emailVerified: true,
  isAnonymous: false,
  providerData: []
};

let mockUserListener: ((user: User | null) => void) | null = null;
let currentMockUser: User | null = MOCK_USER as User;

// Mock Auth Instance
export const auth = {
  currentUser: currentMockUser
};

// Mock Firestore Instance
export const db = {} as any;

export const onAuthStateChanged = (authInstance: any, callback: (user: User | null) => void) => {
  mockUserListener = callback;
  
  // Set initial state
  setTimeout(() => {
    callback(currentMockUser);
  }, 100);

  return () => {
    mockUserListener = null;
  };
};

export const signInWithMock = () => {
  currentMockUser = MOCK_USER as User;
  auth.currentUser = currentMockUser;
  if (mockUserListener) {
    mockUserListener(currentMockUser);
  }
};

export const logout = () => {
  currentMockUser = null;
  auth.currentUser = null;
  if (mockUserListener) mockUserListener(null);
  return Promise.resolve();
};

export const signInWithGoogle = async () => {
  // In pure mock mode, Google sign-in also uses the mock user
  signInWithMock();
  return { user: currentMockUser };
};

export const ensureUserProfile = async (user: User) => {
  // No-op in mock mode
  return Promise.resolve();
};

export interface FirestoreErrorInfo {
  error: string;
  operationType: 'create' | 'update' | 'delete' | 'list' | 'get' | 'write';
  path: string | null;
  authInfo: any;
}

export function handleFirestoreError(error: any, operationType: FirestoreErrorInfo['operationType'], path: string | null = null): never {
  throw new Error(`Mock Firestore Error: ${error.message || 'Unknown error'}`);
}
