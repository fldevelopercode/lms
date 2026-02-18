"use client";

import { useEffect, useState } from "react";
import { db, auth } from "@/lib/firebase";
import { collection, getDocs, doc, getDoc, setDoc, arrayUnion } from "firebase/firestore";
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
            name: "", 
            enrolledCourses: [], 
            profilePicture: "" 
          });
          setUserProfile({ 
            uid: currentUser.uid, 
            email: currentUser.email, 
            name: "", 
            enrolledCourses: [], 
            profilePicture: "" 
          });
        }
        
        // Fetch certificates after user is loaded
        fetchCertificates(currentUser.uid);
      } else {
        router.push("/login");
      }
      setLoading(false);
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

  // 3️⃣ Fetch certificates
  const fetchCertificates = async (userId) => {
    try {
      const certQuery = await getDocs(collection(db, "certificates"));
      const userCerts = certQuery.docs
        .map(doc => ({ id: doc.id, ...doc.data() }))
        .filter(cert => cert.userId === userId);
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
      setUserProfile(prev => ({ 
        ...prev, 
        enrolledCourses: [...prev.enrolledCourses, courseId] 
      }));
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
        <h1 className="text-2xl md:text-3xl font-bold text-[#7607B3]">
          Welcome, {userProfile.firstName || userProfile.name || userProfile.email}
        </h1>
        
       
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
              className="text-sm text-[#D2640D] hover:underline"
            >
              View All →
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {certificates.slice(0, 3).map((cert) => {
              const course = courses.find(c => c.id === cert.courseId);
              return (
                <div
                  key={cert.id}
                  className="bg-gradient-to-br from-purple-50 to-orange-50 rounded-lg p-4 border border-purple-200 shadow-sm hover:shadow-md transition cursor-pointer"
                  onClick={() => router.push("/certificates")}
                >
                  <div className="flex items-center gap-3">
                    <div className="text-3xl">🏆</div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-semibold text-[#7607B3] truncate">
                        {course?.title || 'Course'}
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
      <h2 className="text-xl font-semibold mb-4 text-[#7607B3] flex items-center gap-2">
        <span>📚</span> Available Courses
      </h2>
      
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
                  src={course.image || "https://static.wixstatic.com/media/742122_164c45f3ee7048cdbd896adda94ec1a8~mv2.webp"}
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
                    className={`px-5 py-2 rounded-full font-semibold text-white transition ${
                      isEnrolled 
                        ? "bg-green-500 hover:bg-green-600" 
                        : "bg-[#7607B3] hover:bg-purple-800"
                    }`}
                  >
                    {isEnrolled ? "View Course" : "Enroll Now"}
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