const {
  AUTO_APPROVE_DAYS_THRESHOLD,
  LEAVE_REQUEST_STATUS,
  QUEUE_EVENTS
} = require('../utils/constants');
const LeaveRequestRepository = require('../repositories/LeaveRequestRepository');
const { consumeMessages, publishMessage } = require('../config/rabbitmq');
const logger = require('../utils/logger');

const MILLISECONDS_IN_DAY = 1000 * 60 * 60 * 24;

const areRabbitCredentialsPresent = () => (
  process.env.RABBITMQ_URL &&
  process.env.RABBITMQ_EXCHANGE_NAME &&
  process.env.RABBITMQ_QUEUE_NAME
);

const calculateLeaveDuration = (startDate, endDate) => {
  const start = new Date(startDate);
  const end = new Date(endDate);

  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
    return null;
  }

  return Math.max(1, Math.ceil((end - start) / MILLISECONDS_IN_DAY) + 1);
};

const autoProcessLeaveRequest = async (leaveRequest) => {
  if (!leaveRequest || leaveRequest.status !== LEAVE_REQUEST_STATUS.PENDING) {
    return;
  }

  const duration = calculateLeaveDuration(leaveRequest.startDate, leaveRequest.endDate);

  if (!duration) {
    logger.warn('Unable to determine leave duration', { leaveRequestId: leaveRequest.id });
    return;
  }

  let nextStatus = LEAVE_REQUEST_STATUS.PENDING_APPROVAL;

  if (duration <= AUTO_APPROVE_DAYS_THRESHOLD) {
    nextStatus = LEAVE_REQUEST_STATUS.APPROVED;
  }

  if (nextStatus === leaveRequest.status) {
    return;
  }

  await LeaveRequestRepository.updateStatus(leaveRequest.id, nextStatus);
  logger.info('Leave request auto-processed', {
    leaveRequestId: leaveRequest.id,
    nextStatus,
    duration
  });

  if (nextStatus === LEAVE_REQUEST_STATUS.APPROVED) {
    try {
      await publishMessage(QUEUE_EVENTS.LEAVE_APPROVED, {
        id: leaveRequest.id,
        employeeId: leaveRequest.employeeId,
        startDate: leaveRequest.startDate,
        endDate: leaveRequest.endDate,
        processedAt: new Date().toISOString()
      });
    } catch (error) {
      logger.error('Failed to publish auto-approval event', error);
    }
  }
};

const handleQueueMessage = async (payload, rawMessage) => {
  const routingKey = rawMessage?.fields?.routingKey;

  if (routingKey !== QUEUE_EVENTS.LEAVE_REQUESTED) {
    logger.debug('Ignoring unsupported routing key', { routingKey });
    return;
  }

  const leaveRequestId = payload?.id;

  if (!leaveRequestId) {
    logger.warn('Received leave request message without ID');
    return;
  }

  const leaveRequest = await LeaveRequestRepository.findById(leaveRequestId);

  if (!leaveRequest) {
    logger.warn('Leave request not found for auto-processing', { leaveRequestId });
    return;
  }

  await autoProcessLeaveRequest(leaveRequest);
};

const startLeaveRequestConsumer = async () => {
  if (!areRabbitCredentialsPresent()) {
    logger.warn('RabbitMQ environment variables missing, skipping consumer startup');
    return;
  }

  await consumeMessages(handleQueueMessage);
  logger.info('Leave request consumer started');
};

module.exports = {
  startLeaveRequestConsumer
};
