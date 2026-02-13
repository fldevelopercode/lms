import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getAnalytics, isSupported } from "firebase/analytics";

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

export const auth = getAuth(app);
export const db = getFirestore(app);

let analytics = null;

// ✅ Analytics sirf client side pe chalega
if (typeof window !== "undefined") {
  isSupported().then((yes) => {
    if (yes) {
      analytics = getAnalytics(app);
    }
  });
}

export { analytics };
