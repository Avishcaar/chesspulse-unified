import express from 'express';
import passport from '../config/passport.js';
import bcrypt from 'bcryptjs';
import RefreshToken from '../models/RefreshToken.js';
import { generateAccessToken, generateRefreshToken } from '../utils/jwt.js';

const router = express.Router();

const isProduction = process.env.RENDER === 'true' || process.env.NODE_ENV === 'production';

function getOrigin(value) {
    try {
        const url = new URL(value);
        if (!['http:', 'https:'].includes(url.protocol) || url.username || url.password) return null;
        return url.origin;
    } catch (_) {
        return null;
    }
}

function getConfiguredFrontendOrigin() {
    const origin = getOrigin(process.env.FRONTEND_URL);
    if (!origin || !isProduction) return origin;
    const hostname = new URL(origin).hostname;
    return ['localhost', '127.0.0.1', '::1'].includes(hostname) ? null : origin;
}

function getRequestOrigin(req) {
    const protocol = String(req.headers['x-forwarded-proto'] || req.protocol).split(',')[0].trim();
    return getOrigin(`${protocol}://${req.get('host')}`);
}

function isTrustedFrontendOrigin(origin, req) {
    if (!origin) return false;
    const configuredOrigin = getConfiguredFrontendOrigin();
    if (configuredOrigin === origin) return true;
    if (getRequestOrigin(req) === origin) return true;
    return !isProduction && ['http://localhost:5173', 'http://127.0.0.1:5173'].includes(origin);
}

const getFrontendUrl = (req) => {
    const sessionOrigin = getOrigin(req?.session?.frontendOrigin);
    if (isTrustedFrontendOrigin(sessionOrigin, req)) return sessionOrigin;

    const refererOrigin = getOrigin(req?.headers?.referer);
    if (isTrustedFrontendOrigin(refererOrigin, req)) return refererOrigin;

    const configuredOrigin = getConfiguredFrontendOrigin();
    if (configuredOrigin) return configuredOrigin;

    return isProduction ? getRequestOrigin(req) : 'http://localhost:5173';
};

router.get('/google', (req, res, next) => {
    // Preserve only a known application origin across the OAuth round trip.
    if (req.headers.referer) {
        const refOrigin = getOrigin(req.headers.referer);
        if (req.session && isTrustedFrontendOrigin(refOrigin, req)) {
            req.session.frontendOrigin = refOrigin;
        }
    }

    if (!passport._strategies || !passport._strategies.google) {
        const frontendUrl = getFrontendUrl(req);
        return res.redirect(`${frontendUrl}/signin?error=${encodeURIComponent('Google OAuth is not configured on this server')}`);
    }

    return passport.authenticate('google', {
        scope: ['profile', 'email'],
        session: false
    })(req, res, next);
});

router.get('/google/callback', async (req, res, next) => {
    if (!passport._strategies || !passport._strategies.google) {
        const frontendUrl = getFrontendUrl(req);
        return res.redirect(`${frontendUrl}/signin?error=${encodeURIComponent('Google OAuth is not configured on this server')}`);
    }

    passport.authenticate('google', { session: false }, async (err, user, info) => {
        try {
            console.log('OAuth callback - err:', err, 'user:', !!user);

            const frontendUrl = getFrontendUrl(req);

            if (err) {
                console.error('OAuth error:', err);
                return res.redirect(`${frontendUrl}/signin?error=${encodeURIComponent(err.message || 'Authentication failed')}`);
            }

            if (!user) {
                console.error('No user returned from OAuth strategy');
                return res.redirect(`${frontendUrl}/signin?error=Authentication%20failed`);
            }

            console.log('Generating tokens for user:', user._id);
            const accessToken = generateAccessToken(user._id, user.email);
            const refreshToken = generateRefreshToken(user._id);

            const tokenHash = await bcrypt.hash(refreshToken, 10);
            const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

            await RefreshToken.create({
                userId: user._id,
                tokenHash,
                expiresAt
            });

            const redirectUrl = `${frontendUrl}/auth-success?accessToken=${accessToken}&refreshToken=${refreshToken}`;

            console.log('OAuth success - redirecting to frontend:', frontendUrl);
            return res.redirect(redirectUrl);

        } catch (error) {
            console.error('OAuth callback error:', error);
            const frontendUrl = getFrontendUrl(req);
            return res.redirect(`${frontendUrl}/signin?error=${encodeURIComponent(error.message)}`);
        }
    })(req, res, next);
});

export default router;
