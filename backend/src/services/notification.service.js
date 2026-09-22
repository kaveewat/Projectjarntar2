const notificationModel = require('../models/notification.model');
const logger = require('../utils/logger');
const db = require('../config/db');

/**
 * Notification Service
 * Manages dispatching notifications to users for marketplace lifecycle events
 */

/**
 * Safely create notification without throwing exceptions that could break caller transactions
 * @param {object} param0
 */
const notify = async ({
  userId,
  type,
  title,
  message,
  referenceType = null,
  referenceId = null,
}) => {
  try {
    if (!userId) return null;
    const notificationId = await notificationModel.create({
      userId,
      type,
      title,
      message,
      referenceType,
      referenceId,
    });
    return notificationId;
  } catch (err) {
    logger.warn(`Failed to send notification to user ${userId} [${type}]: ${err.message}`);
    return null;
  }
};

/**
 * Helper to notify all active staff (Admins and Moderators)
 * @param {object} param0
 */
const notifyStaff = async ({ type, title, message, referenceType, referenceId }) => {
  try {
    const [staffUsers] = await db.query(
      `SELECT id FROM users WHERE role IN ('ADMIN', 'MODERATOR') AND is_suspended = 0 AND is_banned = 0`
    );
    const promises = staffUsers.map((staff) =>
      notify({
        userId: staff.id,
        type,
        title,
        message,
        referenceType,
        referenceId,
      })
    );
    await Promise.allSettled(promises);
  } catch (err) {
    logger.warn(`Failed to broadcast staff notification [${type}]: ${err.message}`);
  }
};

/**
 * Domain Event: Buyer created new order
 * @param {object} order
 */
const notifyOrderCreated = async (order) => {
  if (!order) return;
  await notify({
    userId: order.seller_id,
    type: 'ORDER_CREATED',
    title: 'มีคำสั่งซื้อใหม่เข้ามา!',
    message: `ผู้ซื้อได้ทำการสั่งซื้อไอดี "${order.listing_title || 'Listing #' + order.listing_id}" (Order #${order.order_number}) กรุณารอการชำระเงินและตรวจสอบสลิป`,
    referenceType: 'ORDER',
    referenceId: order.id,
  });
};

/**
 * Domain Event: Buyer submitted payment slip
 * @param {object} order
 */
const notifyPaymentSubmitted = async (order) => {
  if (!order) return;
  await notifyStaff({
    type: 'PAYMENT_SUBMITTED',
    title: 'มีสลิปการชำระเงินรอตรวจสอบ',
    message: `คำสั่งซื้อ #${order.order_number} แนบหลักฐานการชำระเงินแล้ว กรุณาตรวจสอบความถูกต้อง`,
    referenceType: 'ORDER',
    referenceId: order.id,
  });
};

/**
 * Domain Event: Admin/Moderator approved payment
 * @param {object} order
 */
const notifyPaymentApproved = async (order) => {
  if (!order) return;
  // Notify Buyer
  await notify({
    userId: order.buyer_id,
    type: 'PAYMENT_APPROVED',
    title: 'การชำระเงินได้รับการอนุมัติแล้ว',
    message: `ยอดชำระของคำสั่งซื้อ #${order.order_number} ถูกจัดเก็บในระบบ Escrow ปลอดภัยเรียบร้อย ระบบได้เปิดห้องส่งมอบแล้ว`,
    referenceType: 'ORDER',
    referenceId: order.id,
  });

  // Notify Seller to deliver credentials
  await notify({
    userId: order.seller_id,
    type: 'HANDOVER_OPEN',
    title: 'การชำระเงินเรียบร้อย กรุณาส่งมอบข้อมูลบัญชี',
    message: `ผู้ซื้อชำระเงินสำหรับคำสั่งซื้อ #${order.order_number} แล้ว กรุณาเข้าห้อง Handover Room เพื่อกรอกข้อมูลบัญชี Konami ภายใน 72 ชั่วโมง`,
    referenceType: 'ORDER',
    referenceId: order.id,
  });
};

/**
 * Domain Event: Admin/Moderator rejected payment
 * @param {object} order
 * @param {string} reason
 */
const notifyPaymentRejected = async (order, reason) => {
  if (!order) return;
  await notify({
    userId: order.buyer_id,
    type: 'PAYMENT_REJECTED',
    title: 'สลิปการชำระเงินไม่ถูกต้อง',
    message: `สลิปการชำระเงินสำหรับคำสั่งซื้อ #${order.order_number} ถูกปฏิเสธ: ${reason || 'ข้อมูลไม่ตรงตามยอด'} คำสั่งซื้อถูกยกเลิกแล้ว`,
    referenceType: 'ORDER',
    referenceId: order.id,
  });
};

/**
 * Domain Event: Seller provided credentials in vault
 * @param {object} order
 */
const notifyCredentialsSubmitted = async (order) => {
  if (!order) return;
  await notify({
    userId: order.buyer_id,
    type: 'SELLER_INFO_SUBMITTED',
    title: 'ผู้ขายได้ส่งมอบข้อมูลบัญชีแล้ว',
    message: `ผู้ขายได้จัดส่งรหัสบัญชีของคำสั่งซื้อ #${order.order_number} ลงใน Secure Vault แล้ว กรุณาเข้าตรวจสอบและทดสอบเข้าสู่ระบบภายใน 48 ชั่วโมง`,
    referenceType: 'ORDER',
    referenceId: order.id,
  });
};

/**
 * Domain Event: Buyer confirmed receipt & Escrow released
 * @param {object} order
 */
const notifyHandoverConfirmed = async (order) => {
  if (!order) return;
  await notify({
    userId: order.seller_id,
    type: 'ESCROW_RELEASED',
    title: 'การส่งมอบเสร็จสมบูรณ์ — เงินเข้าบัญชีแล้ว!',
    message: `ผู้ซื้อได้ยืนยันการรับบัญชีของคำสั่งซื้อ #${order.order_number} เรียบร้อยแล้ว ระบบได้ปล่อยเงิน Escrow (฿${order.seller_payout || order.amount}) ให้คุณแล้ว`,
    referenceType: 'ORDER',
    referenceId: order.id,
  });
};

/**
 * Domain Event: 48h timeout auto-release triggered
 * @param {object} order
 */
const notifyAutoReleased = async (order) => {
  if (!order) return;
  await notify({
    userId: order.seller_id,
    type: 'AUTO_RELEASE_TRIGGERED',
    title: 'ระบบปล่อยเงินอัตโนมัติ (ครบกำหนด 48 ชม.)',
    message: `เนื่องจากผู้ซื้อไม่ได้ท้วงติงภายใน 48 ชม. ระบบได้ทำการปล่อยเงิน Escrow สำหรับคำสั่งซื้อ #${order.order_number} ให้คุณโดยอัตโนมัติ`,
    referenceType: 'ORDER',
    referenceId: order.id,
  });

  await notify({
    userId: order.buyer_id,
    type: 'AUTO_RELEASE_TRIGGERED',
    title: 'คำสั่งซื้อเสร็จสมบูรณ์โดยอัตโนมัติ',
    message: `คำสั่งซื้อ #${order.order_number} ครบกำหนดเวลาตรวจสอบ 48 ชม. ระบบได้ปิดคำสั่งซื้อและปล่อยเงินให้ผู้ขายเรียบร้อยแล้ว`,
    referenceType: 'ORDER',
    referenceId: order.id,
  });
};

/**
 * Domain Event: Buyer opened dispute
 * @param {object} dispute
 * @param {object} order
 */
const notifyDisputeOpened = async (dispute, order) => {
  if (!dispute || !order) return;
  // Notify Seller
  await notify({
    userId: order.seller_id,
    type: 'DISPUTE_OPENED',
    title: 'คำสั่งซื้อมีข้อพิพาท!',
    message: `ผู้ซื้อได้เปิดข้อพิพาทสำหรับคำสั่งซื้อ #${order.order_number} เงิน Escrow ถูกระงับชั่วคราว ทีมงานกำลังดำเนินการตรวจสอบ`,
    referenceType: 'DISPUTE',
    referenceId: dispute.id,
  });

  // Notify Staff
  await notifyStaff({
    type: 'DISPUTE_OPENED',
    title: 'มีข้อพิพาทใหม่รอการไกล่เกลี่ย',
    message: `ข้อพิพาท #${dispute.id} ถูกเปิดขึ้นสำหรับคำสั่งซื้อ #${order.order_number} กรุณาเข้าตรวจสอบและวินิจฉัย`,
    referenceType: 'DISPUTE',
    referenceId: dispute.id,
  });
};

/**
 * Domain Event: Admin resolved dispute
 * @param {object} dispute
 * @param {object} order
 * @param {'BUYER'|'SELLER'} winner
 */
const notifyDisputeResolved = async (dispute, order, winner) => {
  if (!dispute || !order) return;
  if (winner === 'BUYER') {
    await notify({
      userId: order.buyer_id,
      type: 'ESCROW_REFUNDED',
      title: 'ข้อพิพาทได้รับการตัดสิน: คืนเงินสำเร็จ',
      message: `ข้อพิพาท #${dispute.id} ได้รับการตัดสินให้คืนเงิน (฿${order.amount}) เข้าบัญชีของคุณเรียบร้อยแล้ว`,
      referenceType: 'DISPUTE',
      referenceId: dispute.id,
    });
    await notify({
      userId: order.seller_id,
      type: 'DISPUTE_RESOLVED',
      title: 'ผลการตัดสินข้อพิพาท',
      message: `ข้อพิพาท #${dispute.id} ได้รับการตัดสินให้คืนเงินแก่ผู้ซื้อ ไอดีของคุณได้รับการกู้คืนสู่สถานะ Active บน Marketplace แล้ว`,
      referenceType: 'DISPUTE',
      referenceId: dispute.id,
    });
  } else {
    await notify({
      userId: order.seller_id,
      type: 'ESCROW_RELEASED',
      title: 'ข้อพิพาทได้รับการตัดสิน: อนุมัติเงินให้ผู้ขาย',
      message: `ข้อพิพาท #${dispute.id} ได้รับการตัดสินเป็นธรรมแก่คุณ เงิน Escrow (฿${order.seller_payout || order.amount}) ถูกปล่อยเข้าบัญชีแล้ว`,
      referenceType: 'DISPUTE',
      referenceId: dispute.id,
    });
    await notify({
      userId: order.buyer_id,
      type: 'DISPUTE_RESOLVED',
      title: 'ผลการตัดสินข้อพิพาท',
      message: `ข้อพิพาท #${dispute.id} ได้รับการตัดสินให้ผู้ขายได้รับเงินตามสัญญา คำสั่งซื้อถูกปิดเป็น COMPLETED`,
      referenceType: 'DISPUTE',
      referenceId: dispute.id,
    });
  }
};

/**
 * Domain Event: Listing status became ACTIVE (N01)
 * @param {object} param0
 */
const notifyListingActive = async ({ sellerId, listingId, title }) => {
  if (!sellerId) return;
  await notify({
    userId: sellerId,
    type: 'LISTING_ACTIVE',
    title: 'ประกาศของคุณเผยแพร่แล้ว!',
    message: `ประกาศ "${title || 'Listing #' + listingId}" ได้รับการอนุมัติและเผยแพร่บน Marketplace เรียบร้อยแล้ว`,
    referenceType: 'LISTING',
    referenceId: listingId,
  });
};

/**
 * Domain Event: KYC approved (N21)
 * @param {object} param0
 */
const notifyKycApproved = async ({ userId }) => {
  if (!userId) return;
  await notify({
    userId,
    type: 'KYC_APPROVED',
    title: 'ยืนยันตัวตนสำเร็จ — ได้รับ Verified Badge',
    message: 'เอกสารยืนยันตัวตน (KYC) ของคุณผ่านการอนุมัติแล้ว คุณได้รับสถานะ Verified Seller เรียบร้อย',
    referenceType: 'KYC',
    referenceId: userId,
  });
};

/**
 * Domain Event: KYC rejected (N22)
 * @param {object} param0
 */
const notifyKycRejected = async ({ userId, reason }) => {
  if (!userId) return;
  await notify({
    userId,
    type: 'KYC_REJECTED',
    title: 'การยืนยันตัวตน (KYC) ไม่ผ่านการอนุมัติ',
    message: `เอกสาร KYC ของคุณถูกปฏิเสธ: ${reason || 'ข้อมูลไม่ชัดเจนหรือไม่ตรงตามเกณฑ์'} กรุณาอัปโหลดใหม่อีกครั้ง`,
    referenceType: 'KYC',
    referenceId: userId,
  });
};

/**
 * Domain Event: Order payment timeout expired (N24)
 * @param {object} order
 */
const notifyOrderExpired = async (order) => {
  if (!order) return;
  if (order.buyer_id) {
    await notify({
      userId: order.buyer_id,
      type: 'ORDER_EXPIRED',
      title: 'คำสั่งซื้อหมดอายุ',
      message: `คำสั่งซื้อ #${order.order_number || order.id} หมดอายุเนื่องจากไม่มีการชำระเงินภายในระยะเวลาที่กำหนด`,
      referenceType: 'ORDER',
      referenceId: order.id,
    });
  }
  if (order.seller_id) {
    await notify({
      userId: order.seller_id,
      type: 'ORDER_EXPIRED',
      title: 'คำสั่งซื้อหมดอายุ',
      message: `คำสั่งซื้อ #${order.order_number || order.id} หมดอายุและระบบได้คืนสถานะไอดีสู่ Marketplace แล้ว`,
      referenceType: 'ORDER',
      referenceId: order.id,
    });
  }
};

/**
 * Domain Event: Dispute SLA warning (<12h left or >36h open) (N25)
 * @param {object} dispute
 */
const notifyDisputeSlaWarning = async (dispute) => {
  if (!dispute) return;
  await notifyStaff({
    type: 'DISPUTE_SLA_WARNING',
    title: '⚠️ แจ้งเตือน SLA ข้อพิพาทใกล้ครบกำหนด',
    message: `ข้อพิพาท #${dispute.id} (Order #${dispute.order_number || dispute.order_id}) เปิดมาเกิน 36 ชม. หรือเหลือเวลาไม่ถึง 12 ชม. ก่อนหมด SLA กรุณาเข้าไกล่เกลี่ยด่วน`,
    referenceType: 'DISPUTE',
    referenceId: dispute.id,
  });
};

module.exports = {
  notify,
  notifyStaff,
  notifyOrderCreated,
  notifyPaymentSubmitted,
  notifyPaymentApproved,
  notifyPaymentRejected,
  notifyCredentialsSubmitted,
  notifyHandoverConfirmed,
  notifyAutoReleased,
  notifyDisputeOpened,
  notifyDisputeResolved,
  notifyListingActive,
  notifyKycApproved,
  notifyKycRejected,
  notifyOrderExpired,
  notifyDisputeSlaWarning,
};

