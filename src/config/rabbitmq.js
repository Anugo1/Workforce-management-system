/**
 * RabbitMQ configuration and connection management
 * Implements connection pooling and retry logic
 */

const amqp = require('amqplib');
const logger = require('../utils/logger');

let connection = null;
let channel = null;

/**
 * Connect to RabbitMQ
 */
const connect = async () => {
  try {
    if (connection) {
      return connection;
    }

    connection = await amqp.connect(process.env.RABBITMQ_URL);
    
    connection.on('error', (err) => {
      logger.error('RabbitMQ connection error', err);
      
      connection = null;
    });

    connection.on('close', () => {
      logger.warn('RabbitMQ connection closed');
      connection = null;
      // Attempt to reconnect after 5 seconds
      setTimeout(connect, 5000);
    });

    logger.info('RabbitMQ connection established');
    return connection;
  } catch (error) {
    logger.error('Failed to connect to RabbitMQ', error);
    throw error;
  }
};

/**
 * Create a channel
 */
const createChannel = async () => {
  try {
    if (channel) {
      return channel;
    }

    const conn = await connect();
    channel = await conn.createChannel();
    
    // Setup exchange
    await channel.assertExchange(
      process.env.RABBITMQ_EXCHANGE_NAME,
      'topic',
      { durable: true }
    );

    // Setup queue
    await channel.assertQueue(
      process.env.RABBITMQ_QUEUE_NAME,
      { durable: true }
    );

    // Bind queue to exchange
    await channel.bindQueue(
      process.env.RABBITMQ_QUEUE_NAME,
      process.env.RABBITMQ_EXCHANGE_NAME,
      'leave.*'
    );

    // Set prefetch to 1 for fair dispatch
    await channel.prefetch(1);

    logger.info('RabbitMQ channel created successfully');
    return channel;
  } catch (error) {
    logger.error('Failed to create RabbitMQ channel', error);
    throw error;
  }
};

/**
 * Publish message to queue
 * @param {string} routingKey - Routing key for the message
 * @param {Object} message - Message payload
 */
const publishMessage = async (routingKey, message) => {
  try {
    const ch = await createChannel();
    const messageBuffer = Buffer.from(JSON.stringify(message));
    
    const published = ch.publish(
      process.env.RABBITMQ_EXCHANGE_NAME,
      routingKey,
      messageBuffer,
      {
        persistent: true,
        contentType: 'application/json',
        timestamp: Date.now()
      }
    );

    if (published) {
      logger.info('Message published to queue', { routingKey, messageId: message.id });
      return true;
    }
    
    return false;
  } catch (error) {
    logger.error('Failed to publish message', error);
    throw error;
  }
};

/**
 * Consume messages from queue
 * @param {Function} callback - Message handler function
 */
const consumeMessages = async (callback) => {
  try {
    const ch = await createChannel();
    
    await ch.consume(
      process.env.RABBITMQ_QUEUE_NAME,
      async (msg) => {
        if (msg) {
          try {
            const content = JSON.parse(msg.content.toString());
            await callback(content, msg);
            ch.ack(msg);
          } catch (error) {
            logger.error('Error processing message', error);
            // Reject and requeue if not already retried max times
            const retryCount = (msg.properties.headers?.['x-retry-count'] || 0);
            const maxRetries = parseInt(process.env.RABBITMQ_MAX_RETRIES) || 3;
            
            if (retryCount < maxRetries) {
              // Requeue with incremented retry count
              ch.nack(msg, false, false);
              
              // Publish to retry queue with delay
              setTimeout(() => {
                ch.publish(
                  process.env.RABBITMQ_EXCHANGE_NAME,
                  msg.fields.routingKey,
                  msg.content,
                  {
                    persistent: true,
                    headers: {
                      'x-retry-count': retryCount + 1
                    }
                  }
                );
              }, parseInt(process.env.RABBITMQ_RETRY_DELAY) || 5000);
            } else {
              // Max retries reached, send to dead letter queue
              logger.error('Max retries reached for message', { content: msg.content.toString() });
              ch.nack(msg, false, false);
            }
          }
        }
      },
      { noAck: false }
    );

    logger.info('Started consuming messages from queue');
  } catch (error) {
    logger.error('Failed to consume messages', error);
    throw error;
  }
};

/**
 * Close RabbitMQ connection
 */
const closeConnection = async () => {
  try {
    if (channel) {
      await channel.close();
      channel = null;
    }
    if (connection) {
      await connection.close();
      connection = null;
    }
    logger.info('RabbitMQ connection closed');
  } catch (error) {
    logger.error('Error closing RabbitMQ connection', error);
    throw error;
  }
};

module.exports = {
  connect,
  createChannel,
  publishMessage,
  consumeMessages,
  closeConnection
};
