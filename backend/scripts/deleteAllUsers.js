import 'dotenv/config';
import connectDB from '../src/config/db.js';
import User from '../src/models/User.js';

async function deleteAllUsers() {
  try {
    // Connexion à la base de données
    await connectDB();
    console.log('Connexion à MongoDB réussie.');

    // Suppression de tous les documents dans la collection users
    const result = await User.deleteMany({});
    console.log(`${result.deletedCount} utilisateur(s) supprimé(s) avec succès.`);

    console.log('Terminé.');
    process.exit(0);
  } catch (error) {
    console.error('Erreur lors de la suppression des utilisateurs :', error);
    process.exit(1);
  }
}

deleteAllUsers();
