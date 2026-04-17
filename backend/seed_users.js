import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from './src/models/User.js';
import Match from './src/models/Match.js';

dotenv.config();

const femaleNames = ['Sophie', 'Emma', 'Léa', 'Chloé', 'Manon', 'Julie', 'Sarah', 'Camille'];
const bios = [
  'Amatrice de café et de voyages ✈️',
  'Passionnée par la tech et le design 💻',
  'Toujours partante pour une randonnée ⛰️',
  'Fan de lecture et de soirées Netflix 🍿',
  'À la recherche de nouvelles aventures ✨'
];
const interestsList = ['Voyages', 'Cuisine', 'Photo', 'Musique', 'Art', 'Sport', 'Tech', 'Nature'];

const MONGO_URI = process.env.MONGODB_URI;

async function seed() {
  try {
    if (!MONGO_URI) {
      throw new Error('MONGODB_URI non définie dans le fichier .env');
    }

    await mongoose.connect(MONGO_URI);
    console.log('Connecté à MongoDB Atlas');

    // Nettoyer les anciens utilisateurs de test
    console.log('Nettoyage des anciens utilisateurs de test...');
    await User.deleteMany({ email: { $regex: /@test.com$/ } });

    const users = [];
    for (let i = 0; i < 15; i++) {
      const name = femaleNames[Math.floor(Math.random() * femaleNames.length)];
      const username = `${name.toLowerCase()}${Math.floor(Math.random() * 1000)}`;
      const age = 18 + Math.floor(Math.random() * 20);
      const birthDate = new Date();
      birthDate.setFullYear(birthDate.getFullYear() - age);

      users.push({
        firstName: name,
        lastName: 'Test',
        username: username,
        email: `${username}@test.com`,
        password: 'password123',
        birthDate: birthDate,
        gender: 'female',
        interestedIn: ['male', 'female'],
        bio: bios[Math.floor(Math.random() * bios.length)],
        interests: interestsList.sort(() => 0.5 - Math.random()).slice(0, 3),
        location: { city: 'Paris', coordinates: [2.3522, 48.8566] },
        profilePicture: `https://i.pravatar.cc/300?u=${username}`,
        isBanned: false,
        isVerified: true,
        status: 'active'
      });
    }

    await User.insertMany(users);
    console.log(`${users.length} utilisateurs ajoutés !`);
    
    console.log('Traitement terminé.');
    process.exit(0);
  } catch (err) {
    console.error('Erreur lors du seeding :', err);
    process.exit(1);
  }
}

seed();
