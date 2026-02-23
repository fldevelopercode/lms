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

  // Load progress from Firestore (priority) then localStorage
  useEffect(() => {
    const loadProgress = async () => {
      if (!user || !videoId || !courseId) return;

      try {
        // Priority 1: Firestore se load karo
        const progressDoc = doc(db, "userProgress", `${user.uid}_${courseId}_${videoId}`);
        const docSnap = await getDoc(progressDoc);
        
        if (docSnap.exists()) {
          const data = docSnap.data();
          const time = data.currentTime || 0;
          const completed = data.completed || false;
          
          console.log(`📥 Firestore progress: ${time}s, completed: ${completed} for ${videoId}`);
          
          setSavedProgress(time);
          // Update localStorage
          localStorage.setItem(`progress-${videoId}`, JSON.stringify({ time, completed }));
        } else {
          // Priority 2: Fallback to localStorage
          const cached = localStorage.getItem(`progress-${videoId}`);
          if (cached) {
            const { time } = JSON.parse(cached);
            console.log(`📦 Cache progress: ${time}s for ${videoId}`);
            setSavedProgress(time);
          }
        }
      } catch (error) {
        console.error("Error loading progress:", error);
        
        // Fallback to localStorage on error
        const cached = localStorage.getItem(`progress-${videoId}`);
        if (cached) {
          const { time } = JSON.parse(cached);
          setSavedProgress(time);
        }
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

  // Set video position with better timing
  useEffect(() => {
    if (playerReady && savedProgress > 1 && playerRef.current && !progressSetRef.current) {
      setTimeout(() => {
        if (playerRef.current) {
          console.log(`🎯 Seeking to: ${savedProgress}s`);
          playerRef.current.seekTo(savedProgress, "seconds");
          progressSetRef.current = true;
        }
      }, 500);
    }
  }, [playerReady, savedProgress]);

  // 🔥 FIX: Save progress with completed flag
  const saveProgress = async (currentTime, duration) => {
    if (!user || !videoId || !courseId || !currentTime) return;

    const isCompleted = currentTime / duration > 0.95;
    
    // Har 5 second mein save karo
    if (Math.floor(currentTime) % 5 === 0 || isCompleted) {
      try {
        const progressRef = doc(db, "userProgress", `${user.uid}_${courseId}_${videoId}`);
        await setDoc(progressRef, {
          userId: user.uid,
          courseId,
          videoId,
          currentTime,
          duration,
          completed: isCompleted,
          lastWatched: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }, { merge: true });
        
        localStorage.setItem(`progress-${videoId}`, JSON.stringify({ 
          time: currentTime,
          completed: isCompleted 
        }));
        
        console.log(`💾 Saved: ${Math.floor(currentTime)}s, completed: ${isCompleted}`);
      } catch (error) {
        console.error("Save error:", error);
      }
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
          console.log("✅ Player ready");
          setPlayerReady(true);
          setIsBuffering(false);
        }}
        onBuffer={() => setIsBuffering(true)}
        onBufferEnd={() => setIsBuffering(false)}
        onProgress={({ playedSeconds, loadedSeconds }) => {
          if (playedSeconds > 0) {
            saveProgress(playedSeconds, loadedSeconds);
          }
        }}
        onPause={() => {
          const currentTime = playerRef.current?.getCurrentTime();
          const duration = playerRef.current?.getDuration();
          if (currentTime > 0) {
            console.log(`⏸️ Paused at: ${currentTime}s`);
            saveProgress(currentTime, duration);
          }
        }}
        onEnded={() => {
          console.log("✅ Video ended");
          const duration = playerRef.current?.getDuration();
          if (user) {
            saveProgress(duration, duration);
          }
          if (onVideoEnd) onVideoEnd();
        }}
        config={{
          file: {
            attributes: {
              preload: "auto",
              controlsList: "nodownload",
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
        <div className="absolute top-2 left-2 bg-purple-600 text-white px-3 py-1 rounded-full text-sm z-10 shadow-lg">
          ⏯️ Resume {Math.floor(savedProgress / 60)}:
          {Math.floor(savedProgress % 60).toString().padStart(2, "0")}
        </div>
      )}
    </div>
  );
};

export default VideoPlayer;