module.exports = {
  apps: [
    {
      name: "tipper-server",
      script: "./server.js", // Or your actual entry point
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: "1500M",
    },
  ],
};
