const express = require('express');
const User = require('../models/User');
const Context = require('../models/Context');
const Question = require('../models/Question');
const Answer = require('../models/Answer');
const ReminderTime = require('../models/ReminderTime');
const aiService = require('../services/aiService');

const router = express.Router();

// Middleware to validate API key
const validateApiKey = (req, res, next) => {
  const authHeader = req.headers.authorization;
  const apiKey = process.env.N8N_API_KEY;
  
  console.log('🔑 validateApiKey:', { 
    hasApiKey: !!apiKey, 
    apiKeyValue: apiKey === 'your_n8n_api_key_here' ? 'default' : 'set',
    authHeader: authHeader ? 'present' : 'missing',
    method: req.method,
    path: req.path
  });
  
  if (!apiKey || apiKey === 'your_n8n_api_key_here' || apiKey.trim() === '') {
    // Skip API key validation if not configured
    console.log('⏭️ Skipping API key validation');
    return next();
  }
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    console.log('❌ Missing or invalid Authorization header');
    return res.status(401).json({ error: 'Authorization header with Bearer token required' });
  }
  
  const token = authHeader.substring(7); // Remove 'Bearer ' prefix
  
  if (token !== apiKey) {
    console.log('❌ Invalid API key');
    return res.status(401).json({ error: 'Invalid API key' });
  }
  
  console.log('✅ API key validation passed');
  next();
};

// Middleware to validate user identification
const validateUser = (req, res, next) => {
  const telegramId = req.headers['x-telegram-id'] || req.body.telegram_id || req.query.telegram_id;
  const userId = req.body.user_id || req.query.user_id;
  
  console.log('🔍 validateUser middleware:', { 
    telegramId, 
    userId, 
    headers: req.headers['x-telegram-id'],
    bodyTelegramId: req.body.telegram_id,
    bodyUserId: req.body.user_id,
    queryTelegramId: req.query.telegram_id,
    queryUserId: req.query.user_id
  });
  
  if (!telegramId && !userId) {
    console.log('❌ validateUser: No user identification provided');
    return res.status(401).json({ error: 'Either telegram_id or user_id is required' });
  }
  
  req.telegramId = telegramId;
  req.userId = parseInt(userId); // Convert to number if it's a string from query params
  console.log('✅ validateUser: User identification set:', { telegramId, userId: req.userId });
  next();
};

// POST /context/merge - Merge and update context with AI
router.post('/context/merge', validateApiKey, async (req, res) => {
  try {
    const { userId, newContextData } = req.body;
    
    if (!userId) {
      return res.status(400).json({ error: 'userId is required' });
    }
    
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    // Get existing context
    const existingContext = await Context.findByUserId(user.id);
    
    // Prepare old context data as text
    let oldContextText = '';
    if (existingContext) {
      oldContextText = `Про себе: ${existingContext.about_me || ''}\nЦілі: ${existingContext.goals || ''}\nСфери життя: ${existingContext.areas || ''}`;
    }
    
    // Merge with AI
    const mergedContext = await aiService.mergeContext(oldContextText, newContextData);
    
    // Save merged context
    const context = await Context.createOrUpdate(
      user.id, 
      mergedContext.about_me, 
      mergedContext.goals, 
      mergedContext.areas
    );
    
    res.json({ 
      success: true,
      message: 'Context updated successfully',
      mergedContext: mergedContext
    });
  } catch (error) {
    console.error('Error merging context:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /context - Update context (legacy, direct update)
router.post('/context', validateApiKey, validateUser, async (req, res) => {
  try {
    const { context_data } = req.body;
    let user;
    
    if (req.userId) {
      user = await User.findById(req.userId);
    } else {
      user = await User.findByTelegramId(req.telegramId);
    }
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    const context = await Context.createOrUpdate(user.id, context_data);
    res.json({ 
      context,
      user: { id: user.id, telegram_id: user.telegram_id, username: user.username }
    });
  } catch (error) {
    console.error('Error updating context:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /context - Get context
router.get('/context', validateApiKey, validateUser, async (req, res) => {
  try {
    let user;
    
    if (req.userId) {
      user = await User.findById(req.userId);
    } else {
      user = await User.findByTelegramId(req.telegramId);
    }
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    const context = await Context.findByUserId(user.id);
    res.json({ 
      context,
      user: { id: user.id, telegram_id: user.telegram_id, username: user.username }
    });
  } catch (error) {
    console.error('Error getting context:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /context/:userId - Get context by user ID
router.get('/context/:userId', validateApiKey, async (req, res) => {
  try {
    const userId = req.params.userId;
    const user = await User.findById(userId);
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    const context = await Context.findByUserId(user.id);
    res.json({ 
      id: context ? context.id : null,
      user_id: user.id,
      about_me: context ? context.about_me : null,
      goals: context ? context.goals : null,
      areas: context ? context.areas : null
    });
  } catch (error) {
    console.error('Error getting context by userId:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /questions/generate - Generate AI questions
router.post('/questions/generate', validateUser, async (req, res) => {
  try {
    let user;
    
    if (req.userId) {
      user = await User.findById(req.userId);
    } else {
      user = await User.findByTelegramId(req.telegramId);
    }
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    const context = await Context.findByUserId(user.id);
    if (!context) {
      return res.status(400).json({ error: 'User context not found. Please set context first.' });
    }
    
    // Get recent answers for context
    const recentAnswers = await Answer.findByUserId(user.id, 5);
    
    const questions = await aiService.generateQuestions(context, recentAnswers);
    
    // Save generated questions
    const savedQuestions = [];
    for (const questionText of questions) {
      const question = await Question.create(user.id, questionText, 'agent');
      savedQuestions.push(question);
    }
    
    res.json({ 
      questions: savedQuestions,
      generated_count: questions.length,
      user: { id: user.id, telegram_id: user.telegram_id, username: user.username }
    });
  } catch (error) {
    console.error('Error generating questions:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /questions - Create question
router.post('/questions', validateUser, async (req, res) => {
  try {
    console.log('📝 POST /questions - Full request body:', req.body);
    const { text, source = 'user' } = req.body;
    console.log('📝 Creating question with:', { text, source, userId: req.userId, telegramId: req.telegramId });
    
    let user;
    
    if (req.userId) {
      user = await User.findById(req.userId);
    } else {
      user = await User.findByTelegramId(req.telegramId);
    }
    
    if (!user) {
      console.log('❌ User not found');
      return res.status(404).json({ error: 'User not found' });
    }
    
    console.log('✅ User found:', { id: user.id, telegram_id: user.telegram_id });
    
    // Clean and validate source value
    const cleanSource = source === 'agent' || source === '"agent"' ? 'agent' : 'user';
    console.log('🔧 Cleaned source:', { original: source, cleaned: cleanSource });
    
    if (cleanSource === 'user') {
      const questionCount = await Question.getActiveQuestionsCount(user.id);
      console.log('📊 Active questions count:', questionCount);
      if (questionCount >= 3) {
        console.log('❌ Maximum user questions reached');
        return res.status(400).json({ error: 'Maximum 3 user questions allowed' });
      }
    }
    
    const question = await Question.create(user.id, text, cleanSource);
    console.log('✅ Question created successfully:', { id: question.id, text: question.text });
    
    res.status(201).json({ 
      question,
      user: { id: user.id, telegram_id: user.telegram_id, username: user.username }
    });
  } catch (error) {
    console.error('❌ Error creating question:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /questions - Get questions
router.get('/questions', validateUser, async (req, res) => {
  try {
    const { active_only = 'true' } = req.query;
    let user;
    
    if (req.userId) {
      user = await User.findById(req.userId);
    } else {
      user = await User.findByTelegramId(req.telegramId);
    }
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    const questions = await Question.findByUserId(user.id, active_only === 'true');
    res.json({ 
      questions,
      user: { id: user.id, telegram_id: user.telegram_id, username: user.username }
    });
  } catch (error) {
    console.error('Error getting questions:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /answers - Create answer
router.post('/answers', validateUser, async (req, res) => {
  try {
    const { question_id, text } = req.body;
    let user;
    
    if (req.userId) {
      user = await User.findById(req.userId);
    } else {
      user = await User.findByTelegramId(req.telegramId);
    }
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    const answer = await Answer.create(user.id, question_id, text);
    res.status(201).json({ 
      answer,
      user: { id: user.id, telegram_id: user.telegram_id, username: user.username }
    });
  } catch (error) {
    console.error('Error creating answer:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /answers/analyze - Analyze answer with AI
router.post('/answers/analyze', validateUser, async (req, res) => {
  try {
    const { answer_id, question_text, answer_text } = req.body;
    let user;
    
    if (req.userId) {
      user = await User.findById(req.userId);
    } else {
      user = await User.findByTelegramId(req.telegramId);
    }
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    const context = await Context.findByUserId(user.id);
    
    const analysis = await aiService.analyzeAnswer(answer_text, question_text, context || {});
    
    res.json({ 
      analysis,
      answer_id,
      question_text,
      answer_text,
      user: { id: user.id, telegram_id: user.telegram_id, username: user.username }
    });
  } catch (error) {
    console.error('Error analyzing answer:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /answers - Get answers
router.get('/answers', validateUser, async (req, res) => {
  try {
    const { limit = 50, question_id, date } = req.query;
    let user;
    
    if (req.userId) {
      user = await User.findById(req.userId);
    } else {
      user = await User.findByTelegramId(req.telegramId);
    }
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    let answers;
    if (question_id) {
      answers = await Answer.getAnswersForQuestion(user.id, question_id);
    } else if (date) {
      answers = await Answer.getAnswersForDate(user.id, date);
    } else {
      answers = await Answer.findByUserId(user.id, parseInt(limit));
    }
    
    res.json({ 
      answers,
      user: { id: user.id, telegram_id: user.telegram_id, username: user.username }
    });
  } catch (error) {
    console.error('Error getting answers:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});



// GET /users - Get user by telegram_id or user_id
router.get('/users', validateUser, async (req, res) => {
  try {
    let user;
    
    if (req.userId) {
      user = await User.findById(req.userId);
    } else {
      user = await User.findByTelegramId(req.telegramId);
    }
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    res.json({ 
      user: { 
        id: user.id, 
        telegram_id: user.telegram_id, 
        username: user.username,
        created_at: user.created_at
      }
    });
  } catch (error) {
    console.error('Error getting user:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /reminders - Get user's reminder times
router.get('/reminders', validateApiKey, validateUser, async (req, res) => {
  try {
    let user;
    
    if (req.userId) {
      user = await User.findById(req.userId);
    } else {
      user = await User.findByTelegramId(req.telegramId);
    }
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    const reminders = await ReminderTime.findByUserId(user.id);
    res.json({ 
      reminders,
      user: { id: user.id, telegram_id: user.telegram_id, username: user.username }
    });
  } catch (error) {
    console.error('Error getting reminders:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /reminders - Create reminder time
router.post('/reminders', validateApiKey, validateUser, async (req, res) => {
  try {
    const { time } = req.body;
    let user;
    
    if (req.userId) {
      user = await User.findById(req.userId);
    } else {
      user = await User.findByTelegramId(req.telegramId);
    }
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    if (!time) {
      return res.status(400).json({ error: 'time is required' });
    }
    
    // Validate time format
    const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
    if (!timeRegex.test(time)) {
      return res.status(400).json({ error: 'Invalid time format. Use HH:MM format' });
    }
    
    // Check if user already has 3 active reminders
    const activeCount = await ReminderTime.getActiveCount(user.id);
    if (activeCount >= 3) {
      return res.status(400).json({ error: 'Maximum 3 active reminders allowed' });
    }
    
    const reminder = await ReminderTime.create(user.id, time);
    res.status(201).json({ 
      reminder,
      user: { id: user.id, telegram_id: user.telegram_id, username: user.username }
    });
  } catch (error) {
    console.error('Error creating reminder:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PUT /reminders - Update reminder time
router.put('/reminders', validateApiKey, async (req, res) => {
  try {
    const { id, time, active } = req.body;
    
    if (!id) {
      return res.status(400).json({ error: 'id is required' });
    }
    
    const reminder = await ReminderTime.update(id, { time, active });
    if (!reminder) {
      return res.status(404).json({ error: 'Reminder not found' });
    }
    
    res.json({ reminder });
  } catch (error) {
    console.error('Error updating reminder:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// DELETE /reminders - Delete reminder time
router.delete('/reminders', validateApiKey, async (req, res) => {
  try {
    const { id } = req.body;
    
    if (!id) {
      return res.status(400).json({ error: 'id is required' });
    }
    
    const reminder = await ReminderTime.delete(id);
    if (!reminder) {
      return res.status(404).json({ error: 'Reminder not found' });
    }
    
    res.json({ message: 'Reminder deleted successfully', reminder });
  } catch (error) {
    console.error('Error deleting reminder:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /health - Health check
router.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

module.exports = router;
