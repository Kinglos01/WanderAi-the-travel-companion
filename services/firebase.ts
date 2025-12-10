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
  const sessionsRef = collection(db, 'sessions');
  const sessionData = { 
    ...session, 
    createdAt: new Date().toISOString() 
  };
  
  const docRef = await addDoc(sessionsRef, sessionData);
  return { ...sessionData, id: docRef.id };
};

export const getSessions = async (userId: string): Promise<Session[]> => {
  try {
    const sessionsRef = collection(db, 'sessions');
    const q = query(
      sessionsRef, 
      where("userId", "==", userId),
      orderBy("createdAt", "desc")
    );
    
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as Session));
  } catch (error) {
    console.error("Error fetching sessions:", error);
    return [];
  }
};