#!/bin/bash
# ✅ FINAL DEPLOYMENT CHECKLIST

echo "╔════════════════════════════════════════════════════════════════╗"
echo "║                   DEPLOYMENT CHECKLIST                        ║"
echo "╚════════════════════════════════════════════════════════════════╝"
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Counter
PASSED=0
FAILED=0

check() {
    if [ $1 -eq 0 ]; then
        echo -e "${GREEN}✓${NC} $2"
        ((PASSED++))
    else
        echo -e "${RED}✗${NC} $2"
        ((FAILED++))
    fi
}

# 1. Git check
echo "📦 GIT"
git rev-parse --git-dir > /dev/null 2>&1
check $? "Git repository initialized"
[ -f ".gitignore" ] && [ -z "$(grep -l '.env' .gitignore 2>/dev/null)" ] && grep -q '\.env' .gitignore
check $? ".env files ignored by .gitignore"
echo ""

# 2. Backend check
echo "⚙️  BACKEND"
[ -f "backend/package.json" ]
check $? "backend/package.json exists"
[ -d "backend/src" ]
check $? "backend/src directory exists"
[ -f "backend/.env.example" ]
check $? "backend/.env.example exists"
[ -f "backend/src/server.js" ]
check $? "backend/src/server.js exists"
echo ""

# 3. Frontend check
echo "🎨 FRONTEND"
[ -f "frontend/package.json" ]
check $? "frontend/package.json exists"
[ -f "frontend/vite.config.js" ]
check $? "frontend/vite.config.js exists"
[ -f "frontend/vercel.json" ]
check $? "frontend/vercel.json exists"
[ -f "frontend/.env.example" ]
check $? "frontend/.env.example exists"
[ -f "frontend/.env.local" ]
check $? "frontend/.env.local exists"
echo ""

# 4. Config files check
echo "🔧 CONFIGURATION"
[ -f "render.yaml" ]
check $? "render.yaml exists"
[ -f "package.json" ]
check $? "Root package.json exists"
[ -f ".env.template" ]
check $? ".env.template exists"
echo ""

# 5. Documentation check
echo "📚 DOCUMENTATION"
[ -f "QUICK_DEPLOY.md" ]
check $? "QUICK_DEPLOY.md exists"
[ -f "VERCEL_QUICK_START.md" ]
check $? "VERCEL_QUICK_START.md exists"
[ -f "DEPLOI.md" ]
check $? "DEPLOI.md exists"
[ -f "DEV_GUIDE.md" ]
check $? "DEV_GUIDE.md exists"
[ -f "VISUAL_DEPLOYMENT_GUIDE.md" ]
check $? "VISUAL_DEPLOYMENT_GUIDE.md exists"
[ -f "DOCS_INDEX.md" ]
check $? "DOCS_INDEX.md exists"
echo ""

# 6. Scripts check
echo "📝 SCRIPTS"
[ -f "scripts/setup.js" ]
check $? "scripts/setup.js exists"
[ -f "deploy.sh" ]
check $? "deploy.sh exists"
echo ""

# Results
echo "════════════════════════════════════════════════════════════════"
echo -e "Results: ${GREEN}${PASSED} passed${NC}, ${RED}${FAILED} failed${NC}"
echo ""

if [ $FAILED -eq 0 ]; then
    echo -e "${GREEN}✅ All checks passed!${NC}"
    echo ""
    echo "Next steps:"
    echo "  1. Read QUICK_DEPLOY.md"
    echo "  2. Create MongoDB account"
    echo "  3. Git push your code"
    echo "  4. Deploy to Render + Vercel"
    echo ""
    echo "Questions? → Read DOCS_INDEX.md"
    exit 0
else
    echo -e "${RED}❌ Some checks failed!${NC}"
    echo "Please verify the files above exist and are configured correctly."
    exit 1
fi
