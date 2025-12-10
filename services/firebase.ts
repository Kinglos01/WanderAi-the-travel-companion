import { initializeApp } from 'firebase/app';
import { 
  getAuth, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged,
  updateProfile,
  User as FirebaseUser 
} from 'firebase/auth';
import { 
  getFirestore, 
  collection, 
  addDoc, 
  query, 
  where, 
  getDocs, 
  orderBy 
} from 'firebase/firestore';
import { User, Session } from '../types';

// Firebase Configuration
const firebaseConfig = {
  apiKey: process.env.FIREBASE_API_KEY,
  authDomain: process.env.FIREBASE_AUTH_DOMAIN,
  projectId: process.env.FIREBASE_PROJECT_ID,
  storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.FIREBASE_APP_ID,
};

// Initialize
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);

// --- Auth Helpers ---

const mapUser = (user: FirebaseUser): User => ({
  uid: user.uid,
  email: user.email || '',
  displayName: user.displayName || user.email?.split('@')[0] || 'Traveler',
  createdAt: user.metadata.creationTime || new Date().toISOString()
});

export const subscribeToAuthChanges = (callback: (user: User | null) => void) => {
  return onAuthStateChanged(auth, (user) => {
    callback(user ? mapUser(user) : null);
  });
};

export const login = async (email: string, password?: string): Promise<User> => {
  if (!password) throw new Error("Password is required.");
  const credential = await signInWithEmailAndPassword(auth, email, password);
  return mapUser(credential.user);
};

export const register = async (email: string, password: string, name: string): Promise<User> => {
  const credential = await createUserWithEmailAndPassword(auth, email, password);
  if (auth.currentUser) {
    await updateProfile(auth.currentUser, { displayName: name });
  }
  return mapUser({ ...credential.user, displayName: name } as FirebaseUser);
};

export const logout = async (): Promise<void> => {
  await signOut(auth);
};

// --- Firestore Service (Auto-Connects User ID) ---

// Note: We omit 'id', 'userId', and 'createdAt' from the input because 
// we will generate them automatically here to ensure security consistency.
export const saveSession = async (
  sessionData: Omit<Session, 'id' | 'userId' | 'createdAt'>
): Promise<Session> => {
  try {
    const currentUser = auth.currentUser;
    if (!currentUser) throw new Error("User must be logged in to save session.");

    // STRICTLY binding the userId here prevents permission mismatches
    const fullSession = { 
      ...sessionData, 
      userId: currentUser.uid, 
      createdAt: new Date().toISOString() 
    };

    const sessionsRef = collection(db, 'sessions');
    
    console.log(`[Firestore] Saving session for verified user: ${currentUser.uid}`);
    const docRef = await addDoc(sessionsRef, fullSession);
    console.log(`[Firestore] Success! Document ID: ${docRef.id}`);
    
    return { ...fullSession, id: docRef.id };
  } catch (error: any) {
    console.error("Error saving session:", error);
    if (error.code === 'permission-denied') {
      console.error("PERMISSION DENIED: The database rejected the write. Ensure 'firestore.rules' are deployed.");
    }
    throw error;
  }
};

export const getSessions = async (): Promise<Session[]> => {
  try {
    const currentUser = auth.currentUser;
    if (!currentUser) {
      console.warn("getSessions called but no user is logged in.");
      return [];
    }
    
    console.log(`[Firestore] Querying sessions owned by: ${currentUser.uid}`);
    
    const sessionsRef = collection(db, 'sessions');
    
    // Query strictly for the current user
    const q = query(
      sessionsRef, 
      where("userId", "==", currentUser.uid),
      orderBy("createdAt", "desc")
    );
    
    const querySnapshot = await getDocs(q);
    const results = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as Session));
    
    console.log(`[Firestore] Loaded ${results.length} sessions.`);
    return results;

  } catch (error: any) {
    console.error("Error fetching sessions:", error);
    if (error.code === 'failed-precondition') {
      console.error("INDEX MISSING: Open the link above in the console to create the index.");
    }
    return [];
  }
};