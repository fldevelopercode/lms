// app/course/[id]/page.js
"use client";

import { useEffect, useState, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { db, auth } from "@/lib/firebase";
import { collection, doc, getDoc, getDocs } from "firebase/firestore";
import dynamic from "next/dynamic";
import { generateCertificatePDF } from "@/lib/generateCertificate";
import { saveCertificate, hasCertificate } from "@/lib/firebaseCertificates";

const VideoPlayer = dynamic(() => import("@/components/VideoPlayer"), {
  ssr: false,
  loading: () => (
    <div className="w-full aspect-video bg-gray-900 animate-pulse rounded-lg flex items-center justify-center text-white">
      Loading Player...
    </div>
  ),
});

export default function CoursePage() {
  const router = useRouter();
  const { id: courseId } = useParams();
  const [items, setItems] = useState([]);
  const [currentItem, setCurrentItem] = useState(null);
  const [completedItems, setCompletedItems] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [playerLoading, setPlayerLoading] = useState(true);
  const [courseData, setCourseData] = useState(null);
  const [user, setUser] = useState(null);
  const [showCertificate, setShowCertificate] = useState(false);
  const [certificateUrl, setCertificateUrl] = useState(null);
  const [generatingCert, setGeneratingCert] = useState(false);
  const [allItemsCompleted, setAllItemsCompleted] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [certificateGenerated, setCertificateGenerated] = useState(false);
  const [certificatePdfBlob, setCertificatePdfBlob] = useState(null);
  const playlistRef = useRef(null);

  // Get current user
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(setUser);
    return () => unsubscribe();
  }, []);

  // Load completion with user-specific keys
  useEffect(() => {
    if (!user || !courseId) {
      setCompletedItems({});
      return;
    }
    
    const loadUserCompletion = () => {
      const key = `completed-${user.uid}-${courseId}`;
      const saved = localStorage.getItem(key);
      
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          if (typeof parsed === 'object' && parsed !== null) {
            console.log("📥 Loading completion for user:", user.uid, parsed);
            setCompletedItems(parsed);
          } else {
            setCompletedItems({});
          }
        } catch (e) {
          console.error("Error parsing completion:", e);
          setCompletedItems({});
        }
      } else {
        console.log("🆕 Fresh start for user:", user.uid);
        setCompletedItems({});
      }
      
      const oldKey = `completed-${courseId}`;
      localStorage.removeItem(oldKey);
    };
    
    loadUserCompletion();
    
  }, [user, courseId]);

  // Check if certificate already exists for this course
  useEffect(() => {
    const checkExistingCertificate = async () => {
      if (user && courseId) {
        const exists = await hasCertificate(user.uid, courseId);
        setCertificateGenerated(exists);
      }
    };
    checkExistingCertificate();
  }, [user, courseId]);

  // Fetch course content
  useEffect(() => {
    const fetchItems = async () => {
      if (!courseId) return;
      setIsLoading(true);
      const allItems = [];

      try {
        const courseDoc = await getDoc(doc(db, "courses", courseId));
        if (courseDoc.exists()) {
          setCourseData({ id: courseDoc.id, ...courseDoc.data() });
          
          const data = courseDoc.data();
          
          const videoSnap = await getDocs(collection(db, `courses/${courseId}/videos`));
          videoSnap.forEach((docSnap) => {
            const data = docSnap.data();
            allItems.push({
              id: docSnap.id,
              type: "video",
              title: data.title || "Untitled Video",
              url: data.url,
              duration: data.duration || "",
              order: data.order || 0,
              ...data,
            });
          });

          if (data.resources?.length) {
            data.resources.forEach((res, i) => {
              allItems.push({
                id: res.id || `res-${i}`,
                type: res.type || "pdf",
                title: res.title || "Untitled",
                url: res.url || "",
                content: res.content || "",
                order: res.order || (allItems.length + i),
                ...res,
              });
            });
          }
        }

        allItems.sort((a, b) => (a.order || 0) - (b.order || 0));
        setItems(allItems);
        
        setCompletedItems(prev => {
          const validCompletions = {};
          Object.keys(prev).forEach(key => {
            if (allItems.some(item => item.id === key)) {
              validCompletions[key] = prev[key];
            }
          });
          return validCompletions;
        });
        
        if (allItems.length > 0) {
          setCurrentItem(allItems[0]);
        }
      } catch (err) {
        console.error("Fetch error:", err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchItems();
  }, [courseId]);

  // Check if ALL items completed
  useEffect(() => {
    if (items.length === 0) return;
    
    const allCompleted = items.every(item => completedItems[item.id]);
    setAllItemsCompleted(allCompleted);
    
    if (allCompleted && user && !certificateGenerated) {
      setShowCertificate(true);
    } else {
      setShowCertificate(false);
    }
  }, [completedItems, items, user, certificateGenerated]);

  const handleSelect = (item) => {
    setCurrentItem(item);
    setPlayerLoading(true);
  };

  const toggleComplete = (id) => {
    setCompletedItems(prev => {
      const newState = { ...prev, [id]: !prev[id] };
      
      if (user && courseId) {
        const key = `completed-${user.uid}-${courseId}`;
        localStorage.setItem(key, JSON.stringify(newState));
        console.log("💾 Saved completion for user:", user.uid, newState);
      }
      
      return newState;
    });
  };

  const handleContinue = () => {
    if (!currentItem) return;
    
    const currentIndex = items.findIndex(i => i.id === currentItem.id);
    if (currentIndex < items.length - 1) {
      const nextItem = items[currentIndex + 1];
      setCurrentItem(nextItem);
      setPlayerLoading(true);
      
      setTimeout(() => {
        const el = playlistRef.current?.querySelector(`[data-id="${nextItem.id}"]`);
        if (el) el.scrollIntoView({ behavior: "smooth", block: "center" });
      }, 100);
    }
  };

  const handleGenerateCertificate = async () => {
    if (!user || !courseData) {
      alert("Please login to generate certificate");
      return;
    }
    
    setGeneratingCert(true);
    try {
      const userName = user.displayName || user.email?.split('@')[0] || "Student";
      
      const { pdf, certificateId, pdfUrl } = await generateCertificatePDF(
        { name: userName, email: user.email },
        { title: courseData.title || "Course Completion" }
      );
      
      await saveCertificate(user.uid, courseId, certificateId, pdf);
      
      setCertificatePdfBlob(pdf);
      setCertificateUrl(pdfUrl);
      
      setTimeout(() => {
        setShowModal(true);
      }, 100);
      
      setCertificateGenerated(true);
      setShowCertificate(false);
      
    } catch (error) {
      console.error("Certificate error:", error);
      alert("Certificate generation failed. Please try again.");
    } finally {
      setGeneratingCert(false);
    }
  };

  const closeModal = () => {
    setShowModal(false);
    if (certificateUrl) {
      URL.revokeObjectURL(certificateUrl);
      setCertificateUrl(null);
    }
  };

  const handleDownload = () => {
    if (certificatePdfBlob) {
      const url = URL.createObjectURL(certificatePdfBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `Certificate-${courseData?.title || 'Course'}.pdf`;
      link.click();
      URL.revokeObjectURL(url);
    } else if (certificateUrl) {
      const link = document.createElement('a');
      link.href = certificateUrl;
      link.download = `Certificate-${courseData?.title || 'Course'}.pdf`;
      link.click();
    }
  };

  useEffect(() => {
    if (!user) {
      setCompletedItems({});
      setCertificateGenerated(false);
      setShowCertificate(false);
    }
  }, [user]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="animate-pulse text-center">
          <div className="text-[#7607B3] text-xl">Loading course...</div>
        </div>
      </div>
    );
  }

  // 🔥 FIXED: CENTERED LAYOUT WITH PROPER SPACING
  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header with Back button - Centered */}
      <div className="bg-white border-b sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
          <button
            onClick={() => router.push("/dashboard")}
            className="px-4 py-2 bg-[#7607B3] text-white rounded-lg hover:bg-purple-800 transition text-sm inline-flex items-center"
          >
            ← Back to Dashboard
          </button>
        </div>
      </div>

      {/* Main Content - Centered with max width */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Left Column - Video/Content Area - 2/3 width */}
          <div className="lg:w-2/3">
            <div className="bg-white rounded-xl shadow-lg p-5 sm:p-6">
              {currentItem ? (
                <>
                  <div className="flex items-center gap-2 mb-4">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      currentItem.type === 'video' ? 'bg-blue-100 text-blue-700' :
                      currentItem.type === 'pdf' ? 'bg-red-100 text-red-700' :
                      'bg-green-100 text-green-700'
                    }`}>
                      {currentItem.type.toUpperCase()}
                    </span>
                    <h2 className="text-xl sm:text-2xl font-bold text-[#7607B3] truncate">
                      {currentItem.title}
                    </h2>
                  </div>

                  {/* Content Area */}
                  <div className="mb-4">
                    {currentItem.type === "video" && (
                      <div className="aspect-video bg-black rounded-lg overflow-hidden">
                        <VideoPlayer
                          videoUrl={currentItem.url}
                          videoId={currentItem.id}
                          courseId={courseId}
                        />
                      </div>
                    )}

                    {currentItem.type === "pdf" && (
                      <div className="aspect-[4/3] rounded-lg overflow-hidden shadow-lg">
                        <iframe
                          src={`https://docs.google.com/gview?url=${encodeURIComponent(currentItem.url)}&embedded=true`}
                          width="100%"
                          height="100%"
                          className="border-0 w-full h-full"
                          title={currentItem.title}
                        />
                      </div>
                    )}

                    {currentItem.type === "text" && (
                      <div className="prose max-w-none p-4 bg-gray-50 rounded-lg overflow-auto">
                        <div dangerouslySetInnerHTML={{ __html: currentItem.content }} />
                      </div>
                    )}
                  </div>

                  {/* Buttons */}
                  <div className="flex flex-col sm:flex-row gap-3">
                    <button
                      onClick={() => toggleComplete(currentItem.id)}
                      className={`flex-1 px-4 py-3 rounded-lg font-medium text-white transition ${
                        completedItems[currentItem.id] 
                          ? "bg-green-600 hover:bg-green-700" 
                          : "bg-gray-700 hover:bg-gray-800"
                      }`}
                    >
                      {completedItems[currentItem.id] ? "✅ Completed" : "○ Mark Complete"}
                    </button>

                    {completedItems[currentItem.id] && (
                      <button
                        onClick={handleContinue}
                        className="flex-1 px-4 py-3 bg-[#D2640D] hover:bg-orange-700 text-white rounded-lg font-medium transition"
                      >
                        Continue →
                      </button>
                    )}
                  </div>
                </>
              ) : (
                <div className="h-64 flex items-center justify-center text-gray-500">
                  No content available
                </div>
              )}
            </div>
          </div>

          {/* Right Column - Playlist - 1/3 width */}
          <div className="lg:w-1/3">
            <div className="bg-white rounded-xl shadow-lg p-5 sticky top-20">
              <h3 className="text-lg font-semibold text-[#D2640D] mb-4">
                Course Content
              </h3>

              {/* Progress Summary */}
              <div className="mb-4 p-3 bg-purple-50 rounded-lg">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium">Progress</span>
                  <span className="text-sm font-bold text-[#7607B3]">
                    {Object.keys(completedItems).length}/{items.length} completed
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-gradient-to-r from-[#7607B3] to-[#D2640D] h-2 rounded-full transition-all"
                    style={{ width: `${(Object.keys(completedItems).length / items.length) * 100}%` }}
                  ></div>
                </div>
              </div>

              {/* Playlist Items */}
              <div className="space-y-2 max-h-[calc(100vh-300px)] overflow-y-auto pr-2">
                {items.map((item) => {
                  const isActive = currentItem?.id === item.id;
                  const isDone = completedItems[item.id] || false;

                  const getIcon = () => {
                    if (isDone) return "✅";
                    switch(item.type) {
                      case "video": return "🎬";
                      case "pdf": return "📄";
                      case "text": return "📝";
                      default: return "📁";
                    }
                  };

                  return (
                    <div
                      key={item.id}
                      data-id={item.id}
                      onClick={() => handleSelect(item)}
                      className={`p-3 rounded-lg cursor-pointer transition ${
                        isActive 
                          ? "bg-[#7607B3] text-white" 
                          : isDone 
                            ? "bg-green-50 hover:bg-green-100" 
                            : "hover:bg-gray-100"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-lg min-w-[24px]">
                          {getIcon()}
                        </span>
                        <span className="flex-1 truncate text-sm">
                          {item.title}
                        </span>
                        <span className={`text-xs px-2 py-1 rounded ${
                          isActive ? 'bg-white/20' : 'bg-gray-200 text-gray-700'
                        }`}>
                          {item.type === "video" ? "🎬" : "📄"}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Certificate Section */}
              {allItemsCompleted && (
                <div className="mt-4 p-4 bg-gradient-to-r from-purple-50 to-orange-50 rounded-lg border-2 border-purple-200">
                  <div className="flex items-center gap-3">
                    <div className="text-3xl">🎓</div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-bold text-[#7607B3] text-sm">
                        Course Complete!
                      </h4>
                      <p className="text-xs text-gray-600 truncate">
                        {certificateGenerated 
                          ? "Certificate generated" 
                          : "Claim your certificate"}
                      </p>
                    </div>
                    {showCertificate && !certificateGenerated && (
                      <button
                        onClick={handleGenerateCertificate}
                        disabled={generatingCert}
                        className={`px-3 py-1.5 bg-gradient-to-r from-[#7607B3] to-[#D2640D] text-white rounded-lg text-xs font-medium transition whitespace-nowrap ${
                          generatingCert ? 'opacity-50 cursor-not-allowed' : ''
                        }`}
                      >
                        {generatingCert ? (
                          <span className="flex items-center gap-1">
                            <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white"></div>
                            ...
                          </span>
                        ) : (
                          <span>Get</span>
                        )}
                      </button>
                    )}
                    {certificateGenerated && (
                      <button
                        onClick={() => {
                          if (certificateUrl) {
                            setShowModal(true);
                          } else {
                            router.push("/certificates");
                          }
                        }}
                        className="px-3 py-1.5 bg-green-600 text-white rounded-lg text-xs font-medium hover:bg-green-700 transition"
                      >
                        View
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Certificate Modal */}
      {showModal && certificateUrl && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-5xl w-full max-h-[90vh] flex flex-col">
            <div className="p-4 border-b flex justify-between items-center flex-shrink-0">
              <div>
                <h3 className="text-xl font-bold text-[#7607B3]">Your Certificate</h3>
                <p className="text-sm text-gray-600">{courseData?.title}</p>
              </div>
              <button
                onClick={closeModal}
                className="text-gray-500 hover:text-gray-700 text-xl p-2"
              >
                ✕
              </button>
            </div>
            
            <div className="flex-1 overflow-auto p-4 bg-gray-100">
              <div className="bg-white rounded-lg shadow-lg p-4">
                <iframe
                  src={certificateUrl}
                  className="w-full h-[600px] border-0"
                  title="Certificate"
                  onLoad={() => console.log("Certificate loaded")}
                />
              </div>
            </div>
            
            <div className="p-4 border-t flex justify-end gap-3 flex-shrink-0">
              <button
                onClick={handleDownload}
                className="px-6 py-2 bg-[#7607B3] text-white rounded-lg hover:bg-purple-800 transition flex items-center gap-2"
              >
                <span>📥</span> Download PDF
              </button>
              <button
                onClick={() => window.print()}
                className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition flex items-center gap-2"
              >
                <span>🖨️</span> Print
              </button>
              <button
                onClick={() => router.push("/certificates")}
                className="px-6 py-2 bg-purple-100 text-[#7607B3] rounded-lg hover:bg-purple-200 transition"
              >
                View All
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}