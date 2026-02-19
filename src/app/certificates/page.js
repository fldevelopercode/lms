// app/certificates/page.js
"use client";

import { useEffect, useState } from "react";
import { auth, db } from "@/lib/firebase";
import { collection, query, where, getDocs, orderBy } from "firebase/firestore";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function CertificatesPage() {
  const router = useRouter();
  const [certificates, setCertificates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (user) {
        setUser(user);
        fetchCertificates(user.uid);
      } else {
        router.push("/login");
      }
    });
    return () => unsubscribe();
  }, []);

  const fetchCertificates = async (userId) => {
    setLoading(true);
    
    try {
      const q = query(
        collection(db, "certificates"),
        where("userId", "==", userId)
      );
      
      const querySnapshot = await getDocs(q);
      
      const certs = [];
      querySnapshot.forEach((doc) => {
        certs.push({ id: doc.id, ...doc.data() });
      });
      
      // Sort manually by date
      certs.sort((a, b) => new Date(b.issuedAt) - new Date(a.issuedAt));
      
      setCertificates(certs);
      
    } catch (error) {
      console.error("Error fetching certificates:", error);
      
      // Fallback query if index error
      if (error.message.includes("index")) {
        try {
          const simpleQuery = query(
            collection(db, "certificates"),
            where("userId", "==", userId)
          );
          const simpleSnapshot = await getDocs(simpleQuery);
          const simpleCerts = [];
          simpleSnapshot.forEach((doc) => {
            simpleCerts.push({ id: doc.id, ...doc.data() });
          });
          simpleCerts.sort((a, b) => new Date(b.issuedAt) - new Date(a.issuedAt));
          setCertificates(simpleCerts);
        } catch (secondError) {
          console.error("Second attempt failed:", secondError);
        }
      }
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  // 🔥 NEW: Navigate to dedicated preview page
  const handleViewCertificate = (certId) => {
    router.push(`/certificate/${certId}`);
  };

  const handleDownload = (cert) => {
    const link = document.createElement('a');
    link.href = cert.pdfUrl;
    link.download = `Certificate-${cert.courseId || 'Course'}.pdf`;
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#7607B3] mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your certificates...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <div className="bg-white shadow-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => router.push("/dashboard")}
                className="px-4 py-2 bg-[#7607B3] text-white rounded-lg hover:bg-purple-800 transition text-sm flex items-center gap-1"
              >
                <span>←</span> Dashboard
              </button>
              <h1 className="text-2xl font-bold text-[#7607B3]">My Certificates</h1>
            </div>
           
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {certificates.length === 0 ? (
          <div className="bg-white rounded-xl shadow-lg p-12 text-center">
            <div className="text-8xl mb-6">🎓</div>
            <h2 className="text-2xl font-semibold text-gray-800 mb-3">
              No Certificates Yet
            </h2>
            <p className="text-gray-600 mb-8 max-w-md mx-auto">
              Complete courses to earn certificates. Each completed course will automatically generate a certificate.
            </p>
            <Link
              href="/dashboard"
              className="inline-block px-6 py-3 bg-gradient-to-r from-[#7607B3] to-[#D2640D] text-white rounded-lg font-medium hover:opacity-90 transition"
            >
              Browse Courses
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {certificates.map((cert) => (
              <div
                key={cert.id}
                className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition transform hover:-translate-y-1"
              >
                {/* 🔥 FIXED: Certificate Card - Click to dedicated page */}
                <div 
                  className="aspect-[4/3] bg-gradient-to-br from-purple-100 to-orange-100 p-6 relative cursor-pointer group"
                  onClick={() => handleViewCertificate(cert.id)}
                >
                  <div className="h-full flex flex-col items-center justify-center text-center">
                    <div className="text-6xl mb-3 group-hover:scale-110 transition">🏆</div>
                    <h3 className="font-bold text-[#7607B3] mb-1">Certificate of Completion</h3>
                    <p className="text-xs text-gray-600 mb-2">Course: {cert.courseId || 'N/A'}</p>
                    <p className="text-xs text-gray-500">Issued: {formatDate(cert.issuedAt)}</p>
                  </div>
                  
                  {/* Hover overlay */}
                  <div className="absolute inset-0 bg-black/5 opacity-0 group-hover:opacity-100 transition flex items-center justify-center">
                    <span className="bg-white/90 text-[#7607B3] px-4 py-2 rounded-full text-sm font-medium shadow-lg">
                      Click to view
                    </span>
                  </div>
                </div>

                {/* Card Footer - Buttons */}
                <div className="p-4 bg-gray-50">
                  <div className="flex gap-2">
                    {/* 🔥 FIXED: View Details button */}
                    <button
                      onClick={() => handleViewCertificate(cert.id)}
                      className="flex-1 px-3 py-2 bg-[#7607B3] text-white rounded-lg hover:bg-purple-800 transition text-sm text-center flex items-center justify-center gap-1"
                    >
                      <span>👁️</span> View Details
                    </button>
                    <button
                      onClick={() => handleDownload(cert)}
                      className="flex-1 px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition text-sm text-center flex items-center justify-center gap-1"
                    >
                      <span>⬇️</span> PDF
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}