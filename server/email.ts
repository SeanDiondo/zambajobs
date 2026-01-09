import { getUncachableResendClient } from './resend-client';
import crypto from 'crypto';

const ADMIN_EMAIL = 'admin@zambajobs.digital';

async function sendEmail(to: string, subject: string, html: string): Promise<void> {
  console.log('DEBUG: sendEmail called with:', { to, subject });
  
  try {
    const { client, fromEmail } = await getUncachableResendClient();
    
    console.log(`Attempting to send email from ${fromEmail} to ${to}...`);
    
    const result = await client.emails.send({
      from: fromEmail,
      to,
      subject,
      html,
    });
    
    console.log(`✅ Email sent successfully! ID: ${result.data?.id}, From: ${fromEmail}, To: ${to}, Subject: ${subject}`);
  } catch (error: any) {
    console.log('❌ Failed to send email:', error.message);
    console.log('❌ Full error details:', error);
    throw error;
  }
}

export function generateOTP(): string {
  return crypto.randomInt(100000, 1000000).toString();
}

export async function sendOTPEmail(
  email: string,
  otp: string,
  firstName?: string
): Promise<void> {
  // Log OTP for easy access during testing if email fails
  console.log(`[AUTH] Verification code for ${email}: ${otp}`);

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #EAB308 0%, #F59E0B 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
        .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px; }
        .otp-box { background: white; border: 2px dashed #EAB308; border-radius: 8px; padding: 20px; text-align: center; margin: 20px 0; }
        .otp-code { font-size: 32px; font-weight: bold; color: #EAB308; letter-spacing: 8px; }
        .footer { text-align: center; margin-top: 20px; font-size: 12px; color: #666; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>🔐 ZambaJobs Verification Code</h1>
        </div>
        <div class="content">
          <p>Hi${firstName ? ` ${firstName}` : ''},</p>
          <p>Your verification code for ZambaJobs is:</p>
          
          <div class="otp-box">
            <div class="otp-code">${otp}</div>
          </div>
          
          <p><strong>This code will expire in 10 minutes.</strong></p>
          <p>If you didn't request this code, please ignore this email.</p>
          
          <p>Need help? Contact us at support@zambajobs.digital</p>
        </div>
        <div class="footer">
          <p>© 2025 ZambaJobs. Connecting talent with opportunity in the Philippines.</p>
        </div>
      </div>
    </body>
    </html>
  `;
  
  await sendEmail(email, 'Your ZambaJobs Verification Code', html);
}

export async function sendPasswordResetEmail(
  email: string,
  token: string,
  firstName?: string
): Promise<void> {
  const resetUrl = `${process.env.APP_URL || 'http://localhost:5000'}/reset-password?token=${token}`;
  
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #EAB308 0%, #F59E0B 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
        .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px; }
        .button { display: inline-block; background: #EAB308; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: bold; margin: 20px 0; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>🔑 Password Reset Request</h1>
        </div>
        <div class="content">
          <p>Hi${firstName ? ` ${firstName}` : ''},</p>
          <p>We received a request to reset your password. Click the button below to set a new password:</p>
          
          <p style="text-align: center;">
            <a href="${resetUrl}" class="button">Reset Password</a>
          </p>
          
          <p><strong>This link will expire in 1 hour.</strong></p>
          <p>If you didn't request a password reset, please ignore this email and your password will remain unchanged.</p>
        </div>
      </div>
    </body>
    </html>
  `;
  
  await sendEmail(email, 'Reset your ZambaJobs password', html);
}

export async function sendFraudAlertEmail(
  alertType: string,
  description: string,
  entityType: string,
  entityId: string,
  confidence: number
): Promise<void> {
  const dashboardUrl = `${process.env.APP_URL || 'http://localhost:5000'}/admin/fraud-detection`;
  
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #DC2626 0%, #EF4444 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
        .content { background: #fff; padding: 30px; border: 2px solid #DC2626; border-radius: 0 0 8px 8px; }
        .alert-box { background: #FEE2E2; border-left: 4px solid #DC2626; padding: 15px; margin: 20px 0; }
        .confidence { font-size: 24px; font-weight: bold; color: #DC2626; }
        .button { display: inline-block; background: #DC2626; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: bold; margin: 20px 0; }
        ul { background: #f9f9f9; padding: 20px; border-radius: 6px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>🚨 URGENT: Fraud Detection Alert</h1>
        </div>
        <div class="content">
          <div class="alert-box">
            <p><strong>⚠️ The AI fraud detection system has flagged potentially fraudulent activity that requires immediate review.</strong></p>
          </div>
          
          <h3>Alert Details:</h3>
          <ul>
            <li><strong>Alert Type:</strong> ${alertType}</li>
            <li><strong>Entity Type:</strong> ${entityType}</li>
            <li><strong>Entity ID:</strong> ${entityId}</li>
            <li><strong>AI Confidence:</strong> <span class="confidence">${confidence}%</span></li>
          </ul>
          
          <h3>Description:</h3>
          <p>${description}</p>
          
          <p style="text-align: center;">
            <a href="${dashboardUrl}" class="button">Review in Admin Dashboard</a>
          </p>
          
          <p><strong>Recommended Action:</strong> Please review this alert immediately and take appropriate action (flag account, suspend listing, or dismiss if false positive).</p>
        </div>
      </div>
    </body>
    </html>
  `;
  
  await sendEmail(ADMIN_EMAIL, `🚨 Fraud Alert: ${alertType} (${confidence}% confidence)`, html);
}

export async function sendApplicationStatusEmail(
  email: string,
  jobTitle: string,
  status: string,
  firstName?: string
): Promise<void> {
  const statusMessages = {
    reviewing: "is being reviewed",
    shortlisted: "has been shortlisted! 🎉",
    rejected: "was not selected this time",
    accepted: "has been accepted! 🎉 Congratulations!",
  };

  const message = statusMessages[status as keyof typeof statusMessages] || "has been updated";
  
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #EAB308 0%, #F59E0B 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
        .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>📋 Application Status Update</h1>
        </div>
        <div class="content">
          <p>Hi${firstName ? ` ${firstName}` : ''},</p>
          <p>Your application for <strong>${jobTitle}</strong> ${message}.</p>
          <p>Log in to your ZambaJobs account to view more details.</p>
        </div>
      </div>
    </body>
    </html>
  `;
  
  await sendEmail(email, `Application Update: ${jobTitle}`, html);
}
