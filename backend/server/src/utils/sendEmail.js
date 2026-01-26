import nodemailer from "nodemailer";
import dotenv from "dotenv";
dotenv.config();

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.MAIL_USER,
    pass: process.env.MAIL_PASS,
  },
});

export const sendAdminWelcomeEmail = async (to, name) => {
  try {
    await transporter.sendMail({
      from: `"ProCtrl Admin Team" <${process.env.MAIL_USER}>`,
      to,
      subject: "Welcome to ProCtrl - Admin Access Granted",
      html: `
        <div style="font-family: Arial, sans-serif; color: #333;">
          <h2 style="color: #4F46E5;">Welcome aboard, ${name}!</h2>
          <p>Your <strong>Admin</strong> account has been successfully created on ProCtrl.</p>
          <p>You now have full access to:</p>
          <ul>
            <li>Create and schedule secure exams</li>
            <li>Manage questions and candidate lists</li>
            <li>Monitor live exams with AI proctoring</li>
          </ul>
          <p>Get started by logging into your dashboard.</p>
          <br>
          <p>Best regards,<br>The ProCtrl Team</p>
        </div>
      `,
    });
    console.log(`Admin welcome email sent to ${to}`);
  } catch (error) {
    console.error("Error sending admin email:", error);
  }
};

export const sendCandidateWelcomeEmail = async (to, name) => {
  try {
    await transporter.sendMail({
      from: `"ProCtrl Exams" <${process.env.MAIL_USER}>`,
      to,
      subject: "Welcome to ProCtrl - Candidate Registration Successful",
      html: `
        <div style="font-family: Arial, sans-serif; color: #333;">
          <h2 style="color: #10B981;">Hi ${name},</h2>
          <p>Your <strong>Candidate</strong> account has been successfully registered on ProCtrl.</p>
          <p>You can now:</p>
          <ul>
            <li>Join assigned exams securely</li>
            <li>View your past attempts and scores</li>
          </ul>
          <p>Please ensure your webcam and microphone are working before joining any test.</p>
          <br>
          <p>Good luck!<br>The ProCtrl Team</p>
        </div>
      `,
    });
    console.log(`Candidate welcome email sent to ${to}`);
  } catch (error) {
    console.error("Error sending candidate email:", error);
  }
};

export const sendOTPEmail = async (to, otp) => {
  try {
    await transporter.sendMail({
      from: `"ProCtrl Security" <${process.env.MAIL_USER}>`,
      to,
      subject: "Your ProCtrl Verification Code",
      html: `
        <div style="font-family: Arial, sans-serif; color: #333; text-align: center;">
          <h2 style="color: #4F46E5;">Email Verification</h2>
          <p>Please use the following OTP (One-Time Password) to complete your registration:</p>
          <div style="margin: 20px 0;">
            <span style="font-size: 24px; font-weight: bold; letter-spacing: 5px; background-color: #f3f4f6; padding: 10px 20px; border-radius: 5px; border: 1px solid #ddd;">
              ${otp}
            </span>
          </div>
          <p>This code is valid for 10 minutes.</p>
          <p>If you didn't request this code, you can ignore this email.</p>
          <br>
          <p>The ProCtrl Team</p>
        </div>
      `,
    });
    console.log(`OTP email sent to ${to}`);
  } catch (error) {
    console.error("Error sending OTP email:", error);
  }
};
