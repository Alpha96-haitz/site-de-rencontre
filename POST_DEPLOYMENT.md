# 🎯 Post-Deployment Best Practices

## 1. Monitoring & Logs

### Daily checks:

**Vercel:**
```
1. Dashboard > Deployments
2. Look for red X or failing builds
3. Check Analytics for errors
```

**Render:**
```
1. Dashboard > Services > meetup-backend
2. Check "Logs" section
3. Look for errors (red) or warnings (yellow)
```

**MongoDB:**
```
1. Atlas Dashboard > Monitoring
2. Check connection metrics
3. Monitor storage usage (free: 512MB limit)
```

### Weekly review:

- Check both platform dashboards for alerts
- Review error rates in logs
- Monitor database size growth
- Check uptime percentage

---

## 2. Security After Launch

### Immediate:

- [ ] Change `JWT_SECRET` to a new random value (current tokens become invalid)
- [ ] Enable MongoDB authentication for database users
- [ ] Review MongoDB IP whitelist (0.0.0.0/0 is OK for MVP)
- [ ] Set up email alerts in Render/Vercel

### Within 1 week:

- [ ] Review who has access to Render/Vercel dashboards
- [ ] Set up 2FA on both accounts if available
- [ ] Create separate database user for production (different from dev)
- [ ] Review API logs for suspicious activity

### Monthly:

- [ ] Rotate sensitive credentials (consider tools like 1Password)
- [ ] Update dependencies: `npm audit`, `npm update`
- [ ] Test backup/restore of MongoDB
- [ ] Review and update CORS settings if needed

---

## 3. Performance Optimization

### Frontend (on Vercel):

**Check build performance:**
```
vercel.com > Deployments > Click deployment > Audit
```

**Common optimizations:**
- Code splitting (already done in Vite)
- Image optimization (use Cloudinary)
- Remove unused dependencies: `npm prune`
- Enable caching in vercel.json

### Backend (on Render):

**Monitor response times:**
- Render Dashboard > Metrics
- Target: < 500ms for APIs

**Optimizations:**
- Add indexes to MongoDB (see TROUBLESHOOTING.md)
- Cache frequently accessed data
- Use pagination for large datasets

---

## 4. Database Maintenance

### MongoDB Atlas:

```
1. Enable automatic backups
   → Atlas > Backup > Configure Backup
   
2. Monitor storage
   → Atlas > Collections > Check size
   → Free tier: 512MB limit
   
3. Create indexes for common queries
   → Atlas > Indexes
   → Add index on commonly filtered fields
```

### Backup strategy:

```bash
# Export data locally (monthly)
mongodump --uri "mongodb+srv://..." --out ./backup-$(date +%Y%m%d)

# Check backup size
du -sh ./backup*/
```

---

## 5. Custom Domain (Optional)

### Add custom domain:

**Vercel:**
```
1. vercel.com > Project > Settings > Domains
2. Add custom domain
3. Update DNS records (instructions provided)
```

**Render:**
```
1. render.com > Backend Service > Settings > Custom Domain
2. Add custom domain
3. Verify DNS settings
```

### Update MongoDB whitelisting:

If using custom domain, ensure IP is in MongoDB whitelist:
```
MongoDB Atlas > Network Access > Add IP Address
Add your Vercel/Render server IPs
```

---

## 6. Scaling Considerations

### When to upgrade:

**Vercel Frontend:**
- Current: Free tier (unlimited bandwidth for static)
- Upgrade trigger: Never (unless custom features)

**Render Backend:**
- Current: Free tier (sleeps after 15 min, 512MB RAM)
- Upgrade trigger: When...
  - App needs 24/7 availability
  - → Upgrade to: Starter ($7/mo, always on)
  - After 100+ concurrent users
  - → Upgrade to: Standard ($25+/mo)

**MongoDB:**
- Current: Free tier (512MB storage)
- Upgrade trigger: When...
  - Storage exceeds 512MB
  - → Upgrade to: M2 ($9/mo, 2.5GB)
  - Need multiple regions
  - → Upgrade to: M10+ with Multi-region

---

## 7. Analytics & User Tracking

### Frontend Analytics (optional):

```javascript
// Add analytics to track user actions
// Popular options: Google Analytics, Mixpanel, LogRocket
// Example (Google Analytics):

import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

export function Analytics() {
  const location = useLocation();
  
  useEffect(() => {
    window.gtag('pageview', location.pathname);
  }, [location]);
}
```

### Backend Monitoring (optional):

Set up error tracking:
```javascript
// Add Sentry for error tracking
import * as Sentry from "@sentry/node";

Sentry.init({
  dsn: "https://your-sentry-dsn",
  environment: process.env.NODE_ENV,
});
```

---

## 8. Dependency Updates

### Weekly check:

```bash
npm outdated  # See what's outdated
npm audit     # Check security vulnerabilities
```

### Update procedure:

```bash
# Check what will update
npm update --dry-run

# Update non-major versions (safer)
npm update

# Test locally
npm run dev

# If working, commit and push
git add package.json package-lock.json
git commit -m "chore: update dependencies"
git push
# Vercel/Render auto-redeploy

# Check deployed version
# Verify in browser: No new errors
```

### Major version updates:

Do these carefully:
```bash
npm install express@5  # Update to new major version
# Test thoroughly before pushing
npm run dev      # Check for breaking changes
# Read changelog for breaking changes
```

---

## 9. Error Monitoring

### Setup alerts:

**Vercel:**
- Dashboard > Settings > Notifications
- Enable: Build Failures, Performance Alerts

**Render:**
- Dashboard > Account > Notifications
- Enable: Deployment failures, Runtime errors

**MongoDB:**
- Atlas > Alerts
- Enable: Connection errors, Quota alerts

### When you get an alert:

1. Check the platform dashboard
2. Read the error message
3. Check logs
4. Fix and redeploy if needed
5. Verify fix worked

---

## 10. Maintenance Windows

Real-world maintenance schedule:

### Daily (automated):
- App running checks
- Database backups (Atlas does this)

### Weekly (you):
- Update check: `npm outdated`
- Log review: Any errors?
- Database size check: Growing too fast?

### Monthly (you):
- Security review
- Performance review
- Backup test
- Dependency updates

### Quarterly (you):
- Major security patches
- Infrastructure review
- Feature audit

---

## 11. Disaster Recovery

### If something breaks:

1. **Revert code:**
   ```bash
   git revert <bad-commit>
   git push
   # Vercel/Render auto-redeploy
   ```

2. **Revert deployment:**
   ```
   Vercel: Deployments > Previous > Promote
   Render: Manual Deploy > Select previous version
   ```

3. **Restore database:**
   ```bash
   # From MongoDB Atlas backup
   mongorestore --uri "mongodb+srv://..." --archive=backup.archive
   ```

---

## 12. Production Checklist (Before First Users)

- [ ] App loads quickly (< 3 seconds)
- [ ] Signup/login works
- [ ] Database operations successful
- [ ] API errors handled gracefully
- [ ] CORS not blocking requests
- [ ] WebSocket real-time working
- [ ] Mobile responsive (test on phone)
- [ ] Error messages user-friendly
- [ ] Rate limiting working (can't spam API)
- [ ] Sensitive data not logged
- [ ] Passwords hashed (bcrypt)
- [ ] HTTPS enforced (automatic)
- [ ] No console errors in DevTools
- [ ] All env variables set
- [ ] MongoDB backups enabled
- [ ] Team has access to dashboards

---

## 13. Performance Metrics to Watch

### Frontend:

- **First Contentful Paint (FCP):** < 1.8s (good)
- **Largest Contentful Paint (LCP):** < 2.5s (good)
- **Error rate:** < 0.1%

### Backend:

- **API response time:** < 500ms (good)
- **Database query time:** < 100ms (good)
- **Uptime:** > 99.9% (goal)
- **Error rate:** < 0.1%

### Database:

- **Connection pool usage:** < 80%
- **Storage used:** Check weekly
- **Backup status:** Always current

### Check metrics in:

- **Vercel:** Analytics tab
- **Render:** Metrics tab
- **MongoDB:** Monitoring tab

---

## 14. When to Ask for Help

Get professional help if:

- [ ] App consistently down/slow
- [ ] Database getting too large
- [ ] Security breach suspected
- [ ] Need advanced MongoDB features
- [ ] Need custom domain + SSL
- [ ] Have > 1000 daily active users
- [ ] Need background jobs (cron)

Resources:
- Vercel Support: vercel.com/help
- Render Support: render.com/support
- MongoDB Support: mongodb.com/support

---

## Summary

**Daily:** Check dashboards for errors  
**Weekly:** Update dependencies, check sizes  
**Monthly:** Security review, optimization  
**Quarterly:** Major updates, infrastructure review  

**First Alert:** Read the error, check logs, fix  
**Second Alert:** Same incident? Escalate to help  

**Keep:** Latest backups of data  
**Never:** Ignore security warnings  
**Always:** Test locally before deploying  

You're live! Enjoy 🚀
