// lib/firebaseCertificates.js - FIXED WITH NEW CDN URL
import { db } from "./firebase";
import { collection, addDoc, query, where, getDocs, updateDoc, doc } from "firebase/firestore";

// 🔥 Your Bunny.net credentials
const BUNNY_PASSWORD = "42269309-ee85-49a8-908257202a36-a308-4ebd";
const BUNNY_STORAGE_ZONE = "lms-certificates";
const BUNNY_REGION = "de";

// ✅ NEW - Use your pull zone URL
const BUNNY_CDN_URL = "https://lms-certificates-pull.b-cdn.net";
const BUNNY_STORAGE_URL = "https://storage.bunnycdn.com";

const uploadToBunny = async (fileName, pdfBlob) => {
  if (!BUNNY_PASSWORD) {
    console.error("❌ Bunny.net password missing!");
    throw new Error("Bunny.net API key not configured");
  }

  try {
    // Upload to storage
    const url = `${BUNNY_STORAGE_URL}/${BUNNY_STORAGE_ZONE}/${fileName}`;
    console.log("📤 Uploading to:", url);
    
    const response = await fetch(url, {
      method: 'PUT',
      headers: {
        'AccessKey': BUNNY_PASSWORD.trim(),
        'Content-Type': 'application/pdf',
      },
      body: pdfBlob
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("❌ Upload failed:", response.status, errorText);
      throw new Error(`Upload failed: ${response.status}`);
    }

    // ✅ Return CDN URL from pull zone
    const cdnUrl = `${BUNNY_CDN_URL}/${fileName}`;
    console.log("✅ Upload successful:", cdnUrl);
    return cdnUrl;
    
  } catch (error) {
    console.error("❌ Upload error:", error);
    throw error;
  }
};

// ✅ FIXED: saveCertificate function
export const saveCertificate = async (userId, courseId, certificateId, pdfBlob) => {
  try {
    console.log("📄 Saving certificate for user:", userId);
    
    const fileName = `certificates/${userId}/${courseId}/${certificateId}.pdf`;
    const pdfUrl = await uploadToBunny(fileName, pdfBlob);
    
    const certificateData = {
      userId,
      courseId,
      certificateId,
      pdfUrl,
      issuedAt: new Date().toISOString(),
      validUntil: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
      verified: false,
      storage: "bunny"
    };
    
    const docRef = await addDoc(collection(db, "certificates"), certificateData);
    console.log("✅ Certificate saved to Firestore:", docRef.id);
    return { id: docRef.id, ...certificateData };
    
  } catch (error) {
    console.error("❌ Error saving certificate:", error);
    throw error;
  }
};

// ✅ FIXED: hasCertificate function
export const hasCertificate = async (userId, courseId) => {
  try {
    console.log("🔍 Checking certificate for user:", userId, "course:", courseId);
    
    const q = query(
      collection(db, "certificates"),
      where("userId", "==", userId),
      where("courseId", "==", courseId)
    );
    
    const querySnapshot = await getDocs(q);
    const exists = !querySnapshot.empty;
    console.log("✅ Certificate exists:", exists);
    return exists;
    
  } catch (error) {
    console.error("❌ Error checking certificate:", error);
    return false;
  }
};

// ✅ FIXED: getUserCertificates function
export const getUserCertificates = async (userId) => {
  try {
    console.log("📚 Fetching certificates for user:", userId);
    
    const q = query(
      collection(db, "certificates"),
      where("userId", "==", userId)
    );
    
    const querySnapshot = await getDocs(q);
    console.log("📊 Found certificates:", querySnapshot.size);
    
    const certificates = [];
    querySnapshot.forEach((doc) => {
      console.log("📄 Certificate:", doc.id, doc.data());
      certificates.push({ id: doc.id, ...doc.data() });
    });
    
    return certificates;
    
  } catch (error) {
    console.error("❌ Error fetching certificates:", error);
    return [];
  }
};

// ✅ NEW: verifyCertificate function
export const verifyCertificate = async (certificateId) => {
  try {
    const q = query(
      collection(db, "certificates"),
      where("certificateId", "==", certificateId)
    );
    
    const querySnapshot = await getDocs(q);
    
    if (!querySnapshot.empty) {
      const certDoc = querySnapshot.docs[0];
      await updateDoc(doc(db, "certificates", certDoc.id), {
        verified: true,
        verifiedAt: new Date().toISOString()
      });
      return true;
    }
    return false;
    
  } catch (error) {
    console.error("❌ Error verifying certificate:", error);
    return false;
  }
};