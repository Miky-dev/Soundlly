module.exports = {
    apps: [{
        name: "soundlly",
        script: "./server.js",
        watch: false,
        env: {
            NODE_ENV: "production",
            PORT: 3003
        },
        // Wait 3s before restart if crash to avoid loop
        min_uptime: "3s",
        max_restarts: 10
    }]
};
