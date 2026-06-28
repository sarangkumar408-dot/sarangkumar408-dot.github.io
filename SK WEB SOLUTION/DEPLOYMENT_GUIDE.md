# Website Deployment Guide - SK Web Solutions

## Overview
This guide will help you deploy your SK Web Solutions website to the internet so anyone can access it.

## 🚀 Quick Deployment Options

### Option 1: Vercel (Recommended - FREE & Easy)
**Best for:** Simple deployment with automatic HTTPS

1. **Create a Vercel Account:**
   - Go to [vercel.com](https://vercel.com)
   - Sign up with GitHub or email

2. **Prepare Your Project:**
   - Create a `package.json` file if you don't have one:
     ```bash
     npm init -y
     ```
   - Install dependencies:
     ```bash
     npm install express
     ```

3. **Deploy to Vercel:**
   - Install Vercel CLI:
     ```bash
     npm install -g vercel
     ```
   - Login to Vercel:
     ```bash
     vercel login
     ```
   - Deploy your project:
     ```bash
     vercel --prod
     ```
   - Follow the prompts (press Enter for defaults)

4. **Your website will be live at:** `https://your-project-name.vercel.app`

### Option 2: Render (FREE Tier Available)
**Best for:** Node.js applications with persistent storage

1. **Create a Render Account:**
   - Go to [render.com](https://render.com)
   - Sign up with GitHub

2. **Deploy:**
   - Click "New +" → "Web Service"
   - Connect your GitHub repository
   - Configure:
     - Name: `sk-web-solutions`
     - Environment: `Node`
     - Build Command: `npm install`
     - Start Command: `node server.js`
   - Click "Create Web Service"

3. **Your website will be live at:** `https://sk-web-solutions.onrender.com`

### Option 3: Railway (FREE Tier Available)
**Best for:** Easy deployment with database support

1. **Create a Railway Account:**
   - Go to [railway.app](https://railway.app)
   - Sign up with GitHub

2. **Deploy:**
   - Click "New Project"
   - Select "Deploy from GitHub repo"
   - Choose your repository
   - Railway will auto-detect Node.js and deploy

3. **Your website will be live at:** `https://your-project.railway.app`

### Option 4: Traditional Hosting (Paid)
**Best for:** Full control and custom domains

#### Using Hostinger/Bluehost/A2Hosting:

1. **Buy Hosting & Domain:**
   - Purchase a hosting plan (₹150-300/month)
   - Register a domain (₹500-1000/year)

2. **Upload Files:**
   - Use File Manager or FTP (FileZilla)
   - Upload all project files to `public_html` folder

3. **Configure Node.js:**
   - In cPanel, go to "Setup Node.js App"
   - Create a new application
   - Set application root and startup file (`server.js`)

4. **Your website will be live at:** `https://yourdomain.com`

## 📋 Pre-Deployment Checklist

### 1. Update Configuration
Create a `.env` file for environment variables:
```env
PORT=3000
NODE_ENV=production
```

### 2. Update package.json
Make sure your `package.json` has:
```json
{
  "name": "sk-web-solutions",
  "version": "1.0.0",
  "description": "SK Web Solutions Website",
  "main": "server.js",
  "scripts": {
    "start": "node server.js",
    "dev": "nodemon server.js"
  },
  "dependencies": {
    "express": "^4.18.0"
  },
  "engines": {
    "node": ">=14.0.0"
  }
}
```

### 3. Create .gitignore
Create a `.gitignore` file to exclude sensitive files:
```
node_modules/
data/
.env
*.log
.DS_Store
```

### 4. Test Locally
Before deploying, test your website:
```bash
npm install
npm start
```
Visit `http://localhost:3000` to verify everything works.

## 🔧 Domain Setup (Optional)

### Using a Custom Domain:

1. **Buy a Domain:**
   - GoDaddy, Namecheap, or Google Domains
   - Cost: ₹500-1500/year

2. **Connect to Your Hosting:**
   - **Vercel:** Add domain in Vercel dashboard → Project Settings → Domains
   - **Render:** Add domain in Render dashboard → Settings → Custom Domain
   - **Traditional Hosting:** Update nameservers to point to your host

3. **DNS Configuration:**
   ```
   Type: A
   Name: @
   Value: [your-hosting-IP]
   TTL: Automatic
   ```

## 📊 Database Setup for Visit Counter

### For Vercel/Serverless:
The visit counter will work with file storage, but for better performance, consider:
- **MongoDB Atlas** (FREE tier available)
- **PostgreSQL** (via Neon or Supabase)

### For Traditional Hosting:
File storage (`data/visits.json`) works fine for moderate traffic.

## 🔒 Security Considerations

1. **Update Admin Password:**
   - Change default password in `script.js`
   - Consider moving authentication to server-side

2. **Enable HTTPS:**
   - All recommended platforms provide free SSL certificates

3. **Environment Variables:**
   - Never commit sensitive data to GitHub
   - Use `.env` files for configuration

## 📱 Post-Deployment Testing

After deployment, test:

1. **Homepage:**
   - Check if visitor counter loads
   - Verify all sections display correctly

2. **Admin Panel:**
   - Login with admin credentials
   - Check if visit statistics load
   - Verify visit history displays

3. **WhatsApp Button:**
   - Click the WhatsApp button
   - Verify it opens WhatsApp with pre-filled message

4. **Contact Form:**
   - Submit a test message
   - Check if it appears in admin panel

5. **Mobile Responsiveness:**
   - Test on different devices
   - Check if WhatsApp button appears correctly on mobile

## 🆘 Troubleshooting

### Issue: Website shows 404
**Solution:** Make sure `server.js` is in the root directory and all file paths are correct.

### Issue: Visit counter shows "1,000+"
**Solution:** Check if the server is running and API endpoints are accessible.

### Issue: Admin panel not loading
**Solution:** Verify admin credentials and check browser console for errors.

### Issue: WhatsApp button not working
**Solution:** Check if the link is correct and WhatsApp is installed on the device.

## 💰 Cost Estimates

### Free Options:
- **Vercel:** Free (with .vercel.app domain)
- **Render:** Free (with .onrender.com domain)
- **Railway:** Free tier available

### Paid Options:
- **Domain:** ₹500-1500/year
- **Hosting:** ₹150-500/month
- **Total:** ₹2,300-7,500/year

## 🎯 Recommended Deployment Path

For your SK Web Solutions website, I recommend:

1. **Start with Vercel (Free):**
   - Easy deployment
   - Automatic HTTPS
   - Good performance
   - Free tier is generous

2. **Add Custom Domain Later:**
   - Buy domain from Namecheap (₹800/year)
   - Connect to Vercel (free)

3. **Upgrade if Needed:**
   - If you need more features, consider paid hosting

## 📞 Need Help?

If you encounter issues during deployment:

1. Check the platform's documentation
2. Review browser console for errors
3. Verify all files are uploaded correctly
4. Test locally first before deploying

## 🎉 Success!

Once deployed, your website will be accessible worldwide with:
- ✅ Visit counter tracking
- ✅ Admin analytics dashboard
- ✅ WhatsApp integration
- ✅ Professional design
- ✅ Mobile responsive

**Your website URL will look like:** `https://sk-web-solutions.vercel.app`

---

**Deployment completed? Share your website URL and I can help verify everything is working correctly!**

**Need assistance? Contact: Sarangkumar408@gmail.com**