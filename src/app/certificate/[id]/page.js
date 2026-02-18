// app/certificate/[id]/page.js
"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { auth, db } from "@/lib/firebase";
import { doc, getDoc } from "firebase/firestore";
import Link from "next/link";

export default function CertificatePreviewPage() {
  const router = useRouter();
  const { id } = useParams(); // Certificate ID
  const [certificate, setCertificate] = useState(null);
  const [courseDetails, setCourseDetails] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      setUser(user);
      if (!user) {
        router.push("/login");
      }
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const fetchCertificate = async () => {
      if (!id) return;
      
      try {
        // Fetch certificate
        const certDoc = await getDoc(doc(db, "certificates", id));
        if (certDoc.exists()) {
          const certData = { id: certDoc.id, ...certDoc.data() };
          setCertificate(certData);
          
          // 🔥 NEW: Fetch course details
          if (certData.courseId) {
            const courseDoc = await getDoc(doc(db, "courses", certData.courseId));
            if (courseDoc.exists()) {
              setCourseDetails(courseDoc.data());
            }
          }
          
          // 🔥 NEW: Fetch user profile for name
          if (certData.userId) {
            const userDoc = await getDoc(doc(db, "users", certData.userId));
            if (userDoc.exists()) {
              setUserProfile(userDoc.data());
            }
          }
        } else {
          console.error("Certificate not found");
        }
      } catch (error) {
        console.error("Error fetching certificate:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchCertificate();
  }, [id]);

  // 🔥 NEW: Get full name
  const getFullName = () => {
    if (userProfile?.firstName && userProfile?.lastName) {
      return `${userProfile.firstName} ${userProfile.lastName}`;
    } else if (user?.displayName) {
      return user.displayName;
    } else if (user?.email) {
      return user.email.split('@')[0];
    }
    return "Student";
  };

  const handleDownload = () => {
    if (certificate?.pdfUrl) {
      const link = document.createElement('a');
      link.href = certificate.pdfUrl;
      link.download = `Certificate-${courseDetails?.title || certificate.courseId || 'Course'}.pdf`;
      link.target = '_blank';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const handleCopyLink = () => {
    const url = window.location.href;
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'My Certificate',
          text: `Check out my certificate from ${courseDetails?.title || certificate?.courseId || 'Course'}`,
          url: window.location.href,
        });
      } catch (error) {
        console.log('Share cancelled:', error);
      }
    } else {
      handleCopyLink();
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#7607B3] mx-auto mb-4"></div>
          <p className="text-gray-600">Loading certificate...</p>
        </div>
      </div>
    );
  }

  if (!certificate) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center bg-white p-8 rounded-xl shadow-lg">
          <div className="text-6xl mb-4">😢</div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Certificate Not Found</h2>
          <p className="text-gray-600 mb-6">The certificate you're looking for doesn't exist.</p>
          <Link
            href="/certificates"
            className="px-6 py-2 bg-[#7607B3] text-white rounded-lg hover:bg-purple-800 transition"
          >
            Go to My Certificates
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-100 via-white to-orange-100">
      {/* Header */}
      <div className="bg-white shadow-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => router.back()}
                className="px-4 py-2 bg-[#7607B3] text-white rounded-lg hover:bg-purple-800 transition text-sm flex items-center gap-1"
              >
                <span>←</span> Back
              </button>
              <h1 className="text-2xl font-bold text-[#7607B3]">Certificate Preview</h1>
            </div>
         
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Certificate Container */}
        <div className="bg-white rounded-2xl shadow-2xl overflow-hidden border-8 border-white">
          {/* Certificate iframe */}
          <div className="aspect-[4/3] bg-gray-900">
            <iframe
              src={certificate.pdfUrl}
              className="w-full h-full border-0"
              title="Certificate Preview"
            />
          </div>

          {/* Certificate Details */}
          <div className="p-8 bg-gradient-to-r from-purple-50 to-orange-50">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Left Column - Added ALL required fields */}
              <div>
                <h2 className="text-xl font-bold text-[#7607B3] mb-4">Certificate Details</h2>
                <div className="space-y-3">
                  {/* 🔥 NEW: Student Name */}
                  <div className="flex items-start gap-3">
                    <span className="text-lg">👤</span>
                    <div>
                      <p className="text-sm text-gray-600">Student</p>
                      <p className="font-semibold text-gray-800">{getFullName()}</p>
                    </div>
                  </div>
                  
                  {/* 🔥 NEW: School */}
                  <div className="flex items-start gap-3">
                    <span className="text-lg">🏫</span>
                    <div>
                      <p className="text-sm text-gray-600">School</p>
                      <p className="font-semibold text-gray-800">Futuristic Learning</p>
                    </div>
                  </div>
                  
                  {/* 🔥 UPDATED: Course with actual name */}
                  <div className="flex items-start gap-3">
                    <span className="text-lg">🎓</span>
                    <div>
                      <p className="text-sm text-gray-600">Course</p>
                      <p className="font-semibold text-gray-800">{courseDetails?.title || certificate.courseId || 'Course Completion'}</p>
                    </div>
                  </div>
                  
                  {/* 🔥 Certificate ID */}
                  <div className="flex items-start gap-3">
                    <span className="text-lg">🔢</span>
                    <div>
                      <p className="text-sm text-gray-600">Certificate ID</p>
                      <p className="font-mono text-sm text-gray-800 break-all">{certificate.certificateId}</p>
                    </div>
                  </div>
                  
               {/* 🔥 Issued Date - Fixed DD-MM-YYYY */}
<div className="flex items-start gap-3">
  <span className="text-lg">📅</span>
  <div>
    <p className="text-sm text-gray-600">Issued</p>
    <p className="font-semibold text-gray-800">
      {new Date(certificate.issuedAt).toLocaleDateString('en-GB', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      }).replace(/\//g, '-')}
    </p>
  </div>
</div>
                  
                  {/* 🔥 NEW: Expiry */}
                  <div className="flex items-start gap-3">
                    <span className="text-lg">⏳</span>
                    <div>
                      <p className="text-sm text-gray-600">Expires</p>
                      <p className="font-semibold text-gray-800">No expiry date</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Column - Verification (unchanged) */}
              <div>
                <h2 className="text-xl font-bold text-[#7607B3] mb-4">Verification</h2>
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <span className="text-green-500 text-lg">✓</span>
                    <span className="text-gray-700">This certificate is authentic</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-green-500 text-lg">✓</span>
                    <span className="text-gray-700">Issued by LMS Demo</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-blue-500 text-lg">🔒</span>
                    <span className="text-gray-700">Verified on blockchain</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Action Buttons (unchanged) */}
            <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center">
              <button
                onClick={handleDownload}
                className="px-8 py-4 bg-gradient-to-r from-[#7607B3] to-[#D2640D] text-white rounded-xl font-semibold hover:opacity-90 transition transform hover:scale-105 flex items-center justify-center gap-2"
              >
                <span className="text-xl">📥</span>
                Download Certificate
              </button>
              <button
                onClick={handleCopyLink}
                className="px-8 py-4 bg-white border-2 border-[#7607B3] text-[#7607B3] rounded-xl font-semibold hover:bg-purple-50 transition transform hover:scale-105 flex items-center justify-center gap-2"
              >
                <span className="text-xl">🔗</span>
                {copied ? 'Copied!' : 'Copy Link'}
              </button>
            </div>

            {/* Social Share (unchanged) */}
            <div className="mt-6 flex justify-center gap-4">
              <a
                href={`https://twitter.com/intent/tweet?text=I just earned my certificate from ${courseDetails?.title || certificate.courseId}!&url=${encodeURIComponent(window.location.href)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 bg-[#1DA1F2] text-white rounded-full flex items-center justify-center hover:opacity-90 transition"
              >
                𝕏
              </a>
              <a
                href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(window.location.href)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 bg-[#0077B5] text-white rounded-full flex items-center justify-center hover:opacity-90 transition"
              >
                in
              </a>
              <a
                href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(window.location.href)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 bg-[#4267B2] text-white rounded-full flex items-center justify-center hover:opacity-90 transition"
              >
                f
              </a>
            </div>

            {/* Note (unchanged) */}
            <div className="mt-8 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <p className="text-sm text-gray-600 text-center">
                Please note: This certificate indicates your personal development in the subject matter and does not qualify you to train others. It's a proud emblem of your commitment to self-improvement and continuous learning.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}