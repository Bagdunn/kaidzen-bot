const { Client } = require('pg');
require('dotenv').config();

// Виводимо параметри для дебагу
console.log('🔍 Database connection parameters:');
console.log('Host:', process.env.DB_HOST || 'localhost');
console.log('Port:', process.env.DB_PORT || 5432);
console.log('Database:', process.env.DB_NAME || 'kaizen_questions');
console.log('User:', process.env.DB_USER || 'kaizen_user');
console.log('Password length:', process.env.DB_PASSWORD ? process.env.DB_PASSWORD.length : 0);

const createTables = async () => {
  const client = new Client({
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT) || 5432,
    database: process.env.DB_NAME || 'kaizen_questions',
    user: process.env.DB_USER || 'kaizen_user',
    password: process.env.DB_PASSWORD || 'root',
    ssl: false, // Вимкнути SSL для локального підключення
  });
  
  try {
    console.log('🔌 Connecting to database...');
    await client.connect();
    console.log('✅ Connected successfully!');
    
    // Create users table
    console.log('📋 Creating users table...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        telegram_id BIGINT UNIQUE NOT NULL,
        username TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Create reminder_times table for multiple reminder times
    console.log('📋 Creating reminder_times table...');
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
    console.log('📋 Creating contexts table...');
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
      console.log('📋 Adding unique constraint to contexts...');
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
    console.log('📋 Creating questions table...');
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
    console.log('📋 Creating answers table...');
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
    await client.end();
  }
};

const dropTables = async () => {
  const client = new Client({
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT) || 5432,
    database: process.env.DB_NAME || 'kaizen_questions',
    user: process.env.DB_USER || 'kaizen_user',
    password: process.env.DB_PASSWORD || 'root',
    ssl: false,
  });
  
  try {
    await client.connect();
    
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
    await client.end();
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
