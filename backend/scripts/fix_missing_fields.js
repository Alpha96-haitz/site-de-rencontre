import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from '../src/models/User.js';

dotenv.config();

const MONGO_URI = process.env.MONGODB_URI;

async function fix() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('Connecté pour la correction des champs...');

    const result = await User.updateMany(
      { 
        $or: [
          { birthDate: { $exists: false } },
          { interestedIn: { $exists: false } },
          { gender: { $exists: false } }
        ]
      },
      [
        { 
          $set: { 
            birthDate: { $ifNull: ["$birthDate", new Date("1995-01-01")] },
            gender: { $ifNull: ["$gender", "female"] },
            interestedIn: { $ifNull: ["$interestedIn", ["male", "female"]] },
            status: { $ifNull: ["$status", "active"] }
          }
        }
      ]
    );

    console.log(`${result.modifiedCount} utilisateurs mis à jour.`);
    
    // Aussi réinitialiser les matches pour tout le monde (sauf les mutuels) pour débloquer la découverte
    // (Optionnel selon la demande de l'utilisateur, mais utile ici)
    // await Match.deleteMany({ isMutual: false });
    
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

fix();
