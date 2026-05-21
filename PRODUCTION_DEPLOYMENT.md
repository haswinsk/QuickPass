# Campus QuickPass - Production Deployment Guide

## What's Been Cleaned Up
- ✅ Removed DemoControlPanel component from the app
- ✅ Removed all demo database controls and auto-generation features
- ✅ Cleaned up unnecessary console.log statements
- ✅ Tested production build (495.97 kB, 132.21 kB gzipped)

## Pre-Deployment Checklist

### 1. Environment Variables
Update your `.env` file with production credentials:
- Get real API keys from Firebase, Razorpay, and Cloudinary
- Use a production MongoDB Atlas cluster
- Reference `.env.example` for required variables

### 2. Build for Production
```bash
npm run build
```
This creates an optimized dist/ folder ready for deployment.

### 3. Deploy Options

#### Static Hosting (Netlify, Vercel, GitHub Pages)
```bash
# Build creates dist/ folder
npm run build

# Deploy the dist/ folder to your hosting provider
```

#### Docker Deployment
```dockerfile
FROM node:22-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build
EXPOSE 3000
CMD ["npx", "serve", "-s", "dist", "-l", "3000"]
```

#### Node.js Server
```bash
npm run build
# Serve the dist/ folder with your web server
```

## Security Checklist
- [ ] Remove sensitive keys from .env (use CI/CD secrets)
- [ ] Enable HTTPS on your domain
- [ ] Add CORS headers for API endpoints
- [ ] Configure Firebase security rules
- [ ] Set up Razorpay in production mode (not test mode)
- [ ] Enable Content Security Policy headers

## Performance Tips
- Build output is 495.97 kB (132.21 kB gzipped)
- Vite already optimizes assets and code splitting
- Consider using a CDN for static assets
- Enable gzip compression on your server

## Testing Before Going Live
```bash
# Local testing of production build
npm run preview
```
Visit http://localhost:4173 to verify production build works locally.

## Post-Deployment
- Monitor error logs for production issues
- Set up analytics/monitoring (Firebase Analytics, Sentry, etc.)
- Test payment flow (Razorpay)
- Verify Firebase authentication works
- Test file uploads (Cloudinary)
