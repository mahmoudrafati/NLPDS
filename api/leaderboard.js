/**
 * Vercel Function: Get Leaderboard
 * GET /api/leaderboard
 */

import { getDatabase } from './lib/database.js';
import { verifyToken } from './lib/auth.js';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const db = await getDatabase();
    const { sortBy = 'score', filterBy = 'all', limit = 50 } = req.query;

    // Get user statistics with leaderboard scoring
    const leaderboardQuery = `
      SELECT 
        u.id,
        u.username,
        u.display_name,
        u.last_login,
        COUNT(up.id) as total_questions,
        AVG(up.score) as avg_score,
        SUM(CASE WHEN up.correct = 1 THEN 1 ELSE 0 END) as correct_answers,
        SUM(up.time_spent) as time_invested,
        (
          -- Calculate learning streak for each user
          SELECT COUNT(DISTINCT DATE(answered_at))
          FROM user_progress up2 
          WHERE up2.user_id = u.id 
          AND DATE(up2.answered_at) >= DATE('now', '-30 days')
        ) as learning_streak,
        -- Calculate composite score
        (
          CASE WHEN COUNT(up.id) > 0 THEN
            (AVG(up.score) * 0.4) + 
            (MIN(COUNT(up.id) / 100.0, 1.0) * 0.3) + 
            (MIN((
              SELECT COUNT(DISTINCT DATE(answered_at))
              FROM user_progress up3 
              WHERE up3.user_id = u.id 
              AND DATE(up3.answered_at) >= DATE('now', '-30 days')
            ) / 30.0, 1.0) * 0.2) +
            (MIN(SUM(up.time_spent) / (1000 * 60 * 60 * 10), 1.0) * 0.1)
          ELSE 0 END
        ) * 100 as score
      FROM users u
      LEFT JOIN user_progress up ON u.id = up.user_id
      GROUP BY u.id, u.username, u.display_name, u.last_login
      HAVING total_questions > 0
    `;

    let whereClause = '';
    const params = [];

    // Apply filters
    if (filterBy === 'active') {
      whereClause = " AND u.last_login >= DATE('now', '-7 days')";
    } else if (filterBy === 'streak') {
      whereClause = " AND learning_streak > 0";
    }

    // Apply sorting
    let orderClause = '';
    switch (sortBy) {
      case 'total_questions':
        orderClause = 'ORDER BY total_questions DESC';
        break;
      case 'accuracy':
        orderClause = 'ORDER BY avg_score DESC';
        break;
      case 'time_invested':
        orderClause = 'ORDER BY time_invested DESC';
        break;
      case 'learning_streak':
        orderClause = 'ORDER BY learning_streak DESC';
        break;
      default:
        orderClause = 'ORDER BY score DESC';
    }

    const finalQuery = `
      SELECT * FROM (${leaderboardQuery}) 
      WHERE 1=1 ${whereClause}
      ${orderClause}
      LIMIT ?
    `;

    params.push(parseInt(limit));
    const leaderboardData = await db.all(finalQuery, params);

    // Add rank and format data
    const leaderboard = leaderboardData.map((user, index) => ({
      rank: index + 1,
      username: user.username,
      displayName: user.display_name,
      totalQuestions: user.total_questions,
      accuracy: user.avg_score || 0,
      timeInvested: user.time_invested || 0,
      learningStreak: user.learning_streak || 0,
      totalSessions: Math.ceil(user.total_questions / 10), // Estimate sessions
      score: Math.round(user.score || 0),
      lastActive: user.last_login,
      isCurrentUser: false // Will be set by frontend if needed
    }));

    res.status(200).json({
      leaderboard,
      total: leaderboard.length,
      filters: {
        sortBy,
        filterBy,
        limit: parseInt(limit)
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Leaderboard error:', error);
    res.status(500).json({
      error: 'Failed to get leaderboard',
      message: 'Internal server error'
    });
  }
}
