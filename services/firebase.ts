import { initializeApp } from 'firebase/app';
import { getAnalytics } from "firebase/analytics";
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
  apiKey: "AIzaSyBiyKaJoR1zciPuikGn6vZN4CbCkDBBzdU",
  authDomain: "wanderai-6477f.firebaseapp.com",
  projectId: "wanderai-6477f",
  storageBucket: "wanderai-6477f.firebasestorage.app",
  messagingSenderId: "285344264352",
  appId: "1:285344264352:web:2dff473e9a0568fb6219c5",
  measurementId: "G-L6TDPTC7QJ"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
// Initialize Analytics (optional, but good practice since provided in config)
const analytics = getAnalytics(app);

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
