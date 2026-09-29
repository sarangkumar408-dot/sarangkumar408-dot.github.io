# NexusForge - Deployment Guide

## Overview
This guide will help you deploy your NexusForge website to the internet so anyone can access it.

## 🚀 Quick Deployment Options

### Option 1: Vercel (Recommended - FREE & Easy)
**Best for:** Simple deployment with automatic HTTPS

1. **Create a Vercel Account:**
   - Go to [vercel.com](https://vercel.com)
   - Sign up with GitHub or email

2. **Prepare Your Project:**
   ```bash
   npm init -y
   npm install express
   ```

3. **Deploy to Vercel:**
   ```bash
   npm install -g vercel
   vercel login
   vercel --prod
   ```

### Option 2: Render (FREE Tier Available)
**Best for:** Node.js applications with persistent storage

1. Create account at [render.com](https://render.com)
2. Click "New +" → "Web Service"
3. Connect GitHub repository
4. Configure:
   - Name: `nexusforge`
   - Environment: `Node`
   - Build Command: `npm install`
   - Start Command: `node server.js`

### Option 3: Railway (FREE Tier Available)
**Best for:** Easy deployment with database support

1. Create account at [railway.app](https://railway.app)
2. Click "New Project" → "Deploy from GitHub repo"

## 📋 Pre-Deployment Checklist

### Create .gitignore
```
node_modules/
data/
.env
*.log
.DS_Store
```

### Test Locally
```bash
npm install
npm start
```
Visit `http://localhost:3000`

## 🔒 Security
1. Change default admin password in production
2. Enable HTTPS (auto with Vercel/Render)
3. Use environment variables for sensitive data

## 📱 Post-Deployment Testing
- Homepage loads with dark theme and animations
- Live news section fetches and displays articles
- Contact form submits and stores messages
- Admin login works at `/admin.html`
- Visit statistics track correctly
- Mobile responsive design works

## Need Help?
Contact: hello@nexusforge.dev

