"use client";

import { useEffect, useState } from "react";
import { db, auth } from "@/lib/firebase";
import { collection, getDocs, doc, getDoc, setDoc, arrayUnion } from "firebase/firestore";
import { useRouter } from "next/navigation";
import { onAuthStateChanged, signOut } from "firebase/auth";

export default function Dashboard() {
  const router = useRouter();
  const [userProfile, setUserProfile] = useState(null); 
  const [courses, setCourses] = useState([]);

  // 1️⃣ Check login & fetch profile
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        const userDocRef = doc(db, "users", currentUser.uid);
        const userSnap = await getDoc(userDocRef);
        if (userSnap.exists()) {
          setUserProfile({ uid: currentUser.uid, ...userSnap.data() });
        } else {
          await setDoc(userDocRef, { email: currentUser.email, name: "", enrolledCourses: [], profilePicture: "" });
          setUserProfile({ uid: currentUser.uid, email: currentUser.email, name: "", enrolledCourses: [], profilePicture: "" });
        }
      } else {
        router.push("/login");
      }
    });
    return () => unsubscribe();
  }, [router]);

  // 2️⃣ Fetch courses
  useEffect(() => {
    const fetchCourses = async () => { 
      const querySnapshot = await getDocs(collection(db, "courses"));
      setCourses(querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    };
    fetchCourses();
  }, []);

  // 3️⃣ Watch sessionStorage for live profile updates
  useEffect(() => {
    const handleStorageChange = () => {
      const storedProfile = sessionStorage.getItem("userProfile");
      if (storedProfile) {
        setUserProfile(JSON.parse(storedProfile));
      }
    };
    window.addEventListener("storage", handleStorageChange);
    const interval = setInterval(handleStorageChange, 2000);
    return () => {
      window.removeEventListener("storage", handleStorageChange);
      clearInterval(interval);
    };
  }, []);

  const handleLogout = async () => {
    await signOut(auth);
    sessionStorage.removeItem("userProfile");
    router.push("/login");
  };

  const handleBuyCourse = async (courseId) => {
    if (!userProfile) return;
    try {
      const userRef = doc(db, "users", userProfile.uid);
      await setDoc(userRef, { enrolledCourses: arrayUnion(courseId) }, { merge: true });
      setUserProfile(prev => ({ ...prev, enrolledCourses: [...prev.enrolledCourses, courseId] }));
      sessionStorage.setItem("userProfile", JSON.stringify({
        ...userProfile,
        enrolledCourses: [...userProfile.enrolledCourses, courseId]
      }));
      alert("Course purchased successfully! 🎉");
    } catch (error) {
      console.error("Error enrolling in course:", error);
      alert("Something went wrong. Please try again.");
    }
  };

  const handleViewCourse = (courseId) => router.push(`/course/${courseId}`);

  if (!userProfile) return <p className="text-center mt-20">Loading...</p>;

  return (
    <div className="p-15 mt-0 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="flex flex-col md:flex-row items-center justify-between mb-10">
        <h1 className="text-3xl md:text-4xl font-bold text-[#7607B3]">
          Welcome, {userProfile.firstName || userProfile.name || userProfile.email}
        </h1>
        
      </div>

      {/* Courses Grid */}
      <h2 className="text-2xl font-semibold mb-6 text-[#7607B3]">Available Courses</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {courses.map(course => {
          const isEnrolled = userProfile.enrolledCourses.includes(course.id);
          return (
            <div
              key={course.id}
              className="flex flex-col md:flex-row bg-white rounded-xl shadow-md hover:shadow-xl transition overflow-hidden"
            >
              {/* Left: Course Image */}
              <div className="md:w-1/3 w-full h-48 md:h-auto">
                <img
                  src={course.image || "https://static.wixstatic.com/media/742122_164c45f3ee7048cdbd896adda94ec1a8~mv2.webp/v1/fill/w_271,h_190,al_c,q_80,usm_0.66_1.00_0.01,enc_avif,quality_auto/MS%20Thumbnail.webp"} // Add your image URL here
                  alt={course.title}
                  className="w-full h-full object-cover"
                />
              </div>

              {/* Right: Info & Button */}
              <div className="flex flex-col justify-between p-6 md:w-2/3">
                <div>
                  <h3 className="text-xl font-bold text-[#D2640D]">{course.title}</h3>
                  <p className="text-gray-700 mt-2">{course.description || "No description available."}</p>
                </div>
                <div className="mt-4 flex items-center justify-between">
                  <p className="font-bold text-lg text-gray-900">Price: {course.price || "$0.00"}</p>
                  <button
                    onClick={() => isEnrolled ? handleViewCourse(course.id) : handleBuyCourse(course.id)}
                    className={`px-5 py-2 rounded-full font-semibold text-white transition ${
                      isEnrolled ? "bg-green-500 hover:bg-green-700" : "bg-blue-500 hover:bg-blue-700"
                    }`}
                  >
                    {isEnrolled ? "View Course" : "Buy Course"}
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
