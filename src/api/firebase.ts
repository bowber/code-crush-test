// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, signInWithPopup } from "firebase/auth";
import {
  collection,
  doc,
  getDoc,
  getFirestore,
  onSnapshot,
  setDoc,
} from "firebase/firestore";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyCPpjIi6jSzshh4RsHYBGOMvdnhIR2p-wE",
  authDomain: "code-crush-test-3784f.firebaseapp.com",
  projectId: "code-crush-test-3784f",
  storageBucket: "code-crush-test-3784f.firebasestorage.app",
  messagingSenderId: "571409560541",
  appId: "1:571409560541:web:2adccd4b030873e2913c34",
  measurementId: "G-EY25PGSX36",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const firestore = getFirestore(app);
const auth = getAuth(app);

export const updateHighScore = async (score: number) => {
  await auth.authStateReady();
  const user = auth.currentUser;
  if (!user) {
    throw new Error("User not authenticated");
  }
  const userDoc = await getDoc(doc(firestore, "scores", user.uid));
  if (userDoc.exists() && userDoc.data().highScore >= score) {
    console.log("Current score is not higher than the existing high score.");
    return;
  }
  await setDoc(doc(firestore, "scores", user.uid), {
    highScore: score,
    userId: user.uid,
    userName: user.displayName || "Anonymous",
  });
};

export interface Score {
  highScore: number;
  userId: string;
  userName: string;
}

export const subscribeTopScores = async (callback: (docs: Score[]) => void) => {
  const unsub = onSnapshot(collection(firestore, "scores"), (docs) => {
    console.log(
      "Current data: ",
      docs.docs.map((doc) => doc.data())
    );
    // This is not an efficient way to get top scores, but works for small datasets
    callback(docs.docs.map((doc) => doc.data() as Score));
  });
  return unsub;
};

export const signin = async () => {
  return signInWithPopup(auth, new GoogleAuthProvider());
};

export const isSignedIn = async () => {
  await auth.authStateReady();
  return auth.currentUser !== null;
};
