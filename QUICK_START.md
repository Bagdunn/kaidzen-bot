# 🚀 Швидкий старт Kaizen Questions Bot

## ⚡ Мінімальне налаштування (5 хвилин)

### 1. Встановлення залежностей
```bash
npm install
```

### 2. Налаштування змінних середовища
```bash
cp env.example .env
```

Відредагуйте `.env` файл:
```env
TELEGRAM_BOT_TOKEN=your_bot_token_here
DATABASE_URL=postgresql://username:password@localhost:5432/kaizen_questions
```

### 3. Створення бази даних
```bash
# Створіть базу даних в PostgreSQL
createdb kaizen_questions

# Запустіть міграції
npm run migrate
```

### 4. Запуск
```bash
npm run dev
```

## 🐳 Docker розгортання (ще швидше)

### 1. Налаштування змінних
```bash
cp env.example .env
# Відредагуйте .env файл
```

### 2. Запуск
```bash
docker-compose up -d
```

## 📱 Тестування бота

1. Знайдіть вашого бота в Telegram
2. Відправте `/start`
3. Налаштуйте час отримання питань
4. Додайте контекст командою `/context`

## 🔧 Основні команди

- `/start` - реєстрація
- `/settime` - налаштування часу
- `/addquestion` - додати питання
- `/context` - оновити контекст
- `/questions` - переглянути питання
- `/answers` - історія відповідей

## 🌐 API Endpoints

- `GET /` - інформація про API
- `GET /api/health` - перевірка стану
- `POST /api/register` - реєстрація користувача
- `GET /api/questions` - список питань
- `POST /api/answers` - запис відповіді

## 🤖 n8n інтеграція (опціонально)

Для AI функціональності:

1. Встановіть n8n: `npm install -g n8n`
2. Запустіть: `n8n start`
3. Налаштуйте workflows згідно з `docs/n8n-integration.md`

## 📊 Моніторинг

- Логи: `tail -f logs/app.log`
- Статус API: `curl http://localhost:3000/api/health`
- База даних: `psql -d kaizen_questions`

## 🆘 Проблеми?

1. Перевірте логи: `npm run dev`
2. Перевірте підключення до БД
3. Перевірте токен бота
4. Дивіться `SETUP.md` для детальних інструкцій

## 📚 Документація

- `README.md` - повна документація
- `SETUP.md` - детальне налаштування
- `docs/n8n-integration.md` - інтеграція з n8n

---

**Готово!** 🎉 Ваш Kaizen Questions Bot працює!
