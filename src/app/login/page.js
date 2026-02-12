"use client";

import { useState } from "react";
import { auth, db } from "@/lib/firebase";
import { signInWithEmailAndPassword } from "firebase/auth";
import { useRouter } from "next/navigation";
import { doc, getDoc } from "firebase/firestore";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      // 1️⃣ Sign in with Firebase Auth
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // 2️⃣ Fetch full profile from Firestore
      const userDocRef = doc(db, "users", user.uid);
      const userSnap = await getDoc(userDocRef);

      if (userSnap.exists()) {
        const userData = userSnap.data();

        // 3️⃣ Store profile in sessionStorage (for Navbar/Dashboard use)
        sessionStorage.setItem(
          "userProfile",
          JSON.stringify({
            uid: user.uid,
            email: userData.email,
            name: userData.name || "",
            firstName: userData.firstName || "",
            lastName: userData.lastName || "",
            phone: userData.phone || "",
            address: userData.address || "",
            city: userData.city || "",
            country: userData.country || "",
            profilePicture: userData.profilePicture || "",
            enrolledCourses: userData.enrolledCourses || []
          })
        );
      }

      // 4️⃣ Redirect to Dashboard
      router.push("/dashboard");
    } catch (err) {
      console.error("Login error:", err);
      setError(err.message || "Something went wrong!");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex justify-center items-center min-h-screen bg-gray-50">
      <form
        onSubmit={handleLogin}
        className="bg-white p-8 rounded shadow-md w-full max-w-md space-y-4"
      >
        <h2 className="text-2xl font-bold text-center text-[#7607B3]">Login</h2>
        {error && <p className="text-red-500">{error}</p>}

        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full p-2 border rounded"
          required
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full p-2 border rounded"
          required
        />

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-[#7607B3] text-white p-2 rounded hover:bg-[#5a056f] disabled:opacity-50"
        >
          {loading ? "Logging in..." : "Login"}
        </button>
      </form>
    </div>
  );
}
