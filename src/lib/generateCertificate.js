// lib/generateCertificate.js
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import CertificateTemplate from "@/components/CertificateTemplate";

export const generateCertificatePDF = async (userData, courseData) => {
  try {
    const certificateId = `CERT-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    const html = CertificateTemplate({
      userName: userData.name || userData.email?.split('@')[0] || "Student",
      courseName: courseData.title || "Course Completion",
      date: new Date().toISOString(),
      certificateId
    });
    
    const container = document.createElement('div');
    container.innerHTML = html;
    container.style.position = 'absolute';
    container.style.left = '-9999px';
    container.style.top = '-9999px';
    document.body.appendChild(container);
    
    // Convert to canvas - lower scale for smaller file
    const canvas = await html2canvas(container, {
      scale: 1.2, // Reduce from 1.5 to 1.2
      backgroundColor: '#ffffff',
      logging: false,
      allowTaint: true,
      useCORS: true
    });
    
    document.body.removeChild(container);
    
    // Create PDF with compression
    const pdf = new jsPDF({
      orientation: 'landscape',
      unit: 'px',
      format: [canvas.width * 0.75, canvas.height * 0.75],
      compress: true
    });
    
    // Use JPEG with lower quality for smaller size
    pdf.addImage(
      canvas.toDataURL('image/jpeg', 0.7), // 70% quality
      'JPEG',
      0,
      0,
      canvas.width * 0.75,
      canvas.height * 0.75
    );
    
    const pdfBlob = pdf.output('blob');
    console.log(`📄 PDF Size: ${(pdfBlob.size / 1024 / 1024).toFixed(2)} MB`);
    
    return {
      pdf: pdfBlob,
      certificateId,
      pdfUrl: URL.createObjectURL(pdfBlob)
    };
  } catch (error) {
    console.error("Certificate generation error:", error);
    throw error;
  }
};