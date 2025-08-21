const axios = require('axios');

class N8nService {
  constructor() {
    this.webhookUrl = process.env.N8N_WEBHOOK_URL;
    this.apiKey = process.env.N8N_API_KEY;
    console.log('🔧 n8nService initialized with:');
    console.log('   Webhook URL:', this.webhookUrl);
    console.log('   API Key:', this.apiKey ? 'Set' : 'Not set');
  }

  async classifyMessage(message, userId, context) {
    console.log('🤖 n8nService.classifyMessage called with:', { message: message.substring(0, 50) + '...', userId, context: context ? 'Available' : 'None' });
    
    try {
      const payload = {
        message,
        userId,
        context,
        type: 'classification'
      };

      const headers = {
        'Content-Type': 'application/json'
      };

      // Add authorization header only if API key is provided and not default
      if (this.apiKey && this.apiKey !== 'your_n8n_api_key_here' && this.apiKey.trim() !== '') {
        headers['Authorization'] = `Bearer ${this.apiKey}`;
      }

      console.log('🔗 n8n Request - classifyMessage:');
      console.log('   URL:', this.webhookUrl);
      console.log('   Method: POST');
      console.log('   Headers:', JSON.stringify(headers, null, 2));
      console.log('   Payload:', JSON.stringify(payload, null, 2));

      const response = await axios.post(this.webhookUrl, payload, {
        headers,
        timeout: 30000
      });

      console.log('✅ n8n Response - classifyMessage:', response.status, response.data);
      return response.data;
    } catch (error) {
      console.error('❌ Error classifying message with n8n:', error.message);
      if (error.response) {
        console.error('   Response status:', error.response.status);
        console.error('   Response data:', error.response.data);
      }
      return { type: 'unknown', confidence: 0 };
    }
  }

  async generateQuestions(userId, context, previousAnswers = []) {
    console.log('🤖 n8nService.generateQuestions called with:', { userId, context: context ? 'Available' : 'None', previousAnswersCount: previousAnswers.length });
    
    try {
      const payload = {
        userId,
        context,
        previousAnswers,
        type: 'generate_questions',
        count: 3
      };

      const headers = {
        'Content-Type': 'application/json'
      };

      // Add authorization header only if API key is provided and not default
      if (this.apiKey && this.apiKey !== 'your_n8n_api_key_here' && this.apiKey.trim() !== '') {
        headers['Authorization'] = `Bearer ${this.apiKey}`;
      }

      console.log('🔗 n8n Request - generateQuestions:');
      console.log('   URL:', this.webhookUrl);
      console.log('   Method: POST');
      console.log('   Headers:', JSON.stringify(headers, null, 2));
      console.log('   Payload:', JSON.stringify(payload, null, 2));

      const response = await axios.post(this.webhookUrl, payload, {
        headers,
        timeout: 15000
      });

      console.log('✅ n8n Response - generateQuestions:', response.status, response.data);
      return response.data.questions || [];
    } catch (error) {
      console.error('❌ Error generating questions with n8n:', error.message);
      if (error.response) {
        console.error('   Response status:', error.response.status);
        console.error('   Response data:', error.response.data);
      }
      return [];
    }
  }

  async analyzeAnswer(answer, question, context) {
    console.log('🤖 n8nService.analyzeAnswer called with:', { answer: answer.substring(0, 50) + '...', question: question.substring(0, 50) + '...', context: context ? 'Available' : 'None' });
    
    try {
      const payload = {
        answer,
        question,
        context,
        type: 'analyze_answer'
      };

      const headers = {
        'Content-Type': 'application/json'
      };

      // Add authorization header only if API key is provided and not default
      if (this.apiKey && this.apiKey !== 'your_n8n_api_key_here' && this.apiKey.trim() !== '') {
        headers['Authorization'] = `Bearer ${this.apiKey}`;
      }

      console.log('🔗 n8n Request - analyzeAnswer:');
      console.log('   URL:', this.webhookUrl);
      console.log('   Method: POST');
      console.log('   Headers:', JSON.stringify(headers, null, 2));
      console.log('   Payload:', JSON.stringify(payload, null, 2));

      const response = await axios.post(this.webhookUrl, payload, {
        headers,
        timeout: 30000
      });

      console.log('✅ n8n Response - analyzeAnswer:', response.status, response.data);
      return response.data;
    } catch (error) {
      console.error('❌ Error analyzing answer with n8n:', error.message);
      if (error.response) {
        console.error('   Response status:', error.response.status);
        console.error('   Response data:', error.response.data);
      }
      return { insights: [], suggestions: [] };
    }
  }

  async getFollowUpQuestions(userId, context, lastAnswer) {
    console.log('🤖 n8nService.getFollowUpQuestions called with:', { userId, context: context ? 'Available' : 'None', lastAnswer: lastAnswer.substring(0, 50) + '...' });
    
    try {
      const payload = {
        userId,
        context,
        lastAnswer,
        type: 'follow_up_questions'
      };

      const headers = {
        'Content-Type': 'application/json'
      };

      // Add authorization header only if API key is provided and not default
      if (this.apiKey && this.apiKey !== 'your_n8n_api_key_here' && this.apiKey.trim() !== '') {
        headers['Authorization'] = `Bearer ${this.apiKey}`;
      }

      console.log('🔗 n8n Request - getFollowUpQuestions:');
      console.log('   URL:', this.webhookUrl);
      console.log('   Method: POST');
      console.log('   Headers:', JSON.stringify(headers, null, 2));
      console.log('   Payload:', JSON.stringify(payload, null, 2));

      const response = await axios.post(this.webhookUrl, payload, {
        headers,
        timeout: 30000
      });

      console.log('✅ n8n Response - getFollowUpQuestions:', response.status, response.data);
      return response.data.questions || [];
    } catch (error) {
      console.error('❌ Error getting follow-up questions with n8n:', error.message);
      if (error.response) {
        console.error('   Response status:', error.response.status);
        console.error('   Response data:', error.response.data);
      }
      return [];
    }
  }

  async processMessage(message, userId, previousBotMessage = null, context = null) {
    console.log('🤖 n8nService.processMessage called with:', { 
      message: message.substring(0, 50) + '...', 
      userId, 
      previousBotMessage: previousBotMessage ? previousBotMessage.substring(0, 50) + '...' : 'None',
      context: context ? 'Available' : 'None' 
    });
    
    try {
      const payload = {
        message,
        userId,
        previousBotMessage,
        context,
        type: 'process_message'
      };

      const headers = {
        'Content-Type': 'application/json'
      };

      // Add authorization header only if API key is provided and not default
      if (this.apiKey && this.apiKey !== 'your_n8n_api_key_here' && this.apiKey.trim() !== '') {
        headers['Authorization'] = `Bearer ${this.apiKey}`;
      }

      console.log('🔗 n8n Request - processMessage:');
      console.log('   URL:', this.webhookUrl);
      console.log('   Method: POST');
      console.log('   Headers:', JSON.stringify(headers, null, 2));
      console.log('   Payload:', JSON.stringify(payload, null, 2));

      const response = await axios.post(this.webhookUrl, payload, {
        headers,
        timeout: 30000
      });

      console.log('✅ n8n Response - processMessage:', response.status, response.data);
      return response.data;
    } catch (error) {
      console.error('❌ Error processing message with n8n:', error.message);
      if (error.response) {
        console.error('   Response status:', error.response.status);
        console.error('   Response data:', error.response.data);
      }
      return null;
    }
  }

  async sendTelegramMessage(telegramId, message) {
    console.log('📱 n8nService.sendTelegramMessage called with:', { 
      telegramId, 
      message: message.substring(0, 50) + '...' 
    });
    
    try {
      const payload = {
        telegramId,
        message,
        type: 'send_message'
      };

      const headers = {
        'Content-Type': 'application/json'
      };

      // Add authorization header only if API key is provided and not default
      if (this.apiKey && this.apiKey !== 'your_n8n_api_key_here' && this.apiKey.trim() !== '') {
        headers['Authorization'] = `Bearer ${this.apiKey}`;
      }

      console.log('🔗 n8n Request - sendTelegramMessage:');
      console.log('   URL:', this.webhookUrl);
      console.log('   Method: POST');
      console.log('   Headers:', JSON.stringify(headers, null, 2));
      console.log('   Payload:', JSON.stringify(payload, null, 2));

      const response = await axios.post(this.webhookUrl, payload, {
        headers,
        timeout: 30000
      });

      console.log('✅ n8n Response - sendTelegramMessage:', response.status, response.data);
      return response.data;
    } catch (error) {
      console.error('❌ Error sending Telegram message with n8n:', error.message);
      if (error.response) {
        console.error('   Response status:', error.response.status);
        console.error('   Response data:', error.response.data);
      }
      return null;
    }
  }
}

module.exports = new N8nService();
