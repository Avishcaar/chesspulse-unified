# ♟ ChessPulse Unified — Monorepo for Single-Platform Render Deployment

> **Unified Full-Stack Architecture**: Modern React 19 + Vite frontend coupled with an Express 5 + Socket.io backend and client-side Stockfish 17 WASM engine — bundled to deploy as a single, high-performance Web Service on **Render**.

---

## 🚀 Why a Unified Project?

Previously, deploying the frontend on Vercel and the backend on Render introduced:
- **CORS friction & cookie restrictions** across cross-domain origins.
- **Sleep delay & wake-up latency** when the free backend spun down while the frontend stayed live.
- **WebSocket connection hurdles** with separate hostnames.
- **Multiple dashboards & billing accounts** to manage.

**The Unified Setup fixes all of this:**
- **Single URL & Domain**: Frontend and backend run on the exact same host (`https://chesspulse.onrender.com`).
- **Zero CORS issues**: Client makes relative requests (`/api/...`) and connects to WebSockets via `window.location.origin`.
- **WASM & Worker Ready**: Helmet security headers are optimized so Stockfish 17 WebAssembly (`stockfish.wasm` + Web Workers) and CDN avatars load without CSP blocking.
- **Full SPA Routing**: Express serves the production React build from `frontend/dist` and routes non-API URLs to `index.html` via client-side React Router.

---

## 📁 Repository Structure

```
chesspulse-unified/
├── backend/                        # Node.js + Express + Socket.io Server
│   ├── config/                     # Database (MongoDB Atlas) & Passport OAuth
│   ├── middleware/                 # Rate limiting, Auth JWT, Validators, Error handlers
│   ├── models/                     # Mongoose schemas (User, BotGame, OnlineGame, etc.)
│   ├── routes/                     # REST API endpoints (/api/auth, /api/puzzles, etc.)
│   ├── socket/                     # Live multiplayer Socket.io game rooms & clocks
│   ├── utils/                      # ELO calculator, JWT utils, Gemini AI
│   ├── .env.example                # Backend environment template
│   ├── package.json                # Backend dependencies (Express, Mongoose, Socket.io)
│   └── server.js                   # Unified server (Serves /api, sockets & static React SPA)
│
├── frontend/                       # Vite + React 19 Frontend
│   ├── public/                     # Static assets (Stockfish 17 WASM & Worker, samples)
│   ├── src/                        # React components, pages, hooks, contexts, theme
│   ├── index.html                  # HTML entry point
│   ├── vite.config.ts              # Vite config with development API & Socket proxy
│   ├── .env.example                # Frontend environment template
│   └── package.json                # Frontend dependencies (Lucide, Tailwind, Chess.js, etc.)
│
├── .gitignore                      # Ignore node_modules, dist, and local .env files
├── .env.example                    # Unified environment reference
├── package.json                    # Root package.json with unified build & start scripts
├── render.yaml                     # 1-Click Render Blueprint configuration
└── README.md                       # Documentation & Deployment Guide
```

---

## 🛠 Local Development Setup

### 1. Prerequisites
- **Node.js** v18+ installed.
- A **MongoDB** database (MongoDB Atlas connection string).

### 2. Install Dependencies
Run from the root directory:
```bash
npm run install:all
```
*(Or install devDependencies at root to enable the concurrent dev script: `npm install`)*

### 3. Configure Local Environment
Create `backend/.env` based on `backend/.env.example`:
```ini
PORT=5001
NODE_ENV=development
MONGODB_URI=your_mongodb_atlas_connection_string
JWT_SECRET=your_dev_jwt_secret_key
REFRESH_TOKEN_SECRET=your_dev_refresh_token_secret
SESSION_SECRET=your_dev_session_secret
```

### 4. Run Both Ends Concurrently
```bash
npm run dev
```
- **Backend API & WebSockets**: Runs on `http://localhost:5001`
- **Frontend Vite Dev Server**: Runs on `http://localhost:5173` (proxies `/api` and `/socket.io` to `5001`)

---

## 🚢 Deploying to Render (Single Service)

You can deploy using either **Option A (Render Blueprint - Easiest)** or **Option B (Manual Web Service)**.

### Option A: 1-Click Blueprint (Recommended)
1. Push this `chesspulse-unified` folder to a new repository on your GitHub account.
2. Go to the [Render Dashboard](https://dashboard.render.com).
3. Click **New +** → **Blueprint**.
4. Connect your GitHub repository.
5. Render will automatically detect [`render.yaml`](file:///render.yaml) and configure:
   - **Service Type**: Web Service (Node)
   - **Build Command**: `npm run build`
   - **Start Command**: `npm start`
   - **Health Check**: `/api/health`
6. Fill in your `MONGODB_URI` and any optional keys (`GROQ_API_KEY`, Google OAuth).
7. Click **Apply** to deploy!

---

### Option B: Manual Web Service Setup
1. Push the code to GitHub.
2. In the Render Dashboard, click **New +** → **Web Service**.
3. Select your GitHub repository.
4. Fill in the following settings:
   - **Name**: `chesspulse` (or your preferred name)
   - **Region**: Choose the closest to your users (e.g., *Oregon (US West)* or *Frankfurt (EU)*)
   - **Branch**: `main`
   - **Runtime**: `Node`
   - **Build Command**:
     ```bash
     npm run build
     ```
   - **Start Command**:
     ```bash
     npm start
     ```
   - **Plan**: `Free` (or higher)

5. Under **Environment Variables**, add the following:

| Key | Suggested / Default Value | Purpose |
|---|---|---|
| `NODE_ENV` | `production` | Enables production optimizations & static file serving |
| `PORT` | `10000` | Port assigned by Render |
| `MONGODB_URI` | `mongodb+srv://...` | Your MongoDB Atlas connection URI |
| `JWT_SECRET` | *(64-char random string)* | Access token signing secret |
| `JWT_EXPIRES_IN` | `3h` | Access token lifetime |
| `REFRESH_TOKEN_SECRET` | *(64-char random string)* | Refresh token signing secret |
| `REFRESH_TOKEN_EXPIRES_IN` | `7d` | Refresh token lifetime |
| `SESSION_SECRET` | *(Random string)* | Session encryption secret |
| `GROQ_API_KEY` | *(Optional)* | Groq API Key for AI bot commentary |
| `GOOGLE_CLIENT_ID` | *(Optional)* | Google OAuth client ID |
| `GOOGLE_CLIENT_SECRET` | *(Optional)* | Google OAuth client secret |
| `GOOGLE_CALLBACK_URL` | `https://<your-render-name>.onrender.com/api/oauth/google/callback` | OAuth redirect |

6. Click **Create Web Service**.

Render will run `npm run build` (installing dependencies for both ends and compiling Vite into `frontend/dist`), and then run `node backend/server.js` to serve both your backend API and your frontend SPA.

---

## ⚡ How the Unified Pipeline Works

1. **Build Phase (`npm run build`)**:
   - `npm install --prefix backend` installs backend production modules.
   - `npm install --prefix frontend` installs frontend production & dev modules.
   - `npm run build --prefix frontend` runs Vite compiler, outputting optimized HTML, CSS, JS, and Stockfish 17 WASM files into `frontend/dist`.

2. **Runtime Phase (`npm start`)**:
   - Starts Express 5 and HTTP Server with Socket.io on port `process.env.PORT`.
   - Connects to MongoDB Atlas.
   - Registers `/api/auth`, `/api/user`, `/api/puzzles`, `/api/bot-games`, `/api/oauth`.
   - Attaches Socket.io on the exact same HTTP server for real-time online chess matches.
   - Calls `app.use(express.static('frontend/dist'))` to serve the static frontend assets.
   - Uses `app.get('*', ...)` catch-all to route SPA page views (`/play/online`, `/analysis`, `/bots`, `/puzzles`, etc.) to `frontend/dist/index.html`.
