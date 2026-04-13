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
    from: process.env.EMAIL_FROM || '"Haitz Rencontre" <noreply@haitz.app>',
    to: email,
    subject: 'Réinitialisation de votre mot de passe - Haitz Rencontre',
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
        <h2 style="color: #f43f5e; text-align: center;">Récupération de compte</h2>
        <p>Vous avez demandé la réinitialisation de votre mot de passe. Voici votre code de sécurité :</p>
        <div style="background: #fff1f2; padding: 20px; text-align: center; border-radius: 8px; margin: 20px 0; border: 1px solid #fecdd3;">
          <h1 style="letter-spacing: 12px; margin: 0; color: #881337;">${code}</h1>
        </div>
        <p style="color: #666; font-size: 14px;">Ce code expire dans 10 minutes. Si vous n'êtes pas à l'origine de cette demande, vous pouvez ignorer cet e-mail en toute sécurité.</p>
        <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;" />
        <p style="text-align: center; color: #999; font-size: 12px;">© 2024 Haitz Rencontre. Sécurité & Confidentialité.</p>
      </div>
    `
  });
};

export const sendSignupCodeEmail = async (email, code) => {
  if (!transporter) {
    console.warn('Signup code email skipped (SMTP not configured)');
    return;
  }

  await transporter.sendMail({
    from: process.env.EMAIL_FROM || '"Haitz Rencontre" <noreply@haitz.app>',
    to: email,
    subject: 'Votre code de validation - Haitz Rencontre',
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
        <h2 style="color: #6366f1; text-align: center;">Bienvenue sur Haitz Rencontre</h2>
        <p>Merci de votre inscription. Voici votre code de validation à usage unique :</p>
        <div style="background: #f4f4f9; padding: 20px; text-align: center; border-radius: 8px; margin: 20px 0;">
          <h1 style="letter-spacing: 12px; margin: 0; color: #1e1b4b;">${code}</h1>
        </div>
        <p style="color: #666; font-size: 14px;">Ce code expire dans 10 minutes. Si vous n'êtes pas à l'origine de cette demande, ignorez cet e-mail.</p>
        <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;" />
        <p style="text-align: center; color: #999; font-size: 12px;">© 2024 Haitz Rencontre. Tous droits réservés.</p>
      </div>
    `
  });
};
