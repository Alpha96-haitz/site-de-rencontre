/**
 * Email helpers (Nodemailer)
 */
import nodemailer from 'nodemailer';

const hasSmtpConfig = !!(process.env.SMTP_USER && process.env.SMTP_PASS);

export const isSmtpConfigured = () => hasSmtpConfig;

const transporter = hasSmtpConfig
  ? nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: parseInt(process.env.SMTP_PORT, 10) || 587,
      secure: false,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
      }
    })
  : null;

export const sendVerificationEmail = async (email, token, baseUrl) => {
  if (!transporter) {
    console.warn('Verification email skipped (SMTP not configured)');
    return;
  }

  const url = `${baseUrl}/verify-email?token=${token}`;
  await transporter.sendMail({
    from: process.env.EMAIL_FROM || '"Dating App" <noreply@dating.app>',
    to: email,
    subject: 'Verify your email',
    html: `<p>Click to verify your email: <a href="${url}">${url}</a></p>`
  });
};

export const sendPasswordResetEmail = async (email, token, baseUrl) => {
  if (!transporter) {
    console.warn('Password reset email skipped (SMTP not configured)');
    return;
  }

  const url = `${baseUrl}/reset-password?token=${token}`;
  await transporter.sendMail({
    from: process.env.EMAIL_FROM || '"Dating App" <noreply@dating.app>',
    to: email,
    subject: 'Password reset link',
    html: `<p>Reset link: <a href="${url}">${url}</a></p><p>Expires in 1 hour.</p>`
  });
};

export const sendPasswordResetCodeEmail = async (email, code) => {
  if (!transporter) {
    console.warn('Password reset code skipped (SMTP not configured)');
    return;
  }

  await transporter.sendMail({
    from: process.env.EMAIL_FROM || '"Dating App" <noreply@dating.app>',
    to: email,
    subject: 'Password reset code',
    html: `<p>Your password reset code:</p><h2 style="letter-spacing: 6px;">${code}</h2><p>This code expires in 10 minutes.</p>`
  });
};
