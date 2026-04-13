import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.SMTP_PORT, 10) || 587,
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS.replace(/\s/g, '') // Remove spaces for the test
  }
});

async function testEmail() {
  console.log('--- Testing SMTP configuration ---');
  console.log('User:', process.env.SMTP_USER);
  console.log('Pass:', process.env.SMTP_PASS ? '********' : 'NOT SET');
  
  try {
    await transporter.verify();
    console.log('✅ SMTP connection successful!');
    
    const info = await transporter.sendMail({
      from: process.env.EMAIL_FROM,
      to: process.env.SMTP_USER,
      subject: 'Test Haitz SMTP',
      text: 'Si vous recevez ceci, votre configuration SMTP est parfaite !'
    });
    console.log('✅ Email sent successfully:', info.messageId);
  } catch (error) {
    console.error('❌ SMTP Error:', error.message);
    if (error.code === 'EAUTH') {
      console.error('Erreur d\'authentification : Vérifiez votre email et mot de passe d\'application.');
    }
  }
}

testEmail();
