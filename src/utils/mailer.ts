import nodemailer from "nodemailer";

// 1. Create the Transporter (The "Connection" to Gmail)
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

export const sendOtpEmail = async (email: string, otp: string) => {
  try {
    // 2. Send the mail using your Gmail account
    const info = await transporter.sendMail({
      from: `"Asciente Hub" <${process.env.EMAIL_USER}>`,
      to: email, // This can now be ANY email (Buyer, Dev, etc.)
      subject: "Verify Your Account - Asciente Hub",
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 10px;">
          <h2 style="color: #333; text-align: center;">Asciente Hub</h2>
          <hr style="border: 0; border-top: 1px solid #eee;" />
          <p>Hello,</p>
          <p>Thank you for joining <strong>Asciente Hub</strong>. Please use the verification code below to complete your registration:</p>
          <div style="text-align: center; margin: 30px 0;">
            <span style="font-size: 32px; font-weight: bold; letter-spacing: 5px; color: #4A90E2; background: #f4f7fa; padding: 10px 20px; border-radius: 5px;">
              ${otp}
            </span>
          </div>
          <p style="font-size: 12px; color: #777;">This code is valid for 15 minutes. If you did not request this, please ignore this email.</p>
          <hr style="border: 0; border-top: 1px solid #eee;" />
          <p style="font-size: 10px; color: #aaa; text-align: center;">
            © 2026 Asciente Hub | Baguio City, Philippines
          </p>
        </div>
      `,
    });

    console.log("📧 Email sent via Nodemailer:", info.messageId);
    return info;
  } catch (error) {
    console.error("❌ Nodemailer failed:", error);
    throw error;
  }
};
