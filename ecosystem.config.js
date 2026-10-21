module.exports = {
  apps: [
    {
      name: 'kensai-bot',
      script: './index.js',
      watch: false,
      autorestart: true,
      max_memory_restart: '400M',
      env: {
        NODE_ENV: 'production'
      }
    }
  ]
};
