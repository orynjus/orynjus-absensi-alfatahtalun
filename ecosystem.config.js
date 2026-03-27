module.exports = {
  apps: [
    {
      name: 'absensi-app',
      script: 'dist/index.cjs',
      instances: 'max',
      exec_mode: 'cluster',
      env: {
        NODE_ENV: 'production',
        PORT: 3000
      },
      env_staging: {
        NODE_ENV: 'staging',
        PORT: 3001
      },
      error_file: './logs/err.log',
      out_file: './logs/out.log',
      log_file: './logs/combined.log',
      time: true,
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      node_args: '--max-old-space-size=1024'
    }
  ],

  deploy: {
    production: {
      user: 'deploy',
      host: ['your-server-ip'],
      ref: 'origin/main',
      repo: 'https://github.com/username/absensi-alfatahtalun.git',
      path: '/var/www/absensi',
      'pre-deploy-local': '',
      'post-deploy': 'npm install && npm run build && npx drizzle-kit push && pm2 reload ecosystem.config.js --env production',
      'pre-setup': ''
    },
    staging: {
      user: 'deploy',
      host: ['your-staging-server-ip'],
      ref: 'origin/develop',
      repo: 'https://github.com/username/absensi-alfatahtalun.git',
      path: '/var/www/absensi-staging',
      'post-deploy': 'npm install && npm run build && npx drizzle-kit push && pm2 reload ecosystem.config.js --env staging'
    }
  }
};
