# ⚡ DEPLOY IN 5 MINUTES

**TL;DR**: Push code → Render reads `render.yaml` → Vercel builds frontend → Done

## Prerequisites ✓

- GitHub account (push repo)
- MongoDB Atlas account (free, takes 2 min)
- No coding needed!

## Step 1: MongoDB (2 min)

```
1. https://mongodb.com/cloud/atlas
2. Create account → Create project → Create cluster
3. Database Access: Add user
4. Network: Add 0.0.0.0/0
5. Cluster > Connect > Copy connection string
   → mongodb+srv://USERNAME:PASSWORD@cluster...
```

## Step 2: Push to GitHub (1 min)

```bash
cd /path/to/site
git add .
git commit -m "Deploy"
git push origin main
```

## Step 3: Deploy Backend → Render (7 min)

```
1. https://render.com (Sign up with GitHub)
2. New > Blueprint > Select repo
3. Environment Variables:
   MONGODB_URI = [copy from step 1]
   JWT_SECRET = [any long string like: MySuper$ecureSecret123!]
   FRONTEND_URL = [LEAVE EMPTY FOR NOW]
4. Deploy
5. Wait... check logs for: ✅ Serveur sur https://xxx...
6. SAVE THIS URL: https://xxx.onrender.com
```

## Step 4: Deploy Frontend → Vercel (5 min)

```
1. https://vercel.com (Sign up with GitHub)
2. Add New > Project > Select repo
3. Root: frontend | Framework: Vite
4. Environment Variables:
   VITE_API_URL = https://xxx.onrender.com/api
   (replace xxx with your Render URL from step 3)
   VITE_SOCKET_URL = https://xxx.onrender.com
5. Deploy
6. Wait... SAVE YOUR URL: https://my-app.vercel.app
```

## Step 5: Finalize Render (1 min)

```
1. https://render.com > Your Backend Service
2. Environment > FRONTEND_URL = https://my-app.vercel.app
   (use your Vercel URL from step 4)
3. Manual Deploy
```

## Step 6: Test ✓

```
Open: https://my-app.vercel.app
- Page loads? ✅
- Can signup/login? ✅
- No errors in F12 console? ✅
Done! 🎉
```

---

## Troubleshooting

**API Error?** → Step 4, check VITE_API_URL  
**CORS Error?** → Step 5, update FRONTEND_URL and redeploy  
**MongoDB Error?** → Step 3, check MONGODB_URI  

---

**Questions?** Read [VERCEL_QUICK_START.md](./VERCEL_QUICK_START.md)

**That's it!** Your app is live 🚀
