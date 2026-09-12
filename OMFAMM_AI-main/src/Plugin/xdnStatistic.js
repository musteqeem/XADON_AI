const xdnStatistic = (app, io) => {
    // Init stats object if missing - prevents "reading 'startTime'" error
    if (!global.xdnStats) {
        global.xdnStats = {
            messages: 0,
            uptime: 0,
            startTime: Date.now()
        };
    }

    app.get('/api/stats', (req, res) => {
        res.json(global.xdnStats || {});
    });

    app.get('/api/commands', (req, res) => {
        const { getByCategory } = require('./xdnCmd');
        res.json(getByCategory());
    });

    setInterval(() => {
        if (global.xdnStats?.startTime) {
            global.xdnStats.uptime = Math.floor((Date.now() - global.xdnStats.startTime) / 1000);
            io.emit('stats-update', global.xdnStats);
        }
    }, 5000);
};

module.exports = { xdnStatistic };