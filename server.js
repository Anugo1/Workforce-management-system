/**
 * Server entry point
 * Initializes database and starts the application
 */

require('dotenv').config();
const { sequelize, testConnection, syncDatabase } = require('./src/config/db');
const logger = require('./src/utils/logger');

// Import models to ensure they're registered
require('./src/models');

/**
 * Initialize and start server
 */
const startServer = async () => {
  try {
    // Test database connection
    logger.info('Testing database connection...');
    await testConnection();
    
    // Sync database (create tables if they don't exist)
    logger.info('Synchronizing database...');
    await syncDatabase({ alter: true }); // Use { force: true } to drop and recreate tables
    
    logger.info('Database is ready!');
    logger.info('Server initialization complete');
    
    // TODO: Start Express server here when ready
    // const app = require('./src/app');
    // const PORT = process.env.PORT || 3000;
    // app.listen(PORT, () => {
    //   logger.info(`Server running on port ${PORT}`);
    // });
    
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
};

// Handle graceful shutdown
process.on('SIGINT', async () => {
  logger.info('Shutting down gracefully...');
  await sequelize.close();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  logger.info('Shutting down gracefully...');
  await sequelize.close();
  process.exit(0);
});

// Start the server
startServer();
