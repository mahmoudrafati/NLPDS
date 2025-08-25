/**
 * Vercel Database Manager
 * Simple in-memory JSON storage for Vercel serverless functions
 */

import { readFileSync } from 'fs';
import { join } from 'path';

// In-memory storage (resets on each function call)
let storage = {
  users: new Map(),
  progress: new Map(),
  questions: new Map(),
  initialized: false
};

/**
 * Get database instance (in-memory JSON storage)
 */
export async function getDatabase() {
  if (!storage.initialized) {
    await initializeDatabase();
    storage.initialized = true;
  }
  
  return new DatabaseManager();
}

/**
 * Initialize database schema and seed data
 */
async function initializeDatabase() {
  // Initialize storage maps
  storage.users.clear();
  storage.progress.clear();
  storage.questions.clear();

  // Load exam questions from JSON file
  try {
    const questionsPath = join(process.cwd(), 'data', 'exam_questions_combined.json');
    const questionsData = JSON.parse(readFileSync(questionsPath, 'utf8'));
    
    for (const question of questionsData.exam_questions) {
      storage.questions.set(question.id, {
        id: question.id,
        source: question.source,
        type: question.type,
        topic: question.topic,
        question_text: question.question_text,
        math_blocks: question.math_blocks || [],
        images: question.images || [],
        options: question.options || [],
        correct_options: question.correct_options || [],
        given_answer: question.given_answer,
        verified: question.verified || false,
        notes: question.notes
      });
    }

    console.log(`✅ Loaded ${questionsData.exam_questions.length} exam questions`);
  } catch (error) {
    console.error('❌ Failed to load exam questions:', error);
  }

  console.log('✅ Database initialized');
}

/**
 * Enhanced database methods using in-memory storage
 */
export class DatabaseManager {
  constructor() {}

  // Simplified query methods for JSON storage
  async get(query, params = []) {
    try {
      // Parse simple SQL-like queries for our use cases
      if (query.includes('SELECT * FROM users WHERE username = ?')) {
        const username = params[0];
        for (const [id, user] of storage.users) {
          if (user.username === username) {
            return user;
          }
        }
        return null;
      }
      
      if (query.includes('SELECT * FROM users WHERE id = ?')) {
        const id = params[0];
        return storage.users.get(id) || null;
      }
      
      return null;
    } catch (error) {
      console.error('Database GET error:', error);
      throw error;
    }
  }

  async all(query, params = []) {
    try {
      // Handle common queries
      if (query.includes('user_progress') && query.includes('WHERE user_id = ?')) {
        const userId = params[0];
        return Array.from(storage.progress.values()).filter(p => p.user_id === userId);
      }
      
      if (query.includes('DISTINCT DATE(answered_at)')) {
        const userId = params[0];
        const userProgress = Array.from(storage.progress.values()).filter(p => p.user_id === userId);
        const dates = [...new Set(userProgress.map(p => p.answered_at.split('T')[0]))];
        return dates.map(date => ({ date })).sort((a, b) => b.date.localeCompare(a.date));
      }
      
      return [];
    } catch (error) {
      console.error('Database ALL error:', error);
      throw error;
    }
  }

  async run(query, params = []) {
    try {
      if (query.includes('INSERT INTO users')) {
        const [username, password_hash, display_name, created_at, last_login] = params;
        const id = storage.users.size + 1;
        const user = {
          id,
          username,
          password_hash,
          display_name,
          created_at,
          last_login
        };
        storage.users.set(id, user);
        return { lastID: id };
      }
      
      if (query.includes('INSERT INTO user_progress')) {
        const [user_id, question_id, user_answer, score, correct, hints_used, time_spent, session_mode, evaluation_data, answered_at] = params;
        const id = storage.progress.size + 1;
        const progress = {
          id,
          user_id,
          question_id,
          user_answer,
          score,
          correct,
          hints_used,
          time_spent,
          session_mode,
          evaluation_data,
          answered_at
        };
        storage.progress.set(id, progress);
        return { lastID: id };
      }
      
      if (query.includes('UPDATE users SET last_login')) {
        const [last_login, id] = params;
        const user = storage.users.get(id);
        if (user) {
          user.last_login = last_login;
          storage.users.set(id, user);
        }
        return { changes: 1 };
      }
      
      return { lastID: 0, changes: 0 };
    } catch (error) {
      console.error('Database RUN error:', error);
      throw error;
    }
  }

  // Mock SQL aggregations for statistics
  async getUserStats(userId) {
    const userProgress = Array.from(storage.progress.values()).filter(p => p.user_id === userId);
    
    if (userProgress.length === 0) {
      return {
        total_questions: 0,
        average_score: 0,
        correct_answers: 0,
        accuracy: 0,
        total_time_spent: 0,
        total_hints_used: 0,
        first_answer: null,
        last_answer: null
      };
    }
    
    const totalQuestions = userProgress.length;
    const correctAnswers = userProgress.filter(p => p.correct).length;
    const totalScore = userProgress.reduce((sum, p) => sum + p.score, 0);
    const totalTimeSpent = userProgress.reduce((sum, p) => sum + (p.time_spent || 0), 0);
    const totalHintsUsed = userProgress.reduce((sum, p) => sum + (p.hints_used || 0), 0);
    
    const dates = userProgress.map(p => p.answered_at).sort();
    
    return {
      total_questions: totalQuestions,
      average_score: totalScore / totalQuestions,
      correct_answers: correctAnswers,
      accuracy: correctAnswers / totalQuestions,
      total_time_spent: totalTimeSpent,
      total_hints_used: totalHintsUsed,
      first_answer: dates[0],
      last_answer: dates[dates.length - 1]
    };
  }
}
