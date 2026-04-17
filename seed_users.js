const mongoose = require('mongoose');
const User = require('./backend/src/models/User');

const femaleNames = ['Sophie', 'Emma', 'Léa', 'Chloé', 'Manon', 'Julie', 'Sarah', 'Camille'];
const bios = [
  'Amatrice de café et de voyages ✈️',
  'Passionnée par la tech et le design 💻',
  'Toujours partante pour une randonnée ⛰️',
  'Fan de lecture et de soirées Netflix 🍿',
  'À la recherche de nouvelles aventures ✨'
];
const interests = ['Voyages', 'Cuisine', 'Photo', 'Musique', 'Art', 'Sport', 'Tech', 'Nature'];

const MONGO_URI = 'mongodb://localhost:27017/site-de-rencontre';

async function seed() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('Connecté à MongoDB');

    const users = [];
    for (let i = 0; i < 15; i++) {
      const name = femaleNames[Math.floor(Math.random() * femaleNames.length)];
      const username = `${name.toLowerCase()}${Math.floor(Math.random() * 1000)}`;
      users.push({
        firstName: name,
        lastName: 'Test',
        username: username,
        email: `${username}@test.com`,
        password: 'password123',
        age: 18 + Math.floor(Math.random() * 20),
        gender: 'female',
        bio: bios[Math.floor(Math.random() * bios.length)],
        interests: interests.sort(() => 0.5 - Math.random()).slice(0, 3),
        location: { city: 'Paris', type: 'Point', coordinates: [2.3522, 48.8566] },
        profilePicture: `https://i.pravatar.cc/300?u=${username}`,
        isBanned: false,
        isVerified: true
      });
    }

    await User.insertMany(users);
    console.log(`${users.length} utilisateurs ajoutés !`);
    process.exit();
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

seed();
