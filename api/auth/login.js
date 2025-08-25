/**
 * Vercel Function: User Login
 * POST /api/auth/login
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
      username: { required: true, type: 'string', minLength: 3 },
      password: { required: true, type: 'string', minLength: 4 }
    });

    if (!validation.isValid) {
      return res.status(400).json({
        error: 'Validation failed',
        details: validation.errors
      });
    }

    const { username, password } = req.body;
    const db = await getDatabase();

    // Check if user exists
    const user = await db.get(
      'SELECT * FROM users WHERE username = ?',
      [username]
    );

    if (!user) {
      return res.status(401).json({
        error: 'Invalid credentials',
        message: 'Username or password incorrect'
      });
    }

    // Verify password
    const hashedPassword = hashPassword(password);
    if (user.password_hash !== hashedPassword) {
      return res.status(401).json({
        error: 'Invalid credentials',
        message: 'Username or password incorrect'
      });
    }

    // Generate JWT token
    const token = generateToken({
      userId: user.id,
      username: user.username
    });

    // Update last login
    await db.run(
      'UPDATE users SET last_login = ? WHERE id = ?',
      [new Date().toISOString(), user.id]
    );

    res.status(200).json({
      message: 'Login successful',
      token,
      user: {
        id: user.id,
        username: user.username,
        displayName: user.display_name,
        createdAt: user.created_at,
        lastLogin: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Login failed'
    });
  }
}
