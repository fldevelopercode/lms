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
  const lastSavedTimeRef = useRef(0);
  const saveTimeoutRef = useRef(null); // 🔥 NEW: Debounce saves

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      console.log("🔥 Auth state changed:", user?.email);
      setUser(user);
    });
    return () => unsubscribe();
  }, []);

  // Load progress from Firestore
  useEffect(() => {
    const loadProgress = async () => {
      if (!user || !videoId || !courseId) {
        console.log("⏳ Waiting for user...");
        return;
      }

      try {
        console.log(`📥 Loading progress for ${videoId}...`);
        const progressDoc = doc(db, "userProgress", `${user.uid}_${courseId}_${videoId}`);
        const docSnap = await getDoc(progressDoc);
        
        if (docSnap.exists()) {
          const data = docSnap.data();
          const time = data.currentTime || 0;
          const completed = data.completed || false;
          
          console.log(`✅ Loaded: ${time}s, completed: ${completed}`);
          setSavedProgress(time);
          localStorage.setItem(`progress-${videoId}`, JSON.stringify({ time, completed }));
          lastSavedTimeRef.current = time;
        } else {
          const cached = localStorage.getItem(`progress-${videoId}`);
          if (cached) {
            const { time } = JSON.parse(cached);
            console.log(`📦 Cache: ${time}s`);
            setSavedProgress(time);
            lastSavedTimeRef.current = time;
          }
        }
      } catch (error) {
        console.error("❌ Error loading progress:", error);
      }
    };

    loadProgress();
  }, [user, videoId, courseId]);

  // Reset for new video
  useEffect(() => {
    setPlayerReady(false);
    setIsBuffering(true);
    progressSetRef.current = false;
    lastSavedTimeRef.current = 0;
    
    // Clear any pending save
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }
  }, [videoId]);

  // Set video position
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

  // 🔥 FIXED: Debounced save function
  const saveProgress = async (currentTime, duration) => {
    // 🔥 CRITICAL: Check user on every save
    if (!auth.currentUser || !videoId || !courseId) {
      console.log("⏭️ No user, skipping save");
      return;
    }

    // Debounce to prevent too many saves
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    saveTimeoutRef.current = setTimeout(async () => {
      try {
        const currentUser = auth.currentUser;
        if (!currentUser) return;

        const isCompleted = currentTime / duration > 0.95;
        
        // Check if we should save (every 5 seconds or on complete)
        if (Math.floor(currentTime) % 5 === 0 || isCompleted) {
          const progressRef = doc(db, "userProgress", `${currentUser.uid}_${courseId}_${videoId}`);
          
          // Check existing data
          const docSnap = await getDoc(progressRef);
          const existingCompleted = docSnap.exists() ? docSnap.data().completed : false;
          
          // Don't downgrade completed status
          if (existingCompleted && !isCompleted) {
            console.log(`⏭️ Already completed, skipping`);
            return;
          }
          
          const finalCompleted = isCompleted || existingCompleted;
          
          await setDoc(progressRef, {
            userId: currentUser.uid,
            courseId,
            videoId,
            currentTime,
            duration,
            completed: finalCompleted,
            lastWatched: new Date().toISOString()
          }, { merge: true });
          
          localStorage.setItem(`progress-${videoId}`, JSON.stringify({ 
            time: currentTime,
            completed: finalCompleted 
          }));
          
          lastSavedTimeRef.current = currentTime;
          console.log(`💾 Saved: ${Math.floor(currentTime)}s`);
        }
      } catch (error) {
        console.error("❌ Save error:", error);
      }
    }, 1000); // Wait 1 second before saving
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
          if (auth.currentUser) {
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