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

const seedData = async () => {
  const client = await pool.connect();
  
  try {
    // Sample users
    const users = [
      { telegram_id: 123456789, username: 'test_user_1', question_time: '09:00:00' },
      { telegram_id: 987654321, username: 'test_user_2', question_time: '18:00:00' },
      { telegram_id: 555666777, username: 'test_user_3', question_time: '21:00:00' }
    ];

    console.log('🌱 Seeding users...');
    for (const userData of users) {
      await client.query(`
        INSERT INTO users (telegram_id, username, question_time)
        VALUES ($1, $2, $3)
        ON CONFLICT (telegram_id) DO NOTHING
      `, [userData.telegram_id, userData.username, userData.question_time]);
    }

    // Sample contexts
    const contexts = [
      {
        user_id: 1,
        about_me: 'Я розробник програмного забезпечення, працюю в IT компанії. Люблю читати книги та подорожувати.',
        goals: 'Хочу покращити свої навички лідерства та вивчити нові технології. Також хочу більше часу приділяти спорту.',
        areas: 'Робота, особистий розвиток, здоров\'я, сім\'я'
      },
      {
        user_id: 2,
        about_me: 'Менеджер проекту з досвідом 5 років. Займаюся плануванням та координацією команди.',
        goals: 'Покращити комунікативні навички та навчитися краще делегувати завдання.',
        areas: 'Робота, комунікація, управління часом, особистий розвиток'
      }
    ];

    console.log('🌱 Seeding contexts...');
    for (const contextData of contexts) {
      await client.query(`
        INSERT INTO contexts (user_id, about_me, goals, areas)
        VALUES ($1, $2, $3, $4)
        ON CONFLICT (user_id) DO UPDATE SET
          about_me = $2,
          goals = $3,
          areas = $4,
          updated_at = CURRENT_TIMESTAMP
      `, [contextData.user_id, contextData.about_me, contextData.goals, contextData.areas]);
    }

    // Sample questions
    const questions = [
      { user_id: 1, text: 'Що я можу покращити в своїй роботі сьогодні?', source: 'user', active: true },
      { user_id: 1, text: 'Яка найважливіша річ, яку я зробив сьогодні?', source: 'user', active: true },
      { user_id: 1, text: 'Як я можу бути кращим лідером для своєї команди?', source: 'agent', active: true },
      { user_id: 2, text: 'Що я можу зробити завтра краще?', source: 'user', active: true },
      { user_id: 2, text: 'Як я можу покращити комунікацію з колегами?', source: 'agent', active: true }
    ];

    console.log('🌱 Seeding questions...');
    for (const questionData of questions) {
      await client.query(`
        INSERT INTO questions (user_id, text, source, active)
        VALUES ($1, $2, $3, $4)
      `, [questionData.user_id, questionData.text, questionData.source, questionData.active]);
    }

    // Sample answers
    const answers = [
      { user_id: 1, question_id: 1, text: 'Можу покращити документацію коду та більше тестувати функції перед комітом.' },
      { user_id: 1, question_id: 2, text: 'Найважливіше - допоміг колезі з складним багом та навчив його новому підходу до дебагу.' },
      { user_id: 1, question_id: 3, text: 'Можу більше слухати команду, давати конструктивний фідбек та бути прикладом для наслідування.' },
      { user_id: 2, question_id: 4, text: 'Завтра зроблю детальний план на тиждень та проведу ретроспективу з командою.' },
      { user_id: 2, question_id: 5, text: 'Буду більше використовувати візуальні допомоги при презентації танаймати час на особисті розмови.' }
    ];

    console.log('🌱 Seeding answers...');
    for (const answerData of answers) {
      await client.query(`
        INSERT INTO answers (user_id, question_id, text)
        VALUES ($1, $2, $3)
      `, [answerData.user_id, answerData.question_id, answerData.text]);
    }

    console.log('✅ Database seeded successfully');
    
  } catch (error) {
    console.error('❌ Error seeding database:', error);
    throw error;
  } finally {
    client.release();
  }
};

// Run seeding
const runSeed = async () => {
  try {
    await seedData();
    console.log('🎉 Database seeding completed successfully');
  } catch (error) {
    console.error('💥 Seeding failed:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
};

runSeed();
