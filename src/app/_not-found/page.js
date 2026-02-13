"use client";

import { useEffect } from "react";
import { analytics } from "@/lib/firebase";

export default function NotFoundPage() {
  useEffect(() => {
    // Client-side safe code
    if (analytics) {
      console.log("Analytics ready on 404 page");
    }
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <h1 className="text-4xl font-bold text-[#7607B3]">404</h1>
      <p className="mt-4 text-lg text-gray-700">Page Not Found</p>
    </div>
  );
}
