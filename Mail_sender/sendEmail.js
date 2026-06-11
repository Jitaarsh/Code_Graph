import nodemailer from "nodemailer";

const sendEmail = async ({ to, subject, html, attachments = [] }) => {
  const host = process.env.SMTP_HOST || process.env.EMAIL_HOST;
  const port = Number(process.env.SMTP_PORT || process.env.EMAIL_PORT || 587);
  const user = process.env.SMTP_USER || process.env.EMAIL_USER;
  const pass = process.env.SMTP_PASS || process.env.EMAIL_PASS;
  const from = process.env.SMTP_FROM || process.env.EMAIL_FROM;

  const transporter = nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: { user, pass },
    tls: { rejectUnauthorized: false },
  });

  // Wrap the sending process in a try-catch block
  try {
    const info = await transporter.sendMail({
      from,
      to,
      subject,
      html,
      attachments,
    });
    console.log("✉️ Email sent successfully:", info.messageId);
    return info;
  } catch (error) {
    // This will print the exact reason for the 500 error in your console
    console.error("❌ Nodemailer Error Details:", error);
    throw error; // Re-throw so your API controller knows it failed
  }
};

export default sendEmail;