const ReminderTime = require('../models/ReminderTime');
const Question = require('../models/Question');
const n8nService = require('./n8nService');

class ReminderService {
  // Send daily questions to users at specific time
  static async sendDailyQuestionsAtTime(time, bot) {
    try {
      console.log(`📤 Sending daily questions to users at ${time}`);
      
      // Get all users with active reminder at this time
      const usersWithReminders = await ReminderTime.getAllUsersWithReminders();
      const usersAtTime = usersWithReminders.filter(user => {
        // Convert time from HH:MM:SS to HH:MM format for comparison
        const userTime = user.time.substring(0, 5); // Get first 5 characters (HH:MM)
        return userTime === time;
      });
      
      console.log(`📋 Found ${usersAtTime.length} users with reminder at ${time}`);
      
      let sentCount = 0;
      
      for (const user of usersAtTime) {
        try {
          // Get active questions for user
          const questions = await Question.findByUserId(user.id, true);
          
          if (questions.length === 0) {
            console.log(`⚠️ No active questions for user ${user.id} (${user.username})`);
            // Send message that user needs to add questions
            await bot.telegram.sendMessage(user.telegram_id, 
              '📝 У вас поки немає питань. Додайте власні питання командою /addquestion або оновіть контекст командою /context.'
            );
            continue;
          }
          
          // Select 1-3 random questions
          const selectedQuestions = this.selectRandomQuestions(questions, 1, 3);
          
          // Format message
          const message = this.formatDailyQuestionsMessage(selectedQuestions);
          
          // Send directly via Telegram bot
          await bot.telegram.sendMessage(user.telegram_id, message, { parse_mode: 'Markdown' });
          
          sentCount++;
          console.log(`✅ Sent ${selectedQuestions.length} questions to user ${user.id} (${user.username})`);
          
        } catch (error) {
          console.error(`❌ Error sending questions to user ${user.id} (${user.username}):`, error);
        }
      }
      
      console.log(`📤 Sent daily questions to ${sentCount} users at ${time}`);
      return sentCount;
      
    } catch (error) {
      console.error('❌ Error in sendDailyQuestionsAtTime:', error);
      return 0;
    }
  }

  // Select random questions from array
  static selectRandomQuestions(questions, minCount = 1, maxCount = 3) {
    const count = Math.min(
      Math.max(minCount, Math.floor(Math.random() * maxCount) + 1),
      questions.length
    );
    
    const shuffled = [...questions].sort(() => 0.5 - Math.random());
    return shuffled.slice(0, count);
  }

  // Format daily questions message
  static formatDailyQuestionsMessage(questions) {
    let message = '🌅 *Доброго ранку! Ось ваші питання на сьогодні:*\n\n';
    
    questions.forEach((question, index) => {
      message += `${index + 1}. ${question.text}\n\n`;
    });
    
    message += '💭 *Відповідайте на ці питання протягом дня для саморозвитку!*';
    
    return message;
  }

  // Get all unique reminder times
  static async getAllReminderTimes() {
    try {
      const usersWithReminders = await ReminderTime.getAllUsersWithReminders();
      const times = [...new Set(usersWithReminders.map(user => user.time))];
      return times.sort();
    } catch (error) {
      console.error('❌ Error getting all reminder times:', error);
      return [];
    }
  }

  // Check if it's time to send reminders
  static isTimeToSend(currentTime) {
    const timeStr = currentTime.toTimeString().slice(0, 5); // HH:MM format
    return timeStr;
  }
}

module.exports = ReminderService;
