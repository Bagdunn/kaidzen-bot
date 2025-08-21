module.exports = {
  apps: [{
    name: 'kaizen-bot',
    script: 'src/index.js',
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
    env: {
      NODE_ENV: 'development',
      PORT: 3000
    },
    env_production: {
      NODE_ENV: 'production',
      PORT: 3000
    },
    error_file: './logs/err.log',
    out_file: './logs/out.log',
    log_file: './logs/combined.log',
    time: true,
    // Log rotation
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    // Restart on file changes (development only)
    watch: process.env.NODE_ENV === 'development' ? ['src'] : false,
    ignore_watch: ['node_modules', 'logs', '.git'],
    // Health check
    health_check_grace_period: 3000,
    // Memory and CPU limits
    max_memory_restart: '1G',
    node_args: '--max-old-space-size=1024'
  }]
};
