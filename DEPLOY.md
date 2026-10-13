# Deploy checklist (do in this order)

## 1. Database - Aiven (free MySQL)
1. aiven.io -> create a MySQL service on the Free plan.
2. When it says "Running" copy: Host, Port, User, Password (database is usually `defaultdb`).
3. Your DB_URL is:
   jdbc:mysql://HOST:PORT/defaultdb?sslMode=REQUIRED

## 2. GitHub
Upload the `backend` and `frontend` folders to ONE new GitHub repository
(they must be at the top level of the repo).

## 3. Backend - Render
New > Web Service > pick the repo
- Language: Docker
- Root Directory: backend
- Instance type: Free
Environment variables:
  DB_URL        = (from step 1)
  DB_USERNAME   = (Aiven user, usually avnadmin)
  DB_PASSWORD   = (Aiven password)
  CORS_ORIGINS  = https://placeholder.vercel.app   (fixed in step 5)
  FRONTEND_URL  = https://placeholder.vercel.app   (fixed in step 5)
When it is live open  https://YOUR-SERVICE.onrender.com/users  -> you should see []

## 4. Frontend - Vercel
Add New > Project > pick the same repo
- Root Directory: frontend
- Build Command:  CI=false npm run build
- Environment variable: REACT_APP_API_URL = https://YOUR-SERVICE.onrender.com   (no trailing slash)
Deploy, then copy your Vercel address.

## 5. Connect them
Render > your service > Environment: change CORS_ORIGINS and FRONTEND_URL to the Vercel address
(https, no trailing slash). Saving redeploys.

## 6. Test
Open the Vercel address (first load can take ~1 minute: Render free sleeps).
Sign up, log in. The email code is NOT emailed on Render free: open Render > Logs and look for "LOGIN CODE".
