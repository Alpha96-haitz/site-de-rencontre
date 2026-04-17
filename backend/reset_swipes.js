import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Match from './src/models/Match.js';

dotenv.config();

const MONGO_URI = process.env.MONGODB_URI;

async function reset() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('Connecté pour la réinitialisation des swipes...');

    const result = await Match.deleteMany({ isMutual: false });
    console.log(`${result.deletedCount} swipes (non-mutuels) ont été supprimés.`);
    
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

reset();
