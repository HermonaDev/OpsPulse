# Free Database Setup Guide (No Shell Required!)

## 🎉 Good News: No Money Needed!

You don't need to upgrade Render to use Shell. Here are **FREE alternatives** to set up your database:

## Method 1: Use the Setup Endpoint (Easiest)

The backend automatically creates database tables when it starts. You just need to create an admin user.

### Step 1: Wait for Backend to Deploy
- Make sure your backend is running on Render
- Visit `https://YOUR_BACKEND_URL/` - should show: `{"message":"OpsPulse backend API is running"}`

### Step 2: Create Admin User via HTTP

**Option A: Using curl (Command Line)**
```bash
curl -X POST https://YOUR_BACKEND_URL/setup/ \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Admin",
    "email": "admin@test.com",
    "password": "admin123",
    "setup_key": "opspulse-setup-2024"
  }'
```

**Option B: Using Postman/Insomnia**
1. Create a new POST request
2. URL: `https://YOUR_BACKEND_URL/setup/`
3. Headers: `Content-Type: application/json`
4. Body (raw JSON):
```json
{
  "name": "Admin",
  "email": "admin@test.com",
  "password": "admin123",
  "setup_key": "opspulse-setup-2024"
}
```
5. Send the request

**Option C: Using Your Browser (with an extension)**
- Install "REST Client" extension for Chrome/Firefox
- Or use online tools like:
  - https://httpie.io/app (free)
  - https://reqbin.com/ (free)
  - https://hoppscotch.io/ (free)

### Step 3: Verify Admin Created
You should get a response like:
```json
{
  "message": "Admin user created successfully!",
  "email": "admin@test.com",
  "note": "You can now login with this admin account."
}
```

## Method 2: Use the Signup Endpoint (Always Works)

If the setup endpoint doesn't work, use the regular signup endpoint:

```bash
curl -X POST https://YOUR_BACKEND_URL/signup/ \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Admin",
    "email": "admin@test.com",
    "password": "admin123",
    "role": "admin",
    "phone": ""
  }'
```

**Note:** The signup endpoint allows creating admin users directly (for initial setup).

## Method 3: Use Online API Testing Tools

### Option A: Hoppscotch (Free, No Account Needed)
1. Go to https://hoppscotch.io/
2. Select POST method
3. Enter URL: `https://YOUR_BACKEND_URL/setup/`
4. Click "Headers" tab, add:
   - Key: `Content-Type`
   - Value: `application/json`
5. Click "Body" tab, select "JSON", paste:
```json
{
  "name": "Admin",
  "email": "admin@test.com",
  "password": "admin123",
  "setup_key": "opspulse-setup-2024"
}
```
6. Click "Send"

### Option B: ReqBin (Free)
1. Go to https://reqbin.com/
2. Select POST method
3. Enter your backend URL + `/setup/`
4. Add header: `Content-Type: application/json`
5. Add JSON body (same as above)
6. Click "Send"

### Option C: httpie.io/app (Free)
1. Go to https://httpie.io/app
2. Enter: `POST https://YOUR_BACKEND_URL/setup/`
3. Add JSON body
4. Click "Send"

## Troubleshooting

### Error: "Admin user already exists"
- Good! An admin already exists
- Use the login endpoint with your admin credentials
- Or create more users via the signup endpoint

### Error: "Invalid setup key"
- Make sure you're using: `opspulse-setup-2024`
- Or set `SETUP_KEY` environment variable in Render

### Error: "Email already registered"
- The email is already taken
- Use a different email or login with existing account

### Tables Not Created?
- Tables are created automatically when backend starts
- Check Render logs to verify backend started successfully
- If issues persist, the backend will create tables on first database access

## After Setup

1. **Login with your admin account:**
   - Go to your frontend URL
   - Click "Get Started" → "Login"
   - Use the email and password you created

2. **Create more users:**
   - Login as admin
   - Go to admin dashboard
   - Approve pending users or create new ones

## Security Note

After creating your admin user:
1. Change the default password to something secure
2. Optionally, set a custom `SETUP_KEY` environment variable in Render
3. The setup endpoint only works if no admin exists (one-time use)

## Need Help?

- Check Render logs: Dashboard → Your Service → Logs
- Verify backend is running: Visit `https://YOUR_BACKEND_URL/`
- Test the endpoint: Try the setup endpoint again
- Check email format: Must be valid email format

**You don't need to pay for Render Shell - everything can be done via HTTP! 🎉**

