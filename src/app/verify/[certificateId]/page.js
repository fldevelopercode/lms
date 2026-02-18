// app/verify/[certificateId]/page.js
"use client";

import { useEffect, useState } from "react";
import { verifyCertificate } from "@/lib/firebaseCertificates";
import { useParams } from "next/navigation";

export default function VerifyPage() {
  const { certificateId } = useParams();
  const [verified, setVerified] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const verify = async () => {
      const result = await verifyCertificate(certificateId);
      setVerified(result);
      setLoading(false);
    };
    verify();
  }, [certificateId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 p-8 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#7607B3]"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-md mx-auto bg-white rounded-xl shadow-lg p-8 text-center">
        {verified ? (
          <>
            <div className="text-6xl mb-4">✅</div>
            <h1 className="text-2xl font-bold text-green-600 mb-2">
              Certificate Verified!
            </h1>
            <p className="text-gray-600">
              This certificate is authentic and issued by LMS Demo.
            </p>
          </>
        ) : (
          <>
            <div className="text-6xl mb-4">❌</div>
            <h1 className="text-2xl font-bold text-red-600 mb-2">
              Invalid Certificate
            </h1>
            <p className="text-gray-600">
              This certificate could not be verified in our system.
            </p>
          </>
        )}
      </div>
    </div>
  );
}