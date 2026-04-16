/**
 * Email helpers (Nodemailer) - HAITZ Branding
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

/**
 * Premium HAITZ HTML Template Wrapper
 */
const wrapTemplate = (content, title) => `
  <!DOCTYPE html>
  <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; background-color: #0a0a0a; margin: 0; padding: 0; -webkit-font-smoothing: antialiased; }
        .wrapper { width: 100%; table-layout: fixed; background-color: #0a0a0a; padding-bottom: 40px; padding-top: 40px; }
        .main { background-color: #121212; margin: 0 auto; width: 100%; max-width: 600px; border-radius: 24px; border: 1px solid #222; overflow: hidden; shadow: 0 20px 50px rgba(0,0,0,0.5); }
        .header { background: linear-gradient(to right, #f43f5e, #e11d48); padding: 40px 20px; text-align: center; }
        .header h1 { color: #ffffff; margin: 0; font-size: 32px; font-weight: 900; letter-spacing: -1px; text-transform: uppercase; }
        .body { padding: 40px 30px; color: #cbd5e1; line-height: 1.6; font-size: 16px; }
        .body h2 { color: #ffffff; font-size: 24px; font-weight: 700; margin-top: 0; margin-bottom: 20px; }
        .code-box { background: #1a1a1a; border: 1px dashed #f43f5e; border-radius: 16px; padding: 30px; margin: 30px 0; text-align: center; }
        .code { font-size: 42px; font-weight: 900; color: #f43f5e; letter-spacing: 15px; margin: 0; }
        .button-wrapper { text-align: center; margin: 40px 0; }
        .button { background: linear-gradient(to right, #f43f5e, #e11d48); color: #ffffff !important; padding: 18px 36px; text-decoration: none; border-radius: 14px; font-weight: 800; font-size: 16px; display: inline-block; box-shadow: 0 10px 20px rgba(244, 63, 94, 0.3); }
        .footer { text-align: center; padding: 30px; color: #64748b; font-size: 12px; border-top: 1px solid #222; }
        .footer a { color: #f43f5e; text-decoration: none; font-weight: bold; }
        .link-text { color: #f43f5e; word-break: break-all; font-size: 12px; }
      </style>
    </head>
    <body>
      <div class="wrapper">
        <div class="main">
          <div class="header">
            <h1>HAITZ</h1>
          </div>
          <div class="body">
            ${content}
          </div>
          <div class="footer">
            <p>Cet email a été envoyé automatiquement. Merci de ne pas y répondre.</p>
            <p>&copy; 2024 HAITZ S.A. Propriété et Confidentialité.<br>
            <a href="#">Conditions d'utilisation</a> &bull; <a href="#">Confidentialité</a></p>
          </div>
        </div>
      </div>
    </body>
  </html>
`;

export const sendVerificationEmail = async (email, token, baseUrl) => {
  if (!transporter) return;

  const url = `${baseUrl}/verify-email?token=${token}`;
  const content = `
    <h2>Bienvenue sur HAITZ !</h2>
    <p>Nous sommes ravis de vous compter parmi nous. Pour activer votre compte et commencer l'expérience, veuillez confirmer votre adresse e-mail en cliquant sur le bouton ci-dessous :</p>
    <div class="button-wrapper">
      <a href="${url}" class="button">ACTIVER MON COMPTE</a>
    </div>
    <p style="font-size: 13px; color: #64748b; text-align: center;">Si le bouton ne fonctionne pas, copiez ce lien :<br>
    <span class="link-text">${url}</span></p>
  `;

  await transporter.sendMail({
    from: process.env.EMAIL_FROM || '"HAITZ" <noreply@haitz.app>',
    to: email,
    subject: 'Activez votre compte HAITZ',
    html: wrapTemplate(content)
  });
};

export const sendPasswordResetEmail = async (email, token, baseUrl) => {
  if (!transporter) return;

  const url = `${baseUrl}/reset-password?token=${token}`;
  const content = `
    <h2>Réinitialisation de mot de passe</h2>
    <p>Vous avez demandé la réinitialisation du mot de passe de votre compte HAITZ.</p>
    <p>Si vous n'êtes pas à l'origine de cette demande, vous pouvez ignorer cet e-mail en toute sécurité.</p>
    <div class="button-wrapper">
      <a href="${url}" class="button">RÉINITIALISER MON PASS</a>
    </div>
    <p style="font-size: 13px; color: #64748b; text-align: center;">Lien direct :<br>
    <span class="link-text">${url}</span></p>
  `;

  await transporter.sendMail({
    from: process.env.EMAIL_FROM || '"HAITZ" <noreply@haitz.app>',
    to: email,
    subject: 'Réinitialisation de mot de passe - HAITZ',
    html: wrapTemplate(content)
  });
};

export const sendPasswordResetCodeEmail = async (email, code) => {
  if (!transporter) return;

  const content = `
    <h2>Récupération de compte</h2>
    <p>Voici votre code de sécurité pour réinitialiser votre mot de passe. Ce code expire dans 10 minutes.</p>
    <div class="code-box">
      <p class="code">${code}</p>
    </div>
    <p>Entrez ce code sur la page de récupération pour continuer.</p>
  `;

  await transporter.sendMail({
    from: process.env.EMAIL_FROM || '"HAITZ" <noreply@haitz.app>',
    to: email,
    subject: 'Code de sécurité - HAITZ',
    html: wrapTemplate(content)
  });
};

export const sendSignupCodeEmail = async (email, code) => {
  if (!transporter) return;

  const content = `
    <h2>Validez votre inscription</h2>
    <p>Merci de rejoindre HAITZ ! Voici votre code de validation pour finaliser la création de votre compte :</p>
    <div class="code-box">
      <p class="code">${code}</p>
    </div>
    <p>Ce code est valable pendant 10 minutes.</p>
  `;

  await transporter.sendMail({
    from: process.env.EMAIL_FROM || '"HAITZ" <noreply@haitz.app>',
    to: email,
    subject: 'Votre code de validation HAITZ',
    html: wrapTemplate(content)
  });
};
