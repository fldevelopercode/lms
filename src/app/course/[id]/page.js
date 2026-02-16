// app/course/[id]/page.js
"use client";

import { useEffect, useState, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { db } from "@/lib/firebase";
import { collection, doc, getDoc, getDocs } from "firebase/firestore";
import dynamic from "next/dynamic";

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
  const playlistRef = useRef(null);

  // Load completion from localStorage
  useEffect(() => {
    if (!courseId) return;
    const saved = localStorage.getItem(`completed-${courseId}`);
    if (saved) {
      setCompletedItems(JSON.parse(saved));
    }
  }, [courseId]);

  // Fetch course content
  useEffect(() => {
    const fetchItems = async () => {
      if (!courseId) return;
      setIsLoading(true);
      const allItems = [];

      try {
        // Fetch videos
        const videoSnap = await getDocs(collection(db, `courses/${courseId}/videos`));
        videoSnap.forEach((docSnap) => {
          const data = docSnap.data();
          allItems.push({
            id: docSnap.id,
            type: "video",
            title: data.title || "Untitled Video",
            url: data.url,
            duration: data.duration || "",
            ...data,
          });
        });

        // Fetch resources
        const courseDoc = await getDoc(doc(db, "courses", courseId));
        if (courseDoc.exists()) {
          const data = courseDoc.data();
          if (data.resources?.length) {
            data.resources.forEach((res, i) => {
              allItems.push({
                id: res.id || `res-${i}`,
                type: res.type || "pdf",
                title: res.title || "Untitled",
                url: res.url || "",
                ...res,
              });
            });
          }
        }

        allItems.sort((a, b) => (a.order || 0) - (b.order || 0));
        setItems(allItems);
        
        // FIX 3: Auto-select last watched or first
        const lastWatched = findLastWatched(allItems);
        if (lastWatched) {
          setCurrentItem(lastWatched);
        } else if (allItems.length > 0) {
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

  // FIX 4: Find last watched video
  const findLastWatched = (items) => {
    for (const item of items) {
      if (item.type === "video") {
        const saved = localStorage.getItem(`progress-${item.id}`);
        if (saved) {
          const { time } = JSON.parse(saved);
          if (time > 0) return item;
        }
      }
    }
    return null;
  };

  const handleSelect = (item) => {
    setCurrentItem(item);
    setPlayerLoading(true);
  };

  const toggleComplete = (id) => {
    const newState = { ...completedItems, [id]: !completedItems[id] };
    setCompletedItems(newState);
    localStorage.setItem(`completed-${courseId}`, JSON.stringify(newState));
  };

  // FIX 5: Handle continue to next video
  const handleContinue = () => {
    if (!currentItem) return;
    
    const currentIndex = items.findIndex(i => i.id === currentItem.id);
    if (currentIndex < items.length - 1) {
      // Next item exists
      const nextItem = items[currentIndex + 1];
      setCurrentItem(nextItem);
      setPlayerLoading(true);
      
      // Scroll to next item in playlist
      setTimeout(() => {
        const el = playlistRef.current?.querySelector(`[data-id="${nextItem.id}"]`);
        if (el) el.scrollIntoView({ behavior: "smooth", block: "center" });
      }, 100);
    } else {
      alert("🎉 Course completed! You've finished all videos.");
    }
  };

  // Handle video end
  const handleVideoEnd = () => {
    if (currentItem) {
      // Auto-mark as complete when video ends
      if (!completedItems[currentItem.id]) {
        toggleComplete(currentItem.id);
      }
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-100 p-8">
        <div className="max-w-7xl mx-auto animate-pulse">
          Loading course...
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        <button
          onClick={() => router.push("/dashboard")}
          className="mb-6 px-5 py-2 bg-[#7607B3] text-white rounded-lg hover:bg-purple-800 transition"
        >
          ← Back
        </button>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 bg-white rounded-xl shadow-lg p-6">
            {currentItem ? (
              <>
                <h2 className="text-2xl font-bold text-[#7607B3] mb-4">
                  {currentItem.title}
                </h2>

                {currentItem.type === "video" && (
                  <div className="mb-4">
                    <VideoPlayer
                      videoUrl={currentItem.url}
                      videoId={currentItem.id}
                      courseId={courseId}
                      onVideoEnd={handleVideoEnd}
                    />
                  </div>
                )}

                {currentItem.type === "pdf" && (
                  <div className="aspect-[4/3] rounded-lg overflow-hidden shadow-lg">
                    <iframe
                      src={`https://docs.google.com/gview?url=${encodeURIComponent(currentItem.url)}&embedded=true`}
                      width="100%"
                      height="100%"
                      className="border-0"
                    />
                  </div>
                )}

                {/* FIX 6: Buttons with Continue */}
                <div className="mt-6 flex gap-4">
                  <button
                    onClick={() => toggleComplete(currentItem.id)}
                    className={`px-6 py-3 rounded-lg font-medium text-white transition flex-1 ${
                      completedItems[currentItem.id] 
                        ? "bg-green-600 hover:bg-green-700" 
                        : "bg-gray-700 hover:bg-gray-800"
                    }`}
                  >
                    {completedItems[currentItem.id] ? "✅ Completed" : "○ Mark Complete"}
                  </button>

                  {/* FIX 7: Continue button appears when completed */}
                  {completedItems[currentItem.id] && (
                    <button
                      onClick={handleContinue}
                      className="px-6 py-3 bg-[#D2640D] hover:bg-orange-700 text-white rounded-lg font-medium transition flex-1"
                    >
                      Continue →
                    </button>
                  )}
                </div>
              </>
            ) : (
              <div className="text-center text-gray-500 py-20">
                No content available
              </div>
            )}
          </div>

          {/* Playlist Sidebar */}
          <div
            ref={playlistRef}
            className="bg-white rounded-xl shadow-lg p-5 h-[80vh] overflow-y-auto"
          >
            <h3 className="text-xl font-semibold mb-4 text-[#D2640D] sticky top-0 bg-white py-2">
              Course Content
            </h3>

            <div className="space-y-2">
              {items.map((item, index) => {
                const isActive = currentItem?.id === item.id;
                const isDone = completedItems[item.id];
                const saved = localStorage.getItem(`progress-${item.id}`);
                const progress = saved ? JSON.parse(saved).time : 0;

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
                      <span className="text-lg">
                        {isDone ? "✅" : index + 1}
                      </span>
                      <span className="flex-1 truncate">{item.title}</span>
                      {item.type === "video" && progress > 0 && !isDone && (
                        <span className="text-xs bg-purple-200 text-purple-800 px-2 py-1 rounded">
                          {Math.floor(progress / 60)}m
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}