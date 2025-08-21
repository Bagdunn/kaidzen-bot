#!/bin/bash

# Kaizen Questions Bot - Deploy Script
echo "🚀 Deploying Kaizen Questions Bot..."

# 1. Update system packages
echo "📦 Updating system packages..."
sudo apt update && sudo apt upgrade -y

# 2. Install Node.js and npm (if not installed)
if ! command -v node &> /dev/null; then
    echo "📥 Installing Node.js..."
    curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
    sudo apt-get install -y nodejs
fi

# 3. Install PM2 globally
echo "📥 Installing PM2..."
sudo npm install -g pm2

# 4. Install PostgreSQL (if not installed)
if ! command -v psql &> /dev/null; then
    echo "📥 Installing PostgreSQL..."
    sudo apt install -y postgresql postgresql-contrib
    sudo systemctl start postgresql
    sudo systemctl enable postgresql
fi

# 5. Create database and user
echo "🗄️ Setting up database..."
sudo -u postgres psql -c "CREATE DATABASE kaizen_questions;"
sudo -u postgres psql -c "CREATE USER kaizen_user WITH PASSWORD 'your_password_here';"
sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE kaizen_questions TO kaizen_user;"

# 6. Install project dependencies
echo "📦 Installing project dependencies..."
npm install

# 7. Set up environment variables
echo "🔧 Setting up environment variables..."
if [ ! -f .env ]; then
    cp env.example .env
    echo "⚠️ Please edit .env file with your configuration!"
fi

# 8. Run database migrations
echo "🗄️ Running database migrations..."
npm run migrate

# 9. Create PM2 ecosystem file
echo "⚙️ Creating PM2 ecosystem file..."
cat > ecosystem.config.js << 'EOF'
module.exports = {
  apps: [{
    name: 'kaizen-bot',
    script: 'src/index.js',
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
    env: {
      NODE_ENV: 'production',
      PORT: 3000
    },
    env_production: {
      NODE_ENV: 'production',
      PORT: 3000
    },
    error_file: './logs/err.log',
    out_file: './logs/out.log',
    log_file: './logs/combined.log',
    time: true
  }]
};
EOF

# 10. Create logs directory
mkdir -p logs

# 11. Start with PM2
echo "🚀 Starting application with PM2..."
pm2 start ecosystem.config.js --env production

# 12. Save PM2 configuration
pm2 save

# 13. Setup PM2 startup script
pm2 startup

echo "✅ Deployment completed!"
echo "📊 Check status: pm2 status"
echo "📋 View logs: pm2 logs kaizen-bot"
echo "🔄 Restart: pm2 restart kaizen-bot"
echo "⏹️ Stop: pm2 stop kaizen-bot"
