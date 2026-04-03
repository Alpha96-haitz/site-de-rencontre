#!/usr/bin/env node
/**
 * Script Setup - Initialiser le projet pour développement/production
 * Usage: node scripts/setup.js [dev|prod]
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, '..');
const backendDir = path.join(rootDir, 'backend');
const frontendDir = path.join(rootDir, 'frontend');

const mode = process.argv[2] || 'dev';

console.log(`\n📋 Setup MeetUp - Mode: ${mode.toUpperCase()}\n`);

// Vérifier les fichiers .env
const files = [
  { path: path.join(frontendDir, '.env.local'), example: path.join(frontendDir, '.env.example'), name: 'Frontend' },
  { path: path.join(backendDir, '.env'), example: path.join(backendDir, '.env.example'), name: 'Backend' }
];

let missingEnv = [];

files.forEach(file => {
  if (!fs.existsSync(file.path)) {
    missingEnv.push(file.name);
    console.log(`⚠️  ${file.name} .env manquant`);
    console.log(`   → Copie: cp ${file.example} ${file.path}`);
    if (fs.existsSync(file.example)) {
      fs.copyFileSync(file.example, file.path);
      console.log(`   ✅ Créé ${path.basename(file.path)}\n`);
    }
  } else {
    console.log(`✅ ${file.name} .env trouvé\n`);
  }
});

if (missingEnv.length > 0) {
  console.log(`\n⚠️  IMPORTANT: Configurez les fichiers .env créés avec vos vraies valeurs!\n`);
}

// Vérifier node_modules
console.log('📦 Vérification des dépendances...\n');

if (!fs.existsSync(path.join(backendDir, 'node_modules'))) {
  console.log('   Backend: npm install requis');
}
if (!fs.existsSync(path.join(frontendDir, 'node_modules'))) {
  console.log('   Frontend: npm install requis');
}

console.log(`\n✅ Setup terminé!\n`);
console.log(`Commandes utiles:\n`);
console.log(`   Dev (frontend + backend):\n`);
console.log(`     npm run dev\n`);
console.log(`   Backend seul:\n`);
console.log(`     npm run server\n`);
console.log(`   Frontend seul:\n`);
console.log(`     npm run client\n`);
