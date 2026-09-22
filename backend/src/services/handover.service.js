const crypto = require('../utils/crypto');
const handoverModel = require('../models/handover.model');
const orderModel = require('../models/order.model');
const escrowService = require('./escrow.service');
const orderLogModel = require('../models/order-status-log.model');
const notificationService = require('./notification.service');
const { AppError } = require('../middleware/errorHandler');

/**
 * Secure Handover Service (AES-256-GCM Credential Management)
 */

/**
 * Seller submits confidential Konami account credentials
 * Credentials are encrypted before being persisted in the database
 * @param {object} param0
 */
const submitCredentials = async ({
  orderId,
  sellerId,
  konamiEmail,
  konamiPassword,
  notes = null,
  ipAddress = null,
  userAgent = null,
}) => {
  const order = await orderModel.findById(orderId);
  if (!order) {
    throw new AppError(`Order with ID ${orderId} not found`, 404, 'NOT_FOUND');
  }

  // Only the seller of this order can submit credentials
  if (order.seller_id !== sellerId) {
    throw new AppError('Only the seller of this order can submit account credentials', 403, 'FORBIDDEN');
  }

  // Order must be in PAYMENT_APPROVED or HANDOVER_OPEN
  const allowed = ['PAYMENT_APPROVED', 'HANDOVER_OPEN'];
  if (!allowed.includes(order.status)) {
    throw new AppError(
      `Cannot submit credentials: Order status is '${order.status}'. Handover must be active.`,
      422,
      'ORDER_WRONG_STATUS'
    );
  }

  const room = await handoverModel.getOrCreateRoom(orderId, order.handover_deadline);

  // Encrypt payload with AES-256-GCM
  const payload = {
    konami_email: konamiEmail,
    konami_password: konamiPassword,
    notes,
    submitted_at: new Date().toISOString(),
  };

  const { ciphertext, iv, authTag } = crypto.encrypt(payload);
  const storedContent = JSON.stringify({ ciphertext, authTag });

  // Store encrypted credentials in database
  await handoverModel.saveEncryptedMessage(room.id, 'SELLER', storedContent, iv);

  // Update room status to INFO_PROVIDED & set 48h auto-release deadline
  const autoReleaseDate = new Date(Date.now() + 48 * 3600 * 1000);
  await handoverModel.updateRoom(room.id, {
    status: 'INFO_PROVIDED',
    seller_submitted_at: new Date(),
    auto_release_at: autoReleaseDate,
  });

  // Update order status to HANDOVER_INFO_PROVIDED
  await orderModel.updateStatus({
    orderId,
    newStatus: 'HANDOVER_INFO_PROVIDED',
    changedBy: sellerId,
    note: 'Seller provided encrypted account credentials',
    extraFields: {
      auto_release_at: autoReleaseDate,
    },
  });

  // Log access event
  await handoverModel.logAccess({
    roomId: room.id,
    userId: sellerId,
    action: 'INFO_SUBMITTED',
    ipAddress,
    userAgent,
  });

  notificationService.notifyCredentialsSubmitted(order).catch(() => {});

  return {
    room_id: room.id,
    order_id: orderId,
    status: 'INFO_PROVIDED',
    auto_release_at: autoReleaseDate,
  };
};

/**
 * Buyer accesses and decrypts confidential account credentials
 * Records access log with IP and timestamp
 * @param {object} param0
 */
const getDecryptedCredentials = async ({
  orderId,
  buyerId,
  ipAddress = null,
  userAgent = null,
}) => {
  const order = await orderModel.findById(orderId);
  if (!order) {
    throw new AppError(`Order with ID ${orderId} not found`, 404, 'NOT_FOUND');
  }

  // Only the buyer of this order can view credentials
  if (order.buyer_id !== buyerId) {
    throw new AppError('Only the buyer of this order can view account credentials', 403, 'FORBIDDEN');
  }

  const room = await handoverModel.findByOrderId(orderId);
  if (!room) {
    throw new AppError('Handover room has not been initialized for this order', 404, 'NOT_FOUND');
  }

  const allowedStatuses = ['INFO_PROVIDED', 'BUYER_REVIEWING'];
  if (!allowedStatuses.includes(room.status)) {
    throw new AppError(
      `Credentials are not available in current room status '${room.status}'`,
      422,
      'CREDENTIALS_NOT_AVAILABLE'
    );
  }

  const message = await handoverModel.getMessageByRoomId(room.id);
  if (!message) {
    throw new AppError('Encrypted credentials not found in handover room', 404, 'NOT_FOUND');
  }

  // Decrypt credentials
  let credentials;
  try {
    const { ciphertext, authTag } = JSON.parse(message.content_encrypted);
    const decryptedRaw = crypto.decrypt(ciphertext, message.encryption_iv, authTag);
    credentials = JSON.parse(decryptedRaw);
  } catch (err) {
    throw new AppError(`Failed to decrypt credentials: ${err.message}`, 500, 'DECRYPTION_FAILED');
  }

  // Transition room & order status to BUYER_REVIEWING if first view
  if (room.status === 'INFO_PROVIDED') {
    await handoverModel.updateRoom(room.id, { status: 'BUYER_REVIEWING' });
    await orderModel.updateStatus({
      orderId,
      newStatus: 'BUYER_REVIEWING',
      changedBy: buyerId,
      note: 'Buyer accessed and decrypted account credentials',
    });
  }

  // Log access event
  await handoverModel.logAccess({
    roomId: room.id,
    userId: buyerId,
    action: 'INFO_VIEWED',
    ipAddress,
    userAgent,
  });

  return {
    credentials,
    auto_release_at: room.auto_release_at,
    room_status: 'BUYER_REVIEWING',
  };
};

/**
 * Buyer confirms successful receipt: releases escrow and hard-deletes credentials
 * @param {object} param0
 */
const confirmReceipt = async ({
  orderId,
  buyerId,
  ipAddress = null,
  userAgent = null,
}) => {
  const order = await orderModel.findById(orderId);
  if (!order) {
    throw new AppError(`Order with ID ${orderId} not found`, 404, 'NOT_FOUND');
  }

  if (order.buyer_id !== buyerId) {
    throw new AppError('Only the buyer of this order can confirm receipt', 403, 'FORBIDDEN');
  }

  const room = await handoverModel.findByOrderId(orderId);
  if (!room) {
    throw new AppError('Handover room not found', 404, 'NOT_FOUND');
  }

  const allowedStatuses = ['INFO_PROVIDED', 'BUYER_REVIEWING'];
  if (!allowedStatuses.includes(room.status)) {
    throw new AppError(
      `Cannot confirm receipt in current room status '${room.status}'`,
      422,
      'HANDOVER_WRONG_STATUS'
    );
  }

  // 1. Release escrow funds to seller & mark order as COMPLETED
  await escrowService.releaseEscrow({
    orderId,
    userId: buyerId,
    note: 'Buyer confirmed handover and accepted account credentials',
  });

  // 2. Hard delete confidential credentials from handover_messages
  const deletedCount = await handoverModel.hardDeleteMessages(room.id);

  // 3. Update room status to CONFIRMED
  await handoverModel.updateRoom(room.id, {
    status: 'CONFIRMED',
    buyer_confirmed_at: new Date(),
    data_deleted_at: new Date(),
  });

  // 4. Log access event
  await handoverModel.logAccess({
    roomId: room.id,
    userId: buyerId,
    action: 'CONFIRMED',
    ipAddress,
    userAgent,
  });

  return {
    order_id: orderId,
    status: 'COMPLETED',
    credentials_purged: deletedCount > 0,
    message: 'Handover confirmed. Escrow released to seller, and confidential credentials permanently purged.',
  };
};

module.exports = {
  submitCredentials,
  getDecryptedCredentials,
  confirmReceipt,
};
