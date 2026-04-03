# 🚨 Common Errors & Solutions

## API Errors During Development

### Error 1: "Cannot POST /api/auth/login"

**Symptoms:**
- Network tab shows request to `/api/auth/login` returns 404
- Backend might not be running

**Solutions:**

```bash
# Check 1: Is backend running?
npm run server
# Should show: ✅ Serveur sur http://localhost:5000

# Check 2: Is frontend proxy correct?
cat frontend/vite.config.js | grep proxy

# Check 3: Check .env.local
cat frontend/.env.local
# Should have: VITE_API_URL=http://localhost:5000/api
```

---

## Errors After Deployment to Vercel

### Error 2: "API Error" or "Cannot reach backend"

**Symptoms:**
- App loads but API calls fail
- Network tab shows req to vercel.app/api returns error

**Cause:**
- `VITE_API_URL` in Vercel is wrong

**Solution:**

1. Vercel Dashboard → Your Project
2. Settings → Environment Variables
3. Check `VITE_API_URL`
   - ✓ Should be: `https://xxx.onrender.com/api`
   - ✗ Should NOT be: `http://localhost:5000/api`
4. Redeploy

```bash
# Locally, verify:
curl https://xxx.onrender.com/api/health
# Should return: {"status":"OK"}
```

---

### Error 3: CORS Error

**Symptoms:**
```
Access to XMLHttpRequest at 'https://xxx.onrender.com/api/auth/login'
from origin 'https://my-app.vercel.app' has been blocked by CORS policy
```

**Cause:**
- Backend `FRONTEND_URL` doesn't match Vercel URL

**Solution:**

1. Render Dashboard > Your Backend Service
2. Settings → Environment
3. Find `FRONTEND_URL`
4. Change to: `https://my-app.vercel.app` (your actual Vercel URL)
5. Click "Manual Deploy"

```bash
# Check in terminal when backend redeploys:
✅ Serveur sur https://xxx.onrender.com
# Means it's restarted with new FRONTEND_URL
```

---

### Error 4: "WebSocket connection failed"

**Symptoms:**
- Real-time features don't work
- Messages don't sync between devices
- Network tab doesn't show WebSocket connection

**Cause:**
- `VITE_SOCKET_URL` incorrect

**Solution:**

1. Vercel Dashboard → Environment Variables
2. Check `VITE_SOCKET_URL`
   - ✓ Should be: `https://xxx.onrender.com`
   - ✗ Should NOT be: `https://xxx.onrender.com/api`
   - ✗ Should NOT be: `https://xxx.onrender.com/socket.io`
3. Redeploy

---

## Errors in Backend (Render)

### Error 5: "MONGODB_URI error" or "Cannot connect to database"

**Symptoms:**
- Render logs show MongoDB connection error
- Any API call returns 500

**Cause:**
- `MONGODB_URI` env var missing or invalid

**Solution:**

1. Render > Backend Service > Settings > Environment
2. Check `MONGODB_URI`
   - Must be: `mongodb+srv://USERNAME:PASSWORD@cluster.mongodb.net/...`
   - Get from: https://mongodb.com/cloud/atlas
   - Click Cluster > Connect > Copy connection string
3. Add or update the variable
4. Manual Deploy

```bash
# Test locally if you have the string:
mongosh "mongodb+srv://USER:PASS@cluster..."
```

---

### Error 6: "JWT_SECRET not found" or JWT errors

**Symptoms:**
- Login fails
- "Invalid token" errors

**Cause:**
- `JWT_SECRET` env var missing

**Solution:**

1. Render > Backend > Environment
2. If `JWT_SECRET` is empty or missing:
   - Render can auto-generate it
   - Or set manually: any strong random string (32+ chars)
   - Example: `MySuper$ecure123RandomSecret`
3. Manual Deploy

**Note:** If you change it, all existing tokens become invalid (users need to re-login).

---

### Error 7: "Port already in use" (Local)

**Symptoms:**
```
Error: listen EADDRINUSE: address already in use :::5000
```

**Solution (Windows):**

Backend has auto-kill:
```bash
npm run server
# It auto kills any process on port 5000
```

**Solution (Mac/Linux):**

```bash
lsof -ti:5000 | xargs kill -9
npm run server
```

---

### Error 8: "Cannot find module" errors

**Symptoms:**
```
Error: Cannot find module 'express'
Error: Cannot find module '@vitejs/plugin-react'
```

**Cause:**
- Dependencies not installed

**Solution:**

```bash
# Install everything
npm run install:all

# Or individually:
cd backend && npm install
cd ../frontend && npm install
cd ..
```

---

## MongoDB Errors

### Error 9: "MongooseError: Cannot connect"

**Symptoms:**
- Backend fails to start
- Logs show MongoDB connection error

**Cause:**
- MongoDB URI wrong
- MongoDB service not running
- Network access not allowed

**Solution:**

**Option A: Use MongoDB in-memory (dev)**
```env
USE_MEMORY_DB=true
MONGODB_URI=unused
```

**Option B: Local MongoDB**
```bash
# Install MongoDB (depends on OS)
# Windows: choco install mongodb
# Mac: brew install mongodb-community
# Then start it: mongod

# Update .env:
MONGODB_URI=mongodb://localhost:27017/dating-app
USE_MEMORY_DB=false
```

**Option C: MongoDB Atlas (recommended)**
1. https://mongodb.com/cloud/atlas
2. Create cluster
3. Get connection string
4. Update `MONGODB_URI` in `.env` or Render

---

### Error 10: "Connection timeout" or "ECONNREFUSED"

**Symptoms:**
```
MongoNetworkError: connection timed out
ECONNREFUSED 127.0.0.1:27017
```

**Cause:**
- MongoDB not running
- Wrong connection string

**Solution:**

```bash
# Check 1: If using local MongoDB, start it
mongod

# Check 2: If using Atlas, verify:
# - String has mongodb+srv:// (not mongodb://)
# - Username and password are correct
# - IP whitelist allows your connection

# Check 3: Test connection
mongosh "your_connection_string"
```

---

## Vercel Deployment Errors

### Error 11: "Build failed" or "npm run build failed"

**Symptoms:**
- Vercel deployment shows red X
- Logs show build error

**Common causes:**
- Missing dependency
- TypeScript error
- Import path wrong

**Solution:**

1. Check Vercel build logs (Deployments tab)
2. Look for the specific error
3. Common fixes:

```bash
# Missing package? Add it:
cd frontend && npm install missing-package

# Syntax error? Fix in editor
# Usually shown in logs with file:line number

# Wrong import? Check file paths
# Example: should be ./Component not /Component
```

---

### Error 12: "Env variable not found"

**Symptoms:**
- App loads but shows "undefined" or errors
- Network tab shows 404 or undefined URLs

**Cause:**
- Environment variable not set in Vercel

**Solution:**

1. Vercel Dashboard > Settings > Environment Variables
2. Check the variable exists
3. Verify spelling matches code
   - Code: `import.meta.env.VITE_API_URL`
   - Env var: `VITE_API_URL` ✓
   - NOT: `API_URL` ✗
4. Redeploy after adding/changing

---

## Render Deployment Errors

### Error 13: "Render says service is down"

**Symptoms:**
- Backend URL returns 503 or connection refused
- "Service is spinning up..."

**Causes:**
- Free plan spins down after 15 min inactivity
- Building or restarting
- Out of memory

**Solutions:**

**For free tier (expected behavior):**
```
First request: 10-30 seconds to wake up
Subsequent: instant
```

To avoid: Upgrade to paid plan ($7/mo minimum)

**For crashes:**
1. Render > Logs
2. Check for stack traces
3. Usually: MongoDB issue or missing env var
4. Fix, then Manual Deploy

---

### Error 14: "Render says 'npm start failed'"

**Symptoms:**
- Deployment shows red X
- Logs end with "npm start failed"

**Common causes:**
- Missing `npm start` script in backend/package.json
- Port binding error
- Dependency missing

**Solution:**

Check backend/package.json:
```json
"scripts": {
  "start": "node src/server.js"  // ← Must exist
}
```

Or check rendered logs for the actual error and fix.

---

## Troubleshooting Workflow

1. **Error in browser?** (F12 DevTools)
   - Check Console for JS errors
   - Check Network for failed requests
   - Look at request URL and response status

2. **Error in Vercel logs?**
   - Vercel Dashboard > Deployments > Logs
   - Usually build or env var issue

3. **Error in Render logs?**
   - Render Dashboard > Logs
   - Check for MongoDB, port, or dependency errors

4. **Can't find the issue?**
   - Try local dev version: `npm run dev`
   - If it works locally but not deployed:
     - Check env variables
     - Check URLs match
     - Check CORS
   - Read the actual error message carefully!

---

## Still Stuck?

1. **Read:** VISUAL_DEPLOYMENT_GUIDE.md > Common Issues
2. **Check:** DEPLOYMENT_STATUS.md for what's configured
3. **Review:** Logs (Vercel & Render dashboards)
4. **Ask:** ChatGPT with the exact error message from logs

---

## Quick Reference - Environment Variables

**Frontend (Vercel):**
```
VITE_API_URL = https://xxx.onrender.com/api
VITE_SOCKET_URL = https://xxx.onrender.com
VITE_GOOGLE_CLIENT_ID = [optional]
```

**Backend (Render):**
```
MONGODB_URI = mongodb+srv://...
JWT_SECRET = [strong random string]
FRONTEND_URL = https://your-app.vercel.app
NODE_ENV = production
```

Double-check these first - 80% of errors are env var issues!
