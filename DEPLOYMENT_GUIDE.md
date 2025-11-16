# 🚀 Project Deployment Guide

## Deployment Options

### Option 1: Vercel (Frontend) + Railway (Backend) - Recommended ✅

#### Frontend (Vercel):
1. **Vercel Account:**
   - https://vercel.com → Sign up (GitHub account use pannunga)

2. **Deploy:**
   - "New Project" click pannunga
   - GitHub repository select pannunga
   - **Root Directory:** `frontend` set pannunga
   - **Framework Preset:** Vite
   - **Build Command:** `npm run build`
   - **Output Directory:** `dist`
   - "Deploy" click pannunga

3. **Environment Variables:**
   - Vercel dashboard-la "Settings" → "Environment Variables"
   - Add: `VITE_API_URL=https://your-backend-url.com`

4. **Deployed Link:**
   - Vercel automatically gives: `https://your-project.vercel.app`

---

#### Backend (Railway):
1. **Railway Account:**
   - https://railway.app → Sign up (GitHub account use pannunga)

2. **Deploy:**
   - "New Project" → "Deploy from GitHub repo"
   - Repository select pannunga
   - **Root Directory:** `backend` set pannunga
   - Railway automatically detects Python

3. **Environment Variables:**
   - Railway dashboard-la "Variables" tab
   - Add:
     - `OPENAI_API_KEY=your-key`
     - `DEVICE_API_KEY=your-key`
     - `JWT_SECRET_KEY=your-secret`
     - `DATABASE_URL=sqlite:///./database.db`

4. **Deployed Link:**
   - Railway gives: `https://your-project.railway.app`

---

### Option 2: Render (Full Stack) - Easy ✅

#### Frontend + Backend:
1. **Render Account:**
   - https://render.com → Sign up

2. **Backend Deploy:**
   - "New" → "Web Service"
   - GitHub repository connect pannunga
   - **Root Directory:** `backend`
   - **Build Command:** `pip install -r requirements.txt`
   - **Start Command:** `uvicorn app:app --host 0.0.0.0 --port $PORT`
   - Environment variables add pannunga

3. **Frontend Deploy:**
   - "New" → "Static Site"
   - GitHub repository connect pannunga
   - **Root Directory:** `frontend`
   - **Build Command:** `npm install && npm run build`
   - **Publish Directory:** `dist`

4. **Deployed Links:**
   - Backend: `https://your-backend.onrender.com`
   - Frontend: `https://your-frontend.onrender.com`

---

### Option 3: Netlify (Frontend) + Render (Backend)

#### Frontend (Netlify):
1. **Netlify Account:**
   - https://netlify.com → Sign up

2. **Deploy:**
   - "Add new site" → "Import an existing project"
   - GitHub repository connect pannunga
   - **Base directory:** `frontend`
   - **Build command:** `npm run build`
   - **Publish directory:** `dist`
   - "Deploy site" click pannunga

3. **Deployed Link:**
   - Netlify gives: `https://your-project.netlify.app`

---

## 📝 Deployment Checklist

### Before Deploying:
- [ ] Repository public panniten
- [ ] `.env` file-la secrets irukku (deployment platform-la add pannanum)
- [ ] `README.md` update panniten (deployment links add pannunga)
- [ ] Database setup (SQLite for development, PostgreSQL for production)

### Environment Variables (Deployment Platform-la Add):
```
OPENAI_API_KEY=your-openai-key
DEVICE_API_KEY=esp32-secure-key-2024
JWT_SECRET_KEY=your-secret-key-min-32-chars
DATABASE_URL=sqlite:///./database.db
```

### Frontend Environment Variables:
```
VITE_API_URL=https://your-backend-url.com
```

---

## 🔗 Deployed Links Add Pannum Podhu

### README.md-la Add Pannunga:
```markdown
## 🌐 Live Demo

- **Frontend:** https://your-project.vercel.app
- **Backend API:** https://your-backend.railway.app
- **API Docs:** https://your-backend.railway.app/docs
```

---

## 🎯 Recommended Setup:

**Best for Your Project:**
1. **Frontend:** Vercel (free, fast, easy)
2. **Backend:** Railway (free tier available, easy setup)
3. **Database:** Railway-la SQLite (or PostgreSQL for production)

---

## 📚 Step-by-Step Deployment:

### Vercel (Frontend):
1. Vercel.com → Sign up
2. "New Project" → GitHub repo select
3. Root: `frontend`
4. Deploy

### Railway (Backend):
1. Railway.app → Sign up
2. "New Project" → GitHub repo select
3. Root: `backend`
4. Environment variables add
5. Deploy

---

**Ippo deploy pannunga — live link varum!** 🚀✅

