import 'dotenv/config';
import connectDB from '../src/config/db.js';
import User from '../src/models/User.js';

const [emailArg, passwordArg, usernameArg] = process.argv.slice(2);

if (!emailArg) {
  console.error('Usage: npm run make-root -- <email> [password] [username]');
  process.exit(1);
}

const email = emailArg.toLowerCase().trim();
const password = passwordArg?.trim();
const username = usernameArg?.trim();

const run = async () => {
  try {
    await connectDB();

    let user = await User.findOne({ email });

    if (!user) {
      if (!password) {
        console.error('Le mot de passe est requis pour creer un nouvel utilisateur root.');
        process.exit(1);
      }

      const generatedUsername = username || `root_${Date.now().toString().slice(-6)}`;

      user = await User.create({
        email,
        username: generatedUsername,
        password,
        firstName: 'Root',
        lastName: 'Admin',
        birthDate: new Date('1990-01-01'),
        gender: 'other',
        emailVerified: true,
        role: 'root'
      });

      console.log(`Compte root cree: ${user.email} (${user.username})`);
      process.exit(0);
    }

    user.role = 'root';
    user.isBanned = false;
    user.bannedUntil = null;
    if (!user.emailVerified) user.emailVerified = true;
    if (password && !user.googleId) {
      user.password = password;
    }
    await user.save();

    console.log(`Compte promu root: ${user.email}`);
    process.exit(0);
  } catch (error) {
    console.error('Erreur script root:', error.message);
    process.exit(1);
  }
};

run();
