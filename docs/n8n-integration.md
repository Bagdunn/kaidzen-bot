# Інтеграція з n8n

Цей документ описує як налаштувати інтеграцію між Kaizen Questions Bot та n8n для AI-функціональності.

## 🎯 Мета інтеграції

n8n використовується як AI-агент для:
- Генерації персоналізованих питань
- Аналізу відповідей та надання інсайтів
- Створення уточнюючих питань
- Обробки повідомлень користувача

## 🔧 Налаштування n8n

### 1. Встановлення n8n

```bash
# Локальне встановлення
npm install -g n8n

# Або через Docker
docker run -it --rm \
  --name n8n \
  -p 5678:5678 \
  -v ~/.n8n:/home/node/.n8n \
  n8nio/n8n
```

### 2. Створення Workflow

#### Workflow 1: Обробка повідомлень

**Тригер:** Webhook
- URL: `http://localhost:5678/webhook/kaizen-message-processing`
- Method: POST

**Обробка:**
1. **Extract Data** - витягти дані з запиту
2. **AI Service** (OpenAI/ChatGPT) - обробити повідомлення
3. **HTTP Request** - відправити результат назад до бота

**AI Prompt для обробки повідомлень:**
```
Оброби це повідомлення користувача та надай відповідну відповідь:

Повідомлення: {{ $json.message }}
Контекст користувача: {{ $json.context }}

Відповідь повинна бути:
- Корисною та мотивуючою
- Відповідати контексту користувача
- Сприяти саморозвитку

Відповідь в форматі JSON:
{
  "response": "текст відповіді",
  "suggestions": ["пропозиція 1", "пропозиція 2"],
  "next_action": "наступна дія"
}
```

#### Workflow 2: Генерація питань

**Тригер:** Webhook
- URL: `http://localhost:5678/webhook/kaizen-question-generation`
- Method: POST

**Обробка:**
1. **Extract Data** - витягти контекст та історію
2. **AI Service** - згенерувати питання
3. **HTTP Request** - відправити питання до бота

**AI Prompt для генерації питань:**
```
Створи 3 кайдзен-питання для користувача на основі його контексту та історії відповідей.

Контекст користувача:
- Про себе: {{ $json.context.about_me }}
- Цілі: {{ $json.context.goals }}
- Сфери життя: {{ $json.context.areas }}

Останні відповіді: {{ $json.previousAnswers }}

Питання повинні бути:
- Короткими та зрозумілими
- Специфічними для контексту користувача
- Сприяти саморозвитку
- Різноманітними за тематикою

Відповідь в форматі JSON:
{
  "questions": [
    "Питання 1",
    "Питання 2", 
    "Питання 3"
  ]
}
```

#### Workflow 3: Аналіз відповідей

**Тригер:** Webhook
- URL: `http://localhost:5678/webhook/kaizen-answer-analysis`
- Method: POST

**Обробка:**
1. **Extract Data** - витягти відповідь та контекст
2. **AI Service** - проаналізувати відповідь
3. **HTTP Request** - відправити аналіз до бота

**AI Prompt для аналізу:**
```
Проаналізуй відповідь користувача на кайдзен-питання та надай інсайти та рекомендації.

Питання: {{ $json.question }}
Відповідь: {{ $json.answer }}
Контекст користувача: {{ $json.context }}

Надай:
1. Ключові інсайти з відповіді
2. Конкретні рекомендації для покращення
3. Можливі наступні кроки

Відповідь в форматі JSON:
{
  "insights": [
    "Інсайт 1",
    "Інсайт 2"
  ],
  "suggestions": [
    "Рекомендація 1",
    "Рекомендація 2"
  ],
  "nextSteps": [
    "Крок 1",
    "Крок 2"
  ]
}
```

## 🔗 Налаштування з'єднань

### 1. Конфігурація бота

В файлі `.env`:
```env
N8N_WEBHOOK_URL=http://localhost:5678/webhook/kaizen-bot
N8N_API_KEY=your_n8n_api_key_here
```

### 2. Налаштування AI сервісу

В n8n додайте AI сервіс (OpenAI, ChatGPT, або інший):

**OpenAI Configuration:**
- API Key: ваш OpenAI API ключ
- Model: gpt-3.5-turbo або gpt-4
- Temperature: 0.7
- Max Tokens: 500

## 📡 Webhook Endpoints

### Відправка до n8n

Бот відправляє дані на n8n через HTTP POST запити:

```javascript
// Приклад запиту до n8n
const response = await axios.post(n8nWebhookUrl, {
  message: "текст повідомлення",
  userId: 123,
  context: {
    about_me: "...",
    goals: "...",
    areas: "..."
  },
  type: "classification"
});
```

### Отримання від n8n

n8n відправляє результати назад до бота:

```javascript
// n8n відправляє результат
const result = {
  type: "context_update",
  confidence: 0.95,
  reasoning: "Користувач описує себе та свої цілі"
};
```

## 🧪 Тестування

### 1. Тест класифікації

```bash
curl -X POST http://localhost:5678/webhook/kaizen-message-classification \
  -H "Content-Type: application/json" \
  -d '{
    "message": "Я хочу покращити свої навички лідерства",
    "userId": 123,
    "context": {
      "about_me": "Розробник програмного забезпечення",
      "goals": "Покращити лідерство",
      "areas": "Робота, особистий розвиток"
    }
  }'
```

### 2. Тест генерації питань

```bash
curl -X POST http://localhost:5678/webhook/kaizen-question-generation \
  -H "Content-Type: application/json" \
  -d '{
    "userId": 123,
    "context": {
      "about_me": "Розробник програмного забезпечення",
      "goals": "Покращити лідерство",
      "areas": "Робота, особистий розвиток"
    },
    "previousAnswers": [
      "Відповідь 1",
      "Відповідь 2"
    ]
  }'
```

## 🔒 Безпека

### 1. API Key Authentication

Додайте перевірку API ключа в n8n workflows:

```javascript
// В n8n HTTP Request node
const apiKey = $input.first().json.headers['authorization'];
if (apiKey !== 'Bearer your_api_key') {
  throw new Error('Unauthorized');
}
```

### 2. Rate Limiting

Налаштуйте обмеження частоти запитів в n8n:

```javascript
// Використовуйте n8n Rate Limiting node
// Максимум 10 запитів на хвилину
```

## 📊 Моніторинг

### 1. Логи

Включайте логування в n8n workflows:

```javascript
// В n8n Code node
console.log('Processing request:', $input.first().json);
```

### 2. Метрики

Відстежуйте:
- Кількість запитів
- Час відповіді
- Помилки
- Якість обробки повідомлень

## 🚀 Розгортання

### Локальне розгортання

1. Запустіть n8n: `n8n start`
2. Створіть workflows
3. Налаштуйте webhook URLs
4. Запустіть бота

### Продакшн розгортання

1. Розгорніть n8n на сервері
2. Налаштуйте HTTPS
3. Використовуйте зовнішні AI сервіси
4. Налаштуйте моніторинг

## 🔧 Troubleshooting

### Поширені проблеми

1. **Webhook не спрацьовує**
   - Перевірте URL
   - Перевірте метод (POST)
   - Перевірте формат даних

2. **AI не відповідає**
   - Перевірте API ключ
   - Перевірте ліміти
   - Перевірте prompt

3. **Повільна відповідь**
   - Оптимізуйте prompt
   - Використовуйте кешування
   - Збільшіть ресурси

### Логи для діагностики

```bash
# n8n логи
n8n logs

# Бот логи
npm run dev
```

## 📚 Додаткові ресурси

- [n8n Documentation](https://docs.n8n.io/)
- [OpenAI API Documentation](https://platform.openai.com/docs)
- [Telegram Bot API](https://core.telegram.org/bots/api)

---

**Примітка:** Обробка повідомлень тепер повністю обробляється через n8n агента. Пряма інтеграція з AI залишається тільки для генерації питань при налаштуванні контексту.
