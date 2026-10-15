import 'dotenv/config';
import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import session from 'express-session';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

import connectDB from './config/database.js';
import passport from './config/passport.js';
import authRoutes from './routes/auth.js';
import userRoutes from './routes/user.js';
import oauthRoutes from './routes/oauth.js';
import puzzleRoutes from './routes/puzzles.js';
import botGameRoutes from './routes/botGames.js';
import rankingsRoutes from './routes/rankings.js';
import errorHandler from './middleware/errorHandler.js';
import { apiLimiter } from './middleware/rateLimiter.js';
import { initializeSocketHandlers } from './socket/socketHandler.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const frontendDistPath = path.resolve(__dirname, '../frontend/dist');

// Auto-detect production mode on Render platform or via NODE_ENV
if (process.env.RENDER === 'true' || process.env.RENDER || process.env.NODE_ENV === 'production') {
    process.env.NODE_ENV = 'production';
}

const app = express();
const httpServer = createServer(app);

// In production behind Render proxy, trust first proxy for secure cookies/headers
if (process.env.NODE_ENV === 'production') {
    app.set('trust proxy', 1);
}

// Allowed CORS origins for development and production
const allowedOrigins = [
    process.env.FRONTEND_URL,
    'http://localhost:5173',
    'http://localhost:5174',
    'http://localhost:5001'
].filter(Boolean);

const isOriginAllowed = (origin) => {
    if (!origin) return true; // Same-origin or non-browser request
    if (process.env.NODE_ENV === 'production') return true; // In production, unified on same domain
    return allowedOrigins.includes(origin);
};

const io = new Server(httpServer, {
    cors: {
        origin: (origin, callback) => {
            if (isOriginAllowed(origin)) {
                return callback(null, true);
            }
            callback(new Error('Not allowed by CORS'));
        },
        methods: ['GET', 'POST'],
        credentials: true
    }
});

const PORT = process.env.PORT || 5001;

// Connect to MongoDB
connectDB();

// Initialize Socket.io game handlers
initializeSocketHandlers(io);

// Security Headers - disable CSP/COEP so Stockfish WASM Web Workers and external avatars work
app.use(helmet({
    contentSecurityPolicy: false,
    crossOriginEmbedderPolicy: false
}));

// CORS Middleware
app.use(cors({
    origin: (origin, callback) => {
        if (isOriginAllowed(origin)) {
            return callback(null, true);
        }
        callback(new Error('Not allowed by CORS'));
    },
    credentials: true
}));

app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(session({
    secret: process.env.SESSION_SECRET || 'chesspulse-unified-session-secret',
    resave: false,
    saveUninitialized: false,
    cookie: {
        secure: process.env.NODE_ENV === 'production',
        httpOnly: true,
        maxAge: 24 * 60 * 60 * 1000
    }
}));

app.use(passport.initialize());

// Rate Limiting on API endpoints
app.use('/api', apiLimiter);

// API Health Check
app.get('/api/health', (req, res) => {
    res.json({
        success: true,
        message: 'ChessPulse Unified Server is healthy',
        environment: process.env.NODE_ENV || 'development',
        render: Boolean(process.env.RENDER),
        timestamp: new Date().toISOString()
    });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/user', userRoutes);
app.use('/api/oauth', oauthRoutes);
app.use('/api/puzzles', puzzleRoutes);
app.use('/api/bot-games', botGameRoutes);
app.use('/api/rankings', rankingsRoutes);

// Catch-all 404 for unhandled API routes
app.use('/api', (req, res) => {
    res.status(404).json({
        success: false,
        message: 'API route not found'
    });
});

// Serve frontend static assets in production (or when frontend/dist exists)
if (fs.existsSync(frontendDistPath)) {
    console.log(`Serving static frontend build from: ${frontendDistPath}`);
    app.use(express.static(frontendDistPath));

    // Handle React client-side SPA routing (all non-API GET requests return index.html)
    app.use((req, res, next) => {
        if (req.method !== 'GET') return next();
        if (req.path.startsWith('/api') || req.path.startsWith('/socket.io')) {
            return next();
        }
        res.sendFile(path.join(frontendDistPath, 'index.html'));
    });
} else {
    // Development fallback when frontend has not been compiled into dist
    app.get('/', (req, res) => {
        res.json({
            success: true,
            message: 'ChessPulse Backend API is running. (Frontend dist not built yet. Run `npm run build` to build frontend for production).',
            version: '1.0.0',
            endpoints: {
                health: '/api/health',
                auth: '/api/auth',
                user: '/api/user',
                puzzles: '/api/puzzles',
                botGames: '/api/bot-games'
            }
        });
    });
}

// Global error handler
app.use(errorHandler);

httpServer.listen(PORT, () => {
    console.log(`===============================================`);
    console.log(`♟ ChessPulse Unified Server running on port ${PORT}`);
    console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`Frontend Served: ${fs.existsSync(frontendDistPath) ? 'YES (dist)' : 'NO (dev API only)'}`);
    console.log(`Socket.io Server initialized on port ${PORT}`);
    console.log(`===============================================`);
});

process.on('unhandledRejection', (err) => {
    console.error('Unhandled Promise Rejection:', err);
    process.exit(1);
});

process.on('uncaughtException', (err) => {
    console.error('Uncaught Exception:', err);
    process.exit(1);
});