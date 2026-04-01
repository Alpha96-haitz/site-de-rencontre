/**
 * Configuration MongoDB - Connexion à la base de données
 * Utilise mongodb-memory-server si USE_MEMORY_DB=true (MongoDB non installé)
 */
import mongoose from 'mongoose';
import dns from 'node:dns/promises';

const connectDB = async () => {
  let uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/dating-app';

  // Fix Windows: Node.js bug querySrv ECONNREFUSED - forcer Google/Cloudflare DNS
  if (uri.startsWith('mongodb+srv://') && process.platform === 'win32') {
    try {
      await dns.setServers(['8.8.8.8', '8.8.4.4', '1.1.1.1']);
    } catch (_) {}
  }

  if (process.env.USE_MEMORY_DB === 'true' && process.env.NODE_ENV !== 'production') {
    try {
      const { MongoMemoryServer } = await import('mongodb-memory-server');
      console.log('Démarrage de MongoDB en mémoire (téléchargement possible au 1er lancement)...');
      const mongod = await MongoMemoryServer.create();
      uri = mongod.getUri();
      console.log('MongoDB en mémoire prêt');
    } catch (err) {
      console.error('Impossible de démarrer MongoDB en mémoire:', err.message);
      if (err.stack) console.error(err.stack);
      throw err;
    }
  }

  try {
    const conn = await mongoose.connect(uri);
    console.log(`MongoDB connecté: ${conn.connection.host}`);
  } catch (error) {
    console.error('Erreur connexion MongoDB:', error.message);
    throw error;
  }
};

export default connectDB;
