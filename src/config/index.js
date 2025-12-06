/**
 * Central configuration export
 */

require('dotenv').config();

const database = require('./db');
const rabbitmq = require('./rabbitmq');

module.exports = {
  database,
  rabbitmq,
  env: {
    nodeEnv: process.env.NODE_ENV || 'development',
    port: parseInt(process.env.PORT) || 3000,
    defaultPageSize: parseInt(process.env.DEFAULT_PAGE_SIZE) || 10,
    maxPageSize: parseInt(process.env.MAX_PAGE_SIZE) || 100
  }
};
