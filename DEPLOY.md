# 🚀 DEPLOY LIFE VAULT BACKEND TO PRODUCTION

## ✅ Code is on GitHub
https://github.com/PUTYAHEARTINIT/lifevault-backend

---

## 🚂 **OPTION 1: Railway.app (RECOMMENDED)** - 5 minutes

Railway is perfect for this backend (persistent storage, database support)

### Step 1: Sign Up
Go to: https://railway.app
Sign in with GitHub

### Step 2: Deploy
1. Click "New Project"
2. Click "Deploy from GitHub repo"
3. Select: **PUTYAHEARTINIT/lifevault-backend**
4. Click "Deploy Now"

### Step 3: Set Environment Variables
In Railway dashboard:
- Click your project
- Go to "Variables" tab
- Add these:

```
PORT=3000
JWT_SECRET=lifevault_production_secret_change_this_2026_$(openssl rand -hex 32)
ENCRYPTION_KEY=encryption_key_production_$(openssl rand -hex 32)
NODE_ENV=production
```

### Step 4: Get Your URL
Railway will give you a URL like: `lifevault-backend.up.railway.app`

**Done! Your API is live!** ✅

---

## 🎨 **OPTION 2: Render.com** - 5 minutes

### Step 1: Sign Up
Go to: https://render.com
Sign in with GitHub

### Step 2: Deploy
1. Click "New +"
2. Select "Web Service"
3. Connect GitHub: **PUTYAHEARTINIT/lifevault-backend**
4. Settings:
   - **Name:** lifevault-backend
   - **Build Command:** `npm install`
   - **Start Command:** `npm start`

### Step 3: Environment Variables
Add in Render dashboard:
```
JWT_SECRET=your_secret_here
ENCRYPTION_KEY=your_encryption_key_here
NODE_ENV=production
```

**Done! URL:** `lifevault-backend.onrender.com`

---

## 🔥 **OPTION 3: Fly.io** - Command Line

```bash
# Install Fly CLI
curl -L https://fly.io/install.sh | sh

# Login
fly auth login

# Deploy
cd ~/lifevault-backend
fly launch
fly deploy
```

---

## ⚡ **OPTION 4: Heroku** - Classic

```bash
# Install Heroku CLI
brew install heroku/brew/heroku

# Login
heroku login

# Deploy
cd ~/lifevault-backend
heroku create lifevault-backend
git push heroku main
```

---

## 🧪 TEST YOUR DEPLOYMENT

Once deployed, test with:

```bash
# Health check
curl https://YOUR-URL.com/api/health

# Register user
curl -X POST https://YOUR-URL.com/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"secure123","fullName":"Test User"}'
```

---

## 🔐 IMPORTANT: Update Environment Variables

Before going live, change:
- `JWT_SECRET` - Generate with `openssl rand -hex 64`
- `ENCRYPTION_KEY` - Generate with `openssl rand -hex 32`

---

## 📱 CONNECT TO FRONTEND

Update your frontend (https://lifevault-gold.vercel.app/) API base URL to:
```javascript
const API_BASE_URL = 'https://YOUR-RAILWAY-URL.up.railway.app';
```

---

## 🎯 RECOMMENDED: Railway.app

**Why Railway?**
- ✅ Free tier (500 hours/month)
- ✅ Persistent file storage
- ✅ Auto-deploy from GitHub
- ✅ Built-in PostgreSQL database (upgrade later)
- ✅ Simple environment variables
- ✅ Logs & monitoring included

**Start here:** https://railway.app/new
