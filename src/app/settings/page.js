"use client";

import { useEffect, useState } from "react";
import { db, auth } from "@/lib/firebase";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import { useRouter } from "next/navigation";

export default function SettingsPage() {
  const [userProfile, setUserProfile] = useState(null);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [country, setCountry] = useState("");
  const [profilePicture, setProfilePicture] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  // Fetch current user profile
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        const userDocRef = doc(db, "users", user.uid);
        const userSnap = await getDoc(userDocRef);
        if (userSnap.exists()) {
          const data = userSnap.data();
          setUserProfile({ uid: user.uid, ...data });
          setFirstName(data.firstName || "");
          setLastName(data.lastName || "");
          setPhone(data.phone || "");
          setAddress(data.address || "");
          setCity(data.city || "");
          setCountry(data.country || "");
          setProfilePicture(data.profilePicture || "");
        }
      } else {
        router.push("/login");
      }
    });
    return () => unsubscribe();
  }, [router]);

  const handleSave = async (e) => {
    e.preventDefault();
    if (!userProfile) return;

    setLoading(true);
    try {
      const userRef = doc(db, "users", userProfile.uid);
      await updateDoc(userRef, {
        firstName,
        lastName,
        phone,
        address,
        city,
        country,
        profilePicture
      });

      // Update local state immediately
      const updatedProfile = {
        ...userProfile,
        firstName,
        lastName,
        phone,
        address,
        city,
        country,
        profilePicture
      };
      setUserProfile(updatedProfile);

      // ✅ Update sessionStorage so Navbar / Dashboard reflect changes instantly
      sessionStorage.setItem("userProfile", JSON.stringify(updatedProfile));

      alert("Profile updated successfully! 🎉");
    } catch (error) {
      console.error("Error updating profile:", error);
      alert("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (!userProfile) return <p>Loading...</p>;

  return (
    <div className="p-8 max-w-lg mx-auto">
      <h1 className="text-2xl font-bold text-[#7607B3] mb-6">Profile Settings</h1>

      <form onSubmit={handleSave} className="space-y-4">
        <div>
          <label className="block font-medium mb-1">First Name</label>
          <input
            type="text"
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            className="w-full p-2 border rounded"
            required
          />
        </div>

        <div>
          <label className="block font-medium mb-1">Last Name</label>
          <input
            type="text"
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
            className="w-full p-2 border rounded"
            required
          />
        </div>

        <div>
          <label className="block font-medium mb-1">Phone</label>
          <input
            type="text"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className="w-full p-2 border rounded"
          />
        </div>

        <div>
          <label className="block font-medium mb-1">Address</label>
          <input
            type="text"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            className="w-full p-2 border rounded"
          />
        </div>

        <div>
          <label className="block font-medium mb-1">City</label>
          <input
            type="text"
            value={city}
            onChange={(e) => setCity(e.target.value)}
            className="w-full p-2 border rounded"
          />
        </div>

        <div>
          <label className="block font-medium mb-1">Country</label>
          <input
            type="text"
            value={country}
            onChange={(e) => setCountry(e.target.value)}
            className="w-full p-2 border rounded"
          />
        </div>

        <div>
          <label className="block font-medium mb-1">Profile Picture URL</label>
          <input
            type="text"
            value={profilePicture}
            onChange={(e) => setProfilePicture(e.target.value)}
            className="w-full p-2 border rounded"
            placeholder="https://example.com/avatar.jpg"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-[#7607B3] text-white p-2 rounded hover:bg-[#5a056f] disabled:opacity-50"
        >
          {loading ? "Saving..." : "Save Changes"}
        </button>
      </form>
    </div>
  );
}
