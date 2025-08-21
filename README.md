# Kaizen Questions Bot

Telegram-бот для щоденних кайдзен-питань з інтеграцією AI через n8n.

## 🎯 Мета проєкту

Розробити Telegram-бота, який щодня в обраний час задає користувачу 1–3 коротких «кайдзен-питання» для саморозвитку та самопокращення.

## 🏗️ Архітектура

- **Node.js + Express.js** — серверна частина
- **PostgreSQL** — база даних
- **Telegram Bot API (Telegraf)** — інтеграція з Telegram
- **n8n** — ШІ-агент для генерації питань та аналізу відповідей
- **node-cron** — планування щоденних повідомлень

## 🚀 Швидкий старт

### 1. Встановлення залежностей

```bash
npm install
```

### 2. Налаштування змінних середовища

Скопіюйте `env.example` в `.env` та заповніть необхідні змінні:

```bash
cp env.example .env
```

```env
# Telegram Bot Configuration
TELEGRAM_BOT_TOKEN=your_telegram_bot_token_here

# Database Configuration
DATABASE_URL=postgresql://username:password@localhost:5432/kaizen_questions

# Server Configuration
PORT=3000
NODE_ENV=development

# n8n Integration
N8N_WEBHOOK_URL=http://localhost:5678/webhook/kaizen-bot
N8N_API_KEY=your_n8n_api_key_here

# Security
JWT_SECRET=your_jwt_secret_here
```

### 3. Налаштування бази даних

```bash
# Створення таблиць
npm run migrate

# Видалення таблиць (якщо потрібно)
npm run migrate drop
```

### 4. Запуск

```bash
# Розробка
npm run dev

# Продакшн
npm start
```

## 📋 Основні функції

### 👤 Користувач

- **Реєстрація** через Telegram (ID, username)
- **Налаштування часу** отримання питань (до 3 часів на день)
- **Власні питання** (до 3 шт.)
- **Контекст** (інформація про себе, цілі, сфери життя)
- **Отримання питань** (власні + AI-генеровані)
- **Відповіді** зберігаються для аналізу
- **Історія** відповідей

### 🤖 ШІ-агент (через n8n)

- **Генерація питань** на основі контексту
- **Аналіз відповідей** та надання інсайтів
- **Уточнюючі питання** для глибшого розуміння
- **Обробка повідомлень** користувача

## 🗄️ Структура бази даних

### Таблиця `users`
- `id` (SERIAL PK) — унікальний ID
- `telegram_id` (BIGINT) — Telegram user_id
- `username` (TEXT) — Telegram username
- `created_at` (TIMESTAMP) — дата реєстрації

### Таблиця `reminder_times`
- `id` (SERIAL PK) — унікальний ID
- `user_id` (INT FK) — посилання на users
- `time` (TIME) — час нагадування
- `active` (BOOLEAN) — активне нагадування
- `created_at` (TIMESTAMP) — дата створення

### Таблиця `contexts`
- `id` (SERIAL PK)
- `user_id` (INT FK) — посилання на users
- `about_me` (TEXT) — «Про мене»
- `goals` (TEXT) — «Що хочу покращити»
- `areas` (TEXT) — «Ключові сфери життя»
- `updated_at` (TIMESTAMP)

### Таблиця `questions`
- `id` (SERIAL PK)
- `user_id` (INT FK) — посилання на users
- `text` (TEXT) — текст питання
- `source` (TEXT) — «user» / «agent»
- `active` (BOOLEAN) — активне чи ні
- `created_at` (TIMESTAMP)

### Таблиця `answers`
- `id` (SERIAL PK)
- `user_id` (INT FK) — посилання на users
- `question_id` (INT FK) — посилання на questions
- `text` (TEXT) — відповідь
- `created_at` (TIMESTAMP)

## 🤖 Команди бота

- `/start` — реєстрація та налаштування
- `/settime` — задати час отримання питань
- `/addquestion` — додати власне питання
- `/context` — оновити контекст
- `/questions` — переглянути питання
- `/answers` — переглянути історію

## 🔌 API Endpoints

### Користувачі
- `GET /api/users` — отримання інформації про користувача

### Контекст
- `POST /api/context/merge` — об'єднання контексту з AI
- `POST /api/context` — оновлення контексту
- `GET /api/context` — отримання контексту

### Питання
- `POST /api/questions/generate` — генерація AI питань
- `POST /api/questions` — створення питання
- `GET /api/questions` — список питань

### Відповіді
- `POST /api/answers/analyze` — аналіз відповіді з AI
- `POST /api/answers` — запис відповіді
- `GET /api/answers` — історія відповідей

### Нагадування
- `GET /api/reminders` — отримання нагадувань користувача
- `POST /api/reminders` — створення нагадування
- `PUT /api/reminders` — оновлення нагадування
- `DELETE /api/reminders` — видалення нагадування

### Система
- `GET /api/health` — перевірка стану
- `GET /` — інформація про API

## 🔗 Інтеграція з n8n

### Webhook Endpoint
```
POST /api/n8n/webhook
```

### Типи повідомлень

#### Класифікація повідомлень
```json
{
  "type": "message_classification",
  "data": {
    "message": "текст повідомлення",
    "userId": 123,
    "context": {...}
  }
}
```

#### Генерація питань
```json
{
  "type": "question_generation",
  "data": {
    "userId": 123,
    "context": {...},
    "previousAnswers": [...]
  }
}
```

#### Аналіз відповідей
```json
{
  "type": "answer_analysis",
  "data": {
    "answer": "текст відповіді",
    "question": "текст питання",
    "context": {...}
  }
}
```

## 🔒 Безпека

- Авторизація за Telegram ID
- Rate limiting (100 запитів на 15 хвилин)
- Helmet.js для захисту заголовків
- CORS налаштування
- Валідація вхідних даних

## 📦 Структура проєкту

```
src/
├── bot/                 # Telegram бот
│   └── index.js        # Основний файл бота
├── database/           # База даних
│   ├── connection.js   # Підключення до БД
│   └── migrate.js      # Міграції
├── models/             # Моделі даних
│   ├── User.js
│   ├── Context.js
│   ├── Question.js
│   ├── Answer.js
│   └── ReminderTime.js
├── routes/             # API маршрути
│   └── api.js
├── services/           # Бізнес-логіка
│   ├── aiService.js    # Пряма інтеграція з AI
│   ├── n8nService.js   # Інтеграція з n8n
│   ├── questionService.js # Сервіс питань
│   └── reminderService.js # Сервіс нагадувань
└── index.js           # Основний файл сервера
```

## 🚀 Розгортання

### Локальне розгортання
1. Встановіть PostgreSQL
2. Створіть базу даних
3. Налаштуйте змінні середовища
4. Запустіть міграції
5. Запустіть сервер

### Docker (майбутнє)
```bash
docker-compose up -d
```

## 📈 Roadmap

### MVP ✅
- [x] Telegram бот + розсилка питань за часом
- [x] Зберігання відповідей
- [x] Контекст + кастомні питання
- [x] Пряма інтеграція з AI (генерація питань, аналіз контексту)
- [x] n8n агент для розширеної обробки

### Майбутні функції
- [ ] Історія + експорт відповідей (CSV)
- [ ] Статистика та аналітика
- [ ] Сповіщення та нагадування
- [ ] Групи та соціальні функції
- [ ] Мобільний додаток

## 🤝 Розробка

### Встановлення для розробки
```bash
git clone <repository>
cd kaizen-questions-bot
npm install
cp env.example .env
# Налаштуйте .env файл
npm run migrate
npm run dev
```

### Тестування
```bash
# Запуск тестів (майбутнє)
npm test

# Лінтер
npm run lint
```

## 📄 Ліцензія

MIT License

## 👥 Автори

Розроблено для проєкту Kaizen Questions Bot.

---

**Примітка:** Цей проєкт знаходиться в активній розробці. API може змінюватися. Класифікація повідомлень тепер обробляється через n8n агента.
