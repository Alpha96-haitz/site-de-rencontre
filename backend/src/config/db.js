/**
 * Configuration MongoDB - Connexion a la base de donnees
 * En developpement, le backend peut retomber sur mongodb-memory-server
 * si l'instance distante est indisponible.
 */
import mongoose from 'mongoose';
import dns from 'node:dns/promises';

let memoryServerPromise = null;

const isDev = process.env.NODE_ENV !== 'production';

const shouldUseMemoryDb = () =>
  process.env.USE_MEMORY_DB === 'true' || process.env.MONGODB_URI_FALLBACK === 'memory';

const getMemoryServerUri = async () => {
  if (!memoryServerPromise) {
    memoryServerPromise = (async () => {
      const { MongoMemoryServer } = await import('mongodb-memory-server');
      const mongod = await MongoMemoryServer.create();
      return mongod;
    })();
  }

  const mongod = await memoryServerPromise;
  return mongod.getUri();
};

const connectWithUri = async (uri) => {
  if (uri.startsWith('mongodb+srv://') && process.platform === 'win32') {
    try {
      await dns.setServers(['8.8.8.8', '8.8.4.4', '1.1.1.1']);
    } catch (_) {}
  }

  const conn = await mongoose.connect(uri);
  return conn;
};

const connectDB = async () => {
  const primaryUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/dating-app';

  try {
    return await connectWithUri(primaryUri);
  } catch (error) {
    console.error('Erreur connexion MongoDB:', error.message);

    if (!isDev) {
      throw error;
    }

    try {
      const fallbackUri = await getMemoryServerUri();
      return await connectWithUri(fallbackUri);
    } catch (fallbackError) {
      console.error('Fallback MongoDB memoire impossible:', fallbackError.message);

      if (shouldUseMemoryDb()) {
        throw fallbackError;
      }

      throw error;
    }
  }
};

export default connectDB;
