// src/services/progressService.js
import { doc, setDoc, getDoc, serverTimestamp, collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../config/firebase';

// Video progress save karo
export const saveVideoProgress = async (userId, courseId, videoId, lastWatchedSeconds, duration) => {
  try {
    const docId = `${userId}_${courseId}_${videoId}`;
    const progressRef = doc(db, 'userProgress', docId);
    
    // Calculate progress percentage
    const progressPercent = (lastWatchedSeconds / duration) * 100;
    const isCompleted = progressPercent > 90; // 90% se zyada to complete
    
    await setDoc(progressRef, {
      userId,
      courseId,
      videoId,
      lastWatched: new Date().toISOString(),
      lastWatchedSeconds,
      duration,
      progress: progressPercent,
      completed: isCompleted,
      updatedAt: serverTimestamp()
    }, { merge: true });
    
    console.log('✅ Progress saved:', progressPercent.toFixed(2) + '%');
    return true;
  } catch (error) {
    console.error('❌ Error saving progress:', error);
    return false;
  }
};

// Video ka last position load karo
export const getLastWatchedPosition = async (userId, courseId, videoId) => {
  try {
    const docId = `${userId}_${courseId}_${videoId}`;
    const progressRef = doc(db, 'userProgress', docId);
    const progressSnap = await getDoc(progressRef);
    
    if (progressSnap.exists()) {
      const data = progressSnap.data();
      return {
        lastWatchedSeconds: data.lastWatchedSeconds || 0,
        progress: data.progress || 0,
        completed: data.completed || false
      };
    }
    return { lastWatchedSeconds: 0, progress: 0, completed: false };
  } catch (error) {
    console.error('❌ Error getting progress:', error);
    return { lastWatchedSeconds: 0, progress: 0, completed: false };
  }
};

// User ka course progress fetch karo
export const getUserCourseProgress = async (userId, courseId) => {
  try {
    const q = query(
      collection(db, 'userProgress'),
      where('userId', '==', userId),
      where('courseId', '==', courseId)
    );
    
    const querySnapshot = await getDocs(q);
    const videos = [];
    let totalProgress = 0;
    
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      videos.push({
        videoId: data.videoId,
        progress: data.progress || 0,
        completed: data.completed || false,
        lastWatchedSeconds: data.lastWatchedSeconds || 0
      });
      totalProgress += data.progress || 0;
    });
    
    const avgProgress = videos.length > 0 ? totalProgress / videos.length : 0;
    
    return {
      videos,
      totalVideos: videos.length,
      averageProgress: avgProgress,
      completedVideos: videos.filter(v => v.completed).length
    };
  } catch (error) {
    console.error('❌ Error fetching course progress:', error);
    return null;
  }
};