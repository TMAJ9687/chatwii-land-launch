
import { 
  signInAnonymously, 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged,
  updateProfile,
  User as FirebaseUser
} from "firebase/auth";
import { doc, setDoc, getDoc, serverTimestamp } from "firebase/firestore";
import { auth, db } from "./client";

// Types
export type UserRole = 'standard' | 'vip' | 'admin' | 'bot';

export interface UserProfile {
  id: string;
  nickname: string;
  gender?: string;
  age?: number;
  country?: string;
  role: UserRole;
  avatar_url?: string;
  vip_status: boolean;
  visibility: 'online' | 'offline';
  created_at: any;
  updated_at: any;
}

// Sign in anonymously
export const signInAnonymousUser = async () => {
  const credentials = await signInAnonymously(auth);
  return credentials.user;
};

// Sign up with email and password
export const signUpWithEmail = async (email: string, password: string) => {
  const credentials = await createUserWithEmailAndPassword(auth, email, password);
  return credentials.user;
};

// Sign in with email and password
export const signInWithEmail = async (email: string, password: string) => {
  const credentials = await signInWithEmailAndPassword(auth, email, password);
  return credentials.user;
};

// Sign out
export const signOutUser = async () => {
  await signOut(auth);
};

// Get current user
export const getCurrentUser = (): FirebaseUser | null => {
  return auth.currentUser;
};

// Create or update user profile
export const createUserProfile = async (
  userId: string,
  profileData: Partial<UserProfile>
): Promise<UserProfile> => {
  const userRef = doc(db, "profiles", userId);
  const now = serverTimestamp();
  
  const profile: Partial<UserProfile> = {
    id: userId,
    role: profileData.role || 'standard',
    vip_status: profileData.vip_status || false,
    visibility: profileData.visibility || 'online',
    created_at: now,
    updated_at: now,
    ...profileData
  };

  await setDoc(userRef, profile, { merge: true });
  
  // Get the created profile with server timestamps
  const profileSnap = await getDoc(userRef);
  return { id: userId, ...profileSnap.data() } as UserProfile;
};

// Get user profile
export const getUserProfile = async (userId: string): Promise<UserProfile | null> => {
  const userRef = doc(db, "profiles", userId);
  const userSnap = await getDoc(userRef);
  
  if (userSnap.exists()) {
    return { id: userId, ...userSnap.data() } as UserProfile;
  }
  
  return null;
};

// Update current user display name and photo URL
export const updateUserDisplayInfo = async (displayName?: string, photoURL?: string) => {
  if (!auth.currentUser) {
    throw new Error("No authenticated user");
  }
  
  await updateProfile(auth.currentUser, {
    displayName: displayName || null,
    photoURL: photoURL || null
  });
};

// Listen for auth state changes
export const subscribeToAuthChanges = (
  callback: (user: FirebaseUser | null) => void
) => {
  return onAuthStateChanged(auth, callback);
};
