# Quick Deployment Guide for Interview Demo

## 🚀 Fastest Way to Deploy (15-20 minutes)

### Option 1: Render + Vercel (Recommended)

#### Backend on Render (10 minutes)

1. **Push to GitHub**
   ```bash
   git add .
   git commit -m "Ready for deployment"
   git push
   ```

2. **Create Render Account**
   - Go to https://render.com
   - Sign up with GitHub

3. **Create Database**
   - Click "New +" → "PostgreSQL"
   - Name: `opspulse-db`
   - Plan: Free
   - Copy the **Internal Database URL**

4. **Deploy Backend**
   - Click "New +" → "Web Service"
   - Connect GitHub repo
   - Settings:
     - **Name**: `opspulse-backend`
     - **Build Command**: `pip install -r backend/requirements.txt`
     - **Start Command**: `PYTHONPATH=. uvicorn backend.main:app --host 0.0.0.0 --port $PORT`
     - **OR** use the startup script: `chmod +x start_backend.sh && ./start_backend.sh`
   - Environment Variables:
     - `SECRET_KEY`: `your-secret-key-here` (any random string)
     - `DATABASE_URL`: (paste from step 3)
   - Click "Create Web Service"
   - **Wait 5-10 minutes, copy the URL** (e.g., `https://opspulse-backend.onrender.com`)

#### Frontend on Vercel (5 minutes)

1. **Create Vercel Account**
   - Go to https://vercel.com
   - Sign up with GitHub

2. **Deploy Frontend**
   - Click "Add New..." → "Project"
   - Import your repo
   - Settings:
     - **Framework**: Vite
     - **Root Directory**: `frontend`
     - **Build Command**: `npm run build`
     - **Output Directory**: `dist`
   - Environment Variable:
     - `VITE_API_URL`: `https://opspulse-backend.onrender.com/api` (your backend URL + /api)
   - Click "Deploy"
   - **Copy the URL** (e.g., `https://opspulse.vercel.app`)

#### Initialize Database

1. Go to Render dashboard → Your backend service → "Shell"
2. Run:
   ```bash
   python -c "from backend.db import engine; from backend.models import Base; Base.metadata.create_all(engine)"
   ```

3. Create admin user (via API or shell):
   ```bash
   curl -X POST https://YOUR_BACKEND_URL/signup/ \
     -H "Content-Type: application/json" \
     -d '{"name":"Admin","email":"admin@test.com","password":"admin123","role":"admin","phone":"123"}'
   ```

**Done!** Visit your Vercel URL to see the app.

---

### Option 2: Railway (Easier - Single Platform)

1. **Go to Railway.app**
   - Sign up with GitHub
   - Click "New Project" → "Deploy from GitHub repo"

2. **Add Services**
   - Add PostgreSQL database
   - Add your backend code
   - Add your frontend code (or deploy separately to Vercel)

3. **Set Environment Variables**
   - Backend: `SECRET_KEY`, `DATABASE_URL` (auto-provided)
   - Frontend: `VITE_API_URL` (your backend URL)

**Railway is simpler but may be slower for free tier.**

---

## ⚠️ Important Notes

1. **First Request Delay**: Render free tier services sleep after 15 min. First request after sleep takes 30-60 seconds.

2. **For Interview**: 
   - Wake up the service 5 minutes before your interview
   - Or upgrade to paid tier ($7/month) to avoid sleep

3. **Database**: Tables are created automatically on first request if `Base.metadata.create_all()` runs.

4. **Admin User**: Create one before the demo:
   ```bash
   # Via Render Shell or curl
   curl -X POST https://YOUR_BACKEND/signup/ \
     -H "Content-Type: application/json" \
     -d '{"name":"Admin","email":"admin@demo.com","password":"admin123","role":"admin","phone":"123"}'
   ```

---

## 🎯 Quick Checklist

- [ ] Code pushed to GitHub
- [ ] Render account created
- [ ] PostgreSQL database created
- [ ] Backend deployed (copy URL)
- [ ] Vercel account created  
- [ ] Frontend deployed with `VITE_API_URL` env var
- [ ] Database initialized
- [ ] Admin user created
- [ ] Tested login

---

## 🆘 Troubleshooting

**Backend won't start?**
- Check Render logs
- Verify `DATABASE_URL` is set
- Check build logs for missing dependencies

**Frontend can't connect?**
- Verify `VITE_API_URL` is correct (should end with `/api`)
- Check browser console for CORS errors
- Make sure backend is running

**Database errors?**
- Run init script in Render Shell
- Check database is running in Render dashboard

---

## 📞 Demo Tips

1. **Have backup**: Take screenshots/video of working app
2. **Test first**: Wake up services 10 min before interview
3. **Show code**: Have GitHub repo ready to show
4. **Explain architecture**: Be ready to explain backend/frontend separation
5. **Show features**: Walk through landing page, login, dashboard

**Good luck! 🍀**

