# 🛠️ Local Development Guide

## Installation & Setup

### 1. Clone & Install

```bash
git clone <ton-repo-url>
cd site

# Install all dependencies
npm run install:all
```

### 2. Configure Environment Variables

**Backend** (`backend/.env`):
```bash
cp backend/.env.example backend/.env
```

Edit `backend/.env`:
```env
USE_MEMORY_DB=true              # En dev, utilise MongoDB en mémoire
# OU si tu as MongoDB local:
# MONGODB_URI=mongodb://localhost:27017/dating-app

GOOGLE_CLIENT_ID=votre_id_google.apps.googleusercontent.com
JWT_SECRET=votre_secret_dev_peut_etre_simple
FRONTEND_URL=http://localhost:5173

# Optionnel mais recommandé:
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=

NODE_ENV=development
PORT=5000
```

**Frontend** (`frontend/.env.local`):
```bash
# Déjà créé avec les bonnes valeurs
cat frontend/.env.local
```

### 3. Start Development Server

**Terminal 1 - Backend**:
```bash
npm run server
# Ou: cd backend && npm run dev
```

Expected output:
```
✅ Serveur sur http://localhost:5000
```

**Terminal 2 - Frontend**:
```bash
npm run client
# Ou: cd frontend && npm run dev
```

Expected output:
```
VITE v7.3.1  ready in XXX ms
  ➜  Local:   http://localhost:5173/
```

**Terminal 3 (optionnel) - Open Browser**:
```bash
# Linux/Mac
open http://localhost:5173

# Windows
start http://localhost:5173

# Ou copie-colle l'URL dans ton navigateur
```

---

## Testing Checklist

### 1. Frontend loads
- [ ] http://localhost:5173 loads without errors
- [ ] Check browser console (F12) for JS errors

### 2. API connection  
- [ ] Try signup/login
- [ ] Check Network tab (F12 > Network)
- [ ] Look for `/api/auth/signup` or `/api/auth/login` requests
- [ ] Status should be 200, not 4xx/5xx

### 3. Backend errors
- [ ] Check backend terminal for stack traces
- [ ] MongoDB connection message appears?
- [ ] `✅ MongoDB connecté` = good

### 4. Real-time features (if implemented)
- [ ] Open in 2 browser windows
- [ ] Login with different users
- [ ] Send a message in one window
- [ ] Should appear in other window without refresh

---

## Common Issues & Fixes

### Error: "Cannot find module"

**Fix**:
```bash
npm run install:all
# ou spécifiquement:
cd backend && npm install
cd ../frontend && npm install
```

### Error: "Port 5000 already in use"

**Fix** (Windows):
```bash
# Backend has built-in kill-port script
npm run server  # Auto-kills any process on 5000
```

**Fix** (Linux/Mac):
```bash
lsof -ti:5000 | xargs kill -9
npm run server
```

### Error: "Cannot POST /api/auth/login"

**Cause**: Backend not running or vite proxy not working

**Fix**:
1. Check backend terminal - is it running?
2. Check Network tab - where is request going?
3. Check vite.config.js - proxy configured?

### Error: "ECONNREFUSED"

**Cause**: Backend isn't running

**Fix**:
```bash
# Terminal 1
npm run server
# Wait for ✅ message before testing
```

### Error: "USE_MEMORY_DB" or MongoDB connection

**Option 1**: Use MongoDB in-memory (no install needed):
```env
USE_MEMORY_DB=true
```

**Option 2**: Install MongoDB locally:
```bash
# On Windows with Chocolatey:
choco install mongodb

# On Mac with Homebrew:
brew install mongodb-community

# Then start it:
mongod

# Update .env:
MONGODB_URI=mongodb://localhost:27017/dating-app
USE_MEMORY_DB=false
```

**Option 3**: Use MongoDB Atlas cloud (recommended):
1. Sign up at mongodb.com/cloud/atlas
2. Create free cluster
3. Get connection string
4. Update `.env`:
```env
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/dating-app
USE_MEMORY_DB=false
```

---

## Useful Commands

### Development
```bash
# Start both frontend & backend in one window
npm run dev

# Start just backend
npm run server

# Start just frontend
npm run client

# Setup/create env files
npm run setup
```

### Building
```bash
# Build for production
npm run build

# Then you can deploy to Vercel/Render
```

### Database
```bash
# Reset memory database (in-process)
# Just restart the backend: npm run server

# If using MongoDB, connect with:
# mongosh mongodb://localhost:27017/dating-app
```

---

## Debugging Tips

### Enable verbose logging

**Backend** - Add to `backend/src/server.js`:
```javascript
console.log('Environment:', process.env.NODE_ENV);
console.log('Frontend URL:', process.env.FRONTEND_URL);
console.log('DB:', process.env.MONGODB_URI ? 'External' : 'In-memory');
```

**Frontend** - Add to `frontend/src/api/client.js`:
```javascript
client.interceptors.request.use((config) => {
  console.log(`📤 ${config.method.toUpperCase()} ${config.url}`);
  return config;
});
```

### Check network requests

1. Open Devtools (F12)
2. Network tab
3. Make a request (login, etc)
4. Click the request
5. Check:
   - Status code
   - Request URL
   - Response body
   - Headers (Authorization token?)

### Check backend logs

Watch the backend terminal output:
```
✅ Serveur sur http://localhost:5000
[socket] User connected: user123
POST /api/auth/login 200 45ms
GET /api/users/123 401 ← Auth failed?
```

---

## Next Steps

Once local development works:

1. **Read** [VERCEL_QUICK_START.md](./VERCEL_QUICK_START.md) for production deployment
2. **Setup** MongoDB Atlas account
3. **Create** GitHub repo if not done
4. **Deploy** to Vercel + Render

---

## Need Help?

- Frontend issues → Check [frontend/README.md](./frontend/README.md) or Vite docs
- Backend issues → Check [backend/ package.json](./backend/package.json) dependencies
- Deployment → Follow [VERCEL_QUICK_START.md](./VERCEL_QUICK_START.md)
- General → Check [DEPLOI.md](./DEPLOI.md)
