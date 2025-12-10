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

// Firebase Configuration from Environment Variables
const firebaseConfig = {
  apiKey: process.env.FIREBASE_API_KEY,
  authDomain: process.env.FIREBASE_AUTH_DOMAIN,
  projectId: process.env.FIREBASE_PROJECT_ID,
  storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.FIREBASE_APP_ID,
};

// Debugging check
if (!firebaseConfig.apiKey) {
  console.error("Firebase Config is missing! Please check your .env file.");
} else {
  console.log(`[Firebase] Initializing connection to project: ${firebaseConfig.projectId}`);
}

// Initialize Firebase
const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);

// Helper to map Firebase User to our User type
const mapUser = (user: FirebaseUser): User => ({
  uid: user.uid,
  email: user.email || '',
  displayName: user.displayName || user.email?.split('@')[0] || 'Traveler',
  createdAt: user.metadata.creationTime || new Date().toISOString()
});

// Authentication Service
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

// Firestore Service
export const saveSession = async (session: Omit<Session, 'id'>): Promise<Session> => {
  try {
    // Validation
    const currentUser = auth.currentUser;
    if (!currentUser) throw new Error("User must be logged in to save session.");
    
    // Security Debugging
    if (session.userId !== currentUser.uid) {
      console.error(`[Security Mismatch] Session UserID: ${session.userId} vs Auth UID: ${currentUser.uid}`);
      throw new Error("Security check failed: User ID mismatch.");
    }

    const sessionsRef = collection(db, 'sessions');
    const sessionData = { 
      ...session, 
      createdAt: new Date().toISOString() 
    };
    
    console.log(`[Firestore] Saving session for user: ${currentUser.uid}`);
    const docRef = await addDoc(sessionsRef, sessionData);
    console.log(`[Firestore] Session saved with ID: ${docRef.id}`);
    
    return { ...sessionData, id: docRef.id };
  } catch (error: any) {
    console.error("Error saving session:", error);
    if (error.code === 'permission-denied') {
      console.error("Firestore Permission Denied (Write). Please check: 1) firestore.rules is deployed. 2) You are logged in. 3) The 'userId' field matches your Auth UID.");
    }
    throw error;
  }
};

export const getSessions = async (userId: string): Promise<Session[]> => {
  try {
    const currentUser = auth.currentUser;
    
    // Log intent
    console.log(`[Firestore] Fetching sessions for userId: ${userId}`);
    
    const sessionsRef = collection(db, 'sessions');
    
    // Note: This query requires an Index (userId ASC, createdAt DESC)
    const q = query(
      sessionsRef, 
      where("userId", "==", userId),
      orderBy("createdAt", "desc")
    );
    
    const querySnapshot = await getDocs(q);
    const results = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as Session));
    
    console.log(`[Firestore] Found ${results.length} sessions.`);
    return results;

  } catch (error: any) {
    console.error("Error fetching sessions:", error);
    
    if (error.code === 'permission-denied') {
      console.error("Firestore Permission Denied (Read): Check firestore.rules or ensure query matches 'allow read' conditions.");
    } else if (error.code === 'failed-precondition') {
      console.error("Firestore Index Missing: Check the console for a link to create the index, or deploy firestore.indexes.json.");
    }
    
    return [];
  }
};