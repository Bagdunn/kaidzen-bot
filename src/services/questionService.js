const Question = require('../models/Question');
const Answer = require('../models/Answer');
const Context = require('../models/Context');
const User = require('../models/User');
const ReminderTime = require('../models/ReminderTime');
const ReminderService = require('./reminderService');

class QuestionService {
  async sendDailyQuestions(bot) {
    try {
      const currentTime = new Date();
      const currentHour = currentTime.getHours().toString().padStart(2, '0');
      const currentMinute = currentTime.getMinutes().toString().padStart(2, '0');
      const timeString = `${currentHour}:${currentMinute}`;
      
      console.log(`📤 Checking for users to send daily questions at ${timeString}`);
      
      // Use ReminderService to send questions at specific time
      const sentCount = await ReminderService.sendDailyQuestionsAtTime(timeString, bot);
      
      if (sentCount > 0) {
        console.log(`✅ Sent daily questions to ${sentCount} users at ${timeString}`);
      }
    } catch (error) {
      console.error('Error sending daily questions:', error);
    }
  }

  async sendQuestionsToUser(bot, telegramId) {
    try {
      const user = await this.getUserByTelegramId(telegramId);
      if (!user) return;

      const questions = await Question.findByUserId(user.id, true);
      if (questions.length === 0) {
        await bot.telegram.sendMessage(telegramId, '📝 У вас поки немає питань. Додайте власні питання командою /addquestion або оновіть контекст командою /context.');
        return;
      }

      const message = this.formatQuestionsMessage(questions);
      await bot.telegram.sendMessage(telegramId, message, { parse_mode: 'HTML' });
    } catch (error) {
      console.error(`Error sending questions to user ${telegramId}:`, error);
    }
  }

  formatQuestionsMessage(questions) {
    let message = '🤔 <b>Ваші щоденні питання:</b>\n\n';
    
    questions.forEach((question, index) => {
      const source = question.source === 'user' ? '👤' : '🤖';
      message += `${index + 1}. ${source} ${question.text}\n\n`;
    });
    
    message += '💭 Виберіть питання для відповіді:';
    
    return message;
  }

  async handleAnswer(bot, telegramId, questionId, answerText) {
    try {
      const user = await this.getUserByTelegramId(telegramId);
      if (!user) return;

      // Save answer
      const answer = await Answer.create(user.id, questionId, answerText);
      
      // TODO: Send to n8n agent for answer analysis and follow-up questions
      // For now, just send a simple confirmation
      await bot.telegram.sendMessage(telegramId, '✅ Відповідь збережено! Дякую за вашу рефлексію.');
      
    } catch (error) {
      console.error('Error handling answer:', error);
      throw error;
    }
  }



  // Helper methods using User model
  async getUsersWithReminderTimes() {
    try {
      return await ReminderTime.getAllUsersWithReminders();
    } catch (error) {
      console.error('Error getting users with reminder times:', error);
      return [];
    }
  }

  async getUserByTelegramId(telegramId) {
    try {
      return await User.findByTelegramId(telegramId);
    } catch (error) {
      console.error('Error getting user by telegram ID:', error);
      return null;
    }
  }
}

module.exports = new QuestionService();

