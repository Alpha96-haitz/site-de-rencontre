import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from './src/models/User.js';

dotenv.config();

const promoteUser = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('MongoDB connecté...');

    const email = 'barrymamadoualpha124@gmail.com';
    const user = await User.findOneAndUpdate(
      { email },
      { role: 'root' },
      { new: true }
    );

    if (user) {
      console.log(`Succès : ${email} est désormais administrateur.`);
    } else {
      console.log(`Erreur : Utilisateur avec l'email ${email} introuvable.`);
    }

    await mongoose.disconnect();
  } catch (err) {
    console.error('Erreur :', err);
    process.exit(1);
  }
};

promoteUser();
