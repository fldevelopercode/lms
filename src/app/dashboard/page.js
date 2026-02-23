"use client";

import { useEffect, useState } from "react";
import { db, auth } from "@/lib/firebase";
import { collection, getDocs, doc, getDoc, setDoc, arrayUnion, query, where } from "firebase/firestore";
import { useRouter } from "next/navigation";
import { onAuthStateChanged, signOut } from "firebase/auth";
import Link from "next/link";

export default function Dashboard() {
  const router = useRouter();
  const [userProfile, setUserProfile] = useState(null); 
  const [courses, setCourses] = useState([]);
  const [certificates, setCertificates] = useState([]);
  const [loading, setLoading] = useState(true);

  // 1️⃣ Check login & fetch profile
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        const userDocRef = doc(db, "users", currentUser.uid);
        const userSnap = await getDoc(userDocRef);
        if (userSnap.exists()) {
          setUserProfile({ uid: currentUser.uid, ...userSnap.data() });
        } else {
          await setDoc(userDocRef, { 
            email: currentUser.email, 
            firstName: "",
            lastName: "",
            name: "", 
            enrolledCourses: [], 
            profilePicture: "" 
          });
          setUserProfile({ 
            uid: currentUser.uid, 
            email: currentUser.email, 
            firstName: "",
            lastName: "",
            name: "", 
            enrolledCourses: [], 
            profilePicture: "" 
          });
        }
        
        // 🔥 Store last user ID to detect new user
        const lastUserId = localStorage.getItem('lastUserId');
        if (lastUserId && lastUserId !== currentUser.uid) {
          console.log('🆕 New user detected, clearing old data...');
          const keys = Object.keys(localStorage);
          keys.forEach(key => {
            if (key.startsWith('completed-') && !key.includes(currentUser.uid)) {
              localStorage.removeItem(key);
            }
          });
        }
        localStorage.setItem('lastUserId', currentUser.uid);
        
        // Fetch certificates after user is loaded
        fetchCertificates(currentUser.uid);
      } else {
        router.push("/login");
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, [router]);

  // 🔥 Clear old course completion data on login
  useEffect(() => {
    if (!userProfile?.uid) return;
    
    const keys = Object.keys(localStorage);
    keys.forEach(key => {
      if (key.startsWith('completed-') && !key.includes(userProfile.uid)) {
        console.log("🧹 Removing old key:", key);
        localStorage.removeItem(key);
      }
    });
  }, [userProfile]);

  // 2️⃣ Fetch courses
  useEffect(() => {
    const fetchCourses = async () => { 
      const querySnapshot = await getDocs(collection(db, "courses"));
      setCourses(querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    };
    fetchCourses();
  }, []);

  // 3️⃣ Fetch certificates with query
  const fetchCertificates = async (userId) => {
    try {
      const certQuery = query(
        collection(db, "certificates"),
        where("userId", "==", userId)
      );
      const querySnapshot = await getDocs(certQuery);
      const userCerts = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setCertificates(userCerts);
    } catch (error) {
      console.error("Error fetching certificates:", error);
    }
  };

  // 4️⃣ Watch sessionStorage for live profile updates
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

  // 🔥 FIXED: Logout function
  const handleLogout = async () => {
    try {
      const userId = auth.currentUser?.uid;
      if (userId) {
        const keys = Object.keys(localStorage);
        keys.forEach(key => {
          if (key.includes(userId)) {
            localStorage.removeItem(key);
          }
        });
      }
      
      await signOut(auth);
      sessionStorage.removeItem("userProfile");
      router.push("/");
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  // 🔥 FIXED: handleBuyCourse - UI immediately update
  const handleBuyCourse = async (courseId) => {
    if (!userProfile) return;
    
    try {
      const userRef = doc(db, "users", userProfile.uid);
      await setDoc(userRef, { enrolledCourses: arrayUnion(courseId) }, { merge: true });
      
      // 🔥 FIX: Correctly update enrolledCourses array
      const updatedEnrolled = [...(userProfile.enrolledCourses || []), courseId];
      
      setUserProfile(prev => ({ 
        ...prev, 
        enrolledCourses: updatedEnrolled 
      }));
      
      // Update sessionStorage
      sessionStorage.setItem("userProfile", JSON.stringify({
        ...userProfile,
        enrolledCourses: updatedEnrolled
      }));
      
      alert("🎉 Course enrolled successfully!");
    } catch (error) {
      console.error("Error enrolling in course:", error);
      alert("Something went wrong. Please try again.");
    }
  };

  const handleViewCourse = (courseId) => router.push(`/course/${courseId}`);

  const getFullName = () => {
    if (userProfile?.firstName && userProfile?.lastName) {
      return `${userProfile.firstName} ${userProfile.lastName}`;
    }
    if (userProfile?.name) return userProfile.name;
    return userProfile?.email?.split('@')[0] || "Student";
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#7607B3] mx-auto mb-4"></div>
          <p className="text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (!userProfile) return <p className="text-center mt-20">Loading...</p>;

  return (
    <div className="p-6 md:p-10 bg-gray-50 min-h-screen">
      {/* Header with Logout */}
      <div className="flex flex-col md:flex-row items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-[#7607B3]">
            Welcome, {getFullName()}!
          </h1>
          <p className="text-gray-600 mt-1">{userProfile.email}</p>
        </div>
        
        <button
          onClick={handleLogout}
          className="mt-4 md:mt-0 px-5 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition flex items-center gap-2"
        >
          <span>🚪</span> Logout
        </button>
      </div>

      {/* Certificates Section */}
      {certificates.length > 0 && (
        <div className="mb-10">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-[#7607B3] flex items-center gap-2">
              <span>🎓</span> My Certificates
            </h2>
            <Link
              href="/certificates"
              className="text-sm text-[#D2640D] hover:underline font-medium"
            >
              View All ({certificates.length}) →
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {certificates.slice(0, 3).map((cert) => {
              const course = courses.find(c => c.id === cert.courseId);
              return (
                <div
                  key={cert.id}
                  className="bg-gradient-to-br from-purple-50 to-orange-50 rounded-lg p-4 border border-purple-200 shadow-sm hover:shadow-md transition cursor-pointer group"
                  onClick={() => router.push(`/certificate/${cert.id}`)}
                >
                  <div className="flex items-center gap-3">
                    <div className="text-3xl group-hover:scale-110 transition">🏆</div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-semibold text-[#7607B3] truncate">
                        {course?.title || cert.courseId || 'Course'}
                      </h4>
                      <p className="text-xs text-gray-600">
                        {new Date(cert.issuedAt).toLocaleDateString()}
                      </p>
                    </div>
                    <span className="text-green-600 text-sm">✓</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Courses Grid */}
      <div className="mb-6 flex items-center justify-between">
        <h2 className="text-xl font-semibold text-[#7607B3] flex items-center gap-2">
          <span>📚</span> Available Courses
        </h2>
        <p className="text-sm text-gray-600">
          Enrolled: {userProfile.enrolledCourses?.length || 0}/{courses.length}
        </p>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {courses.map(course => {
          const isEnrolled = userProfile.enrolledCourses?.includes(course.id);
          return (
            <div
              key={course.id}
              className="flex flex-col md:flex-row bg-white rounded-xl shadow-md hover:shadow-xl transition overflow-hidden"
            >
              {/* Course Image */}
              <div className="md:w-1/3 w-full h-48 md:h-auto bg-gray-200">
                <img
                  src={course.image || "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80"}
                  alt={course.title}
                  className="w-full h-full object-cover"
                />
              </div>

              {/* Course Info */}
              <div className="flex flex-col justify-between p-6 md:w-2/3">
                <div>
                  <h3 className="text-xl font-bold text-[#D2640D]">{course.title}</h3>
                  <p className="text-gray-600 mt-2 text-sm line-clamp-2">
                    {course.description || "No description available."}
                  </p>
                </div>
                
                <div className="mt-4 flex items-center justify-between">
                  <p className="font-bold text-lg text-gray-900">
                    {course.price || "Free"}
                  </p>
                  <button
                    onClick={() => isEnrolled ? handleViewCourse(course.id) : handleBuyCourse(course.id)}
                    className={`px-5 py-2 rounded-full font-semibold text-white transition transform hover:scale-105 ${
                      isEnrolled 
                        ? "bg-green-500 hover:bg-green-600" 
                        : "bg-[#7607B3] hover:bg-purple-800"
                    }`}
                  >
                    {isEnrolled ? "📖 View Course" : "✨ Enroll Now"}
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Empty State */}
      {courses.length === 0 && (
        <div className="text-center py-12 bg-white rounded-xl shadow">
          <p className="text-gray-500">No courses available yet.</p>
        </div>
      )}
    </div>
  );
}