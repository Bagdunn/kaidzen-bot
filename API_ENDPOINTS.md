# API Ендпоінти для Kaizen Questions Bot

## Базовий URL
```
http://localhost:3000/api
```

## Авторизація
Всі ендпоінти потребують один з варіантів ідентифікації користувача:
- **Заголовок** `X-Telegram-ID` або поле `telegram_id` в тілі запиту
- **Поле** `user_id` в тілі запиту (внутрішній ID користувача)

## Ендпоінти

### 1. Отримання інформації про користувача
**GET** `/users`
```json
{
  "user_id": 123
}
```
або
```json
{
  "telegram_id": 123456789
}
```
**Відповідь:**
```json
{
  "user": {
    "id": 123,
    "telegram_id": 123456789,
    "username": "user_name",
    "created_at": "2024-01-01T00:00:00Z"
  }
}
```



### 2. Об'єднання контексту з AI
**POST** `/context/merge`
```json
{
  "user_id": 123,
  "about_me": "нові дані про користувача",
  "goals": "нові цілі",
  "areas": "нові сфери життя"
}
```
**Відповідь:**
```json
{
  "context": {
    "id": 1,
    "user_id": 123,
    "about_me": "об'єднаний та покращений опис",
    "goals": "об'єднані та покращені цілі",
    "areas": "об'єднані сфери життя",
    "created_at": "2024-01-01T00:00:00Z",
    "updated_at": "2024-01-01T00:00:00Z"
  },
  "merged": true,
  "old_context": { /* старий контекст */ },
  "new_data": { /* нові дані */ },
  "user": {
    "id": 123,
    "telegram_id": 123456789,
    "username": "user_name"
  }
}
```

### 3. Отримання контексту
**GET** `/context`
**Заголовок:** `X-Telegram-ID: 123456789`
або
**POST** `/context`
```json
{
  "user_id": 123
}
```
**Відповідь:**
```json
{
  "context": {
    "id": 1,
    "user_id": 123,
    "about_me": "опис користувача",
    "goals": "цілі користувача",
    "areas": "сфери життя",
    "created_at": "2024-01-01T00:00:00Z",
    "updated_at": "2024-01-01T00:00:00Z"
  },
  "user": {
    "id": 123,
    "telegram_id": 123456789,
    "username": "user_name"
  }
}
```

### 4. Генерація AI питань
**POST** `/questions/generate`
```json
{
  "user_id": 123
}
```
**Відповідь:**
```json
{
  "questions": [
    {
      "id": 1,
      "user_id": 123,
      "text": "Згенероване питання 1",
      "source": "agent",
      "is_active": true,
      "created_at": "2024-01-01T00:00:00Z"
    }
  ],
  "generated_count": 3,
  "user": {
    "id": 123,
    "telegram_id": 123456789,
    "username": "user_name"
  }
}
```

### 5. Створення питання
**POST** `/questions`
```json
{
  "user_id": 123,
  "text": "текст питання",
  "source": "user" // або "agent"
}
```
**Відповідь:**
```json
{
  "question": {
    "id": 1,
    "user_id": 123,
    "text": "текст питання",
    "source": "user",
    "is_active": true,
    "created_at": "2024-01-01T00:00:00Z"
  },
  "user": {
    "id": 123,
    "telegram_id": 123456789,
    "username": "user_name"
  }
}
```

### 6. Отримання питань
**GET** `/questions?active_only=true`
**Заголовок:** `X-Telegram-ID: 123456789`
або
**POST** `/questions`
```json
{
  "user_id": 123,
  "active_only": true
}
```
**Відповідь:**
```json
{
  "questions": [
    {
      "id": 1,
      "user_id": 123,
      "text": "питання 1",
      "source": "user",
      "is_active": true,
      "created_at": "2024-01-01T00:00:00Z"
    }
  ],
  "user": {
    "id": 123,
    "telegram_id": 123456789,
    "username": "user_name"
  }
}
```

### 7. Створення відповіді
**POST** `/answers`
```json
{
  "user_id": 123,
  "question_id": 1,
  "text": "текст відповіді"
}
```
**Відповідь:**
```json
{
  "answer": {
    "id": 1,
    "user_id": 123,
    "question_id": 1,
    "text": "текст відповіді",
    "question_text": "текст питання",
    "created_at": "2024-01-01T00:00:00Z"
  },
  "user": {
    "id": 123,
    "telegram_id": 123456789,
    "username": "user_name"
  }
}
```

### 8. Аналіз відповіді з AI
**POST** `/answers/analyze`
```json
{
  "user_id": 123,
  "answer_id": 1,
  "question_text": "текст питання",
  "answer_text": "текст відповіді"
}
```
**Відповідь:**
```json
{
  "analysis": {
    "insights": [
      "інсайт 1 про відповідь",
      "інсайт 2 про паттерни мислення"
    ],
    "suggestions": [
      "конкретна рекомендація 1",
      "конкретна рекомендація 2"
    ],
    "follow_up_questions": [
      "додаткове питання 1",
      "додаткове питання 2"
    ]
  },
  "answer_id": 1,
  "question_text": "текст питання",
  "answer_text": "текст відповіді",
  "user": {
    "id": 123,
    "telegram_id": 123456789,
    "username": "user_name"
  }
}
```

### 10. Отримання відповідей
**GET** `/answers?limit=10&question_id=1&date=2024-01-01`
**Заголовок:** `X-Telegram-ID: 123456789`
або
**POST** `/answers`
```json
{
  "user_id": 123,
  "limit": 10,
  "question_id": 1,
  "date": "2024-01-01"
}
```
**Відповідь:**
```json
{
  "answers": [
    {
      "id": 1,
      "user_id": 123,
      "question_id": 1,
      "text": "текст відповіді",
      "question_text": "текст питання",
      "created_at": "2024-01-01T00:00:00Z"
    }
  ],
  "user": {
    "id": 123,
    "telegram_id": 123456789,
    "username": "user_name"
  }
}
```

### 11. Отримання нагадувань користувача
**GET** `/reminders`
**Заголовок:** `X-Telegram-ID: 123456789`
або
**POST** `/reminders`
```json
{
  "user_id": 123
}
```
**Відповідь:**
```json
{
  "reminders": [
    {
      "id": 1,
      "user_id": 123,
      "time": "09:00",
      "active": true,
      "created_at": "2024-01-01T00:00:00Z"
    },
    {
      "id": 2,
      "user_id": 123,
      "time": "18:00",
      "active": true,
      "created_at": "2024-01-01T00:00:00Z"
    }
  ],
  "user": {
    "id": 123,
    "telegram_id": 123456789,
    "username": "user_name"
  }
}
```

### 12. Створення нагадування
**POST** `/reminders`
```json
{
  "user_id": 123,
  "time": "09:00"
}
```
**Відповідь:**
```json
{
  "reminder": {
    "id": 1,
    "user_id": 123,
    "time": "09:00",
    "active": true,
    "created_at": "2024-01-01T00:00:00Z"
  },
  "user": {
    "id": 123,
    "telegram_id": 123456789,
    "username": "user_name"
  }
}
```

### 13. Оновлення нагадування
**PUT** `/reminders`
```json
{
  "id": 1,
  "time": "10:00",
  "active": false
}
```
**Відповідь:**
```json
{
  "reminder": {
    "id": 1,
    "user_id": 123,
    "time": "10:00",
    "active": false,
    "created_at": "2024-01-01T00:00:00Z"
  }
}
```

### 14. Видалення нагадування
**DELETE** `/reminders`
```json
{
  "id": 1
}
```
**Відповідь:**
```json
{
  "message": "Reminder deleted successfully",
  "reminder": {
    "id": 1,
    "user_id": 123,
    "time": "09:00",
    "active": true,
    "created_at": "2024-01-01T00:00:00Z"
  }
}
```

### 15. Перевірка здоров'я
**GET** `/health`
**Відповідь:**
```json
{
  "status": "ok",
  "timestamp": "2024-01-01T00:00:00Z"
}
```

## Приклади використання

### Отримання користувача за ID
```bash
curl -X GET http://localhost:3000/api/users \
  -H "Content-Type: application/json" \
  -d '{
    "user_id": 123
  }'
```

### Класифікація повідомлення
```bash
curl -X POST http://localhost:3000/api/messages/classify \
  -H "Content-Type: application/json" \
  -d '{
    "user_id": 123,
    "message": "Я хочу покращити свою продуктивність",
    "previous_bot_message": "Що ви можете покращити сьогодні?"
  }'
```

### Об'єднання контексту
```bash
curl -X POST http://localhost:3000/api/context/merge \
  -H "Content-Type: application/json" \
  -d '{
    "user_id": 123,
    "about_me": "Я розробник, працюю в IT компанії",
    "goals": "Хочу покращити продуктивність та навички лідерства",
    "areas": "робота, особистійний розвиток"
  }'
```

### Генерація питань
```bash
curl -X POST http://localhost:3000/api/questions/generate \
  -H "Content-Type: application/json" \
  -d '{
    "user_id": 123
  }'
```

### Аналіз відповіді
```bash
curl -X POST http://localhost:3000/api/answers/analyze \
  -H "Content-Type: application/json" \
  -d '{
    "user_id": 123,
    "answer_id": 1,
    "question_text": "Що ви можете покращити сьогодні?",
    "answer_text": "Я можу краще планувати свій день та делегувати завдання"
  }'
```

### Отримання нагадувань
```bash
curl -X GET http://localhost:3000/api/reminders \
  -H "X-Telegram-ID: 123456789"
```

### Створення нагадування
```bash
curl -X POST http://localhost:3000/api/reminders \
  -H "Content-Type: application/json" \
  -d '{
    "user_id": 123,
    "time": "09:00"
  }'
```

### Оновлення нагадування
```bash
curl -X PUT http://localhost:3000/api/reminders \
  -H "Content-Type: application/json" \
  -d '{
    "id": 1,
    "time": "10:00",
    "active": false
  }'
```

### Видалення нагадування
```bash
curl -X DELETE http://localhost:3000/api/reminders \
  -H "Content-Type: application/json" \
  -d '{
    "id": 1
  }'
```

## Коди помилок

- `400` - Неправильні дані запиту
- `401` - Відсутній Telegram ID або User ID
- `404` - Користувач не знайдений
- `500` - Внутрішня помилка сервера

## Переваги використання user_id

1. **Швидкість** - прямий пошук за ID швидший ніж за telegram_id
2. **Зручність** - агент може зберігати user_id після першого запиту
3. **Гнучкість** - можна використовувати обидва варіанти
4. **Безпека** - user_id є внутрішнім ідентифікатором
