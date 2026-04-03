# 🖼️ Step-by-Step Screenshots Guide

## Partie 1: Render (Backend Deployment)

### Step 1.1: Go to Render.com

```
URL: https://render.com
Click: "Sign up" or "Continue with GitHub"
```

### Step 1.2: Create New Service from Blueprint

```
Dashboard > New > Blueprint
↓
"Connect a repository"
↓
Select your dating-app repo
↓
Render reads render.yaml automatically ✨
```

### Step 1.3: Service Preview

After blueprint parse, you'll see:
```
Service Name: meetup-backend
Root Directory: backend
Build Command: npm install
Start Command: npm start
Environment: [List of vars from render.yaml]
```

### Step 1.4: Add Environment Variables

Before deploying, add these:

```
MONGODB_URI:
├─ Get from: https://www.mongodb.com/cloud/atlas
├─ Format: mongodb+srv://username:password@cluster.mongodb.net/dating-app
└─ Must include database name + retry writes

JWT_SECRET:
├─ Generate: $(openssl rand -base64 32)
├─ Or: Create long random string (32+ chars)
└─ Example: Kph9nX7mQ2wL8vR3dT4bJ5sZ6yE9pF0w

FRONTEND_URL:
├─ Leave empty for now or use: http://localhost:5173
├─ Update later after Vercel deployment
└─ Must match EXACTLY your Vercel URL

NODE_ENV:
└─ production

GOOGLE_CLIENT_ID (optional):
├─ From: https://console.cloud.google.com
└─ Only if using Google Login

CLOUDINARY_* (optional):
├─ From: https://cloudinary.com
└─ Only if using image uploads
```

### Step 1.5: Deploy

```
Click "Deploy"
↓
Wait 5-10 minutes
↓
Check status in Logs tab
↓
When done, you'll see:
   ✅ Serveur sur https://xxx.onrender.com
```

### Step 1.6: Save Backend URL

```
After deployment, navigate to:
https://xxx.onrender.com

Should see or you can test:
https://xxx.onrender.com/api/health
└─ Should return: { "status": "OK" }

Save this URL, you'll need it for Vercel!
Example: https://meetup-backend.onrender.com
```

---

## Partie 2: Vercel (Frontend Deployment)

### Step 2.1: Go to Vercel.com

```
URL: https://vercel.com
Click: "Sign up" or "Continue with GitHub"
```

### Step 2.2: Add New Project

```
Dashboard > "Add New" > "Project"
↓
"Import Git Repository"
↓
Select your dating-app repo
```

### Step 2.3: Configure Project

Vercel will ask for settings:

```
Framework Preset:
├─ Choose: Vite (NOT Next.js, NOT vanilla)
└─ Vercel auto-detects from vite.config.js

Root Directory:
├─ Set to: frontend
└─ NOT the root, NOT backend

Build Command:
└─ npm run build ✅

Output Directory:
└─ dist ✅ (auto-detected from vite.config.js)

Install Command:
└─ npm install ✅ (default)
```

### Step 2.4: Environment Variables

CRITICAL: Add these before deploying:

```
VITE_API_URL:
├─ Value: https://xxx.onrender.com/api
├─ Example: https://meetup-backend.onrender.com/api
└─ MUST include /api at the end

VITE_SOCKET_URL:
├─ Value: https://xxx.onrender.com
├─ Example: https://meetup-backend.onrender.com
└─ NO /api, NO /socket.io

VITE_GOOGLE_CLIENT_ID (optional):
├─ From: https://console.cloud.google.com
└─ Only if Google Login is implemented
```

### Step 2.5: Deploy

```
Click "Deploy"
↓
Wait 2-3 minutes
↓
Deployment done!
↓
You'll see build logs
```

### Step 2.6: Save Frontend URL

```
After deployment, you'll see your live URL:
Example: https://dating-app-123.vercel.app

This is your FRONTEND_URL!

You can test it:
https://dating-app-123.vercel.app
└─ Should load the React app
```

---

## Partie 3: Update Backend FRONTEND_URL

### Step 3.1: Go back to Render

```
https://render.com
↓
Your Services > meetup-backend
```

### Step 3.2: Update Environment

```
Settings > Environment
↓
Find: FRONTEND_URL
↓
Change from: http://localhost:5173 (or empty)
↓
To: https://dating-app-123.vercel.app (your Vercel URL)
```

### Step 3.3: Manual Deploy

```
In Render backend service:
↓
Top right: "Manual Deploy" button
↓
Click it
↓
Wait for restart (1-2 min)
↓
When done, check logs:
   ✅ Serveur sur https://meetup-backend.onrender.com
```

---

## Partie 4: First Production Test

### Step 4.1: Open Frontend

```
https://dating-app-123.vercel.app
(your actual Vercel URL)

Should display:
✅ Landing page or Login page
✅ No console errors
✅ CSS/styling loaded
```

### Step 4.2: Test Signup/Login

```
1. Click "Sign Up" or "Login"
2. Fill form
3. Submit
4. Check Network tab (F12 > Network):
   ├─ POST /api/auth/signup (or /login)
   ├─ Status: 200 (success) or 4xx (error)
   └─ Response: { token, user, ... }
5. If error:
   └─ Check Render logs for API errors
```

### Step 4.3: Test Real-time Features

```
If app has messages/notifications:

1. Open app in 2 browser tabs
2. Login as user1 in Tab 1
3. Login as user2 in Tab 2
4. Send message from Tab 1
5. It should appear in Tab 2 automatically
   (without refresh!)
6. If not: Check Socket.IO connection
   → DevTools > Network > WS/WebSocket tab
   → Should see connection to backend
```

### Step 4.4: Test API Endpoints

```
Using DevTools Network tab or curl:

✅ GET https://dating-app-123.vercel.app/api/health
   → { "status": "OK" }

✅ POST https://dating-app-123.vercel.app/api/auth/login
   → { error: "missing fields" } or { token: "..." }

❌ If you get CORS error:
   → Backend FRONTEND_URL not updated
   → Go back Step 3, update and redeploy
```

---

## Common Issues & Quick Fixes

### Issue 1: "Cannot POST /api/auth/login"

**Diagnosis**:
1. Open DevTools F12
2. Network tab
3. Try login
4. Check request URL
   - ✅ https://dating-app-123.vercel.app/api/...
   - ❌ https://localhost:5000/api/...

**Fix**:
- Vercel Settings > Environment Variables
- Check `VITE_API_URL` is correct
- Redeploy

### Issue 2: "CORS error" / "Access denied"

**Diagnosis**:
- DevTools Console shows CORS error
- Request fails before even hitting backend

**Fix**:
1. Render > Backend > Environment
2. Update `FRONTEND_URL` = your Vercel URL
3. Manual Deploy
4. Wait 2 min for restart

### Issue 3: "Socket connection failed"

**Diagnosis**:
- Real-time features don't work
- No WebSocket in Network tab

**Fix**:
- Check `VITE_SOCKET_URL` in Vercel
- Should be just backend URL, no /api
- Example: ✅ https://xxx.onrender.com
- NOT ❌ https://xxx.onrender.com/api

### Issue 4: "Cannot load image" / Cloudinary error

**Diagnosis**:
- Image uploads fail
- Any Cloudinary-related error

**Fix**:
- Image uploads not required to launch
- Can setup later (Cloudinary is optional)
- Or add CLOUDINARY_* vars to Render if you have them

---

## Success Checklist

After all deployment steps:

- [ ] Backend running on Render
- [ ] Frontend deployed on Vercel
- [ ] App loads without errors
- [ ] Signup/Login works
- [ ] API calls successful (Network tab shows 200)
- [ ] Real-time features work (if implemented)
- [ ] No CORS errors in console

If all checked: **You're live! 🎉**

---

## Rollback / Revert

If something goes wrong:

**Frontend (Vercel)**:
```
Vercel > Deployments > Previous deployment > Revert
```

**Backend (Render)**:
```
Render > Service > Manual Deploy > Select previous version
```

Git can also revert:
```bash
git log
git revert <commit-hash>
git push
```

---

## Next: Monitor & Maintain

### Weekly checks:
- Check logs for errors
- Monitor uptime
- Verify database backups (MongoDB)

### When to upgrade plan:
- If frequent 502 errors → Backend plan needs boost
- If data lost → Enable backups
- If reaching compute limits → Upgrade

---

**Ready? Go deploy! 🚀**
