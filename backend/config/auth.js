import 'dotenv/config';
import { randomBytes } from 'crypto';

const isProduction = process.env.NODE_ENV === 'production' || process.env.RENDER === 'true';

function getSecret(name) {
  const configuredSecret = process.env[name]?.trim();
  if (configuredSecret) return configuredSecret;
  if (isProduction) {
    throw new Error(`${name} must be configured with a strong random value in production.`);
  }
  return randomBytes(32).toString('hex');
}

const jwtSecret = getSecret('JWT_SECRET');
const refreshTokenSecret = getSecret('REFRESH_TOKEN_SECRET');

export default {
  jwtSecret,
  get jwtExpiresIn() {
    return process.env.JWT_EXPIRES_IN || '3h';
  },
  refreshTokenSecret,
  get refreshTokenExpiresIn() {
    return process.env.REFRESH_TOKEN_EXPIRES_IN || '7d';
  },
  saltRounds: 10,
  tokenTypes: {
    ACCESS: 'access',
    REFRESH: 'refresh'
  }
};
