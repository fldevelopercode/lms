"use client";

import { useEffect, useState, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { db, initAnalytics } from "@/lib/firebase";
import { collection, doc, getDoc, getDocs } from "firebase/firestore";

export default function CoursePage() {
  const router = useRouter();
  const { id: courseId } = useParams();

  const [items, setItems] = useState([]);
  const [currentItem, setCurrentItem] = useState(null);
  const [playedSeconds, setPlayedSeconds] = useState(0);
  const [userClickedPlay, setUserClickedPlay] = useState(false);
  const [completedItems, setCompletedItems] = useState({});
  const playlistRef = useRef(null);

  // Load completion from localStorage
  useEffect(() => {
    if (!courseId) return;
    const saved = localStorage.getItem(`completed-${courseId}`);
    if (saved) {
      setCompletedItems(JSON.parse(saved));
    }
  }, [courseId]);

  // Save completion
  useEffect(() => {
    if (Object.keys(completedItems).length > 0) {
      localStorage.setItem(`completed-${courseId}`, JSON.stringify(completedItems));
    }
  }, [completedItems, courseId]);

  useEffect(() => {
    initAnalytics().then((analytics) => {
      if (analytics) console.log("Analytics ready!");
    });
  }, []);

  // Helper function to format duration nicely
  const formatDuration = (duration) => {
    if (!duration) return "";

    // If already has unit like "6 min" or "1 hr", return as is
    if (typeof duration === "string" && (duration.includes("min") || duration.includes("hr"))) {
      return duration;
    }

    // Assume number or string number → in minutes
    const min = parseFloat(duration);
    if (isNaN(min) || min <= 0) return "";

    if (min < 60) {
      return `${Math.round(min)} min`;
    } else {
      const hours = Math.floor(min / 60);
      const remainingMin = Math.round(min % 60);
      if (remainingMin === 0) {
        return `${hours} hr`;
      }
      return `${hours} hr ${remainingMin} min`;
    }
  };

  // Fetch all content
  useEffect(() => {
    const fetchItems = async () => {
      if (!courseId) return;
      const allItems = [];

      try {
        // 1. Videos from subcollection
        const videoSnap = await getDocs(collection(db, `courses/${courseId}/videos`));
        videoSnap.forEach((docSnap) => {
          const data = docSnap.data();
          allItems.push({
            id: docSnap.id,
            type: "video",
            title: data.title || "Untitled Video",
            url: data.url,
            duration: data.duration || "", // can be number or string
            thumbnail: data.thumbnail || "/default-thumb.png",
            ...data,
          });
        });

        // 2. Resources array (pdf + text)
        const courseDocRef = doc(db, "courses", courseId);
        const courseDoc = await getDoc(courseDocRef);

        if (courseDoc.exists()) {
          const courseData = courseDoc.data();
          if (courseData.resources && Array.isArray(courseData.resources)) {
            courseData.resources.forEach((res, index) => {
              const resourceId = res.id || `${res.type || "resource"}-${index}`;
              allItems.push({
                id: resourceId,
                type: res.type || "pdf",
                title: res.title || "Untitled",
                url: res.url || "",
                thumbnail: res.thumbnail || "",
                content: res.content || "",
                duration: res.duration || "", // in case text/pdf has duration (rare)
                ...res,
              });
            });
          }
        }

        // Sort by order if present
        allItems.sort((a, b) => (a.order || 0) - (b.order || 0));

        setItems(allItems);

        if (allItems.length > 0 && !currentItem) {
          const first = allItems[0];
          setCurrentItem(first);
          if (first.type === "video") {
            const saved = localStorage.getItem(`progress-${first.id}`);
            setPlayedSeconds(saved ? parseFloat(saved) : 0);
          }
        }
      } catch (error) {
        console.error("Error fetching course:", error);
      }
    };

    fetchItems();
  }, [courseId]);

  // Video progress saver
  useEffect(() => {
    if (!currentItem || currentItem.type !== "video") return;

    const interval = setInterval(() => {
      if (userClickedPlay) {
        setPlayedSeconds((prev) => {
          const next = prev + 5;
          localStorage.setItem(`progress-${currentItem.id}`, next.toString());
          return next;
        });
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [currentItem, userClickedPlay]);

  // Auto-scroll
  useEffect(() => {
    if (!currentItem || !playlistRef.current) return;
    const el = playlistRef.current.querySelector(`[data-id="${currentItem.id}"]`);
    if (el) el.scrollIntoView({ behavior: "smooth", block: "center" });
  }, [currentItem]);

  const handleSelect = (item) => {
    setCurrentItem(item);
    if (item.type === "video") {
      const saved = localStorage.getItem(`progress-${item.id}`);
      setPlayedSeconds(saved ? parseFloat(saved) : 0);
    }
    setUserClickedPlay(false);
  };

  const toggleComplete = (id) => {
    setCompletedItems((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const handleContinue = () => {
    const idx = items.findIndex((i) => i.id === currentItem?.id);
    if (idx >= 0 && idx + 1 < items.length) {
      handleSelect(items[idx + 1]);
    } else {
      alert("Course tamam ho gaya hai! 🎉");
    }
  };

  const getVideoUrl = (url, sec) => (sec > 0 ? `${url}#t=${Math.floor(sec)}` : url);
  const getPdfUrl = (url) => `https://docs.google.com/gview?url=${encodeURIComponent(url)}&embedded=true`;

  return (
    <div className="min-h-screen bg-gray-100 p-6 md:p-8">
      <div className="max-w-7xl mx-auto">
        <button
          onClick={() => router.push("/dashboard")}
          className="mb-6 px-5 py-2 bg-[#7607B3] text-white rounded-lg hover:bg-purple-800 transition"
        >
          ← Back to Dashboard
        </button>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* LEFT - Content */}
          <div className="lg:col-span-2 bg-white rounded-xl shadow-lg p-6 flex flex-col min-h-auto">
            {currentItem ? (
              <>
                <h2 className="text-2xl md:text-3xl font-bold text-[#7607B3] mb-5">
                  {currentItem.title}
                </h2>

                {currentItem.type === "video" && (
                  <div className="aspect-video mb-6 rounded-lg overflow-hidden shadow-lg">
                    <iframe
                      src={getVideoUrl(currentItem.url, playedSeconds)}
                      width="100%"
                      height="100%"
                      allow="autoplay; encrypted-media; fullscreen"
                      allowFullScreen
                      onClick={() => setUserClickedPlay(true)}
                    />
                  </div>
                )}

                {currentItem.type === "pdf" && currentItem.url && (
                  <div className="aspect-[4/3] mb-6 rounded-lg overflow-hidden shadow-lg">
                    <iframe
                      src={getPdfUrl(currentItem.url)}
                      width="100%"
                      height="100%"
                      className="border-0"
                    />
                  </div>
                )}

                {currentItem.type === "text" && currentItem.content && (
                  <div className="prose prose-lg max-w-none mb-8 leading-relaxed">
                    <div dangerouslySetInnerHTML={{ __html: currentItem.content }} />
                  </div>
                )}

                <div className="flex flex-wrap gap-4">
                  <button
                    onClick={() => toggleComplete(currentItem.id)}
                    className={`px-6 py-3 rounded-lg font-medium text-white transition ${
                      completedItems[currentItem.id]
                        ? "bg-green-600 hover:bg-green-700"
                        : "bg-gray-700 hover:bg-gray-800"
                    }`}
                  >
                    {completedItems[currentItem.id] ? "Mark Incomplete" : "Mark Complete"}
                  </button>

                  {completedItems[currentItem.id] && (
                    <button
                      onClick={handleContinue}
                      className="px-6 py-3 bg-[#D2640D] hover:bg-orange-700 text-white rounded-lg font-medium transition"
                    >
                      Continue →
                    </button>
                  )}
                </div>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center text-gray-500 text-lg">
                Loading course content...
              </div>
            )}
          </div>

          {/* RIGHT - Playlist */}
          <div
            ref={playlistRef}
            className="bg-white rounded-xl shadow-lg p-5 h-auto overflow-y-auto max-h-[80vh]"
          >
            <h3 className="text-xl font-semibold mb-5 text-[#D2640D]">
              Course Content
            </h3>

            {items.length === 0 ? (
              <p className="text-gray-500">No items found in this course.</p>
            ) : (
              <div className="space-y-2">
                {items.map((item) => {
                  const isActive = currentItem?.id === item.id;
                  const isDone = !!completedItems[item.id];

                  const durationText =
                    item.type === "video" && item.duration
                      ? ` • ${formatDuration(item.duration)}`
                      : "";

                  return (
                    <div
                      key={item.id}
                      data-id={item.id}
                      onClick={() => handleSelect(item)}
                      className={`p-3 rounded-lg cursor-pointer flex items-center justify-between gap-3 transition text-sm ${
                        isActive ? "bg-[#7607B3] text-white" : "hover:bg-gray-100"
                      }`}
                    >
                      <div className="flex items-center gap-3 flex-1">
                        <span className="font-bold min-w-[24px] text-center">
                          {isDone ? "✓" : "○"}
                        </span>
                        <span className="font-medium truncate">{item.title}</span>
                      </div>

                      <span className="text-xs px-2.5 py-1 rounded bg-gray-200 text-gray-700 whitespace-nowrap">
                        {item.type.toUpperCase()}
                        {durationText}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}