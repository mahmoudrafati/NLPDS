/**
 * Vercel Function: Get User Statistics
 * GET /api/progress/stats
 */

import { getDatabase } from '../lib/database.js';
import { verifyToken } from '../lib/auth.js';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
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

    const db = await getDatabase();
    const userId = authResult.user.userId;

    // Get basic statistics
    const basicStats = await db.get(`
      SELECT 
        COUNT(*) as total_questions,
        AVG(score) as average_score,
        SUM(CASE WHEN correct = 1 THEN 1 ELSE 0 END) as correct_answers,
        SUM(time_spent) as total_time_spent,
        SUM(hints_used) as total_hints_used,
        MIN(answered_at) as first_answer,
        MAX(answered_at) as last_answer
      FROM user_progress 
      WHERE user_id = ?
    `, [userId]);

    // Calculate accuracy
    const accuracy = basicStats.total_questions > 0 
      ? basicStats.correct_answers / basicStats.total_questions 
      : 0;

    // Get session breakdown
    const sessionBreakdown = await db.all(`
      SELECT 
        session_mode,
        COUNT(*) as count,
        AVG(score) as avg_score,
        SUM(CASE WHEN correct = 1 THEN 1 ELSE 0 END) as correct_count
      FROM user_progress 
      WHERE user_id = ?
      GROUP BY session_mode
    `, [userId]);

    // Get topic breakdown
    const topicBreakdown = await db.all(`
      SELECT 
        eq.topic,
        COUNT(*) as count,
        AVG(up.score) as avg_score,
        SUM(CASE WHEN up.correct = 1 THEN 1 ELSE 0 END) as correct_count
      FROM user_progress up
      JOIN exam_questions eq ON up.question_id = eq.id
      WHERE up.user_id = ?
      GROUP BY eq.topic
    `, [userId]);

    // Get recent activity (last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const recentActivity = await db.all(`
      SELECT 
        DATE(answered_at) as date,
        session_mode,
        COUNT(*) as questions,
        AVG(score) as avg_score,
        SUM(CASE WHEN correct = 1 THEN 1 ELSE 0 END) as correct_count
      FROM user_progress 
      WHERE user_id = ? AND answered_at >= ?
      GROUP BY DATE(answered_at), session_mode
      ORDER BY date DESC
    `, [userId, sevenDaysAgo.toISOString()]);

    // Calculate learning streak
    const learningStreak = await calculateLearningStreak(db, userId);

    // Calculate achievements
    const achievements = calculateAchievements({
      totalQuestions: basicStats.total_questions,
      accuracyRate: accuracy,
      learningStreak,
      timeInvested: basicStats.total_time_spent || 0
    });

    // Format response
    const userStats = {
      totalQuestions: basicStats.total_questions,
      answeredQuestions: basicStats.total_questions,
      accuracyRate: accuracy,
      averageScore: basicStats.average_score || 0,
      timeInvested: basicStats.total_time_spent || 0,
      totalSessions: sessionBreakdown.reduce((sum, s) => sum + s.count, 0),
      learningStreak,
      sessionBreakdown: sessionBreakdown.reduce((acc, session) => {
        acc[session.session_mode] = {
          count: session.count,
          questions: session.count,
          accuracy: session.count > 0 ? session.correct_count / session.count : 0
        };
        return acc;
      }, { learn: { count: 0, questions: 0, accuracy: 0 }, exam: { count: 0, questions: 0, accuracy: 0 } }),
      topicBreakdown: topicBreakdown.reduce((acc, topic) => {
        acc[topic.topic] = {
          count: topic.count,
          correct: topic.correct_count,
          accuracy: topic.count > 0 ? topic.correct_count / topic.count : 0
        };
        return acc;
      }, {}),
      recentActivity: recentActivity.map(activity => ({
        date: activity.date,
        mode: activity.session_mode,
        questions: activity.questions,
        accuracy: activity.questions > 0 ? activity.correct_count / activity.questions : 0
      })),
      achievements
    };

    res.status(200).json({
      userStats,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Get stats error:', error);
    res.status(500).json({
      error: 'Failed to get statistics',
      message: 'Internal server error'
    });
  }
}

/**
 * Calculate learning streak for a user
 */
async function calculateLearningStreak(db, userId) {
  try {
    const recentDays = await db.all(`
      SELECT DISTINCT DATE(answered_at) as date
      FROM user_progress 
      WHERE user_id = ?
      ORDER BY date DESC
      LIMIT 30
    `, [userId]);

    if (recentDays.length === 0) return 0;

    let streak = 0;
    const today = new Date().toISOString().split('T')[0];

    for (let i = 0; i < recentDays.length; i++) {
      const expectedDate = new Date();
      expectedDate.setDate(expectedDate.getDate() - i);
      const expectedDateStr = expectedDate.toISOString().split('T')[0];

      if (recentDays[i].date === expectedDateStr) {
        streak++;
      } else {
        break;
      }
    }

    return streak;
  } catch (error) {
    console.error('Error calculating learning streak:', error);
    return 0;
  }
}

/**
 * Calculate achievements based on user statistics
 */
function calculateAchievements(stats) {
  const achievements = [];

  // Question Count Achievements
  if (stats.totalQuestions >= 10) achievements.push({ id: 'questions_10', name: 'Anfänger', description: '10 Fragen beantwortet', icon: '🌱' });
  if (stats.totalQuestions >= 50) achievements.push({ id: 'questions_50', name: 'Fleißig', description: '50 Fragen beantwortet', icon: '📚' });
  if (stats.totalQuestions >= 100) achievements.push({ id: 'questions_100', name: 'Hundert!', description: '100 Fragen beantwortet', icon: '💯' });

  // Accuracy Achievements
  if (stats.accuracyRate >= 0.7) achievements.push({ id: 'accuracy_70', name: 'Gut', description: '70% Genauigkeit erreicht', icon: '👍' });
  if (stats.accuracyRate >= 0.8) achievements.push({ id: 'accuracy_80', name: 'Sehr gut', description: '80% Genauigkeit erreicht', icon: '⭐' });
  if (stats.accuracyRate >= 0.9) achievements.push({ id: 'accuracy_90', name: 'Ausgezeichnet', description: '90% Genauigkeit erreicht', icon: '🏆' });

  // Streak Achievements
  if (stats.learningStreak >= 3) achievements.push({ id: 'streak_3', name: 'Konstant', description: '3 Tage in Folge gelernt', icon: '🔥' });
  if (stats.learningStreak >= 7) achievements.push({ id: 'streak_7', name: 'Wöchentlich', description: '7 Tage in Folge gelernt', icon: '📅' });

  return achievements;
}
