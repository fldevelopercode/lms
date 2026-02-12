"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { auth } from "@/lib/firebase";
import { signOut } from "firebase/auth";
import { useRouter } from "next/navigation";

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [userProfile, setUserProfile] = useState(null);
  const router = useRouter();

  // ✅ Load user profile from sessionStorage & listen for updates
  useEffect(() => {
    const loadProfile = () => {
      const storedProfile = sessionStorage.getItem("userProfile");
      if (storedProfile) setUserProfile(JSON.parse(storedProfile));
    };

    // Initial load
    loadProfile();

    // Listen to storage events (cross-tab or after signup/login)
    window.addEventListener("storage", loadProfile);

    // Optional: same-tab updates using interval
    const interval = setInterval(loadProfile, 2000);

    return () => {
      window.removeEventListener("storage", loadProfile);
      clearInterval(interval);
    };
  }, []);

  const handleLogout = async () => {
    await signOut(auth);
    sessionStorage.removeItem("userProfile");
    setUserProfile(null);
    router.push("/login");
  };

  return (
    <>
      <nav className="bg-white shadow-md fixed w-full top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
          {/* Logo */}
          <Link href="/" className="text-2xl font-bold text-[#7607B3]">
            Futuristic Learning
          </Link>

          {/* Desktop Menu */}
          <div className="hidden md:flex space-x-8 font-medium items-center">
            <Link href="/" className="hover:text-[#D2640D]">Home</Link>
            <Link href="/course" className="hover:text-[#D2640D]">Courses</Link>
            <Link href="#" className="hover:text-[#D2640D]">Services</Link>
            <Link href="#" className="hover:text-[#D2640D]">Shop</Link>
            <Link href="#" className="hover:text-[#D2640D]">Gallery</Link>
            <Link href="#" className="hover:text-[#D2640D]">About Us</Link>

            {userProfile ? (
              <div className="relative">
                <button
                  onClick={() => setIsOpen(!isOpen)}
                  className="flex items-center space-x-2 bg-gray-100 p-2 rounded hover:bg-gray-200"
                >
                  <img
                    src={userProfile.profilePicture || "/default-avatar.png"}
                    alt="Profile"
                    className="w-8 h-8 rounded-full"
                  />
                  <span>{userProfile.firstName || userProfile.name || "User"}</span>
                </button>

                {/* Dropdown */}
                {isOpen && (
                  <div className="absolute right-0 mt-2 w-40 bg-white border rounded shadow-md z-50">
                    <Link
                      href="/dashboard"
                      className="block px-4 py-2 hover:bg-gray-100"
                      onClick={() => setIsOpen(false)}
                    >
                      Dashboard
                    </Link>
                    <Link
                      href="/settings"
                      className="block px-4 py-2 hover:bg-gray-100"
                      onClick={() => setIsOpen(false)}
                    >
                      Settings
                    </Link>
                    <button
                      onClick={handleLogout}
                      className="w-full text-left px-4 py-2 hover:bg-gray-100"
                    >
                      Logout
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <>
                <Link
                  href="/login"
                  className="ml-4 px-4 py-2 bg-[#7607B3] text-white rounded hover:bg-[#5a056f]"
                >
                  Login
                </Link>
                <Link
                  href="/signup"
                  className="ml-2 px-4 py-2 border border-[#7607B3] text-[#7607B3] rounded hover:bg-[#f3e6fa]"
                >
                  Signup
                </Link>
              </>
            )}
          </div>

          {/* Mobile Button */}
          <button
            className="md:hidden text-[#7607B3]"
            onClick={() => setIsOpen(!isOpen)}
          >
            ☰
          </button>
        </div>

        {/* Mobile Menu */}
        {isOpen && (
          <div className="md:hidden bg-white px-6 pb-4 space-y-4 font-medium">
            <Link href="/" className="block hover:text-[#D2640D]">Home</Link>
            <Link href="/course" className="block hover:text-[#D2640D]">Courses</Link>
            <Link href="#" className="block hover:text-[#D2640D]">Services</Link>
            <Link href="#" className="block hover:text-[#D2640D]">Shop</Link>
            <Link href="#" className="block hover:text-[#D2640D]">Gallery</Link>
            <Link href="#" className="block hover:text-[#D2640D]">About Us</Link>

            {userProfile ? (
              <>
                <Link
                  href="/dashboard"
                  className="block px-4 py-2 hover:bg-gray-100 rounded"
                  onClick={() => setIsOpen(false)}
                >
                  Dashboard
                </Link>
                <Link
                  href="/settings"
                  className="block px-4 py-2 hover:bg-gray-100 rounded"
                  onClick={() => setIsOpen(false)}
                >
                  Settings
                </Link>
                <button
                  onClick={handleLogout}
                  className="w-full text-left px-4 py-2 hover:bg-gray-100 rounded"
                >
                  Logout
                </button>
              </>
            ) : (
              <>
                <Link
                  href="/login"
                  className="block px-4 py-2 bg-[#7607B3] text-white rounded text-center hover:bg-[#5a056f]"
                >
                  Login
                </Link>
                <Link
                  href="/signup"
                  className="block px-4 py-2 border border-[#7607B3] text-[#7607B3] rounded text-center hover:bg-[#f3e6fa]"
                >
                  Signup
                </Link>
              </>
            )}
          </div>
        )}
      </nav>

      {/* ⚡ Spacer to prevent content hidden behind fixed navbar */}
      <div className="h-20" />
    </>
  );
}
