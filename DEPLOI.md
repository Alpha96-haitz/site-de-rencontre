# Déploiement en ligne - MeetUp

## Option 1 : Render (Backend) + Vercel (Frontend) — Recommandé

### Étape 1 : MongoDB Atlas

1. Allez sur [cloud.mongodb.com](https://cloud.mongodb.com)
2. **Network Access** → **Add IP Address** → **Allow Access from Anywhere** (0.0.0.0/0)
3. **Database** → **Connect** → **Drivers** → copiez la chaîne de connexion
4. Remplacez `<password>` par votre mot de passe utilisateur

> Sur un serveur en ligne (Render/Railway), MongoDB Atlas fonctionne car leur réseau n'a pas les restrictions DNS de votre PC.

---

### Étape 2 : Déployer le Backend sur Render

1. Poussez votre code sur **GitHub** (créez un repo si besoin)
2. Allez sur [render.com](https://render.com) → **Sign Up** (gratuit)
3. **New** → **Web Service**
4. Connectez votre repo GitHub
5. Configurez :
   - **Root Directory** : `backend`
   - **Build Command** : `npm install`
   - **Start Command** : `npm start`
6. **Environment** → Ajoutez :
   | Variable | Valeur |
   |----------|--------|
   | NODE_ENV | production |
   | MONGODB_URI | `mongodb+srv://user:pass@cluster.mongodb.net/dating-app?...` |
   | JWT_SECRET | (générez un mot de passe fort) |
   | FRONTEND_URL | (URL du frontend, ex: https://xxx.vercel.app) |
7. **Create Web Service**
8. Notez l'URL : `https://meetup-backend-xxx.onrender.com`

---

### Étape 3 : Déployer le Frontend sur Vercel

1. Allez sur [vercel.com](https://vercel.com) → **Sign Up**
2. **Add New** → **Project** → importez votre repo
3. Configurez :
   - **Root Directory** : `frontend`
   - **Framework Preset** : Vite
4. **Environment Variables** :
   | Variable | Valeur |
   |----------|--------|
   | VITE_API_URL | `https://meetup-backend-xxx.onrender.com/api` |
   | VITE_GOOGLE_CLIENT_ID | (votre Client ID Google) |
5. **Deploy**
6. Notez l'URL : `https://votre-app.vercel.app`

---

### Étape 4 : Finaliser la configuration

1. **Render** → votre service → **Environment** → modifiez `FRONTEND_URL` = `https://votre-app.vercel.app`
2. **Google Cloud Console** → Credentials → ajoutez `https://votre-app.vercel.app` dans les origines autorisées

---

## Option 2 : Railway (Backend + Frontend)

1. [railway.app](https://railway.app) → **Start a New Project**
2. **Deploy from GitHub** → sélectionnez le repo
3. Railway détecte le projet : créez 2 services (backend + frontend)
4. Variables d'environnement : mêmes que ci-dessus
5. Pour le frontend : `Root Directory` = frontend, `Build Command` = npm run build, `Start Command` = npm run preview (ou utilisez Vercel pour le frontend)

---

## Variables d'environnement requises

### Backend (Render/Railway)
- `NODE_ENV` = production
- `MONGODB_URI` = chaîne Atlas complète
- `JWT_SECRET` = secret fort (min 32 caractères)
- `FRONTEND_URL` = URL du frontend déployé
- `GOOGLE_CLIENT_ID` = (optionnel)

### Frontend (Vercel)
- `VITE_API_URL` = https://votre-backend.onrender.com/api
- `VITE_GOOGLE_CLIENT_ID` = (optionnel)
