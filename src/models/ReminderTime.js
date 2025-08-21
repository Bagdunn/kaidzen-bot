const pool = require('../database/connection');

class ReminderTime {
  // Get all reminder times for a user
  static async findByUserId(userId) {
    const query = `
      SELECT id, time, active, created_at 
      FROM reminder_times 
      WHERE user_id = $1 
      ORDER BY time ASC
    `;
    const result = await pool.query(query, [userId]);
    return result.rows;
  }

  // Get active reminder times for a user
  static async findActiveByUserId(userId) {
    const query = `
      SELECT id, time, active, created_at 
      FROM reminder_times 
      WHERE user_id = $1 AND active = true 
      ORDER BY time ASC
    `;
    const result = await pool.query(query, [userId]);
    return result.rows;
  }

  // Find reminder by ID
  static async findById(id) {
    const query = `
      SELECT id, user_id, time, active, created_at 
      FROM reminder_times 
      WHERE id = $1
    `;
    const result = await pool.query(query, [id]);
    return result.rows[0];
  }

  // Create a new reminder time
  static async create(userId, time) {
    const query = `
      INSERT INTO reminder_times (user_id, time) 
      VALUES ($1, $2) 
      ON CONFLICT (user_id, time) 
      DO UPDATE SET active = true 
      RETURNING *
    `;
    const result = await pool.query(query, [userId, time]);
    return result.rows[0];
  }

  // Update reminder time
  static async update(id, updates) {
    const { time, active } = updates;
    const query = `
      UPDATE reminder_times 
      SET time = COALESCE($2, time), 
          active = COALESCE($3, active) 
      WHERE id = $1 
      RETURNING *
    `;
    const result = await pool.query(query, [id, time, active]);
    return result.rows[0];
  }

  // Delete reminder time
  static async delete(id) {
    const query = 'DELETE FROM reminder_times WHERE id = $1 RETURNING *';
    const result = await pool.query(query, [id]);
    return result.rows[0];
  }

  // Deactivate reminder time (soft delete)
  static async deactivate(id) {
    const query = `
      UPDATE reminder_times 
      SET active = false 
      WHERE id = $1 
      RETURNING *
    `;
    const result = await pool.query(query, [id]);
    return result.rows[0];
  }

  // Get count of active reminder times for a user
  static async getActiveCount(userId) {
    const query = `
      SELECT COUNT(*) as count 
      FROM reminder_times 
      WHERE user_id = $1 AND active = true
    `;
    const result = await pool.query(query, [userId]);
    return parseInt(result.rows[0].count);
  }

  // Get all users with their active reminder times
  static async getAllUsersWithReminders() {
    const query = `
      SELECT u.id, u.telegram_id, u.username, rt.time
      FROM users u
      INNER JOIN reminder_times rt ON u.id = rt.user_id
      WHERE rt.active = true
      ORDER BY u.id, rt.time
    `;
    const result = await pool.query(query);
    return result.rows;
  }
}

module.exports = ReminderTime;
