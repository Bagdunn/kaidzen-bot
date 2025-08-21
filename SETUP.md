# Інструкції по налаштуванню Kaizen Questions Bot

## 📋 Передумови

Перед початком роботи переконайтеся, що у вас встановлено:

- **Node.js** (версія 16 або вище)
- **PostgreSQL** (версія 12 або вище)
- **npm** або **yarn**
- **Git**

## 🚀 Швидкий старт

### 1. Клонування репозиторію

```bash
git clone <repository-url>
cd kaizen-questions-bot
```

### 2. Встановлення залежностей

```bash
npm install
```

### 3. Налаштування бази даних

#### Створення бази даних PostgreSQL

```sql
-- Підключіться до PostgreSQL
psql -U postgres

-- Створіть базу даних
CREATE DATABASE kaizen_questions;

-- Створіть користувача (опціонально)
CREATE USER kaizen_user WITH PASSWORD 'your_password';
GRANT ALL PRIVILEGES ON DATABASE kaizen_questions TO kaizen_user;
```

#### Налаштування змінних середовища

Скопіюйте файл змінних середовища:

```bash
cp env.example .env
```

Відредагуйте `.env` файл:

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

### 4. Створення Telegram бота

1. Відкрийте Telegram
2. Знайдіть @BotFather
3. Відправте команду `/newbot`
4. Слідуйте інструкціям для створення бота
5. Скопіюйте отриманий токен в `.env` файл

### 5. Запуск міграцій

```bash
# Створення таблиць
npm run migrate

# Заповнення тестовими даними (опціонально)
npm run seed
```

### 6. Запуск сервера

```bash
# Розробка (з автоматичним перезапуском)
npm run dev

# Продакшн
npm start
```

## 🔧 Детальне налаштування

### Налаштування PostgreSQL

#### Ubuntu/Debian

```bash
# Встановлення PostgreSQL
sudo apt update
sudo apt install postgresql postgresql-contrib

# Запуск сервісу
sudo systemctl start postgresql
sudo systemctl enable postgresql

# Налаштування користувача
sudo -u postgres psql
CREATE USER kaizen_user WITH PASSWORD 'your_password';
CREATE DATABASE kaizen_questions OWNER kaizen_user;
GRANT ALL PRIVILEGES ON DATABASE kaizen_questions TO kaizen_user;
\q
```

#### Windows

1. Завантажте PostgreSQL з [офіційного сайту](https://www.postgresql.org/download/windows/)
2. Встановіть з pgAdmin
3. Створіть базу даних через pgAdmin або командний рядок

#### macOS

```bash
# Через Homebrew
brew install postgresql
brew services start postgresql

# Створення бази даних
createdb kaizen_questions
```

### Налаштування n8n (опціонально)

Для повної функціональності з AI:

```bash
# Встановлення n8n
npm install -g n8n

# Запуск n8n
n8n start
```

Відкрийте http://localhost:5678 та налаштуйте workflows згідно з документацією в `docs/n8n-integration.md`.

## 🧪 Тестування

### Тест бази даних

```bash
# Перевірка підключення
node -e "
const { Pool } = require('pg');
require('dotenv').config();
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
pool.query('SELECT NOW()', (err, res) => {
  if (err) console.error('Database connection failed:', err);
  else console.log('Database connected:', res.rows[0]);
  pool.end();
});
"
```

### Тест API

```bash
# Перевірка стану сервера
curl http://localhost:3000/

# Перевірка API health
curl http://localhost:3000/api/health
```

### Тест бота

1. Знайдіть вашого бота в Telegram
2. Відправте команду `/start`
3. Перевірте, чи отримали ви привітання

## 🔒 Безпека

### Налаштування HTTPS (для продакшну)

```bash
# Встановлення SSL сертифікату
sudo apt install certbot

# Отримання сертифікату
sudo certbot certonly --standalone -d your-domain.com

# Налаштування в .env
NODE_ENV=production
SSL_KEY_PATH=/etc/letsencrypt/live/your-domain.com/privkey.pem
SSL_CERT_PATH=/etc/letsencrypt/live/your-domain.com/fullchain.pem
```

### Налаштування файрвола

```bash
# Ubuntu/Debian
sudo ufw allow 3000
sudo ufw allow 5432
sudo ufw enable

# CentOS/RHEL
sudo firewall-cmd --permanent --add-port=3000/tcp
sudo firewall-cmd --permanent --add-port=5432/tcp
sudo firewall-cmd --reload
```

## 📊 Моніторинг

### Логи

```bash
# Перегляд логів
tail -f logs/app.log

# Логи з фільтрацією
grep "ERROR" logs/app.log
```

### Метрики

Налаштуйте моніторинг для відстеження:
- Кількості активних користувачів
- Кількості відправлених питань
- Часу відповіді API
- Помилок та винятків

## 🚀 Розгортання

### Локальне розгортання

```bash
# Клонування
git clone <repository>
cd kaizen-questions-bot

# Налаштування
npm install
cp env.example .env
# Відредагуйте .env

# База даних
npm run migrate

# Запуск
npm start
```

### Docker розгортання (майбутнє)

```bash
# Створення Docker image
docker build -t kaizen-bot .

# Запуск контейнера
docker run -d \
  --name kaizen-bot \
  -p 3000:3000 \
  --env-file .env \
  kaizen-bot
```

### Розгортання на сервері

1. **Підготовка сервера**
   ```bash
   # Оновлення системи
   sudo apt update && sudo apt upgrade -y
   
   # Встановлення Node.js
   curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
   sudo apt-get install -y nodejs
   
   # Встановлення PostgreSQL
   sudo apt install postgresql postgresql-contrib
   ```

2. **Налаштування проєкту**
   ```bash
   # Клонування
   git clone <repository>
   cd kaizen-questions-bot
   
   # Встановлення залежностей
   npm install --production
   
   # Налаштування змінних
   cp env.example .env
   nano .env
   ```

3. **Налаштування бази даних**
   ```bash
   # Створення бази
   sudo -u postgres createdb kaizen_questions
   
   # Запуск міграцій
   npm run migrate
   ```

4. **Налаштування PM2**
   ```bash
   # Встановлення PM2
   npm install -g pm2
   
   # Запуск додатку
   pm2 start src/index.js --name "kaizen-bot"
   
   # Автозапуск
   pm2 startup
   pm2 save
   ```

## 🔧 Troubleshooting

### Поширені проблеми

#### 1. Помилка підключення до бази даних

```bash
# Перевірте статус PostgreSQL
sudo systemctl status postgresql

# Перевірте підключення
psql -h localhost -U username -d kaizen_questions
```

#### 2. Бот не відповідає

```bash
# Перевірте токен
echo $TELEGRAM_BOT_TOKEN

# Перевірте логи
npm run dev
```

#### 3. Помилки міграції

```bash
# Видалення таблиць
npm run migrate drop

# Повторне створення
npm run migrate
```

#### 4. Проблеми з n8n

```bash
# Перевірка статусу n8n
n8n status

# Перезапуск
n8n restart
```

### Логи для діагностики

```bash
# Логи додатку
tail -f logs/app.log

# Логи PostgreSQL
sudo tail -f /var/log/postgresql/postgresql-*.log

# Логи системи
journalctl -u postgresql -f
```

## 📞 Підтримка

Якщо у вас виникли проблеми:

1. Перевірте розділ Troubleshooting
2. Подивіться логи для діагностики
3. Створіть issue в репозиторії з детальним описом проблеми

## 📚 Додаткові ресурси

- [Node.js Documentation](https://nodejs.org/docs/)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [Telegram Bot API](https://core.telegram.org/bots/api)
- [n8n Documentation](https://docs.n8n.io/)
