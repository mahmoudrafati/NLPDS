/**
 * Vercel Function: User Registration
 * POST /api/auth/register
 */

import { getDatabase } from '../lib/database.js';
import { generateToken, hashPassword } from '../lib/auth.js';
import { validateRequest } from '../lib/validation.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Validate request body
    const validation = validateRequest(req.body, {
      username: { required: true, type: 'string', minLength: 3, maxLength: 30 },
      password: { required: true, type: 'string', minLength: 4 },
      displayName: { required: false, type: 'string', maxLength: 50 }
    });

    if (!validation.isValid) {
      return res.status(400).json({
        error: 'Validation failed',
        details: validation.errors
      });
    }

    const { username, password, displayName } = req.body;
    const db = await getDatabase();

    // Check if username already exists
    const existingUser = await db.get(
      'SELECT id FROM users WHERE username = ?',
      [username]
    );

    if (existingUser) {
      return res.status(409).json({
        error: 'Username already exists',
        message: 'Please choose a different username'
      });
    }

    // Hash password and create user
    const hashedPassword = hashPassword(password);
    const now = new Date().toISOString();

    const result = await db.run(
      `INSERT INTO users (username, password_hash, display_name, created_at, last_login)
       VALUES (?, ?, ?, ?, ?)`,
      [username, hashedPassword, displayName || username, now, now]
    );

    // Generate JWT token
    const token = generateToken({
      userId: result.lastID,
      username
    });

    res.status(201).json({
      message: 'Registration successful',
      token,
      user: {
        id: result.lastID,
        username,
        displayName: displayName || username,
        createdAt: now,
        lastLogin: now
      }
    });

  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Registration failed'
    });
  }
}
