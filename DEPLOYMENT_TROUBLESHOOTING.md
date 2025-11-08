# Deployment Troubleshooting Guide

## PostgreSQL Connection Issues

### Issue: `psycopg2` ImportError with Python 3.13

**Error:**
```
ImportError: undefined symbol: _PyInterpreterState_Get
```

**Cause:** 
- `psycopg2-binary` doesn't support Python 3.13 yet
- Render may default to Python 3.13 even if `runtime.txt` specifies 3.12

**Solution:**
1. **Use psycopg (v3) instead of psycopg2:**
   - Updated `requirements.txt` to use `psycopg[binary]==3.2.3`
   - Updated `runtime.txt` to specify `python-3.12.10`
   - Updated `db.py` to use `postgresql+psycopg://` connection string

2. **Verify Python version in Render:**
   - Go to your Render service dashboard
   - Check "Settings" → "Environment" to see Python version
   - If it shows Python 3.13, manually set it to 3.12 in Render dashboard

3. **Manual Python version override in Render:**
   - Go to your service → Settings → Environment
   - Add environment variable: `PYTHON_VERSION=3.12.10`
   - Or update `runtime.txt` to ensure it's being read

### Alternative Solutions

**Option 1: Use psycopg (v3) - RECOMMENDED** ✅
- Already implemented in the codebase
- Supports Python 3.13
- Modern, actively maintained

**Option 2: Force Python 3.12**
- Update `runtime.txt` to `python-3.12.10`
- Keep `psycopg2-binary` in requirements
- Verify Render respects the runtime.txt file

**Option 3: Use psycopg2 from source (not recommended)**
- Install build dependencies
- Compile psycopg2 from source
- More complex, slower builds

## Database Connection String Format

The code automatically converts connection strings:
- `postgres://...` → `postgresql+psycopg://...`
- `postgresql://...` → `postgresql+psycopg://...`

This ensures SQLAlchemy uses psycopg (v3) instead of psycopg2.

## Common Deployment Issues

### 1. Build Fails: Missing Dependencies
**Solution:** Ensure all dependencies are in `requirements.txt`

### 2. Database Connection Timeout
**Solution:** 
- Verify `DATABASE_URL` is set correctly
- Check that database is running in Render dashboard
- Ensure connection string uses correct format

### 3. Import Errors
**Solution:**
- Check `PYTHONPATH` is set correctly
- Verify all imports use correct paths
- Ensure `backend/__init__.py` exists

### 4. CORS Errors
**Solution:**
- Verify CORS middleware is configured in `main.py`
- Check that frontend URL is allowed in CORS settings
- Ensure backend is running and accessible

## Verification Steps

After deployment, verify:

1. **Backend is running:**
   ```bash
   curl https://your-backend.onrender.com/
   ```
   Should return: `{"message":"OpsPulse backend API is running"}`

2. **Database connection works:**
   - Check Render logs for database connection errors
   - Try creating a user via signup endpoint

3. **Frontend can connect:**
   - Check browser console for API errors
   - Verify `VITE_API_URL` is set correctly in Vercel

## Need Help?

- Check Render logs: Dashboard → Your Service → Logs
- Check Vercel logs: Dashboard → Your Project → Deployments → Logs
- Verify environment variables are set correctly
- Ensure all files are committed and pushed to GitHub

