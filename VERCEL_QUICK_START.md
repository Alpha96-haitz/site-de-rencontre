# 🚀 Vercel Deployment Guide - Action Immédiate

## Situation actuelle

✅ **Préparé pour production:**
- Frontend Vite configuré
- Backend Node/Express prêt pour Render
- MongoDB support (Atlas recommend)
- Socket.IO ready
- Env variables templated

---

## Plan d'action - 15 minutes 

### Phase 1: Local Testing (5 min)

Vérifie que tout fonctionne localement avant de pousser vers le cloud.

```bash
# Terminal 1 - Backend
cd backend
npm install
cp .env.example .env
# Édite .env : MongoDB_URI, JWT_SECRET, NODE_ENV=development
npm start

# Terminal 2 - Frontend  
cd frontend
npm install
cp .env.example .env.local
# Édite .env.local : VITE_API_URL=http://localhost:5000/api
npm run dev
```

Teste: Ouvre http://localhost:5173 → Inscription/Login → Check console pour erreurs API

---

### Phase 2: GitHub Push (2 min)

```bash
cd /path/to/site
git add .
git commit -m "Deploy to Vercel + Render - Production ready"
git push origin main
```

---

### Phase 3: MongoDB Atlas (3 min)

1. Ouvre https://www.mongodb.com/cloud/atlas
2. Create Account → Create Project → Create Cluster (M0 free)
3. Database Access: Create user+password
4. Network Access: Add 0.0.0.0/0
5. Cluster Connect: Copy connection string
   ```
   mongodb+srv://user:password@cluster.mongodb.net/dating-app?retryWrites=true
   ```

---

### Phase 4: Deploy Backend → Render (5 min)

1. Va sur https://render.com → Sign up/Login
2. **New > Blueprint**
3. Connect ton repo GitHub
4. Render lit **render.yaml** → crée le service automatiquement
5. **Configure Environment Variables:**
   ```
   MONGODB_URI = [ta connection string MongoDB]
   JWT_SECRET = [génère un secret fort, ex: $(openssl rand -base64 32)]
   FRONTEND_URL = [à remplir après Vercel]
   NODE_ENV = production
   GOOGLE_CLIENT_ID = [optionnel]
   ```
6. **Deploy** (attends ~10 min)
7. Note l'URL: `https://xxx.onrender.com`

**⚠️ Important**: Render pourrait "spin down" après 15 min d'inactivité (plan free). Upgrade si besoin de 24/7.

---

### Phase 5: Deploy Frontend → Vercel (3 min)

1. Va sur https://vercel.com → Sign up/Login with GitHub
2. **Add New > Project**
3. Select ce repo
4. **Configure:**
   - Root Directory: `frontend`
   - Framework: `Vite`
   - Build: `npm run build`
   - Output: `dist`
5. **Environment Variables:**
   ```
   VITE_API_URL = https://xxx.onrender.com/api
   VITE_SOCKET_URL = https://xxx.onrender.com
   VITE_GOOGLE_CLIENT_ID = [optionnel]
   ```
6. **Deploy** (attends ~2 min)
7. Note l'URL: `https://votre-app.vercel.app`

---

### Phase 6: Finalize Backend → Render (1 min)

Render crée le backend AVANT que Vercel finisse. Maintenant qu'on a l'URL Vercel:

1. Retour à https://render.com
2. Ouvre le service **meetup-backend**
3. **Settings > Environment > FRONTEND_URL**
4. Change: `http://localhost:5173` → `https://votre-app.vercel.app`
5. **Manual Deploy** (redémarre le service)

---

### Phase 7: Test Production (2 min)

Ouvre https://votre-app.vercel.app et teste:

- ✅ Page charge
- ✅ Signup
- ✅ Login
- ✅ Make POST requests → Check Network tab
- ✅ Real-time notifications
- ✅ Google Login (si configuré)

---

## Alternatives de déploiement

| Service | Frontend | Backend | WebSocket | Cost |
|---------|----------|---------|-----------|------|
| **Vercel + Render** | ✅ | ✅ | ✅ | $0/free (avec limits) |
| **Netlify + Heroku** | ✅ | ✅ | ✅ | ~$20/mo |
| **AWS (full)** | ✅ | ✅ | ✅ | ~$10-50/mo |
| **Digital Ocean** | ✅ | ✅ | ✅ | $5/mo |

**Recommandé**: Vercel (frontend) + Render (backend) pour commencer gratuit.

---

## Troubleshooting

### Frontend affiche "API Error"

**Cause**: VITE_API_URL pas correct

**Fix**:
1. Check Vercel > Deployments > Environment
2. Vérifie que `VITE_API_URL` = `https://xxx.onrender.com/api`
3. Redeploy

### CORS Error

**Cause**: `FRONTEND_URL` pas à jour dans Render

**Fix**:
1. Render > Backend Settings > Environment
2. Update `FRONTEND_URL = https://votre-app.vercel.app`
3. Manual Deploy

### "Cannot GET /api/users"

**Cause**: Backend pas running ou MongoDB pas connecté

**Fix**:
1. Check Render > Logs
2. Verify `MONGODB_URI` correct dans Render
3. Check JWT_SECRET present

### WebSocket pas de connection

**Cause**: `VITE_SOCKET_URL` mal configuré

**Fix**: Doit être juste la base, ex:
- ✅ `https://xxx.onrender.com`
- ❌ `https://xxx.onrender.com/api/`
- ❌ `https://xxx.onrender.com/socket.io`

---

## Fichiers à comprendre

- `render.yaml` - Config Render (relire en cas de problème)
- `frontend/vercel.json` - Config Vercel
- `backend/.env.example` - Variables backend requises
- `frontend/.env.example` - Variables frontend requises
- `DEPLOI.md` - Guide détaillé (pour la prochaine fois)

---

## Sécurité basique

⚠️ **SECRETS**
- Ne JAMAIS commit `.env`
- `JWT_SECRET` doit être long et aléatoire
- Rotate tokens régulièrement
- Use HTTPS everywhere (Vercel/Render le font)

⚠️ **CORS**
- Configure exact `FRONTEND_URL` (pas `*`)
- Credentials: true only if needed

⚠️ **MongoDB**
- Whitelist IP: `0.0.0.0/0` (ok pour MVP, restrict en production)
- Strong password
- Enable backups

---

## Questions rapides?

Réponses dans DEPLOI.md ou tiens-moi au courant!

**Let's go! 🚀**
