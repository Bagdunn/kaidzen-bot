# 🚀 Деплой Kaizen Questions Bot на Linux

## 📋 Передумови

- Ubuntu/Debian Linux сервер
- SSH доступ до сервера
- Домен (опціонально, для HTTPS)

## 🔧 Швидкий деплой

### 1. Клонування репозиторію
```bash
git clone <your-repo-url>
cd KaiDzen
```

### 2. Запуск автоматичного деплою
```bash
chmod +x deploy.sh
./deploy.sh
```

### 3. Налаштування змінних середовища
```bash
nano .env
```

**Обов'язкові змінні:**
```env
# Telegram Bot
TELEGRAM_BOT_TOKEN=your_bot_token

# Database
DATABASE_URL=postgresql://kaizen_user:your_password@localhost:5432/kaizen_questions

# Server
PORT=3000
NODE_ENV=production

# n8n (якщо використовуєте)
N8N_WEBHOOK_URL=http://your-domain.com/webhook/kaizen-bot
N8N_API_KEY=your_n8n_api_key

# AI (якщо використовуєте)
OPENAI_API_KEY=your_openai_key
```

## 🛠️ Ручний деплой

### 1. Встановлення залежностей
```bash
# Node.js
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# PM2
sudo npm install -g pm2

# PostgreSQL
sudo apt install -y postgresql postgresql-contrib
sudo systemctl start postgresql
sudo systemctl enable postgresql
```

### 2. Налаштування бази даних
```bash
sudo -u postgres psql -c "CREATE DATABASE kaizen_questions;"
sudo -u postgres psql -c "CREATE USER kaizen_user WITH PASSWORD 'your_password';"
sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE kaizen_questions TO kaizen_user;"
```

### 3. Встановлення проекту
```bash
npm install
cp env.example .env
# Відредагувати .env файл
npm run migrate
```

### 4. Запуск з PM2
```bash
pm2 start ecosystem.config.js --env production
pm2 save
pm2 startup
```

## 📊 Управління PM2

### Основні команди:
```bash
# Статус додатків
pm2 status

# Логи
pm2 logs kaizen-bot
pm2 logs kaizen-bot --lines 100

# Перезапуск
pm2 restart kaizen-bot

# Зупинка
pm2 stop kaizen-bot

# Видалення
pm2 delete kaizen-bot

# Мониторинг
pm2 monit
```

### Автозапуск при перезавантаженні:
```bash
pm2 startup
pm2 save
```

## 🔒 Налаштування Nginx (опціонально)

### 1. Встановлення Nginx
```bash
sudo apt install nginx
```

### 2. Конфігурація
```bash
sudo nano /etc/nginx/sites-available/kaizen-bot
```

```nginx
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

### 3. Активація
```bash
sudo ln -s /etc/nginx/sites-available/kaizen-bot /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

## 🔐 SSL/HTTPS з Let's Encrypt

```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d your-domain.com
```

## 📈 Моніторинг

### Перевірка стану:
```bash
# Статус PM2
pm2 status

# Логи додатку
pm2 logs kaizen-bot

# Використання ресурсів
pm2 monit

# Статус бази даних
sudo systemctl status postgresql
```

### Автоматичне очищення логів:
```bash
# Додати в crontab
0 0 * * * pm2 flush
```

## 🚨 Troubleshooting

### Проблеми з портом:
```bash
# Перевірити що використовує порт 3000
sudo netstat -tulpn | grep :3000

# Зупинити процес
sudo kill -9 <PID>
```

### Проблеми з базою даних:
```bash
# Перевірити статус PostgreSQL
sudo systemctl status postgresql

# Перевірити підключення
psql -h localhost -U kaizen_user -d kaizen_questions
```

### Проблеми з логами:
```bash
# Очистити логи
pm2 flush

# Перезапустити з новими логами
pm2 restart kaizen-bot
```

## 📝 Корисні команди

```bash
# Перезапуск всього стеку
pm2 restart all
sudo systemctl restart postgresql
sudo systemctl restart nginx

# Перевірка версій
node --version
npm --version
pm2 --version
psql --version

# Очищення npm кешу
npm cache clean --force

# Оновлення PM2
npm install -g pm2@latest
pm2 update
```
