const nodemailer = require("nodemailer");

const env = require("../config/env");

const transporter = nodemailer.createTransport({
  host: env.smtp.host,
  port: env.smtp.port,
  secure: env.smtp.secure,
  auth: {
    user: env.smtp.user,
    pass: env.smtp.password
  }
});

async function verifyEmailConnection() {
  await transporter.verify();

  console.log("Email service connected");
}

async function sendPasswordResetOtp(email, otp) {
  await transporter.sendMail({
    from: env.smtp.from,
    to: email,
    subject: "StockSense Password Reset OTP",

    text: `
Your StockSense password reset OTP is:

${otp}

This OTP is valid for 5 minutes.

If you did not request a password reset, you can safely ignore this email.
    `.trim(),

    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto;">
        <h2>StockSense Password Reset</h2>

        <p>You requested to reset your StockSense password.</p>

        <p>Your OTP is:</p>

        <div style="
          font-size: 32px;
          font-weight: bold;
          letter-spacing: 8px;
          margin: 24px 0;
        ">
          ${otp}
        </div>

        <p>
          This OTP is valid for <strong>5 minutes</strong>.
        </p>

        <p>
          If you did not request a password reset,
          you can safely ignore this email.
        </p>

        <hr />

        <small>
          StockSense Inventory Management System
        </small>
      </div>
    `
  });
}

module.exports = {
  verifyEmailConnection,
  sendPasswordResetOtp
};