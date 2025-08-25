/**
 * Vercel Authentication Utilities
 * Simple JWT and password hashing for Vercel serverless functions
 */

import crypto from 'crypto';

const JWT_SECRET = process.env.JWT_SECRET || 'nlpds-demo-secret-key-change-in-production';

/**
 * Simple JWT implementation for Vercel
 */
export function generateToken(payload) {
  const header = {
    alg: 'HS256',
    typ: 'JWT'
  };

  const now = Math.floor(Date.now() / 1000);
  const tokenPayload = {
    ...payload,
    iat: now,
    exp: now + (7 * 24 * 60 * 60) // 7 days
  };

  const encodedHeader = base64UrlEncode(JSON.stringify(header));
  const encodedPayload = base64UrlEncode(JSON.stringify(tokenPayload));
  
  const signature = crypto
    .createHmac('sha256', JWT_SECRET)
    .update(`${encodedHeader}.${encodedPayload}`)
    .digest('base64url');

  return `${encodedHeader}.${encodedPayload}.${signature}`;
}

/**
 * Verify JWT token
 */
export function verifyToken(req) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return { isValid: false, error: 'No token provided' };
    }

    const token = authHeader.substring(7);
    const [encodedHeader, encodedPayload, signature] = token.split('.');

    if (!encodedHeader || !encodedPayload || !signature) {
      return { isValid: false, error: 'Invalid token format' };
    }

    // Verify signature
    const expectedSignature = crypto
      .createHmac('sha256', JWT_SECRET)
      .update(`${encodedHeader}.${encodedPayload}`)
      .digest('base64url');

    if (signature !== expectedSignature) {
      return { isValid: false, error: 'Invalid token signature' };
    }

    // Decode payload
    const payload = JSON.parse(base64UrlDecode(encodedPayload));

    // Check expiration
    const now = Math.floor(Date.now() / 1000);
    if (payload.exp && payload.exp < now) {
      return { isValid: false, error: 'Token expired' };
    }

    return {
      isValid: true,
      user: payload
    };

  } catch (error) {
    return { isValid: false, error: 'Token verification failed' };
  }
}

/**
 * Hash password using crypto
 */
export function hashPassword(password) {
  return crypto
    .createHash('sha256')
    .update(password + 'nlpds-salt')
    .digest('hex');
}

/**
 * Base64 URL encoding/decoding
 */
function base64UrlEncode(str) {
  return Buffer.from(str)
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');
}

function base64UrlDecode(str) {
  // Add padding if needed
  str += '='.repeat((4 - str.length % 4) % 4);
  return Buffer.from(str.replace(/-/g, '+').replace(/_/g, '/'), 'base64').toString();
}
