import nodemailer from 'nodemailer';

let transporter = null;

const initTransporter = () => {
  if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) {
    try {
      transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: parseInt(process.env.SMTP_PORT || '587', 10),
        secure: process.env.SMTP_SECURE === 'true',
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS,
        },
      });
      console.log('✅ SMTP Transporter initialized');
    } catch (e) {
      console.warn('⚠️ Could not initialize SMTP Transporter:', e.message);
    }
  }
};

initTransporter();

export const sendOtpEmail = async (toEmail, userName, otpCode) => {
  const fromAddress = process.env.EMAIL_FROM || '"Attendly Security" <security@attendly.app>';
  const subject = `Your Password Reset OTP: ${otpCode}`;

  const htmlContent = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #0f172a; color: #f8fafc; margin: 0; padding: 20px; }
          .card { max-width: 520px; margin: 0 auto; background-color: #1e293b; border-radius: 16px; border: 1px solid #334155; padding: 32px; box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.5); }
          .logo { text-align: center; margin-bottom: 24px; }
          .logo-badge { display: inline-block; background: linear-gradient(135deg, #6366f1, #a855f7); color: white; font-weight: bold; font-size: 20px; padding: 10px 24px; border-radius: 12px; }
          .title { font-size: 22px; font-weight: 700; color: #ffffff; text-align: center; margin-bottom: 8px; }
          .subtitle { color: #94a3b8; text-align: center; font-size: 14px; margin-bottom: 24px; }
          .otp-box { background-color: #0f172a; border: 2px dashed #6366f1; border-radius: 12px; padding: 20px; text-align: center; margin: 24px 0; }
          .otp-code { font-size: 36px; font-weight: 800; letter-spacing: 8px; color: #818cf8; font-family: monospace; }
          .notice { background-color: rgba(234, 179, 8, 0.1); border-left: 4px solid #eab308; padding: 12px 16px; border-radius: 6px; margin: 20px 0; font-size: 13px; color: #fef08a; }
          .folder-guide { background-color: #0f172a; border-radius: 10px; padding: 16px; margin-top: 20px; font-size: 13px; color: #cbd5e1; }
          .footer { text-align: center; margin-top: 24px; font-size: 12px; color: #64748b; }
        </style>
      </head>
      <body>
        <div class="card">
          <div class="logo">
            <span class="logo-badge">Attendly</span>
          </div>
          <h1 class="title">Password Reset Verification</h1>
          <p class="subtitle">Hello ${userName || 'User'}, we received a request to reset your password.</p>
          
          <div class="otp-box">
            <div style="font-size: 12px; color: #94a3b8; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 6px;">Your 6-Digit One-Time Code</div>
            <div class="otp-code">${otpCode}</div>
            <div style="font-size: 12px; color: #64748b; margin-top: 6px;">Expires in 10 minutes</div>
          </div>

          <div class="notice">
            <strong>Important:</strong> If you did not request this password reset, please ignore this email or notify your system administrator immediately.
          </div>

          <div class="folder-guide">
            <strong>Where to find this code:</strong>
            <ul style="margin: 8px 0 0 0; padding-left: 20px; line-height: 1.6;">
              <li><strong>Primary Inbox:</strong> Under "Attendly Security"</li>
              <li><strong>Spam / Junk Folder:</strong> Automated emails can sometimes be filtered by Gmail, Outlook, or Yahoo into Spam or Junk folders. Click "Report Not Spam" to ensure future delivery.</li>
              <li><strong>Promotions / Updates Tab:</strong> Check categorized mailbox tabs.</li>
            </ul>
          </div>

          <div class="footer">
            &copy; ${new Date().getFullYear()} Attendly Workforce Attendance & Communications System. All rights reserved.
          </div>
        </div>
      </body>
    </html>
  `;

  if (transporter) {
    try {
      const info = await transporter.sendMail({
        from: fromAddress,
        to: toEmail,
        subject,
        html: htmlContent,
        text: `Your Attendly Password Reset OTP code is: ${otpCode}. It will expire in 10 minutes. If you did not request this, please ignore this email. Check Spam/Junk folder if not in primary inbox.`,
      });
      console.log(`📧 Reset OTP Email sent to ${toEmail}: ${info.messageId}`);
      return { sent: true, messageId: info.messageId };
    } catch (err) {
      console.error(`❌ Failed to send reset email to ${toEmail}:`, err.message);
      return { sent: false, error: err.message };
    }
  } else {
    console.log(`ℹ️ [Email Dispatch Simulation] OTP for ${toEmail}: ${otpCode}`);
    return { sent: false, simulated: true, otp: otpCode };
  }
};
