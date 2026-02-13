import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyCsfDHk8tlOK6r1OPt14kBLR4OEvCXwK4w",
  authDomain: "fl-lmsdemo.firebaseapp.com",
  projectId: "fl-lmsdemo",
  storageBucket: "fl-lmsdemo.firebasestorage.app",
  messagingSenderId: "501356494212",
  appId: "1:501356494212:web:a9063848306a37633331d1",
  measurementId: "G-5MZF1RDS6P"
};

// Initialize Firebase app
const app = initializeApp(firebaseConfig);

// Auth and Firestore safe for server & client
export const auth = getAuth(app);
export const db = getFirestore(app);

// ✅ Analytics client-side only
let analytics = null;

export const initAnalytics = async () => {
  if (typeof window === "undefined") return; // server safe
  if (analytics) return analytics; // already initialized

  // dynamic import ensures server-side safety
  const { getAnalytics, isSupported } = await import("firebase/analytics");
  if (await isSupported()) {
    analytics = getAnalytics(app);
  }
  return analytics;
};

export { analytics, app };
