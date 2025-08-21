const axios = require('axios');

class AIService {
  constructor() {
    this.apiKey = process.env.OPENAI_API_KEY || process.env.CLAUDE_API_KEY;
    this.apiUrl = process.env.OPENAI_API_URL || 'https://api.openai.com/v1/chat/completions';
    this.model = process.env.AI_MODEL || 'gpt-3.5-turbo';
  }

  async mergeContext(oldContextData, newContextData) {
    try {
      const prompt = `
Об'єднай старий контекст користувача з новими даними, створюючи оновлений та покращений контекст.

Старий контекст (текст):
${oldContextData || 'Контексту немає'}

Нові дані (текст):
${newContextData}

Правила об'єднання:
1. Залиши всю важливу інформацію зі старого контексту
2. Додай нову інформацію, не дублюючи існуючу
3. Покращи та деталізуй опис, якщо нові дані дають більше інформації
4. Структуруй інформацію в JSON з полями: about_me, goals, areas
5. Поверни тільки JSON об'єкт без додаткового тексту

Приклад структури:
{
  "about_me": "Детальний опис про себе, досвід, інтереси",
  "goals": "Цілі та плани користувача",
  "areas": "Сфери життя для покращення"
}

Оновлений контекст:
`;

      const response = await this.makeAIRequest(prompt);
      return JSON.parse(response);
    } catch (error) {
      console.error('❌ Error merging context:', error);
      // Fallback: просто об'єднати дані
      return {
        about_me: newContextData || '',
        goals: '',
        areas: ''
      };
    }
  }

  async classifyMessage(message, previousBotMessage = null, context = null) {
    try {
      let contextInfo = '';
      if (context) {
        contextInfo = `
Контекст користувача:
- Про себе: ${context.about_me}
- Цілі: ${context.goals}
- Сфери життя: ${context.areas}
`;
      }

      const prompt = `
Класифікуй повідомлення користувача в Telegram боті.

Повідомлення користувача: "${message}"

${previousBotMessage ? `Попереднє повідомлення бота: "${previousBotMessage}"` : 'Попереднього повідомлення бота немає'}

${contextInfo}

Типи повідомлень:
1. "answer" - відповідь на питання бота
2. "context_update" - користувач хоче оновити свій контекст/профіль
3. "question_request" - користувач хоче додати власне питання
4. "general_chat" - загальна розмова, привітання, дякування
5. "help_request" - запит на допомогу, пояснення

Поверни тільки JSON об'єкт:
{
  "type": "answer|context_update|question_request|general_chat|help_request",
  "confidence": 0.95,
  "reasoning": "коротке пояснення чому саме цей тип"
}
`;

      const response = await this.makeAIRequest(prompt);
      return JSON.parse(response);
    } catch (error) {
      console.error('❌ Error classifying message:', error);
      return { type: 'general_chat', confidence: 0.5, reasoning: 'Error occurred' };
    }
  }

  async generateQuestions(context, previousAnswers = []) {
    try {
      const answersInfo = previousAnswers.length > 0 
        ? `Попередні відповіді користувача: ${JSON.stringify(previousAnswers.slice(-3), null, 2)}`
        : 'Попередніх відповідей немає';

      const prompt = `
Згенеруй 3 персоналізовані кайдзен-питання для користувача на основі його контексту.

Контекст користувача:
- Про себе: ${context.about_me}
- Цілі: ${context.goals}
- Сфери життя: ${context.areas}

${answersInfo}

Правила:
1. Питання повинні бути конкретними та дієвими
2. Враховуй цілі та сфери життя користувача
3. Питання повинні спонукати до рефлексії та дії
4. Уникай загальних фраз, будь конкретним
5. Питання українською мовою

Поверни тільки JSON масив з питаннями:
[
  "Питання 1",
  "Питання 2", 
  "Питання 3"
]
`;

      const response = await this.makeAIRequest(prompt);
      return JSON.parse(response);
    } catch (error) {
      console.error('❌ Error generating questions:', error);
      return [
        "Що ви можете покращити в своєму житті сьогодні?",
        "Яка найважливіша ціль для вас зараз?",
        "Що вас найбільше мотивує рухатися вперед?"
      ];
    }
  }

  async analyzeAnswer(answer, question, context) {
    try {
      const prompt = `
Проаналізуй відповідь користувача на питання та дай корисні інсайти.

Питання: "${question}"
Відповідь: "${answer}"

Контекст користувача:
- Про себе: ${context.about_me}
- Цілі: ${context.goals}
- Сфери життя: ${context.areas}

Поверни JSON об'єкт:
{
  "insights": [
    "Інсайт 1 про відповідь користувача",
    "Інсайт 2 про паттерни мислення"
  ],
  "suggestions": [
    "Конкретна рекомендація 1",
    "Конкретна рекомендація 2"
  ],
  "follow_up_questions": [
    "Додаткове питання 1",
    "Додаткове питання 2"
  ]
}
`;

      const response = await this.makeAIRequest(prompt);
      return JSON.parse(response);
    } catch (error) {
      console.error('❌ Error analyzing answer:', error);
      return {
        insights: ["Ваша відповідь показує глибоке розуміння питання"],
        suggestions: ["Продовжуйте рефлексувати над своїми цілями"],
        follow_up_questions: ["Що ще ви можете зробити для досягнення цієї мети?"]
      };
    }
  }

  async makeAIRequest(prompt) {
    if (!this.apiKey) {
      throw new Error('AI API key not configured');
    }

    const payload = {
      model: this.model,
      messages: [
        {
          role: "system",
          content: "Ти - AI асистент для Telegram бота Kaizen Questions. Відповідай тільки JSON без додаткового тексту."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      temperature: 0.7,
      max_tokens: 1000
    };

    const headers = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${this.apiKey}`
    };

    console.log('🤖 AI Request:');
    console.log('   URL:', this.apiUrl);
    console.log('   Model:', this.model);
    console.log('   Prompt length:', prompt.length);

    const response = await axios.post(this.apiUrl, payload, { headers });
    
    console.log('✅ AI Response:', response.status);
    
    const content = response.data.choices[0].message.content;
    return content.trim();
  }
}

module.exports = new AIService();
