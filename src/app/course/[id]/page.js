"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { db, initAnalytics } from "@/lib/firebase"; // client-safe analytics
import { collection, getDocs } from "firebase/firestore";

export default function CoursePage() {
  const router = useRouter();
  const params = useParams();
  const courseId = params.id;

  const [videos, setVideos] = useState([]);
  const [currentVideo, setCurrentVideo] = useState(null);
  const [playedSeconds, setPlayedSeconds] = useState(0);
  const [userClickedPlay, setUserClickedPlay] = useState(false);

  // Initialize Firebase Analytics (client-only)
  useEffect(() => {
    initAnalytics().then((analytics) => {
      if (analytics) console.log("Analytics ready!");
    });
  }, []);

  // Fetch videos from Firestore
  useEffect(() => {
    const fetchVideos = async () => {
      if (!courseId) return;

      const querySnapshot = await getDocs(
        collection(db, `courses/${courseId}/videos`)
      );

      const videosData = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      setVideos(videosData);

      if (videosData.length > 0) {
        const firstVideo = videosData[0];
        setCurrentVideo(firstVideo);

        // Load last watched progress safely
        if (typeof window !== "undefined") {
          const savedProgress = localStorage.getItem(
            `videoProgress-${firstVideo.id}`
          );
          setPlayedSeconds(savedProgress ? parseFloat(savedProgress) : 0);
        }
      }
    };

    fetchVideos();
  }, [courseId]);

  // Auto-save approximate progress every 5 sec
  useEffect(() => {
    if (typeof window === "undefined") return;

    const interval = setInterval(() => {
      if (currentVideo && userClickedPlay) {
        setPlayedSeconds((prev) => {
          const next = prev + 5;
          localStorage.setItem(`videoProgress-${currentVideo.id}`, next);
          return next;
        });
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [currentVideo, userClickedPlay]);

  // When user selects video from playlist
  const handleVideoSelect = (video) => {
    setCurrentVideo(video);
    if (typeof window !== "undefined") {
      const savedProgress = localStorage.getItem(`videoProgress-${video.id}`);
      setPlayedSeconds(savedProgress ? parseFloat(savedProgress) : 0);
    }
    setUserClickedPlay(false);
  };

  // Construct iframe URL with start time
  const getIframeUrl = (url, seconds) =>
    seconds > 0 ? `${url}#t=${Math.floor(seconds)}` : url;

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Back Button */}
        <button
          onClick={() => router.push("/dashboard")}
          className="mb-4 px-4 py-2 bg-[#7607B3] text-white rounded hover:bg-purple-800"
        >
          ← Back to Dashboard
        </button>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* LEFT SIDE - VIDEO */}
          <div className="lg:col-span-2 bg-white rounded-xl shadow p-4">
            {currentVideo && (
              <>
                <h2 className="text-xl font-bold text-[#7607B3] mb-4">
                  {currentVideo.title}
                </h2>

                <div className="aspect-video">
                  <iframe
                    id="course-iframe"
                    src={getIframeUrl(currentVideo.url, playedSeconds)}
                    width="100%"
                    height="100%"
                    allow="autoplay; encrypted-media; fullscreen"
                    allowFullScreen
                    className="rounded-lg"
                    onClick={() => setUserClickedPlay(true)}
                  />
                </div>
              </>
            )}
          </div>

          {/* RIGHT SIDE - PLAYLIST */}
          <div className="bg-white rounded-xl shadow p-4 h-fit">
            <h3 className="text-lg font-semibold mb-4 text-[#D2640D]">
              Course Playlist
            </h3>

            <div className="space-y-3 max-h-[500px] overflow-y-auto">
              {videos.map((video, index) => (
                <div
                  key={video.id}
                  onClick={() => handleVideoSelect(video)}
                  className={`cursor-pointer p-3 rounded-lg border transition ${
                    currentVideo?.id === video.id
                      ? "bg-[#7607B3] text-white"
                      : "hover:bg-gray-100"
                  }`}
                >
                  <p className="font-medium">
                    {index + 1}. {video.title}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
