import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyDKzcKHpqaQatUn2ylKRWdhleH-_S18oO8",
  authDomain: "curio-1d592.firebaseapp.com",
  projectId: "curio-1d592",
  storageBucket: "curio-1d592.firebasestorage.app",
  messagingSenderId: "438972140565",
  appId: "1:438972140565:web:1c72e680bf77bb9e56121c",
  measurementId: "G-R0HE03L61Q",
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export default app;
