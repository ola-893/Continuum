# Frontend Deployment Guide

This guide provides comprehensive instructions for building and deploying the Continuum Protocol frontend application to various hosting platforms.

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Build Configuration](#build-configuration)
3. [Environment Variables](#environment-variables)
4. [Building for Production](#building-for-production)
5. [Deployment Platforms](#deployment-platforms)
6. [Network Configuration](#network-configuration)
7. [Post-Deployment Verification](#post-deployment-verification)
8. [Troubleshooting](#troubleshooting)

## Prerequisites

### Required Tools

- **Node.js**: Version 18.x or higher
- **npm**: Version 9.x or higher (comes with Node.js)
- **Git**: For version control

### Installation

```bash
# Check Node.js version
node --version  # Should be v18.x or higher

# Check npm version
npm --version   # Should be 9.x or higher

# If you need to install Node.js, visit: https://nodejs.org/
```

### Project Setup

```bash
# Clone the repository
git clone <repository-url>
cd continuum-protocol

# Navigate to frontend directory
cd frontend

# Install dependencies
npm install
```

## Build Configuration

### Package Scripts

The frontend includes several build scripts for different environments:

```json
{
  "dev": "vite",                                    // Development server
  "build": "tsc && vite build",                     // Production build
  "build:staging": "tsc && vite build --mode staging",  // Staging build
  "build:production": "tsc && vite build --mode production",  // Production build
  "preview": "vite preview",                        // Preview production build locally
  "validate:config": "node scripts/validate-config.cjs"  // Validate environment config
}
```

### TypeScript Configuration

The build process includes TypeScript compilation. Ensure your `tsconfig.json` is properly configured:

```bash
# Check for TypeScript errors before building
npx tsc --noEmit
```

## Environment Variables

### Required Variables

All environment variables must be prefixed with `VITE_` to be accessible in the browser.

#### Network Selection

```bash
# Set to 'ghostnet' for testnet or 'mainnet' for production
VITE_TEZOS_NETWORK=ghostnet
```

#### Ghostnet Contract Addresses

```bash
VITE_GHOSTNET_STREAMING_PROTOCOL=KT1...
VITE_GHOSTNET_ASSET_YIELD_PROTOCOL=KT1...
VITE_GHOSTNET_COMPLIANCE_GUARD=KT1...
VITE_GHOSTNET_TOKEN_REGISTRY=KT1...
VITE_GHOSTNET_RWA_HUB=KT1...
VITE_GHOSTNET_FA2_TOKEN=KT1...
```

#### Mainnet Contract Addresses

```bash
VITE_MAINNET_STREAMING_PROTOCOL=KT1...
VITE_MAINNET_ASSET_YIELD_PROTOCOL=KT1...
VITE_MAINNET_COMPLIANCE_GUARD=KT1...
VITE_MAINNET_TOKEN_REGISTRY=KT1...
VITE_MAINNET_RWA_HUB=KT1...
VITE_MAINNET_FA2_TOKEN=KT1...
```

### Optional Variables

```bash
# Custom RPC endpoints (defaults will be used if not specified)
VITE_GHOSTNET_RPC=https://ghostnet.ecadinfra.com
VITE_MAINNET_RPC=https://mainnet.api.tez.ie

# Environment identifier
VITE_ENVIRONMENT=development|staging|production

# Enable debug logging
VITE_ENABLE_DEBUG=true|false
```

### Environment File Setup

1. **Copy the example file**:
   ```bash
   cp .env.example .env.production
   ```

2. **Edit the file** with your contract addresses:
   ```bash
   nano .env.production
   # or
   vim .env.production
   ```

3. **Validate configuration**:
   ```bash
   npm run validate:production
   ```

## Building for Production

### Step 1: Prepare Environment

```bash
# Ensure you're in the frontend directory
cd frontend

# Install/update dependencies
npm ci  # Use 'ci' for clean install in production

# Verify environment configuration
npm run validate:production
```

### Step 2: Build the Application

#### For Ghostnet (Testnet)

```bash
# Build with staging configuration
npm run build:staging

# Or with explicit environment
VITE_TEZOS_NETWORK=ghostnet npm run build
```

#### For Mainnet (Production)

```bash
# Build with production configuration
npm run build:production

# Or with explicit environment
VITE_TEZOS_NETWORK=mainnet npm run build
```

### Step 3: Verify Build Output

```bash
# Check the dist directory
ls -la dist/

# Preview the build locally
npm run preview
# Open http://localhost:4173 in your browser
```

### Build Output

The build process creates a `dist/` directory containing:

```
dist/
├── index.html           # Main HTML file
├── assets/              # Compiled JS, CSS, and images
│   ├── index-[hash].js
│   ├── index-[hash].css
│   └── [other assets]
└── vite.svg            # Favicon
```

## Deployment Platforms

### Netlify

#### Method 1: Netlify CLI

```bash
# Install Netlify CLI
npm install -g netlify-cli

# Login to Netlify
netlify login

# Deploy to production
netlify deploy --prod --dir=dist

# Or deploy to preview
netlify deploy --dir=dist
```

#### Method 2: Netlify UI

1. Build the application locally:
   ```bash
   npm run build:production
   ```

2. Go to [Netlify](https://app.netlify.com/)
3. Click "Add new site" → "Deploy manually"
4. Drag and drop the `dist/` folder

#### Method 3: Continuous Deployment

Create `netlify.toml` in the project root:

```toml
[build]
  command = "cd frontend && npm ci && npm run build:production"
  publish = "frontend/dist"

[build.environment]
  NODE_VERSION = "18"

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200
```

Set environment variables in Netlify dashboard:
- Site settings → Environment variables
- Add all `VITE_*` variables

### Vercel

#### Method 1: Vercel CLI

```bash
# Install Vercel CLI
npm install -g vercel

# Login to Vercel
vercel login

# Deploy to production
vercel --prod

# Or deploy to preview
vercel
```

#### Method 2: Vercel UI

1. Go to [Vercel](https://vercel.com/)
2. Click "Add New" → "Project"
3. Import your Git repository
4. Configure:
   - **Framework Preset**: Vite
   - **Root Directory**: `frontend`
   - **Build Command**: `npm run build:production`
   - **Output Directory**: `dist`
5. Add environment variables in project settings
6. Deploy

#### Configuration File

Create `vercel.json` in the frontend directory:

```json
{
  "buildCommand": "npm run build:production",
  "outputDirectory": "dist",
  "framework": "vite",
  "rewrites": [
    {
      "source": "/(.*)",
      "destination": "/index.html"
    }
  ]
}
```

### AWS S3 + CloudFront

#### Step 1: Build the Application

```bash
npm run build:production
```

#### Step 2: Create S3 Bucket

```bash
# Install AWS CLI if not already installed
# Visit: https://aws.amazon.com/cli/

# Create S3 bucket
aws s3 mb s3://continuum-protocol-frontend

# Enable static website hosting
aws s3 website s3://continuum-protocol-frontend \
  --index-document index.html \
  --error-document index.html
```

#### Step 3: Upload Files

```bash
# Sync dist folder to S3
aws s3 sync dist/ s3://continuum-protocol-frontend \
  --delete \
  --cache-control "public, max-age=31536000, immutable" \
  --exclude "index.html"

# Upload index.html with no-cache
aws s3 cp dist/index.html s3://continuum-protocol-frontend/index.html \
  --cache-control "no-cache, no-store, must-revalidate"
```

#### Step 4: Configure CloudFront

1. Create CloudFront distribution
2. Set origin to S3 bucket
3. Configure custom error responses:
   - 403 → /index.html (200)
   - 404 → /index.html (200)
4. Enable HTTPS
5. Set custom domain (optional)

#### Deployment Script

Create `deploy-aws.sh`:

```bash
#!/bin/bash
set -e

echo "Building application..."
npm run build:production

echo "Uploading to S3..."
aws s3 sync dist/ s3://continuum-protocol-frontend \
  --delete \
  --cache-control "public, max-age=31536000, immutable" \
  --exclude "index.html"

aws s3 cp dist/index.html s3://continuum-protocol-frontend/index.html \
  --cache-control "no-cache, no-store, must-revalidate"

echo "Invalidating CloudFront cache..."
aws cloudfront create-invalidation \
  --distribution-id YOUR_DISTRIBUTION_ID \
  --paths "/*"

echo "Deployment complete!"
```

### GitHub Pages

#### Step 1: Configure Base Path

Update `vite.config.ts`:

```typescript
export default defineConfig({
  base: '/continuum-protocol/',  // Replace with your repo name
  // ... other config
})
```

#### Step 2: Build and Deploy

```bash
# Build the application
npm run build:production

# Deploy using gh-pages
npx gh-pages -d dist
```

#### Method 2: GitHub Actions

Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy to GitHub Pages

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
      
      - name: Install dependencies
        run: |
          cd frontend
          npm ci
      
      - name: Build
        env:
          VITE_TEZOS_NETWORK: ${{ secrets.VITE_TEZOS_NETWORK }}
          VITE_MAINNET_STREAMING_PROTOCOL: ${{ secrets.VITE_MAINNET_STREAMING_PROTOCOL }}
          VITE_MAINNET_ASSET_YIELD_PROTOCOL: ${{ secrets.VITE_MAINNET_ASSET_YIELD_PROTOCOL }}
          VITE_MAINNET_COMPLIANCE_GUARD: ${{ secrets.VITE_MAINNET_COMPLIANCE_GUARD }}
          VITE_MAINNET_TOKEN_REGISTRY: ${{ secrets.VITE_MAINNET_TOKEN_REGISTRY }}
          VITE_MAINNET_RWA_HUB: ${{ secrets.VITE_MAINNET_RWA_HUB }}
          VITE_MAINNET_FA2_TOKEN: ${{ secrets.VITE_MAINNET_FA2_TOKEN }}
        run: |
          cd frontend
          npm run build:production
      
      - name: Deploy
        uses: peaceiris/actions-gh-pages@v3
        with:
          github_token: ${{ secrets.GITHUB_TOKEN }}
          publish_dir: ./frontend/dist
```

### Docker Deployment

#### Dockerfile

Create `Dockerfile` in the frontend directory:

```dockerfile
# Build stage
FROM node:18-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy source code
COPY . .

# Build arguments for environment variables
ARG VITE_TEZOS_NETWORK
ARG VITE_MAINNET_STREAMING_PROTOCOL
ARG VITE_MAINNET_ASSET_YIELD_PROTOCOL
ARG VITE_MAINNET_COMPLIANCE_GUARD
ARG VITE_MAINNET_TOKEN_REGISTRY
ARG VITE_MAINNET_RWA_HUB
ARG VITE_MAINNET_FA2_TOKEN

# Build application
RUN npm run build:production

# Production stage
FROM nginx:alpine

# Copy built files
COPY --from=builder /app/dist /usr/share/nginx/html

# Copy nginx configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
```

#### nginx.conf

```nginx
server {
    listen 80;
    server_name _;
    root /usr/share/nginx/html;
    index index.html;

    # Enable gzip compression
    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript;

    # Cache static assets
    location /assets/ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # SPA routing
    location / {
        try_files $uri $uri/ /index.html;
    }

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
}
```

#### Build and Run

```bash
# Build Docker image
docker build \
  --build-arg VITE_TEZOS_NETWORK=mainnet \
  --build-arg VITE_MAINNET_STREAMING_PROTOCOL=KT1... \
  --build-arg VITE_MAINNET_ASSET_YIELD_PROTOCOL=KT1... \
  --build-arg VITE_MAINNET_COMPLIANCE_GUARD=KT1... \
  --build-arg VITE_MAINNET_TOKEN_REGISTRY=KT1... \
  --build-arg VITE_MAINNET_RWA_HUB=KT1... \
  --build-arg VITE_MAINNET_FA2_TOKEN=KT1... \
  -t continuum-frontend .

# Run container
docker run -p 80:80 continuum-frontend
```

## Network Configuration

### Switching Networks

The application can be configured for different Tezos networks:

#### Ghostnet (Testnet)

```bash
# Set in .env.staging or .env
VITE_TEZOS_NETWORK=ghostnet

# Build
npm run build:staging
```

#### Mainnet (Production)

```bash
# Set in .env.production
VITE_TEZOS_NETWORK=mainnet

# Build
npm run build:production
```

### Network-Specific Features

The application automatically adjusts based on the network:

- **Ghostnet**: Shows faucet links, testnet warnings
- **Mainnet**: Hides test features, shows production warnings

### Custom RPC Endpoints

Override default RPC endpoints:

```bash
# Ghostnet
VITE_GHOSTNET_RPC=https://ghostnet.ecadinfra.com

# Mainnet
VITE_MAINNET_RPC=https://mainnet.api.tez.ie
```

## Post-Deployment Verification

### Checklist

After deployment, verify the following:

#### 1. Application Loads

```bash
# Check if the site is accessible
curl -I https://your-domain.com

# Should return 200 OK
```

#### 2. Contract Addresses

Open browser console and check:

```javascript
// Check if contract addresses are loaded
console.log(import.meta.env.VITE_MAINNET_RWA_HUB);
// Should output: KT1...
```

#### 3. Wallet Connection

- Connect Temple/Kukai/Umami wallet
- Verify network detection works
- Check if address displays correctly

#### 4. Network Indicator

- Verify correct network is displayed (Ghostnet/Mainnet)
- Check if network mismatch warnings appear when appropriate

#### 5. Contract Interactions

Test basic operations:
- Query stream information
- Check claimable balances
- Verify transaction submission works

#### 6. Error Handling

Test error scenarios:
- Wrong network connection
- Transaction rejection
- Invalid inputs

### Monitoring

#### Application Health

```bash
# Check if application is responding
curl https://your-domain.com/health

# Monitor response times
curl -w "@curl-format.txt" -o /dev/null -s https://your-domain.com
```

#### Browser Console

Check for errors in browser console:
- No JavaScript errors
- No failed network requests
- No missing resources (404s)

#### Performance

Use Lighthouse or similar tools:

```bash
# Install Lighthouse
npm install -g lighthouse

# Run audit
lighthouse https://your-domain.com --view
```

Target scores:
- Performance: > 90
- Accessibility: > 90
- Best Practices: > 90
- SEO: > 90

## Troubleshooting

### Build Failures

#### Issue: TypeScript compilation errors

```bash
# Check for TypeScript errors
npx tsc --noEmit

# Fix errors and rebuild
npm run build
```

#### Issue: Missing dependencies

```bash
# Clean install
rm -rf node_modules package-lock.json
npm install

# Rebuild
npm run build
```

#### Issue: Out of memory during build

```bash
# Increase Node.js memory limit
NODE_OPTIONS="--max-old-space-size=4096" npm run build
```

### Deployment Issues

#### Issue: Environment variables not loading

**Solution**:
1. Ensure variables are prefixed with `VITE_`
2. Check if variables are set in deployment platform
3. Rebuild after changing variables

#### Issue: 404 errors on page refresh

**Solution**: Configure server for SPA routing

**Netlify**: Add `_redirects` file:
```
/*    /index.html   200
```

**Vercel**: Already handled by `vercel.json`

**Nginx**: Use the provided `nginx.conf`

#### Issue: Assets not loading (CORS errors)

**Solution**: Configure CORS headers

```nginx
# In nginx.conf
add_header Access-Control-Allow-Origin "*";
add_header Access-Control-Allow-Methods "GET, OPTIONS";
```

### Runtime Issues

#### Issue: Wallet connection fails

**Causes**:
- Wallet extension not installed
- Wrong network selected in wallet
- Beacon SDK initialization error

**Solutions**:
1. Install Temple/Kukai/Umami wallet
2. Switch wallet to correct network
3. Clear browser cache and localStorage
4. Check browser console for errors

#### Issue: Contract calls fail

**Causes**:
- Wrong contract addresses
- Network mismatch
- Insufficient gas
- Invalid parameters

**Solutions**:
1. Verify contract addresses in environment variables
2. Check network configuration
3. Increase gas limit
4. Validate input parameters

#### Issue: Real-time balance not updating

**Causes**:
- JavaScript timer not running
- Stream data not loaded
- Calculation error

**Solutions**:
1. Check browser console for errors
2. Verify stream data is loaded
3. Check if component is mounted
4. Refresh the page

### Performance Issues

#### Issue: Slow initial load

**Solutions**:
1. Enable gzip compression
2. Use CDN for static assets
3. Implement code splitting
4. Optimize images

#### Issue: High memory usage

**Solutions**:
1. Check for memory leaks in React components
2. Properly cleanup timers and subscriptions
3. Use React.memo for expensive components
4. Implement virtual scrolling for long lists

## Hosting Recommendations

### For Development/Testing

- **Netlify**: Easy setup, free tier, automatic deployments
- **Vercel**: Excellent DX, preview deployments, free tier

### For Production

- **AWS S3 + CloudFront**: Scalable, reliable, cost-effective
- **Vercel Pro**: Enhanced performance, analytics, support
- **Netlify Pro**: Advanced features, better limits

### For Enterprise

- **AWS**: Full control, compliance, custom infrastructure
- **Azure Static Web Apps**: Enterprise features, integration
- **Google Cloud Storage + CDN**: Global distribution, reliability

## Security Considerations

### Environment Variables

- Never commit `.env` files with real values
- Use platform-specific secret management
- Rotate contract addresses if compromised

### Content Security Policy

Add CSP headers:

```nginx
add_header Content-Security-Policy "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; connect-src 'self' https://ghostnet.ecadinfra.com https://mainnet.api.tez.ie;";
```

### HTTPS

Always use HTTPS in production:
- Netlify/Vercel: Automatic HTTPS
- AWS: Use CloudFront with ACM certificate
- Custom: Use Let's Encrypt

## Additional Resources

- [Vite Documentation](https://vitejs.dev/)
- [Taquito Documentation](https://tezostaquito.io/)
- [Beacon SDK Documentation](https://docs.walletbeacon.io/)
- [Tezos Developer Portal](https://tezos.com/developers/)
- [Netlify Documentation](https://docs.netlify.com/)
- [Vercel Documentation](https://vercel.com/docs)

## Support

For deployment issues:
- Check the [Troubleshooting Guide](./TROUBLESHOOTING.md)
- Review [GitHub Issues](https://github.com/your-repo/issues)
- Contact the development team

---

**Last Updated**: February 2026
**Version**: 1.0.0
