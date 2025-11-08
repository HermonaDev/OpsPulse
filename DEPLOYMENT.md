# OpsPulse Deployment Guide

This guide will help you deploy OpsPulse to Render (backend) and Vercel (frontend) for your interview demo.

## Prerequisites

1. GitHub account (or GitLab/Bitbucket)
2. Render account (free tier available) - https://render.com
3. Vercel account (free tier available) - https://vercel.com
4. Push your code to a Git repository

## Step 1: Push Code to GitHub

```bash
# Initialize git if not already done
git init
git add .
git commit -m "Initial commit for deployment"
git branch -M main

# Create a new repository on GitHub and push
git remote add origin https://github.com/YOUR_USERNAME/OpsPulse.git
git push -u origin main
```

## Step 2: Deploy Backend to Render

### 2.1 Create Render Account
1. Go to https://render.com and sign up (free tier available)

### 2.2 Create PostgreSQL Database
1. In Render dashboard, click "New +" → "PostgreSQL"
2. Name it: `opspulse-db`
3. Select "Free" plan
4. Click "Create Database"
5. **Copy the Internal Database URL** (you'll need this)

### 2.3 Create Redis Instance (Optional - for real-time features)
1. In Render dashboard, click "New +" → "Redis"
2. Name it: `opspulse-redis`
3. Select "Free" plan
4. Click "Create Redis"
5. **Copy the Internal Redis URL** (you'll need this)

### 2.4 Deploy Backend Web Service
1. In Render dashboard, click "New +" → "Web Service"
2. Connect your GitHub repository
3. Select the `OpsPulse` repository
4. Configure:
   - **Name**: `opspulse-backend`
   - **Environment**: `Python 3`
   - **Build Command**: `pip install -r backend/requirements.txt`
   - **Start Command**: `uvicorn backend.main:app --host 0.0.0.0 --port $PORT`
   - **Root Directory**: Leave empty (or set to project root)

5. Add Environment Variables:
   - `SECRET_KEY`: Generate a random string (you can use: `python -c "import secrets; print(secrets.token_urlsafe(32))"`)
   - `DATABASE_URL`: Paste the Internal Database URL from step 2.2
   - `REDIS_URL`: Paste the Internal Redis URL from step 2.3 (optional - app works without it)

6. Click "Create Web Service"
7. Wait for deployment (takes 5-10 minutes)
8. **Copy your backend URL** (e.g., `https://opspulse-backend.onrender.com`)

### 2.5 Update CORS in Backend (if needed)
After deployment, if you want to restrict CORS:
1. Go to your backend service in Render
2. Go to "Environment" tab
3. Add: `FRONTEND_URL` = your Vercel frontend URL
4. Update `backend/main.py` line 28 to use: `allow_origins=[os.getenv("FRONTEND_URL", "*")]`

## Step 3: Deploy Frontend to Vercel

### 3.1 Create Vercel Account
1. Go to https://vercel.com and sign up (free tier available)
2. Connect your GitHub account

### 3.2 Deploy Frontend
1. In Vercel dashboard, click "Add New..." → "Project"
2. Import your `OpsPulse` repository
3. Configure:
   - **Framework Preset**: Vite
   - **Root Directory**: `frontend`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`

4. Add Environment Variable:
   - **Key**: `VITE_API_URL`
   - **Value**: Your Render backend URL (e.g., `https://opspulse-backend.onrender.com/api`)

5. Click "Deploy"
6. Wait for deployment (takes 2-3 minutes)
7. **Copy your frontend URL** (e.g., `https://opspulse.vercel.app`)

### 3.3 Update Backend CORS (if you restricted it)
1. Go back to Render backend service
2. Update `FRONTEND_URL` environment variable to your Vercel URL
3. Redeploy the backend

## Step 4: Initialize Database

### 4.1 Create Admin User
You can do this via the API or create a simple script:

1. Go to your Render backend logs
2. Or use curl/Postman to create an admin user:

```bash
# First, create a user via signup
curl -X POST https://YOUR_BACKEND_URL/signup/ \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Admin User",
    "email": "admin@opspulse.com",
    "password": "admin123",
    "role": "admin",
    "phone": "1234567890"
  }'
```

3. Then manually update the database via Render's PostgreSQL dashboard to change the role to "admin" (if needed)

### 4.2 Alternative: Use Render Shell
1. In Render dashboard, go to your backend service
2. Click "Shell" tab
3. Run:
```bash
python backend/init_db.py
```

## Step 5: Test Your Deployment

1. Visit your Vercel frontend URL
2. You should see the landing page
3. Click "Get Started" to go to login
4. Create an account or login with admin credentials
5. Test the features!

## Quick Deployment Checklist

- [ ] Code pushed to GitHub
- [ ] Render account created
- [ ] PostgreSQL database created on Render
- [ ] Redis instance created on Render (optional)
- [ ] Backend deployed on Render
- [ ] Backend URL copied
- [ ] Vercel account created
- [ ] Frontend deployed on Vercel
- [ ] Environment variable `VITE_API_URL` set in Vercel
- [ ] Admin user created
- [ ] Application tested

## Troubleshooting

### Backend Issues
- **Build fails**: Check that all dependencies are in `requirements.txt`
- **Database connection error**: Verify `DATABASE_URL` is set correctly
- **CORS errors**: Make sure CORS middleware is configured and frontend URL is allowed

### Frontend Issues
- **API calls failing**: Verify `VITE_API_URL` is set correctly in Vercel
- **Build fails**: Check that all dependencies are in `package.json`
- **404 errors**: Make sure Vercel rewrites are configured (should be in `vercel.json`)

### Database Issues
- **Tables not created**: Run `python backend/init_db.py` via Render Shell
- **Connection timeout**: Check that database is running and URL is correct

## Notes for Interview Demo

1. **Free Tier Limits**:
   - Render free tier: Services sleep after 15 minutes of inactivity
   - Vercel free tier: Unlimited deployments, 100GB bandwidth
   - First request after sleep may take 30-60 seconds to wake up

2. **Performance**:
   - For demo, consider upgrading to paid tier to avoid sleep
   - Or use Railway/Railway.app which has better free tier

3. **Alternative Quick Deploy**:
   - Railway.app: Can deploy both backend and frontend easily
   - Fly.io: Good for backend deployment
   - Netlify: Alternative to Vercel for frontend

## Environment Variables Summary

### Backend (Render)
- `SECRET_KEY`: Random secret for JWT tokens
- `DATABASE_URL`: PostgreSQL connection string
- `REDIS_URL`: Redis connection string (optional)

### Frontend (Vercel)
- `VITE_API_URL`: Backend API URL (e.g., `https://opspulse-backend.onrender.com/api`)

## Support

If you encounter issues:
1. Check Render logs: Dashboard → Your Service → Logs
2. Check Vercel logs: Dashboard → Your Project → Deployments → Logs
3. Verify environment variables are set correctly
4. Ensure database is running and accessible

Good luck with your interview! 🚀

