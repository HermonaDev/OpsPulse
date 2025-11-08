# Vercel Deployment Fix for Rollup Error

## Issue
Vercel build fails with:
```
Error: Cannot find module @rollup/rollup-linux-x64-gnu
```

## Solution Applied

### 1. Added Explicit Rollup Dependency
- Added `@rollup/rollup-linux-x64-gnu` to `devDependencies` and `optionalDependencies`
- This ensures the native module is available during build

### 2. Updated Vercel Configuration
- Updated `vercel.json` to use `npm install --include=optional`
- This ensures optional dependencies (like Rollup native modules) are installed

### 3. Important Vercel Settings
**CRITICAL:** In Vercel dashboard, you MUST set:
- **Root Directory**: `frontend`
- **Framework Preset**: Vite

## Steps to Fix Deployment

1. **Update Vercel Project Settings:**
   - Go to your Vercel project → Settings → General
   - Set **Root Directory** to `frontend`
   - Save changes

2. **Redeploy:**
   - Push the updated code to GitHub
   - Vercel will automatically redeploy
   - Or manually trigger a redeploy from Vercel dashboard

3. **Verify Build:**
   - Check build logs for successful installation
   - Verify `@rollup/rollup-linux-x64-gnu` is installed
   - Build should complete successfully

## Alternative Solutions (if above doesn't work)

### Option 1: Downgrade Vite (if needed)
```json
"vite": "^5.4.0"
```
Older Vite versions may have better compatibility.

### Option 2: Use npm ci with force
Update `vercel.json`:
```json
{
  "installCommand": "npm ci --include=optional --force"
}
```

### Option 3: Remove vercel.json entirely
- Delete `frontend/vercel.json`
- Let Vercel auto-detect Vite
- Set Root Directory to `frontend` in dashboard
- Vercel will auto-configure everything

## Verification

After deployment, verify:
1. Build completes without errors
2. Frontend is accessible at your Vercel URL
3. API calls work (check browser console)
4. Environment variable `VITE_API_URL` is set correctly

## Notes

- The Root Directory setting is the most important fix
- Vercel needs to know the frontend code is in a subdirectory
- Without this, Vercel tries to build from the root, causing issues

