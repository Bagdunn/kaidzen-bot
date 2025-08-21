const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'kaizen_questions',
  user: process.env.DB_USER || 'kaizen_user',
  password: process.env.DB_PASSWORD || '',
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
});

const createTables = async () => {
  const client = await pool.connect();
  
  try {
    // Create users table
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        telegram_id BIGINT UNIQUE NOT NULL,
        username TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Create reminder_times table for multiple reminder times
    await client.query(`
      CREATE TABLE IF NOT EXISTS reminder_times (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        time TIME NOT NULL,
        active BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(user_id, time)
      );
    `);

    // Create contexts table
    await client.query(`
      CREATE TABLE IF NOT EXISTS contexts (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        about_me TEXT,
        goals TEXT,
        areas TEXT,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Add unique constraint to contexts table if it doesn't exist
    try {
      await client.query(`
        ALTER TABLE contexts ADD CONSTRAINT contexts_user_id_unique UNIQUE (user_id);
      `);
      console.log('✅ Added unique constraint to contexts table');
    } catch (error) {
      if (error.code === '42710' || error.code === '42P07') { // constraint already exists
        console.log('ℹ️ Unique constraint already exists on contexts table');
      } else {
        throw error;
      }
    }

    // Create questions table
    await client.query(`
      CREATE TABLE IF NOT EXISTS questions (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        text TEXT NOT NULL,
        source TEXT CHECK (source IN ('user', 'agent')) DEFAULT 'user',
        active BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Create answers table
    await client.query(`
      CREATE TABLE IF NOT EXISTS answers (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        question_id INTEGER REFERENCES questions(id) ON DELETE CASCADE,
        text TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    console.log('✅ Database tables created successfully');
  } catch (error) {
    console.error('❌ Error creating tables:', error);
    throw error;
  } finally {
    client.release();
  }
};

const dropTables = async () => {
  const client = await pool.connect();
  
  try {
    await client.query('DROP TABLE IF EXISTS answers CASCADE');
    await client.query('DROP TABLE IF EXISTS questions CASCADE');
    await client.query('DROP TABLE IF EXISTS reminder_times CASCADE');
    await client.query('DROP TABLE IF EXISTS contexts CASCADE');
    await client.query('DROP TABLE IF EXISTS users CASCADE');
    
    console.log('✅ Database tables dropped successfully');
  } catch (error) {
    console.error('❌ Error dropping tables:', error);
    throw error;
  } finally {
    client.release();
  }
};

// Run migrations
const runMigrations = async () => {
  try {
    await createTables();
    console.log('🎉 Database migration completed successfully');
  } catch (error) {
    console.error('💥 Migration failed:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
};

// Handle command line arguments
const command = process.argv[2];

if (command === 'drop') {
  dropTables().then(() => {
    console.log('🗑️ Tables dropped');
    process.exit(0);
  });
} else {
  runMigrations();
}
