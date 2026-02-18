// components/CertificateTemplate.js
"use client";

const CertificateTemplate = ({ userName, courseName, date, certificateId }) => {
  const formattedDate = new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;700&family=Poppins:wght@300;400;600&display=swap');
        
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }
        
        body {
          font-family: 'Poppins', sans-serif;
          background: #f0f2f5;
          display: flex;
          justify-content: center;
          align-items: center;
          min-height: 100vh;
          padding: 20px;
        }
        
        .certificate {
          width: 1100px;
          max-width: 100%;
          background: white;
          border-radius: 30px;
          box-shadow: 0 30px 50px rgba(0,0,0,0.2);
          overflow: hidden;
          position: relative;
        }
        
        /* Gold Border */
        .certificate-border {
          padding: 25px;
          background: linear-gradient(135deg, #BF953F, #FCF6BA, #B38728, #FBF5B7, #AA771C);
        }
        
        .certificate-content {
          background: white;
          padding: 50px 40px;
          position: relative;
          border: 2px dashed #BF953F;
        }
        
        /* Background Pattern */
        .certificate-content::before {
          content: "";
          position: absolute;
          top: 20px;
          left: 20px;
          right: 20px;
          bottom: 20px;
          background: url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" opacity="0.03"><path fill="%23BF953F" d="M50 15 L61 40 L88 42 L67 58 L72 85 L50 72 L28 85 L33 58 L12 42 L39 40 Z"/></svg>');
          background-repeat: repeat;
          pointer-events: none;
        }
        
        .header {
          text-align: center;
          margin-bottom: 30px;
          position: relative;
        }
        
        .logo {
          font-size: 48px;
          font-weight: 700;
          font-family: 'Playfair Display', serif;
          color: #7607B3;
          letter-spacing: 2px;
        }
        
        .logo span {
          color: #D2640D;
        }
        
        .subtitle {
          font-size: 14px;
          color: #666;
          text-transform: uppercase;
          letter-spacing: 5px;
          margin-top: 5px;
        }
        
        .medal-icon {
          width: 80px;
          height: 80px;
          margin: 20px auto;
          background: linear-gradient(135deg, #BF953F, #FCF6BA, #B38728);
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 40px;
          color: white;
        }
        
        .certificate-title {
          font-size: 42px;
          font-family: 'Playfair Display', serif;
          font-weight: 700;
          color: #1a1a1a;
          text-align: center;
          margin: 20px 0 10px;
          text-transform: uppercase;
          letter-spacing: 3px;
        }
        
        .presented-to {
          font-size: 18px;
          color: #666;
          text-align: center;
          margin: 10px 0;
          text-transform: uppercase;
        }
        
      .student-name {
  font-size: 48px;
  font-weight: 700;
  color: #7607B3;
  text-align: center;
  margin: 15px auto;
  font-family: 'Playfair Display', serif;
  border-bottom: 3px solid #D2640D;
  border-top: 3px solid #D2640D;
  padding: 20px 0;
  display: block;
  width: fit-content;
  min-width: 60%;
  max-width: 90%;
  line-height: 1.2;
  word-break: break-word; /* ✅ Long names ko break karega */
}

        
        .course-name {
          font-size: 32px;
          color: #D2640D;
          text-align: center;
          margin: 20px 0;
          font-weight: 600;
        }
        
        .achievement-text {
          font-size: 16px;
          color: #555;
          text-align: center;
          max-width: 600px;
          margin: 20px auto;
          line-height: 1.8;
        }
        
        .details-grid {
          display: flex;
          justify-content: space-between;
          margin: 40px 0 20px;
          padding: 0 30px;
        }
        
        .detail-item {
          text-align: center;
          flex: 1;
        }
        
        .detail-label {
          font-size: 12px;
          color: #999;
          text-transform: uppercase;
          letter-spacing: 2px;
        }
        
        .detail-value {
          font-size: 18px;
          font-weight: 600;
          color: #333;
          margin-top: 5px;
        }
        
        .signature-section {
          display: flex;
          justify-content: space-between;
          margin: 50px 0 20px;
          padding: 0 50px;
        }
        
        .signature {
          text-align: center;
        }
        
        .signature-line {
          width: 200px;
          height: 2px;
          background: #333;
          margin-bottom: 5px;
        }
        
        .signature-title {
          font-size: 14px;
          color: #666;
        }
        
        .certificate-id {
          text-align: center;
          font-size: 12px;
          color: #999;
          margin-top: 30px;
        }
        
        .qr-code {
          text-align: center;
          margin: 20px 0;
        }
        
        .footer {
          text-align: center;
          font-size: 12px;
          color: #999;
          margin-top: 20px;
        }
      </style>
    </head>
    <body>
      <div class="certificate">
        <div class="certificate-border">
          <div class="certificate-content">
            <div class="header">
              <div class="logo">LMS<span>Demo</span></div>
              <div class="subtitle">Certificate of Excellence</div>
            </div>
            
            <div class="medal-icon">🏆</div>
            
            <div class="certificate-title">Certificate of Completion</div>
            
            <div class="presented-to">Presented to</div>
            
            <div class="student-name">${userName}</div>
            
            <div class="course-name">${courseName}</div>
            
            <div class="achievement-text">
              For successfully completing all course requirements<br>
              and demonstrating outstanding commitment to learning
            </div>
            
            <div class="details-grid">
              <div class="detail-item">
                <div class="detail-label">Date</div>
                <div class="detail-value">${formattedDate}</div>
              </div>
              <div class="detail-item">
                <div class="detail-label">Certificate ID</div>
                <div class="detail-value">${certificateId}</div>
              </div>
              <div class="detail-item">
                <div class="detail-label">Duration</div>
                <div class="detail-value">Full Course</div>
              </div>
            </div>
            
            <div class="signature-section">
              <div class="signature">
                <div class="signature-line"></div>
                <div class="signature-title">Instructor</div>
              </div>
              <div class="signature">
                <div class="signature-line"></div>
                <div class="signature-title">Director</div>
              </div>
            </div>
            
            <div class="certificate-id">
              #${certificateId}
            </div>
            
            <div class="footer">
              This certificate is issued by LMS Demo and is verifiable online
            </div>
          </div>
        </div>
      </div>
    </body>
    </html>
  `;
};

export default CertificateTemplate;