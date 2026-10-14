---
name: render-deployment
description: >-
  Automate, verify, and guide the deployment of the unified ChessPulse
  fullstack application (Vite frontend + Express 5 backend) to Render. Use when the
  user asks to deploy to Render, check deployment readiness, configure render.yaml,
  or verify live health endpoints.
---

# Render Deployment Skill for ChessPulse Unified

This skill guides and automates deploying the unified ChessPulse repository (Vite + React frontend & Express 5 + Socket.io backend) to **Render** as a single high-performance Web Service.

---

## 🎯 Architecture Summary

- **Service Type**: Render Web Service (Node.js runtime)
- **Unified Port**: Single port (`PORT=10000` on Render) serving API (`/api/*`), Socket.io (`/socket.io`), and static React assets (`frontend/dist`)
- **SPA Routing**: Non-API paths (`/`, `/play/online`, `/analysis`, `/bots`, etc.) automatically serve `frontend/dist/index.html`
- **Build Command**: `npm run build` (installs backend + frontend and builds Vite into `frontend/dist`)
- **Start Command**: `npm start` (`node backend/server.js`)
- **Health Check Path**: `/api/health`

---

## 📋 Step-by-Step Deployment Procedure

### Step 1: Pre-Flight Build & Configuration Verification
Run pre-flight checks before pushing to make sure the build compiles without errors:

```powershell
# Execute from root of chesspulse-unified
npm run build
```
Verify:
1. `frontend/dist/index.html` exists.
2. `frontend/dist/stockfish.js` and `stockfish.wasm` are present in `frontend/dist/`.
3. `render.yaml` exists in the repository root.

---

### Step 2: Push to GitHub
If a remote repository is not yet linked:
```powershell
# 1. Add remote (replace with your repo URL)
git remote add origin https://github.com/<your-username>/chesspulse-unified.git

# 2. Push to main
git branch -M main
git push -u origin main
```

---

### Step 3: Trigger Render Deployment

#### Option A: Render Blueprint (Recommended — 1-Click Setup)
1. Go to [dashboard.render.com](https://dashboard.render.com) -> Click **New +** -> **Blueprint**.
2. Connect your GitHub repository.
3. Render automatically parses `render.yaml`:
   - Runtime: `Node`
   - Build Command: `npm run build`
   - Start Command: `npm start`
   - Health Check: `/api/health`
4. Enter your `MONGODB_URI` under environment variables.
5. Click **Apply**.

#### Option B: Deploy Hook Automation (Zero-Click Updates)
If you configure a **Deploy Hook** in Render (Settings -> Deploy Hook):
```powershell
# Trigger instant deploy via Render webhook
Invoke-RestMethod -Uri "https://api.render.com/deploy/srv-<your-service-id>?key=<your-key>" -Method Post
```

---

### Step 4: Environment Variables Checklist

Ensure these variables are set in the Render Dashboard:

| Key | Value / Recommendation | Required? |
|---|---|---|
| `NODE_ENV` | `production` | **Yes** |
| `PORT` | `10000` | **Yes** |
| `MONGODB_URI` | `mongodb+srv://...` (Atlas connection string) | **Yes** |
| `JWT_SECRET` | 64-character random string | **Yes** |
| `JWT_EXPIRES_IN` | `3h` | **Yes** |
| `REFRESH_TOKEN_SECRET` | 64-character random string | **Yes** |
| `REFRESH_TOKEN_EXPIRES_IN` | `7d` | **Yes** |
| `SESSION_SECRET` | Secure random string | **Yes** |
| `GROQ_API_KEY` | Groq API key for bot & AI analysis | *Optional* |
| `GOOGLE_CLIENT_ID` | OAuth Client ID | *Optional* |
| `GOOGLE_CLIENT_SECRET` | OAuth Client Secret | *Optional* |
| `GOOGLE_CALLBACK_URL` | `https://<your-render-domain>.onrender.com/api/oauth/google/callback` | *Optional* |

---

### Step 5: Post-Deployment Verification
Once Render marks the service as **Live**:

```powershell
# 1. Verify API Health Endpoint
Invoke-RestMethod -Uri "https://<your-service>.onrender.com/api/health"

# 2. Verify Frontend SPA root
Invoke-WebRequest -Uri "https://<your-service>.onrender.com/" -Method Head
```
Confirm the health check returns `{"success": true, "message": "ChessPulse Unified Server is healthy"}`.
