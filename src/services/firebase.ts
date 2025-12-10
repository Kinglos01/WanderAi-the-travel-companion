import { initializeApp } from "firebase/app";
import { 
  getAuth, 
  onAuthStateChanged, 
  GoogleAuthProvider, 
  signInWithPopup, 
  User as FirebaseUser,
  signOut
} from "firebase/auth";
import { 
  getFirestore, 
  collection, 
  addDoc, 
  query, 
  where, 
  getDocs,
  serverTimestamp,
  orderBy
} from "firebase/firestore";

import { Session, User, Trip } from "../types";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const provider = new GoogleAuthProvider();

export const handleSignIn = async () => {
  try {
    const result = await signInWithPopup(auth, provider);
    const user = result.user;
    console.log("User signed in: ", user);
  } catch (error) {
    console.error("Error during sign in: ", error);
  }
};

export const handleSignOut = async () => {
  try {
    await signOut(auth);
    console.log("User signed out");
  } catch (error) {
    console.error("Error signing out: ", error);
  }
}

export const onAuthStateChangedHelper = (callback: (user: User | null) => void) => {
  return onAuthStateChanged(auth, (user: FirebaseUser | null) => {
    if (user) {
      callback({
        uid: user.uid,
        displayName: user.displayName,
        email: user.email,
        photoURL: user.photoURL,
      });
    } else {
      callback(null);
    }
  });
};

export const saveSession = async (trip: Trip) => {
  const user = auth.currentUser;
  if (user) {
    try {
      const docRef = await addDoc(collection(db, "sessions"), {
        userId: user.uid,
        trip: trip,
        createdAt: serverTimestamp()
      });
      console.log("Session saved with ID: ", docRef.id);
    } catch (e) {
      console.error("Error saving session: ", e);
      throw new Error("Could not save the session. See console for details.");
    }
  } else {
    throw new Error("User not authenticated. Cannot save session.");
  }
};

export const getSessions = async (): Promise<Session[]> => {
  return new Promise((resolve, reject) => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        try {
          const q = query(
            collection(db, "sessions"),
            where("userId", "==", user.uid),
            orderBy("createdAt", "desc")
          );
          const querySnapshot = await getDocs(q);
          const sessions: Session[] = [];
          querySnapshot.forEach((doc) => {
            const data = doc.data();
            sessions.push({
              id: doc.id,
              userId: data.userId,
              trip: data.trip,
              createdAt: data.createdAt.toDate(),
            });
          });
          resolve(sessions);
        } catch (error) {
          console.error("Error fetching sessions:", error);
          reject(error);
        } finally {
          unsubscribe(); 
        }
      } else {
        console.log("No user is signed in to fetch sessions.");
        resolve([]); 
        unsubscribe();
      }
    });
  });
};
