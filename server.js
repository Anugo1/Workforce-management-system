/**
 * Server entry point
 * Initializes database and starts the application
 */

require('dotenv').config();
const { sequelize, testConnection, syncDatabase } = require('./src/config/db');
const { closeConnection: closeRabbitConnection } = require('./src/config/rabbitmq');
const { startLeaveRequestConsumer } = require('./src/queues/leaveRequestProcessor');
const logger = require('./src/utils/logger');

// Import models to ensure they're registered
require('./src/models');

let server;

/**
 * Initialize and start server
 */
const startServer = async () => {
  try {
    logger.info('Testing database connection...');
    await testConnection();

    logger.info('Synchronizing database...');
    await syncDatabase({ alter: true });

    logger.info('Database is ready!');

    const app = require('./src/app');
    const PORT = parseInt(process.env.PORT, 10) || 3000;

    server = app.listen(PORT, () => {
      logger.info(`Server running on port ${PORT}`);
    });

    try {
      await startLeaveRequestConsumer();
    } catch (consumerError) {
      logger.error('Failed to start leave request consumer', consumerError);
    }
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
};

const shutdown = async (signal) => {
  try {
    logger.info(`${signal} received, shutting down gracefully...`);

    if (server) {
      await new Promise((resolve, reject) => {
        server.close((err) => (err ? reject(err) : resolve()));
      });
    }

    await Promise.allSettled([
      sequelize.close(),
      closeRabbitConnection?.()
    ]);

    process.exit(0);
  } catch (error) {
    logger.error('Error during shutdown', error);
    process.exit(1);
  }
};

process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));

startServer();
