# Dumbdown Deployment Guide

## Cloudflare Workers Deployment

### Prerequisites

- **Cloudflare Account** - Free tier works fine
- **Wrangler CLI** - Install via `npm install -g wrangler` or use `npm run worker`
- **Node.js 18+** - For local testing

### Initial Setup (First Time)

#### 1. Authenticate with Cloudflare

```bash
wrangler login
```

This opens a browser to authenticate and saves your credentials locally.

#### 2. Configure Your Worker

Edit `wrangler.toml` to customize:

```toml
name = "dumbdown"  # Your worker name
route = "https://yourdomain.com/*"  # Your domain (optional)
```

#### 3. What Cloudflare Asks For

When deploying a Worker, Cloudflare typically asks for:

- **Account Details** ✓ (Already provided via `wrangler login`)
- **Environment** ✓ (production/staging - configure in `wrangler.toml`)
- **Build Command** ✓ (Configured: `npm install && npm run build:worker`)
- **Build Output** ✓ (Automatically handled by Wrangler)
- **Entry Point** ✓ (Configured: `src/worker.js`)
- **Routes/Domain** ⚠️ (Optional - add to `wrangler.toml` if you have a domain)
- **Environment Variables** ⚠️ (Optional - can be added later via `wrangler secret`)

### Deployment Methods

#### Option A: Direct Wrangler Deploy

```bash
# Install dependencies
npm install

# Test locally first
npm run worker

# Deploy to Cloudflare
npm run deploy
```

#### Option B: Git Integration (Recommended)

1. **Push to GitHub/GitLab**
   ```bash
   git remote add origin https://github.com/yourusername/dumbdown.git
   git push -u origin main
   ```

2. **Connect Cloudflare**
   - Go to [Cloudflare Dashboard](https://dash.cloudflare.com)
   - Navigate to **Workers & Pages** → **Create application** → **Deploy with Git**
   - Select your repository
   - Configure build settings:
     - **Build command**: `npm install && npm run build:worker`
     - **Build output directory**: (Leave empty)
     - **Root directory**: `/` (or where your code is)

3. **Auto-Deployment**
   - Every push to `main` branch automatically deploys
   - Staging deployments on pull requests (optional)

#### Option C: GitHub Actions (Advanced)

Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy to Cloudflare Workers

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: 18
      - run: npm ci
      - run: npm run build
      - run: npx wrangler publish
        env:
          CLOUDFLARE_API_TOKEN: ${{ secrets.CLOUDFLARE_API_TOKEN }}
```

Then add your API token as a GitHub Secret.

### Local Development

```bash
# Start local Wrangler dev server
npm run worker

# Server runs at http://localhost:8787
# Web UI: http://localhost:8787
# API: POST http://localhost:8787/convert
```

### Testing Before Deploy

```bash
# Run test suite
npm test

# Test with sample HTML
curl -X POST http://localhost:8787/convert \
  -H "Content-Type: application/json" \
  -d '{"text": "<h1>Test</h1><p>Hello</p>"}'
```

### Environment Variables

#### Add Secrets (Encrypted)

```bash
wrangler secret put MY_SECRET
# Enter value when prompted
```

#### Add to Worker

```javascript
export default {
  async fetch(request, env) {
    const secret = env.MY_SECRET;
  }
}
```

### Custom Domain Setup

#### Via Cloudflare Dashboard

1. Go to **Workers & Pages** → Your Worker
2. Click **Triggers**
3. Add custom domain under **Routes**
4. Example: `https://dumbdown.yourdomain.com/*`

#### Via wrangler.toml

```toml
route = "https://yourdomain.com/api/convert/*"
zone_id = "your-zone-id"  # Get from Cloudflare Dashboard
```

### Troubleshooting

#### "Authentication Error"
```bash
# Clear cached credentials
rm ~/.wrangler/config/default.toml
wrangler login
```

#### "Build Failed"
```bash
# Check logs
wrangler logs

# Try building locally
npm run build
```

#### "404 on Root Path"
The Worker serves static files from `public/` if configured. Currently configured for POST `/convert` and GET `/health`.

#### "CORS Issues"
All endpoints include proper CORS headers. If issues persist:
```javascript
// Already included in worker.js
const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};
```

### Monitoring & Analytics

#### View Logs

```bash
# Real-time logs
wrangler tail

# Last logs
wrangler logs
```

#### Cloudflare Dashboard

- Go to **Workers & Pages** → Your Worker
- Click **Analytics** for traffic, errors, CPU time
- **Settings** for Rate Limiting, Routes, Environment

### Production Checklist

- [ ] Tested locally with `npm run worker`
- [ ] All tests passing: `npm test`
- [ ] Git repository configured and pushed
- [ ] Cloudflare account authenticated: `wrangler login`
- [ ] `wrangler.toml` reviewed and customized
- [ ] Deployed once with `npm run deploy`
- [ ] Verified at production URL
- [ ] Custom domain configured (if applicable)
- [ ] Monitoring set up in Cloudflare Dashboard

### Rollback

If deployment has issues:

```bash
# View deployment history
wrangler deployments list

# Rollback to previous version
wrangler rollback
```

### Performance Optimization

Cloudflare Workers includes:
- Global edge network (optimized routing)
- Automatic caching
- DDoS protection
- Rate limiting (available)

No additional setup needed for these features.

### Cost

**Dumbdown is within Cloudflare's free tier:**
- 100,000 requests/day
- Unlimited workers
- Custom domains with SSL
- Full analytics

See [Cloudflare Pricing](https://developers.cloudflare.com/workers/platform/pricing/) for details.

### Useful Commands

```bash
# Local development
npm run worker          # Start dev server on port 8787

# Deploy
npm run deploy          # Deploy to production
wrangler publish        # Same as above

# Monitoring
wrangler tail          # Stream live logs
wrangler logs          # View last logs
wrangler deployments   # List previous deployments

# Configuration
wrangler secret put    # Add encrypted environment variable
wrangler secret list   # List secrets
wrangler secret delete # Remove secret

# Debugging
wrangler tail --status error  # Only error logs
wrangler tail --format json   # JSON output
```

### Resources

- **Cloudflare Workers Docs**: https://developers.cloudflare.com/workers/
- **Wrangler CLI Docs**: https://developers.cloudflare.com/workers/wrangler/
- **Troubleshooting**: https://developers.cloudflare.com/workers/troubleshooting/

---

For local Node.js development (without Cloudflare):

```bash
npm run dev    # Starts Express on port 3000
```

Dumbdown works equally well on any Node.js hosting platform!
