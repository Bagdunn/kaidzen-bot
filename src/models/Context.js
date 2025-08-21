const pool = require('../database/connection');

class Context {
  static async createOrUpdate(userId, aboutMe, goals, areas) {
    const query = `
      INSERT INTO contexts (user_id, about_me, goals, areas)
      VALUES ($1, $2, $3, $4)
      ON CONFLICT (user_id) 
      DO UPDATE SET 
        about_me = EXCLUDED.about_me,
        goals = EXCLUDED.goals,
        areas = EXCLUDED.areas,
        updated_at = CURRENT_TIMESTAMP
      RETURNING *
    `;
    
    const result = await pool.query(query, [userId, aboutMe, goals, areas]);
    return result.rows[0];
  }

  static async findByUserId(userId) {
    const query = 'SELECT * FROM contexts WHERE user_id = $1';
    const result = await pool.query(query, [userId]);
    return result.rows[0];
  }

  static async findByTelegramId(telegramId) {
    const query = `
      SELECT c.* FROM contexts c
      JOIN users u ON c.user_id = u.id
      WHERE u.telegram_id = $1
    `;
    const result = await pool.query(query, [telegramId]);
    return result.rows[0];
  }
}

module.exports = Context;
