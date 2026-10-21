const path = require('path');

module.exports = {
  apps: [
    {
      name: 'kensai-bot',
      script: './index.js',
      cwd: __dirname,
      watch: false,
      autorestart: true,
      max_memory_restart: '400M',
      env: {
        NODE_ENV: 'production'
      }
    }
  ]
};
