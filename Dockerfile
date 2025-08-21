# Використовуємо офіційний Node.js образ
FROM node:18-alpine

# Встановлюємо робочу директорію
WORKDIR /app

# Копіюємо package.json та package-lock.json
COPY package*.json ./

# Встановлюємо залежності
RUN npm ci --only=production

# Копіюємо код додатку
COPY . .

# Створюємо користувача для безпеки
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nodejs -u 1001

# Змінюємо власника файлів
RUN chown -R nodejs:nodejs /app
USER nodejs

# Відкриваємо порт
EXPOSE 3000

# Команда для запуску
CMD ["npm", "start"]
