const pool = require('../database/connection');

class Answer {
  static async create(userId, questionId, text) {
    const query = `
      INSERT INTO answers (user_id, question_id, text)
      VALUES ($1, $2, $3)
      RETURNING *
    `;
    
    const result = await pool.query(query, [userId, questionId, text]);
    return result.rows[0];
  }

  static async findByUserId(userId, limit = 50) {
    const query = `
      SELECT a.*, q.text as question_text 
      FROM answers a
      JOIN questions q ON a.question_id = q.id
      WHERE a.user_id = $1
      ORDER BY a.created_at DESC
      LIMIT $2
    `;
    
    const result = await pool.query(query, [userId, limit]);
    return result.rows;
  }

  static async findByTelegramId(telegramId, limit = 50) {
    const query = `
      SELECT a.*, q.text as question_text 
      FROM answers a
      JOIN questions q ON a.question_id = q.id
      JOIN users u ON a.user_id = u.id
      WHERE u.telegram_id = $1
      ORDER BY a.created_at DESC
      LIMIT $2
    `;
    
    const result = await pool.query(query, [telegramId, limit]);
    return result.rows;
  }

  static async getAnswersForDate(userId, date) {
    const query = `
      SELECT a.*, q.text as question_text 
      FROM answers a
      JOIN questions q ON a.question_id = q.id
      WHERE a.user_id = $1 
      AND DATE(a.created_at) = $2
      ORDER BY a.created_at DESC
    `;
    
    const result = await pool.query(query, [userId, date]);
    return result.rows;
  }

  static async getAnswersForQuestion(userId, questionId) {
    const query = `
      SELECT a.*, q.text as question_text 
      FROM answers a
      JOIN questions q ON a.question_id = q.id
      WHERE a.user_id = $1 AND a.question_id = $2
      ORDER BY a.created_at DESC
    `;
    
    const result = await pool.query(query, [userId, questionId]);
    return result.rows;
  }
}

module.exports = Answer;
