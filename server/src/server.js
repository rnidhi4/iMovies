const app = require('./app');
const { port, nodeEnv, mongoUri } = require('./config/env');
const { connectDB, disconnectDB } = require('./config/db');
require('./models'); // registers all models so every index is built
const { startHoldSweeper } = require('./services/holdSweeper');

const start = async () => {
  await connectDB(mongoUri);

  let sweeper = null; // cleans up expired unpaid seat holds (see services/holdSweeper.js)

  const server = app.listen(port, () => {
    console.log(`IMovies API running on port ${port} (${nodeEnv})`);
    sweeper = startHoldSweeper();
  });

  const shutdown = (signal) => {
    console.log(`${signal} received, shutting down...`);
    const sweeperStopped = sweeper ? sweeper.stop() : Promise.resolve(); // no new sweeps; a running one may finish
    server.close(async () => {
      await sweeperStopped;
      await disconnectDB();
      process.exit(0);
    });
    setTimeout(() => process.exit(1), 10000).unref(); // force exit if connections hang
  };

  process.on('SIGINT', () => shutdown('SIGINT'));
  process.on('SIGTERM', () => shutdown('SIGTERM'));
};

process.on('unhandledRejection', (reason) => {
  console.error('Unhandled promise rejection:', reason);
});

start().catch((error) => {
  console.error('Failed to start server:', error.message);
  process.exit(1);
});
