/**
 * Utilitaires d'envoi d'emails (Nodemailer)
 */
import nodemailer from 'nodemailer';

const hasSmtpConfig = !!(process.env.SMTP_USER && process.env.SMTP_PASS);

const transporter = hasSmtpConfig
  ? nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: parseInt(process.env.SMTP_PORT) || 587,
      secure: false,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
      }
    })
  : null;

export const sendVerificationEmail = async (email, token, baseUrl) => {
  if (!transporter) {
    console.warn('Email de vérification ignoré (SMTP non configuré)');
    return;
  }
  const url = `${baseUrl}/verify-email?token=${token}`;
  await transporter.sendMail({
    from: process.env.EMAIL_FROM || '"Dating App" <noreply@dating.app>',
    to: email,
    subject: 'Vérifiez votre email',
    html: `<p>Cliquez pour vérifier : <a href="${url}">${url}</a></p>`
  });
};

export const sendPasswordResetEmail = async (email, token, baseUrl) => {
  if (!transporter) {
    console.warn('Email de réinitialisation ignoré (SMTP non configuré)');
    return;
  }
  const url = `${baseUrl}/reset-password?token=${token}`;
  await transporter.sendMail({
    from: process.env.EMAIL_FROM || '"Dating App" <noreply@dating.app>',
    to: email,
    subject: 'Réinitialisation du mot de passe',
    html: `<p>Lien de réinitialisation : <a href="${url}">${url}</a></p><p>Expire dans 1h.</p>`
  });
};
