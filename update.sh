#!/bin/bash

echo "🔄 Updating Kaizen Questions Bot..."

# 1. Pull latest changes
echo "📥 Pulling latest changes..."
git pull origin main

# 2. Install dependencies
echo "📦 Installing dependencies..."
npm install

# 3. Run migrations
echo "🗄️ Running migrations..."
npm run migrate

# 4. Restart PM2
echo "🔄 Restarting application..."
pm2 restart kaizen-bot

# 5. Check status
echo "📊 Checking status..."
pm2 status

echo "✅ Update completed!"
