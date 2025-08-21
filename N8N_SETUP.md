# Налаштування n8n Агента для Kaizen Questions Bot

## 📋 Огляд

Цей документ описує як налаштувати n8n агента для роботи з Kaizen Questions Bot. Агент може:
- Генерувати персоналізовані питання
- Аналізувати відповіді
- Створювати додаткові питання
- Оновлювати контекст користувачів

## 🚀 Швидкий старт

### 1. Імпорт workflow
1. Відкрийте n8n (зазвичай http://localhost:5678)
2. Перейдіть до **Workflows**
3. Натисніть **Import from file**
4. Виберіть файл `n8n_agent_workflow.json`
5. Натисніть **Import**

### 2. Налаштування OpenAI
1. Відкрийте workflow "Kaizen Questions Bot Agent"
2. Для кожної AI ноди (Generate Questions, Analyze Answer, Follow-up Questions):
   - Натисніть на ноду
   - У розділі **Credentials** натисніть **Add Credential**
   - Виберіть **OpenAI API**
   - Введіть ваш OpenAI API ключ
   - Збережіть credential

### 3. Налаштування webhook URL
1. Відкрийте ноду **Webhook Trigger**
2. Скопіюйте URL webhook (наприклад: `http://localhost:5678/webhook/kaizen-bot-webhook`)
3. Оновіть змінну `N8N_WEBHOOK_URL` у вашому `.env` файлі:
   ```env
   N8N_WEBHOOK_URL=http://localhost:5678/webhook/kaizen-bot-webhook
   ```

### 4. Активація workflow
1. Натисніть **Active** у верхньому правому куті
2. Workflow тепер готовий до роботи!

## 🔧 Детальне налаштування

### Структура Workflow

```
Webhook Trigger → Request Type Switch → AI Processing → API Calls → Response
```

#### 1. Webhook Trigger
- **URL**: `/webhook`
- **Метод**: POST
- **Приймає**: JSON з полями `type`, `userId`, тощо

#### 2. Request Type Switch
Розділяє запити за типом:
- `generate_questions` - генерація питань
- `analyze_answer` - аналіз відповідей
- `follow_up_questions` - додаткові питання

#### 3. AI Nodes
Кожна AI нода має свій системний промпт:

**Generate Questions:**
```
Ти - AI асистент для генерації персоналізованих кайдзен-питань. 
Створи 3 конкретні та дієві питання на основі контексту користувача.

Правила:
1. Питання повинні бути конкретними та дієвими
2. Враховуй цілі та сфери життя користувача
3. Питання повинні спонукати до рефлексії та дії
4. Уникай загальних фраз, будь конкретним
5. Питання українською мовою

Поверни тільки JSON масив з питаннями
```

**Analyze Answer:**
```
Ти - AI асистент для аналізу відповідей користувачів. 
Проаналізуй відповідь та надай корисні інсайти та рекомендації.

Поверни JSON об'єкт з полями:
- insights: масив інсайтів про відповідь
- suggestions: масив конкретних рекомендацій
- follow_up_questions: масив додаткових питань
```

#### 4. API Nodes
Кожна AI нода підключена до відповідного API ендпоінту:

- **API: Generate Questions** → `POST /api/questions/generate`
- **API: Analyze Answer** → `POST /api/answers/analyze`
- **API: Merge Context** → `POST /api/context/merge`

## 📤 Формати запитів



### Генерація питань
```json
{
  "type": "generate_questions",
  "userId": 123
}
```

### Аналіз відповіді
```json
{
  "type": "analyze_answer",
  "userId": 123,
  "answerId": 456,
  "questionText": "Що ви можете покращити сьогодні?",
  "answerText": "Я можу краще планувати свій день"
}
```

### Додаткові питання
```json
{
  "type": "follow_up_questions",
  "userId": 123,
  "lastAnswer": "Я можу краще планувати свій день",
  "aboutMe": "Я розробник",
  "goals": "Покращити продуктивність",
  "areas": "робота, особистісний розвиток"
}
```

## 📥 Формати відповідей

### Успішна відповідь
```json
{
  "success": true,
  "data": {
    "questions": [
      "Як ви можете покращити свою продуктивність сьогодні?",
      "Що вас найбільше мотивує в роботі?",
      "Які перешкоди ви бачите на шляху до своїх цілей?"
    ]
  }
}
```

### Помилка
```json
{
  "success": false,
  "error": "User not found"
}
```

## 🔍 Тестування

### 1. Тест webhook
```bash
curl -X POST http://localhost:5678/webhook/kaizen-bot-webhook \
  -H "Content-Type: application/json" \
  -d '{
    "type": "generate_questions",
    "userId": 123
  }'
```

### 2. Перевірка логів
1. Відкрийте workflow в n8n
2. Натисніть **Execute Workflow**
3. Перегляньте логи кожної ноди

### 3. Тест з ботом
1. Запустіть Kaizen Questions Bot
2. Надішліть повідомлення боту
3. Перевірте логи в n8n та боті

## 🛠️ Налаштування середовища

### Змінні середовища для n8n
```env
# OpenAI
OPENAI_API_KEY=your_openai_api_key_here

# Kaizen Bot API
KAIZEN_BOT_API_URL=http://localhost:3000/api

# Webhook
WEBHOOK_URL=http://localhost:5678/webhook/kaizen-bot-webhook
```

### Налаштування в n8n
1. Перейдіть до **Settings** → **Variables**
2. Додайте змінні:
   - `KAIZEN_BOT_API_URL`: `http://localhost:3000/api`
   - `WEBHOOK_URL`: `http://localhost:5678/webhook/kaizen-bot-webhook`

## 🔧 Модифікація промптів

### Зміна логіки генерації питань
1. Відкрийте ноду **Generate Questions**
2. Модифікуйте системний промпт
3. Додайте нові правила або змініть існуючі

## 🚨 Усунення неполадок

### Помилка "Webhook not found"
- Перевірте, чи активований workflow
- Перевірте URL webhook в налаштуваннях бота

### Помилка "OpenAI API key not configured"
- Перевірте credentials в AI нодах
- Переконайтеся, що API ключ правильний

### Помилка "User not found"
- Перевірте, чи існує користувач з вказаним `userId`
- Перевірте підключення до бази даних

### Помилка "API endpoint not found"
- Перевірте, чи запущений Kaizen Bot
- Перевірте URL API в налаштуваннях n8n

## 📈 Моніторинг

### Логи n8n
1. Відкрийте workflow
2. Натисніть **Executions**
3. Перегляньте детальні логи кожного виконання

### Метрики
- Кількість запитів за день
- Час відповіді AI
- Успішність генерації питань
- Помилки API

## 🔄 Оновлення

### Оновлення промптів
1. Експортуйте поточний workflow
2. Відредагуйте промпти в JSON
3. Імпортуйте оновлений workflow

### Додавання нових функцій
1. Створіть нові AI ноди
2. Додайте відповідні API ноди
3. Оновіть **Request Type Switch** для нових типів
4. Протестуйте нову функціональність

## 📞 Підтримка

При виникненні проблем:
1. Перевірте логи n8n та бота
2. Перевірте підключення до API
3. Перевірте налаштування credentials
4. Зверніться до документації API

---

**Примітка**: Цей workflow призначений для роботи з Kaizen Questions Bot v2.0+ з підтримкою AI сервісів та розширених API ендпоінтів. Класифікація повідомлень тепер обробляється через n8n агента.
