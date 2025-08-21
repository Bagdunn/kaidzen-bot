const { Telegraf, Scenes, session } = require('telegraf');
const User = require('../models/User');
const Context = require('../models/Context');
const Question = require('../models/Question');
const Answer = require('../models/Answer');
const ReminderTime = require('../models/ReminderTime');
const aiService = require('../services/aiService');
const n8nService = require('../services/n8nService');
const questionService = require('../services/questionService');

// Create bot instance
const bot = new Telegraf(process.env.TELEGRAM_BOT_TOKEN);

// Session middleware
bot.use(session());

// Store user states for multi-step interactions
const userStates = new Map();

// Store last bot messages for context
const lastBotMessages = new Map();

// Start command
bot.start(async (ctx) => {
  try {
    const telegramId = ctx.from.id;
    const username = ctx.from.username || ctx.from.first_name;
    
    // Register user automatically
    const user = await User.create(telegramId, username);
    
    const welcomeMessage = `
🎉 <b>Ласкаво просимо до Kaizen Questions!</b>

Це бот, який допоможе вам щодня задавати собі правильні питання для саморозвитку.

<b>Що ви можете робити:</b>
• Отримувати щоденні кайдзен-питання
• Створювати власні питання
• Налаштовувати контекст для персоналізації
• Відстежувати свій прогрес

<b>Основні команди:</b>
/settime - налаштувати час отримання питань
/addquestion - додати власне питання
/context - оновити контекст
/questions - переглянути питання
/answers - переглянути історію відповідей

Почнемо з налаштування часу отримання питань! 🕐
    `;
    
    await ctx.reply(welcomeMessage, { parse_mode: 'HTML' });
    
    // Store this message as last bot message
    lastBotMessages.set(telegramId, welcomeMessage);
    
    // Ask for preferred time
    const timeMessage = '⏰ Оберіть час отримання питань (можна обрати до 3 часів):';
    await ctx.reply(timeMessage, {
      reply_markup: {
        inline_keyboard: [
          [
            { text: '🌅 07:00', callback_data: 'add_time_07:00' },
            { text: '☀️ 09:00', callback_data: 'add_time_09:00' }
          ],
          [
            { text: '🌞 12:00', callback_data: 'add_time_12:00' },
            { text: '🌆 15:00', callback_data: 'add_time_15:00' }
          ],
          [
            { text: '🌇 18:00', callback_data: 'add_time_18:00' },
            { text: '🌃 21:00', callback_data: 'add_time_21:00' }
          ],
          [
            { text: '🌙 22:00', callback_data: 'add_time_22:00' },
            { text: '⏰ Власний час', callback_data: 'custom_time' }
          ]
        ]
      }
    });
    
    // Store time selection message
    lastBotMessages.set(telegramId, timeMessage);
    
  } catch (error) {
    console.error('Error in start command:', error);
    await ctx.reply('❌ Помилка при реєстрації. Спробуйте ще раз.');
  }
});

// Set time command
bot.command('settime', async (ctx) => {
  try {
    const user = await User.findByTelegramId(ctx.from.id);
    if (!user) {
      return await ctx.reply('❌ Будь ласка, спочатку зареєструйтесь командою /start');
    }
    
    // Get current reminder times
    const currentReminders = await ReminderTime.findActiveByUserId(user.id);
    
    let message = '⏰ <b>Налаштування часу нагадувань</b>\n\n';
    message += 'Оберіть час отримання питань (можна обрати до 3 часів):\n\n';
    
    if (currentReminders.length > 0) {
      message += '<b>Поточні нагадування:</b>\n';
      currentReminders.forEach((reminder, index) => {
        message += `${index + 1}. ${reminder.time}\n`;
      });
      message += '\n';
    }
    
    // Create time selection buttons
    const timeButtons = [
      [
        { text: '🌅 07:00', callback_data: 'add_time_07:00' },
        { text: '☀️ 09:00', callback_data: 'add_time_09:00' }
      ],
      [
        { text: '🌞 12:00', callback_data: 'add_time_12:00' },
        { text: '🌆 15:00', callback_data: 'add_time_15:00' }
      ],
      [
        { text: '🌇 18:00', callback_data: 'add_time_18:00' },
        { text: '🌃 21:00', callback_data: 'add_time_21:00' }
      ],
      [
        { text: '🌙 22:00', callback_data: 'add_time_22:00' },
        { text: '⏰ Власний час', callback_data: 'custom_time' }
      ]
    ];
    
    // Add management buttons if user has reminders
    if (currentReminders.length > 0) {
      // Add individual delete buttons for each reminder
      currentReminders.forEach((reminder, index) => {
        timeButtons.push([
          { text: `❌ Видалити ${reminder.time}`, callback_data: `remove_time_${reminder.id}` }
        ]);
      });
      
      timeButtons.push([
        { text: '🗑️ Видалити всі', callback_data: 'remove_all_times' },
        { text: '✅ Готово', callback_data: 'done_times' }
      ]);
    }
    
    await ctx.reply(message, {
      parse_mode: 'HTML',
      reply_markup: {
        inline_keyboard: timeButtons
      }
    });
    lastBotMessages.set(ctx.from.id, message);
    
  } catch (error) {
    console.error('Error in settime command:', error);
    await ctx.reply('❌ Помилка. Спробуйте ще раз.');
  }
});

// Add question command
bot.command('addquestion', async (ctx) => {
  try {
    const user = await User.findByTelegramId(ctx.from.id);
    if (!user) {
      return await ctx.reply('❌ Будь ласка, спочатку зареєструйтесь командою /start');
    }
    
    const questionCount = await Question.getActiveQuestionsCount(user.id);
    if (questionCount >= 3) {
      return await ctx.reply('❌ У вас вже є максимальна кількість власних питань (3). Видаліть одне з існуючих перед додаванням нового.');
    }
    
    userStates.set(ctx.from.id, { action: 'adding_question' });
    const message = '📝 Введіть ваше питання:';
    await ctx.reply(message);
    lastBotMessages.set(ctx.from.id, message);
    
  } catch (error) {
    console.error('Error in addquestion command:', error);
    await ctx.reply('❌ Помилка. Спробуйте ще раз.');
  }
});

// Context command
bot.command('context', async (ctx) => {
  try {
    const user = await User.findByTelegramId(ctx.from.id);
    if (!user) {
      return await ctx.reply('❌ Будь ласка, спочатку зареєструйтесь командою /start');
    }
    
    userStates.set(ctx.from.id, { action: 'setting_context', step: 'about_me' });
    const message = '👤 Розкажіть про себе (хто ви, чим займаєтесь):';
    await ctx.reply(message);
    lastBotMessages.set(ctx.from.id, message);
    
  } catch (error) {
    console.error('Error in context command:', error);
    await ctx.reply('❌ Помилка. Спробуйте ще раз.');
  }
});

// Questions command
bot.command('questions', async (ctx) => {
  try {
    const user = await User.findByTelegramId(ctx.from.id);
    if (!user) {
      return await ctx.reply('❌ Будь ласка, спочатку зареєструйтесь командою /start');
    }
    
    const questions = await Question.findByUserId(user.id, true);
    
    if (questions.length === 0) {
      const message = '📝 У вас поки немає питань. Додайте власні питання командою /addquestion або оновіть контекст командою /context для отримання AI-питань.';
      await ctx.reply(message);
      lastBotMessages.set(ctx.from.id, message);
      return;
    }
    
    let message = '📝 <b>Ваші активні питання:</b>\n\n';
    questions.forEach((question, index) => {
      const source = question.source === 'user' ? '👤' : '🤖';
      message += `${index + 1}. ${source} ${question.text}\n\n`;
    });
    
    await ctx.reply(message, { parse_mode: 'HTML' });
    lastBotMessages.set(ctx.from.id, message);
    
  } catch (error) {
    console.error('Error in questions command:', error);
    await ctx.reply('❌ Помилка. Спробуйте ще раз.');
  }
});

// Answers command
bot.command('answers', async (ctx) => {
  try {
    const user = await User.findByTelegramId(ctx.from.id);
    if (!user) {
      return await ctx.reply('❌ Будь ласка, спочатку зареєструйтесь командою /start');
    }
    
    const answers = await Answer.findByUserId(user.id, 10);
    
    if (answers.length === 0) {
      const message = '📊 У вас поки немає відповідей. Відповідайте на щоденні питання, щоб побачити історію тут.';
      await ctx.reply(message);
      lastBotMessages.set(ctx.from.id, message);
      return;
    }
    
    let message = '📊 <b>Ваші останні відповіді:</b>\n\n';
    answers.slice(0, 5).forEach((answer, index) => {
      const date = new Date(answer.created_at).toLocaleDateString('uk-UA');
      message += `<b>${date}</b>\n❓ ${answer.question_text}\n💭 ${answer.text}\n\n`;
    });
    
    if (answers.length > 5) {
      message += `... та ще ${answers.length - 5} відповідей`;
    }
    
    await ctx.reply(message, { parse_mode: 'HTML' });
    lastBotMessages.set(ctx.from.id, message);
    
  } catch (error) {
    console.error('Error in answers command:', error);
    await ctx.reply('❌ Помилка. Спробуйте ще раз.');
  }
});

// Handle callback queries for time management
bot.action(/add_time_(.+)/, async (ctx) => {
  try {
    const time = ctx.match[1];
    const user = await User.findByTelegramId(ctx.from.id);
    
    if (!user) {
      return await ctx.reply('❌ Користувача не знайдено.');
    }
    
    // Check if user already has 3 active reminders
    const activeCount = await ReminderTime.getActiveCount(user.id);
    if (activeCount >= 3) {
      await ctx.answerCbQuery('❌ У вас вже є максимальна кількість нагадувань (3). Видаліть одне з існуючих.');
      return;
    }
    
    // Add new reminder time
    await ReminderTime.create(user.id, time);
    
    await ctx.answerCbQuery(`✅ Додано нагадування на ${time}`);
    
    // Update the message to show current reminders
    const currentReminders = await ReminderTime.findActiveByUserId(user.id);
    
    let message = '⏰ <b>Налаштування часу нагадувань</b>\n\n';
    message += 'Оберіть час отримання питань (можна обрати до 3 часів):\n\n';
    
    if (currentReminders.length > 0) {
      message += '<b>Поточні нагадування:</b>\n';
      currentReminders.forEach((reminder, index) => {
        message += `${index + 1}. ${reminder.time}\n`;
      });
      message += '\n';
    }
    
    // Recreate buttons
    const timeButtons = [
      [
        { text: '🌅 07:00', callback_data: 'add_time_07:00' },
        { text: '☀️ 09:00', callback_data: 'add_time_09:00' }
      ],
      [
        { text: '🌞 12:00', callback_data: 'add_time_12:00' },
        { text: '🌆 15:00', callback_data: 'add_time_15:00' }
      ],
      [
        { text: '🌇 18:00', callback_data: 'add_time_18:00' },
        { text: '🌃 21:00', callback_data: 'add_time_21:00' }
      ],
      [
        { text: '🌙 22:00', callback_data: 'add_time_22:00' },
        { text: '⏰ Власний час', callback_data: 'custom_time' }
      ]
    ];
    
    if (currentReminders.length > 0) {
      // Add individual delete buttons for each reminder
      currentReminders.forEach((reminder, index) => {
        timeButtons.push([
          { text: `❌ Видалити ${reminder.time}`, callback_data: `remove_time_${reminder.id}` }
        ]);
      });
      
      timeButtons.push([
        { text: '🗑️ Видалити всі', callback_data: 'remove_all_times' },
        { text: '✅ Готово', callback_data: 'done_times' }
      ]);
    }
    
    await ctx.editMessageText(message, {
      parse_mode: 'HTML',
      reply_markup: {
        inline_keyboard: timeButtons
      }
    });
    
  } catch (error) {
    console.error('Error adding time:', error);
    await ctx.answerCbQuery('❌ Помилка при додаванні часу.');
  }
});

bot.action('remove_all_times', async (ctx) => {
  try {
    const user = await User.findByTelegramId(ctx.from.id);
    if (!user) {
      return await ctx.reply('❌ Користувача не знайдено.');
    }
    
    // Get all active reminders and deactivate them
    const activeReminders = await ReminderTime.findActiveByUserId(user.id);
    for (const reminder of activeReminders) {
      await ReminderTime.deactivate(reminder.id);
    }
    
    await ctx.answerCbQuery('✅ Всі нагадування видалено');
    
    // Update message
    const message = '⏰ <b>Налаштування часу нагадувань</b>\n\nОберіть час отримання питань (можна обрати до 3 часів):\n\n';
    
    const timeButtons = [
      [
        { text: '🌅 07:00', callback_data: 'add_time_07:00' },
        { text: '☀️ 09:00', callback_data: 'add_time_09:00' }
      ],
      [
        { text: '🌞 12:00', callback_data: 'add_time_12:00' },
        { text: '🌆 15:00', callback_data: 'add_time_15:00' }
      ],
      [
        { text: '🌇 18:00', callback_data: 'add_time_18:00' },
        { text: '🌃 21:00', callback_data: 'add_time_21:00' }
      ],
      [
        { text: '🌙 22:00', callback_data: 'add_time_22:00' },
        { text: '⏰ Власний час', callback_data: 'custom_time' }
      ]
    ];
    
    await ctx.editMessageText(message, {
      parse_mode: 'HTML',
      reply_markup: {
        inline_keyboard: timeButtons
      }
    });
    
  } catch (error) {
    console.error('Error removing all times:', error);
    await ctx.answerCbQuery('❌ Помилка при видаленні нагадувань.');
  }
});

// Handle individual reminder deletion
bot.action(/remove_time_(.+)/, async (ctx) => {
  try {
    const reminderId = ctx.match[1];
    const user = await User.findByTelegramId(ctx.from.id);
    
    if (!user) {
      return await ctx.reply('❌ Користувача не знайдено.');
    }
    
    // Get the reminder to show the time in the confirmation
    const reminder = await ReminderTime.findById(reminderId);
    if (!reminder) {
      await ctx.answerCbQuery('❌ Нагадування не знайдено.');
      return;
    }
    
    // Check if the reminder belongs to this user
    if (reminder.user_id !== user.id) {
      await ctx.answerCbQuery('❌ Це нагадування не належить вам.');
      return;
    }
    
    // Deactivate the reminder
    await ReminderTime.deactivate(reminderId);
    
    await ctx.answerCbQuery(`✅ Нагадування на ${reminder.time} видалено`);
    
    // Update the message to show current reminders
    const currentReminders = await ReminderTime.findActiveByUserId(user.id);
    
    let message = '⏰ <b>Налаштування часу нагадувань</b>\n\n';
    message += 'Оберіть час отримання питань (можна обрати до 3 часів):\n\n';
    
    if (currentReminders.length > 0) {
      message += '<b>Поточні нагадування:</b>\n';
      currentReminders.forEach((reminder, index) => {
        message += `${index + 1}. ${reminder.time}\n`;
      });
      message += '\n';
    }
    
    // Recreate buttons
    const timeButtons = [
      [
        { text: '🌅 07:00', callback_data: 'add_time_07:00' },
        { text: '☀️ 09:00', callback_data: 'add_time_09:00' }
      ],
      [
        { text: '🌞 12:00', callback_data: 'add_time_12:00' },
        { text: '🌆 15:00', callback_data: 'add_time_15:00' }
      ],
      [
        { text: '🌇 18:00', callback_data: 'add_time_18:00' },
        { text: '🌃 21:00', callback_data: 'add_time_21:00' }
      ],
      [
        { text: '🌙 22:00', callback_data: 'add_time_22:00' },
        { text: '⏰ Власний час', callback_data: 'custom_time' }
      ]
    ];
    
    if (currentReminders.length > 0) {
      // Add individual delete buttons for each reminder
      currentReminders.forEach((reminder, index) => {
        timeButtons.push([
          { text: `❌ Видалити ${reminder.time}`, callback_data: `remove_time_${reminder.id}` }
        ]);
      });
      
      timeButtons.push([
        { text: '🗑️ Видалити всі', callback_data: 'remove_all_times' },
        { text: '✅ Готово', callback_data: 'done_times' }
      ]);
    }
    
    await ctx.editMessageText(message, {
      parse_mode: 'HTML',
      reply_markup: {
        inline_keyboard: timeButtons
      }
    });
    
  } catch (error) {
    console.error('Error removing individual time:', error);
    await ctx.answerCbQuery('❌ Помилка при видаленні нагадування.');
  }
});

bot.action('done_times', async (ctx) => {
  try {
    const user = await User.findByTelegramId(ctx.from.id);
    if (!user) {
      return await ctx.reply('❌ Користувача не знайдено.');
    }
    
    const currentReminders = await ReminderTime.findActiveByUserId(user.id);
    
    if (currentReminders.length === 0) {
      await ctx.answerCbQuery('⚠️ У вас немає активних нагадувань');
      return;
    }
    
    let message = '✅ <b>Нагадування налаштовано!</b>\n\n';
    message += 'Ви будете отримувати питання в такі години:\n';
    currentReminders.forEach((reminder, index) => {
      message += `${index + 1}. ${reminder.time}\n`;
    });
    
    await ctx.editMessageText(message, { parse_mode: 'HTML' });
    lastBotMessages.set(ctx.from.id, message);
    
  } catch (error) {
    console.error('Error finishing time setup:', error);
    await ctx.answerCbQuery('❌ Помилка при завершенні налаштування.');
  }
});

bot.action('custom_time', async (ctx) => {
  try {
    userStates.set(ctx.from.id, { action: 'setting_custom_time' });
    await ctx.answerCbQuery('⏰ Введіть час у форматі HH:MM (наприклад: 14:30)');
    await ctx.editMessageText('⏰ Введіть час у форматі HH:MM (наприклад: 14:30):');
    lastBotMessages.set(ctx.from.id, '⏰ Введіть час у форматі HH:MM (наприклад: 14:30):');
    
  } catch (error) {
    console.error('Error setting custom time:', error);
    await ctx.answerCbQuery('❌ Помилка при налаштуванні власного часу.');
  }
});

bot.action(/answer_(.+)/, async (ctx) => {
  try {
    const questionId = ctx.match[1];
    userStates.set(ctx.from.id, { action: 'answering', questionId });
    
    await ctx.editMessageText('💭 Введіть вашу відповідь:');
    lastBotMessages.set(ctx.from.id, '💭 Введіть вашу відповідь:');
    
  } catch (error) {
    console.error('Error handling answer callback:', error);
    await ctx.reply('❌ Помилка. Спробуйте ще раз.');
  }
});

// Handle text messages
bot.on('text', async (ctx) => {
  try {
    const userState = userStates.get(ctx.from.id);
    const messageText = ctx.message.text;
    
    if (!userState) {
      // Send message to n8n agent for processing
      const user = await User.findByTelegramId(ctx.from.id);
      if (user) {
        try {
          const previousBotMessage = lastBotMessages.get(ctx.from.id);
          const context = await Context.findByUserId(user.id);
          
          // Send to n8n agent for message processing
          const response = await n8nService.processMessage(messageText, user.id, previousBotMessage, context);
          
          if (response && response.output) {
            await ctx.reply(response.output);
            lastBotMessages.set(ctx.from.id, response.output);
          } else if (response && response.response) {
            await ctx.reply(response.response);
            lastBotMessages.set(ctx.from.id, response.response);
          } else {
            const message = '💬 Дякую за повідомлення! Використайте команди для взаємодії з ботом.';
            await ctx.reply(message);
            lastBotMessages.set(ctx.from.id, message);
          }
        } catch (error) {
          console.error('Error processing message with n8n:', error);
          const message = '💬 Дякую за повідомлення! Використайте команди для взаємодії з ботом.';
          await ctx.reply(message);
          lastBotMessages.set(ctx.from.id, message);
        }
      }
      return;
    }
    
    // Handle different user states
    switch (userState.action) {
      case 'adding_question':
        await handleAddQuestion(ctx, messageText);
        break;
        
      case 'answering':
        await handleAnswer(ctx, messageText, userState.questionId);
        break;
        
      case 'setting_context':
        await handleContextSetting(ctx, messageText, userState.step);
        break;
        
      case 'setting_custom_time':
        await handleCustomTime(ctx, messageText);
        break;
        
      default:
        await ctx.reply('❌ Невідома дія. Спробуйте ще раз.');
    }
    
  } catch (error) {
    console.error('Error handling text message:', error);
    await ctx.reply('❌ Помилка. Спробуйте ще раз.');
  }
});

// Helper functions
async function handleAddQuestion(ctx, questionText) {
  try {
    const user = await User.findByTelegramId(ctx.from.id);
    const question = await Question.create(user.id, questionText, 'user');
    
    userStates.delete(ctx.from.id);
    
    const message = `✅ Питання додано: "${questionText}"`;
    await ctx.reply(message);
    lastBotMessages.set(ctx.from.id, message);
    
  } catch (error) {
    console.error('Error adding question:', error);
    await ctx.reply('❌ Помилка при додаванні питання.');
  }
}

async function handleAnswer(ctx, answerText, questionId) {
  try {
    await questionService.handleAnswer(bot, ctx.from.id, questionId, answerText);
    userStates.delete(ctx.from.id);
    
    // Message is already sent by questionService
    lastBotMessages.set(ctx.from.id, '✅ Відповідь збережено! Дякую за вашу рефлексію.');
    
  } catch (error) {
    console.error('Error handling answer:', error);
    await ctx.reply('❌ Помилка при збереженні відповіді.');
  }
}

async function handleContextSetting(ctx, text, step) {
  try {
    const user = await User.findByTelegramId(ctx.from.id);
    const userState = userStates.get(ctx.from.id);
    
    switch (step) {
      case 'about_me':
        userState.context = { about_me: text };
        userState.step = 'goals';
        const goalsMessage = '🎯 Що ви хочете покращити в своєму житті?';
        await ctx.reply(goalsMessage);
        lastBotMessages.set(ctx.from.id, goalsMessage);
        break;
        
      case 'goals':
        userState.context.goals = text;
        userState.step = 'areas';
        const areasMessage = '🌍 Які ключові сфери життя для вас найважливіші? (робота, сім\'я, здоров\'я, тощо)';
        await ctx.reply(areasMessage);
        lastBotMessages.set(ctx.from.id, areasMessage);
        break;
        
      case 'areas':
        userState.context.areas = text;
        
        // Save context to database
        await Context.createOrUpdate(
          user.id,
          userState.context.about_me,
          userState.context.goals,
          userState.context.areas
        );
        
        userStates.delete(ctx.from.id);
        
        const successMessage = '✅ Контекст збережено! Тепер AI зможе генерувати персоналізовані питання для вас.';
        await ctx.reply(successMessage);
        lastBotMessages.set(ctx.from.id, successMessage);
        
        // Generate initial AI questions
        const aiQuestions = await aiService.generateQuestions(userState.context, []);
        if (aiQuestions.length > 0) {
          for (const aiQuestion of aiQuestions.slice(0, 3)) {
            await Question.create(user.id, aiQuestion, 'agent');
          }
          const aiMessage = '🤖 Додано кілька AI-питань на основі вашого контексту!';
          await ctx.reply(aiMessage);
          lastBotMessages.set(ctx.from.id, aiMessage);
        }
        break;
    }
    
  } catch (error) {
    console.error('Error handling context setting:', error);
    await ctx.reply('❌ Помилка при збереженні контексту.');
  }
}

async function handleCustomTime(ctx, timeText) {
  try {
    const user = await User.findByTelegramId(ctx.from.id);
    
    // Validate time format (HH:MM)
    const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
    if (!timeRegex.test(timeText)) {
      await ctx.reply('❌ Неправильний формат часу. Використовуйте формат HH:MM (наприклад: 14:30)');
      return;
    }
    
    // Check if user already has 3 active reminders
    const activeCount = await ReminderTime.getActiveCount(user.id);
    if (activeCount >= 3) {
      await ctx.reply('❌ У вас вже є максимальна кількість нагадувань (3). Видаліть одне з існуючих.');
      userStates.delete(ctx.from.id);
      return;
    }
    
    // Add new reminder time
    await ReminderTime.create(user.id, timeText);
    
    userStates.delete(ctx.from.id);
    
    const message = `✅ Додано нагадування на ${timeText}! Використайте команду /settime для управління нагадуваннями.`;
    await ctx.reply(message);
    lastBotMessages.set(ctx.from.id, message);
    
  } catch (error) {
    console.error('Error handling custom time:', error);
    await ctx.reply('❌ Помилка при додаванні часу.');
    userStates.delete(ctx.from.id);
  }
}

// Error handling
bot.catch((err, ctx) => {
  console.error(`Error for ${ctx.updateType}:`, err);
  ctx.reply('❌ Сталася помилка. Спробуйте ще раз.');
});

module.exports = bot;
