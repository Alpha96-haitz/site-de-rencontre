#!/bin/bash
# Pre-deployment checklist

echo "🔍 MeetUp Pre-Deployment Checklist"
echo ""

# Check 1: Git status
echo "1️⃣  Git Status:"
if [ -z "$(git status --porcelain)" ]; then
    echo "   ✅ All committed"
else
    echo "   ⚠️  Uncommitted changes:"
    git status --short
fi
echo ""

# Check 2: dotenv files
echo "2️⃣  Environment Files:"
[ -f ".env.template" ] && echo "   ✅ .env.template" || echo "   ❌ .env.template missing"
[ -f "backend/.env.example" ] && echo "   ✅ backend/.env.example" || echo "   ❌ backend/.env.example missing"
[ -f "frontend/.env.example" ] && echo "   ✅ frontend/.env.example" || echo "   ❌ frontend/.env.example missing"
echo ""

# Check 3: Config files
echo "3️⃣  Config Files:"
[ -f "render.yaml" ] && echo "   ✅ render.yaml" || echo "   ❌ render.yaml missing"
[ -f "frontend/vercel.json" ] && echo "   ✅ frontend/vercel.json" || echo "   ❌ frontend/vercel.json missing"
echo ""

# Check 4: Key dependencies
echo "4️⃣  Dependencies:"
cd backend && npm list express mongodb socket.io 2>/dev/null | head -4
echo ""
cd ../frontend && npm list react axios socket.io-client 2>/dev/null | head -4
cd ..
echo ""

# Check 5: Docs
echo "5️⃣  Documentation:"
[ -f "DEPLOI.md" ] && echo "   ✅ DEPLOI.md" || echo "   ❌ DEPLOI.md missing"
[ -f "VERCEL_QUICK_START.md" ] && echo "   ✅ VERCEL_QUICK_START.md" || echo "   ❌ VERCEL_QUICK_START.md missing"
echo ""

echo "✅ Ready to deploy! Follow VERCEL_QUICK_START.md"
