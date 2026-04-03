# Déploiement en ligne - MeetUp

## Architecture

- **Frontend**: React + Vite sur **Vercel** (hébergement statique)
- **Backend**: Node + Express sur **Render** (serveur dynamique + WebSocket)
- **Base de données**: MongoDB Atlas (cloud)

---

## Étape 1 : Setup MongoDB Atlas

1. Allez sur [mongodb.com/cloud/atlas](https://www.mongodb.com/cloud/atlas)
2. Créez un compte/projet gratuit
3. **Create a Cluster** (M0 = gratuit)
4. Attendez la création (~5-10 min)
5. **Security > Database Access** : Créez un utilisateur/mot de passe
6. **Network Access** : Ajoutez `0.0.0.0/0` (accès depuis partout)
7. **Cluster > Connect** : Copiez la **connection string** `mongodb+srv://...`

---

## Étape 2 : Google OAuth (optionnel)

1. Allez sur [console.cloud.google.com](https://console.cloud.google.com)
2. **Créer un projet** `MeetUp`
3. **APIs & Services > OAuth consent screen** : Configurez
4. **Credentials > Create OAuth 2.0 Client** : 
   - Type: **Web application**
   - **Authorized JavaScript origins**: 
     - `http://localhost:5173` (dev)
     - `https://votre-app.vercel.app` (production)
   - **Authorized redirect URIs**:
     - `http://localhost:5173/auth/google/callback` (dev)
     - `https://votre-app.vercel.app/auth/google/callback` (production)
5. Copiez le **Client ID**

---

## Étape 3 : Déployer le Backend sur Render

1. Commits & Push sur GitHub
   ```bash
   git add .
   git commit -m "Préparer déploiement Vercel + Render"
   git push origin main
   ```

2. Va sur [render.com](https://render.com) et connecte ton GitHub

3. **New > Blueprint > Connect Repo**
   - Sélectionne ce repo
   - Render va lire `render.yaml` et créer le service

4. **Configure les variables** via Render dashboard:
   - `MONGODB_URI`: Ta connection string MongoDB Atlas
   - `JWT_SECRET`: Génère un secret fort (Render le génère automatiquement)
   - `FRONTEND_URL`: `https://votre-app.vercel.app` (à mettre après Vercel)
   - `GOOGLE_CLIENT_ID`: Ton ID Google (optionnel)

5. **Deploy** (attends ~5-10 min)

6. **Récupère l'URL** du backend Render: `https://xxx.onrender.com`

---

## Étape 4 : Configurer le Backend

### Variables à ajouter dans Render dashboard (en production):

```
FRONTEND_URL = https://votre-app.vercel.app
MONGODB_URI = mongodb+srv://user:pass@cluster.mongodb.net/dating-app
JWT_SECRET = votre_secret_jwt_tres_long_et_securise
NODE_ENV = production
```

### Cloudinary (pour uploads d'images - optionnel):

1. Inscrivez-vous sur [cloudinary.com](https://cloudinary.com)
2. Récupérez `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`
3. Ajoutez-les dans Render

### Email (pour notifications - optionnel):

Utilisez Gmail + App Password:
1. Activez **2FA** sur Google Account
2. Générez une **App Password**: https://myaccount.google.com/apppasswords
3. Ajoutez dans Render:
   ```
   SMTP_HOST = smtp.gmail.com
   SMTP_PORT = 587
   SMTP_USER = votre@gmail.com
   SMTP_PASS = app_password
   EMAIL_FROM = MeetUp <votre@gmail.com>
   ```

---

## Étape 5 : Déployer le Frontend sur Vercel

### Via UI Vercel (plus facile):

1. Va sur [vercel.com](https://vercel.com)
2. Clique **Add New > Project**
3. **Import Git Repository** : Sélectionne ce repo
4. **Configure le projet**:
   - **Root Directory**: `frontend`
   - **Framework Preset**: `Vite`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`

5. **Environment Variables** (ajoute dans **Settings > Environment Variables**):
   ```
   VITE_API_URL = https://xxx.onrender.com/api
   VITE_SOCKET_URL = https://xxx.onrender.com
   VITE_GOOGLE_CLIENT_ID = ton_client_id_google (optionnel)
   ```

6. **Deploy**  (attends ~2-3 min)

7. **Récupère l'URL Vercel**: `https://votre-app.vercel.app`

---

## Étape 6 : Finaliser la Configuration

### Mettre à jour le backend Render:

Une fois que Vercel donne l'URL du frontend:

1. Ouvre **Render > Backend Service > Environment**
2. Ajoute/met à jour:
   ```
   FRONTEND_URL = https://votre-app.vercel.app
   ```
3. **Manual Deploy** pour redémarrer le backend

### Mettre à jour Google OAuth:

Si tu utilises Google Login:
1. Ouvre [console.cloud.google.com](https://console.cloud.google.com)
2. **Credentials > OAuth Client**
3. Ajoute `https://votre-app.vercel.app` dans **Authorized JavaScript origins**

---

## Étape 7 : Tests Post-Déploiement

Teste sur **https://votre-app.vercel.app**:

- ✅ Page charge correctement
- ✅ Inscription / Connexion
- ✅ Appels API (User Profile, Messages, etc.)
- ✅ WebSocket/notifications temps-réel
- ✅ Upload d'images (si Cloudinary configuré)
- ✅ Google Login (si activé)

---

## Dépannage

### Frontend affiche "API Error" ou "Cannot POST /api/..."

→ Vérifie dans **Vercel > Deployment Logs** si `VITE_API_URL` est bien configurée

### Backend retourne erreur CORS

→ Mets à jour `FRONTEND_URL` dans Render et redéploie

### WebSocket ne fonctionne pas

→ Assure-toi que `VITE_SOCKET_URL` = base du backend (sans `/api`, sans `/socket.io`)

### "Email not sent" ou "Cloudinary error"

→ Vérifie les credentials (ne pas pusher `.env` contenant des secrets!)

---

## Fichiers importants

- `.env.example`: Template variables pour local
- `backend/.env.example`: Variables backend
- `frontend/.env.example`: Variables frontend  
- `render.yaml`: Config Render (lecture auto)
- `frontend/vercel.json`: Config Vercel

---

## Notes de sécurité

⚠️ **Ne JAMAIS pusher `.env`** dans Git (déjà dans `.gitignore`)
⚠️ **Secrets forts**: `JWT_SECRET` doit être long et aléatoire
⚠️ **HTTPS obligatoire**: Render & Vercel donnent HTTPS gratuitement
⚠️ **CORS spécifique**: `FRONTEND_URL` doit correspondre à ton domaine Vercel

