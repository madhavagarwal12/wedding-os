module.exports = {
  apps: [
    {
      name: "wedding-os",
      cwd: __dirname,
      script: "node_modules/next/dist/bin/next",
      args: "start --port 3000",
      exec_mode: "fork",
      instances: 1,
      autorestart: true,
      max_restarts: 10,
      min_uptime: "30s",
      max_memory_restart: "1G",
      env: {
        NODE_ENV: "production",
        PORT: 3000,
      },
      error_file: "./logs/pm2-error.log",
      out_file: "./logs/pm2-out.log",
      time: true,
    },
  ],
};
