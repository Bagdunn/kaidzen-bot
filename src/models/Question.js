const pool = require('../database/connection');

class Question {
  static async create(userId, text, source = 'user') {
    const query = `
      INSERT INTO questions (user_id, text, source)
      VALUES ($1, $2, $3)
      RETURNING *
    `;
    
    const result = await pool.query(query, [userId, text, source]);
    return result.rows[0];
  }

  static async findById(id) {
    const query = 'SELECT * FROM questions WHERE id = $1';
    const result = await pool.query(query, [id]);
    return result.rows[0];
  }

  static async findByUserId(userId, activeOnly = true) {
    const query = activeOnly 
      ? 'SELECT * FROM questions WHERE user_id = $1 AND active = true ORDER BY created_at DESC'
      : 'SELECT * FROM questions WHERE user_id = $1 ORDER BY created_at DESC';
    
    const result = await pool.query(query, [userId]);
    return result.rows;
  }

  static async findByTelegramId(telegramId, activeOnly = true) {
    const query = activeOnly 
      ? `
        SELECT q.* FROM questions q
        JOIN users u ON q.user_id = u.id
        WHERE u.telegram_id = $1 AND q.active = true
        ORDER BY q.created_at DESC
      `
      : `
        SELECT q.* FROM questions q
        JOIN users u ON q.user_id = u.id
        WHERE u.telegram_id = $1
        ORDER BY q.created_at DESC
      `;
    
    const result = await pool.query(query, [telegramId]);
    return result.rows;
  }

  static async deactivate(userId, questionId) {
    const query = 'UPDATE questions SET active = false WHERE id = $1 AND user_id = $2 RETURNING *';
    const result = await pool.query(query, [questionId, userId]);
    return result.rows[0];
  }

  static async getActiveQuestionsCount(userId) {
    const query = 'SELECT COUNT(*) FROM questions WHERE user_id = $1 AND active = true AND source = $2';
    const userQuestions = await pool.query(query, [userId, 'user']);
    return parseInt(userQuestions.rows[0].count);
  }

  static async getRandomQuestions(userId, limit = 3) {
    const query = `
      SELECT * FROM questions 
      WHERE user_id = $1 AND active = true 
      ORDER BY RANDOM() 
      LIMIT $2
    `;
    
    const result = await pool.query(query, [userId, limit]);
    return result.rows;
  }
}

module.exports = Question;
