import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";  // 🔹 Import Firestore

const firebaseConfig = {
  apiKey: "AIzaSyCsfDHk8tlOK6r1OPt14kBLR4OEvCXwK4w",
  authDomain: "fl-lmsdemo.firebaseapp.com",
  projectId: "fl-lmsdemo",
  storageBucket: "fl-lmsdemo.firebasestorage.app",
  messagingSenderId: "501356494212",
  appId: "1:501356494212:web:a9063848306a37633331d1",
  measurementId: "G-5MZF1RDS6P"
};

const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);

export const auth = getAuth(app);
export const db = getFirestore(app);  // 🔹 Export Firestore
