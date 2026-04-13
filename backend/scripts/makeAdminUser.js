import 'dotenv/config';
import connectDB from '../src/config/db.js';
import User from '../src/models/User.js';

const [emailArg] = process.argv.slice(2);

if (!emailArg) {
  console.error('Usage: npm run make-admin -- <email>');
  process.exit(1);
}

const email = emailArg.toLowerCase().trim();

const run = async () => {
  try {
    await connectDB();

    const user = await User.findOne({ email });
    if (!user) {
      console.error('Utilisateur introuvable.');
      process.exit(1);
    }

    user.role = 'admin';
    user.isBanned = false;
    user.bannedUntil = null;
    if (!user.emailVerified) user.emailVerified = true;
    await user.save();

    console.log(`Compte promu admin: ${user.email}`);
    process.exit(0);
  } catch (error) {
    console.error('Erreur script admin:', error.message);
    process.exit(1);
  }
};

run();
