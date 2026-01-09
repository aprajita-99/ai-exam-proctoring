import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.MAIL_USER,
    pass: process.env.MAIL_PASS,
  },
});

export const sendWelcomeEmail = async (to, name) => {
  await transporter.sendMail({
    from: `"AI Exam Platform" <${process.env.MAIL_USER}>`,
    to,
    subject: "Welcome to AI Exam Platform",
    html: `
      <h2>Welcome, ${name}!</h2>
      <p>Your admin account has been successfully created.</p>
      <p>You can now create and manage online tests securely.</p>
    `,
  });
};
