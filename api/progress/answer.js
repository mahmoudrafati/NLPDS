/**
 * Vercel Function: Save Answer Progress
 * POST /api/progress/answer
 */

import { getDatabase } from '../lib/database.js';
import { verifyToken } from '../lib/auth.js';
import { validateRequest } from '../lib/validation.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Verify authentication
    const authResult = verifyToken(req);
    if (!authResult.isValid) {
      return res.status(401).json({
        error: 'Authentication required',
        message: authResult.error
      });
    }

    // Validate request body
    const validation = validateRequest(req.body, {
      questionId: { required: true, type: 'string' },
      userAnswer: { required: false, type: 'string' },
      score: { required: true, type: 'number', min: 0, max: 1 },
      correct: { required: true, type: 'boolean' },
      hintsUsed: { required: false, type: 'number', min: 0 },
      timeSpent: { required: false, type: 'number', min: 0 },
      sessionMode: { required: true, type: 'string', enum: ['learn', 'exam'] },
      evaluationData: { required: false, type: 'object' }
    });

    if (!validation.isValid) {
      return res.status(400).json({
        error: 'Validation failed',
        details: validation.errors
      });
    }

    const {
      questionId,
      userAnswer,
      score,
      correct,
      hintsUsed,
      timeSpent,
      sessionMode,
      evaluationData
    } = req.body;

    const db = await getDatabase();
    const now = new Date().toISOString();

    // Save progress
    const result = await db.run(
      `INSERT INTO user_progress (
        user_id, question_id, user_answer, score, correct,
        hints_used, time_spent, session_mode, evaluation_data,
        answered_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        authResult.user.userId,
        questionId,
        userAnswer || '',
        score,
        correct ? 1 : 0,
        hintsUsed || 0,
        timeSpent || null,
        sessionMode,
        evaluationData ? JSON.stringify(evaluationData) : null,
        now
      ]
    );

    res.status(201).json({
      message: 'Progress saved successfully',
      progressId: result.lastID,
      timestamp: now
    });

  } catch (error) {
    console.error('Save progress error:', error);
    res.status(500).json({
      error: 'Failed to save progress',
      message: 'Internal server error'
    });
  }
}
