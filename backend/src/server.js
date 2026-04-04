/**
 * Serveur principal - Express + Socket.io
 */
import 'dotenv/config';
import { execSync } from 'child_process';
import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import compression from 'compression';
import mongoSanitize from 'express-mongo-sanitize';
import rateLimit from 'express-rate-limit';

import connectDB from './config/db.js';

async function killPortIfNeeded(port) {
  try {
    if (process.platform === 'win32') {
      const result = execSync(`netstat -ano | findstr ":${port}"`, { encoding: 'utf8' });
      const lines = result.trim().split('\n').filter(l => l.includes('LISTENING'));
      const myPid = process.pid.toString();
      for (const line of lines) {
        const parts = line.trim().split(/\s+/);
        const pid = parts[parts.length - 1];
        if (pid && pid !== myPid && /^\d+$/.test(pid)) {
          execSync(`taskkill /PID ${pid} /F`, { stdio: 'ignore' });
          console.log(`Port ${port} libéré (PID ${pid})`);
          await new Promise(r => setTimeout(r, 500)); // Laisser le port se libérer
        }
      }
    } else {
      execSync(`lsof -ti:${port} | xargs -r kill -9`, { stdio: 'ignore' });
    }
  } catch (_) {}
}
import routes from './routes/index.js';
import { initSocket } from './socket/index.js';

const app = express();
app.disable('x-powered-by');
app.set('trust proxy', 1);
const httpServer = createServer(app);

const allowedOrigins = (process.env.FRONTEND_URL || 'http://localhost:5173').split(',').map(o => o.trim()).filter(Boolean);
if (process.env.NODE_ENV !== 'production') {
  if (!allowedOrigins.includes('http://localhost:5174')) allowedOrigins.push('http://localhost:5174');
}

// Ajouter l'URL Vercel en production
if (process.env.NODE_ENV === 'production') {
  const vercelUrls = [
    'https://site-de-rencontre-git-main-barrymamadoualpha124-8325s-projects.vercel.app',
    'https://site-de-rencontre-three.vercel.app',
    'https://site-de-rencontre-kohl.vercel.app'
  ];
  vercelUrls.forEach(url => {
    if (!allowedOrigins.includes(url)) allowedOrigins.push(url);
  });
}

// Configuration CORS pour Express
app.use(cors({
  origin: allowedOrigins,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

// Socket.io avec CORS
const io = new Server(httpServer, {
  cors: { origin: allowedOrigins, credentials: true }
});
initSocket(io);
app.set('io', io);

// Sécurité
app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
app.use(compression());
app.use(mongoSanitize({ replaceWith: '_' }));
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));
app.use(cookieParser());

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: process.env.NODE_ENV === 'production' ? Number(process.env.RATE_LIMIT_MAX || 1200) : 5000,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Trop de requetes, reessayez plus tard.' }
});
app.use(limiter);

app.use('/api', routes);

app.use((err, req, res, next) => {
  console.error(err);
  res.status(err.status || 500).json({ message: err.message || 'Erreur serveur' });
});

const PORT = process.env.PORT || 5000;

if (!process.env.JWT_SECRET) {
  throw new Error('JWT_SECRET must être défini dans l environnement');
}

async function start() {
  try {
    if (process.env.NODE_ENV !== 'production') await killPortIfNeeded(PORT);
    await connectDB();
    httpServer.on('error', (err) => {
      if (err.code === 'EADDRINUSE') {
        console.error(`\n⚠️  Le port ${PORT} est déjà utilisé.`);
        console.error('   Arrêtez l\'autre processus ou utilisez: npm run dev (libère le port automatiquement)\n');
      }
      process.exit(1);
    });
    httpServer.listen(PORT, () => {
      const url = process.env.RAILWAY_PUBLIC_DOMAIN || process.env.RENDER_EXTERNAL_URL || `http://localhost:${PORT}`;
      console.log(`✅ Serveur sur ${url}`);
    });
  } catch (err) {
    console.error('Erreur démarrage:', err.message || err);
    process.exit(1);
  }
}
start();
