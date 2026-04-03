#!/bin/bash
# Déploiement rapide MeetUp vers Vercel + Render

echo "🚀 Déploiement MeetUp"
echo ""

# 1. Git push
echo "📤 Pushing to GitHub..."
git add .
git commit -m "Deploy to Vercel + Render"
git push origin main

if [ $? -ne 0 ]; then
    echo "❌ Git push failed"
    exit 1
fi

echo "✅ Code pushed to GitHub"
echo ""
echo "📋 Next steps:"
echo ""
echo "1️⃣  Backend sur Render:"
echo "   → Va sur https://render.com"
echo "   → New > Blueprint > Connect repo"
echo "   → Render lira render.yaml automatiquement"
echo "   → Configure les ENV variables"
echo "   → Deploy"
echo ""
echo "2️⃣  Frontend sur Vercel:"
echo "   → Va sur https://vercel.com"
echo "   → Add New > Project > Import GitHub"
echo "   → Root: frontend | Framework: Vite"
echo "   → Add ENV variables:"
echo "      VITE_API_URL = https://xxx.onrender.com/api"
echo "      VITE_SOCKET_URL = https://xxx.onrender.com"
echo "   → Deploy"
echo ""
echo "3️⃣  Après déploiement Vercel:"
echo "   → Retour à Render"
echo "   → Update FRONTEND_URL = votre-app.vercel.app"
echo "   → Manual Deploy pour redémarrer"
echo ""
