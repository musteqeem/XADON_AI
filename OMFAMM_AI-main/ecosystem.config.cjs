module.exports = {
  apps: [{
    name: 'XADON_AI',
    script: './index.js',
    cwd: __dirname,
    interpreter: process.execPath,
    instances: 1,
    exec_mode: 'fork',
    autorestart: true,
    max_restarts: 20,
    restart_delay: 5000,
    min_uptime: '10s',
    kill_timeout: 10000,
    time: true,
    env: {
      NODE_ENV: 'production',
      PORT: process.env.PORT || 3000
    }
  }]
};
