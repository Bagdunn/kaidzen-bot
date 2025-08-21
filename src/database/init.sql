-- Ініціалізація бази даних для Kaizen Questions Bot
-- Цей файл виконується автоматично при першому запуску PostgreSQL контейнера

-- Створення таблиці користувачів
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    telegram_id BIGINT UNIQUE NOT NULL,
    username TEXT,
    question_time TIME DEFAULT '09:00:00',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Створення таблиці контекстів
CREATE TABLE IF NOT EXISTS contexts (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    about_me TEXT,
    goals TEXT,
    areas TEXT,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Створення таблиці питань
CREATE TABLE IF NOT EXISTS questions (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    text TEXT NOT NULL,
    source TEXT CHECK (source IN ('user', 'agent')) DEFAULT 'user',
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Створення таблиці відповідей
CREATE TABLE IF NOT EXISTS answers (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    question_id INTEGER REFERENCES questions(id) ON DELETE CASCADE,
    text TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Створення індексів для покращення продуктивності
CREATE INDEX IF NOT EXISTS idx_users_telegram_id ON users(telegram_id);
CREATE INDEX IF NOT EXISTS idx_contexts_user_id ON contexts(user_id);
CREATE INDEX IF NOT EXISTS idx_questions_user_id ON questions(user_id);
CREATE INDEX IF NOT EXISTS idx_questions_active ON questions(active);
CREATE INDEX IF NOT EXISTS idx_answers_user_id ON answers(user_id);
CREATE INDEX IF NOT EXISTS idx_answers_question_id ON answers(question_id);
CREATE INDEX IF NOT EXISTS idx_answers_created_at ON answers(created_at);

-- Додавання коментарів до таблиць
COMMENT ON TABLE users IS 'Користувачі Telegram бота';
COMMENT ON TABLE contexts IS 'Контекст користувачів (інформація про себе, цілі, сфери життя)';
COMMENT ON TABLE questions IS 'Питання (власні та AI-генеровані)';
COMMENT ON TABLE answers IS 'Відповіді користувачів на питання';

-- Створення функції для автоматичного оновлення updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Створення тригера для автоматичного оновлення updated_at в contexts
CREATE TRIGGER update_contexts_updated_at 
    BEFORE UPDATE ON contexts 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Додавання тестових даних (опціонально)
INSERT INTO users (telegram_id, username, question_time) VALUES 
    (123456789, 'test_user_1', '09:00:00'),
    (987654321, 'test_user_2', '18:00:00')
ON CONFLICT (telegram_id) DO NOTHING;

INSERT INTO contexts (user_id, about_me, goals, areas) VALUES 
    (1, 'Тестовий користувач - розробник', 'Покращити навички лідерства', 'Робота, особистий розвиток')
ON CONFLICT (user_id) DO NOTHING;

INSERT INTO questions (user_id, text, source, active) VALUES 
    (1, 'Що я можу покращити сьогодні?', 'user', true),
    (1, 'Як я можу бути кращим лідером?', 'agent', true)
ON CONFLICT DO NOTHING;
