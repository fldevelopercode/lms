// components/VideoPlayer.js
"use client";

import { useEffect, useRef, useState } from "react";
import { auth, db } from "@/lib/firebase";
import { doc, getDoc, setDoc } from "firebase/firestore";
import dynamic from "next/dynamic";

const ReactPlayer = dynamic(() => import("react-player/lazy"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full flex items-center justify-center bg-black text-white">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto mb-2"></div>
        <p className="text-sm text-gray-300">Loading player...</p>
      </div>
    </div>
  ),
});

const VideoPlayer = ({ videoUrl, videoId, courseId, onVideoEnd }) => {
  const [user, setUser] = useState(null);
  const [savedProgress, setSavedProgress] = useState(0);
  const [playerReady, setPlayerReady] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const [isBuffering, setIsBuffering] = useState(true);
  const playerRef = useRef(null);
  const progressSetRef = useRef(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(setUser);
    return () => unsubscribe();
  }, []);

  // Load progress - FIX 1: Better loading logic
  useEffect(() => {
    const loadProgress = async () => {
      if (!user || !videoId || !courseId) return;

      try {
        // Pehle localStorage check
        const cached = localStorage.getItem(`progress-${videoId}`);
        if (cached) {
          const { time } = JSON.parse(cached);
          if (time > 0) {
            setSavedProgress(time);
            return;
          }
        }

        // Firebase se load
        const progressDoc = doc(db, "userProgress", `${user.uid}_${courseId}_${videoId}`);
        const docSnap = await getDoc(progressDoc);
        
        if (docSnap.exists()) {
          const time = docSnap.data().currentTime || 0;
          setSavedProgress(time);
          localStorage.setItem(`progress-${videoId}`, JSON.stringify({ time }));
        }
      } catch (error) {
        console.error("Error loading progress:", error);
      }
    };

    loadProgress();
  }, [user, videoId, courseId]);

  // Reset for new video
  useEffect(() => {
    setPlayerReady(false);
    setIsBuffering(true);
    progressSetRef.current = false;
  }, [videoId]);

  // Set video position
  useEffect(() => {
    if (playerReady && savedProgress > 1 && playerRef.current && !progressSetRef.current) {
      playerRef.current.seekTo(savedProgress, "seconds");
      progressSetRef.current = true;
    }
  }, [playerReady, savedProgress]);

  const saveProgress = async (currentTime, duration) => {
    if (!user || !videoId || !courseId || !currentTime) return;

    try {
      const progressRef = doc(db, "userProgress", `${user.uid}_${courseId}_${videoId}`);
      await setDoc(progressRef, {
        userId: user.uid,
        courseId,
        videoId,
        currentTime,
        duration,
        lastWatched: new Date().toISOString(),
      }, { merge: true });
      
      localStorage.setItem(`progress-${videoId}`, JSON.stringify({ time: currentTime }));
    } catch (error) {
      console.error("Save error:", error);
    }
  };

  if (!isMounted) return null;

  return (
    <div className="relative w-full aspect-video bg-black rounded-lg overflow-hidden">
      <ReactPlayer
        ref={playerRef}
        url={videoUrl}
        width="100%"
        height="100%"
        controls={true}
        playing={false}
        onReady={() => {
          setPlayerReady(true);
          setIsBuffering(false);
        }}
        onBuffer={() => setIsBuffering(true)}
        onBufferEnd={() => setIsBuffering(false)}
        onProgress={({ playedSeconds, loadedSeconds }) => {
          if (playedSeconds > 0 && Math.floor(playedSeconds) % 10 === 0) {
            saveProgress(playedSeconds, loadedSeconds);
          }
        }}
        onPause={() => {
          const currentTime = playerRef.current?.getCurrentTime();
          const duration = playerRef.current?.getDuration();
          if (currentTime > 0) saveProgress(currentTime, duration);
        }}
        onEnded={() => {
          console.log("Video ended");
          if (onVideoEnd) onVideoEnd(); // Notify parent that video ended
        }}
        config={{
          file: {
            attributes: {
              preload: "auto", // FIX 2: auto preload for faster loading
            },
          },
        }}
      />

      {/* Loading Overlay */}
      {(isBuffering || !playerReady) && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/80 text-white z-20">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto mb-2"></div>
            <p className="text-sm">
              {!playerReady ? "Loading player..." : "Buffering..."}
            </p>
            {savedProgress > 0 && (
              <p className="text-xs text-purple-400 mt-2">
                Resume at {Math.floor(savedProgress / 60)}:
                {Math.floor(savedProgress % 60).toString().padStart(2, "0")}
              </p>
            )}
          </div>
        </div>
      )}

      {/* Resume Badge */}
      {savedProgress > 1 && playerReady && !isBuffering && (
        <div className="absolute top-2 left-2 bg-purple-600 text-white px-3 py-1 rounded-full text-sm z-10">
          ⏯️ Resume {Math.floor(savedProgress / 60)}:
          {Math.floor(savedProgress % 60).toString().padStart(2, "0")}
        </div>
      )}
    </div>
  );
};

export default VideoPlayer;