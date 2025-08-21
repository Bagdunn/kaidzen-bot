const pool = require('../database/connection');

class User {
  static async create(telegramId, username) {
    const query = `
      INSERT INTO users (telegram_id, username)
      VALUES ($1, $2)
      ON CONFLICT (telegram_id) 
      DO UPDATE SET username = $2
      RETURNING *
    `;
    
    const result = await pool.query(query, [telegramId, username]);
    return result.rows[0];
  }

  static async findByTelegramId(telegramId) {
    const query = 'SELECT * FROM users WHERE telegram_id = $1';
    const result = await pool.query(query, [telegramId]);
    return result.rows[0];
  }

  static async findById(id) {
    const query = 'SELECT * FROM users WHERE id = $1';
    const result = await pool.query(query, [id]);
    return result.rows[0];
  }

  static async getAllUsers() {
    const query = 'SELECT * FROM users';
    const result = await pool.query(query);
    return result.rows;
  }
}

module.exports = User;
