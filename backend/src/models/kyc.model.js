const db = require('../config/db');

/**
 * Find KYC verification record by user ID
 * @param {number} userId
 * @returns {Promise<object|null>}
 */
const findByUserId = async (userId) => {
  const sql = `
    SELECT id, user_id, real_name, id_card_number, id_card_image_url, 
           selfie_image_url, status, reviewed_by, reviewed_at, reject_reason, 
           submitted_at, created_at
    FROM user_kyc
    WHERE user_id = ?
    LIMIT 1
  `;
  const [rows] = await db.query(sql, [userId]);
  return rows[0] || null;
};

/**
 * Submit or re-submit KYC record
 * @param {object} param0
 * @returns {Promise<number>}
 */
const submitKyc = async ({
  userId,
  realName,
  idCardNumber,
  idCardImageUrl,
  selfieImageUrl = null,
}) => {
  const sql = `
    INSERT INTO user_kyc (user_id, real_name, id_card_number, id_card_image_url, selfie_image_url, status, submitted_at)
    VALUES (?, ?, ?, ?, ?, 'PENDING', NOW())
    ON DUPLICATE KEY UPDATE
      real_name = VALUES(real_name),
      id_card_number = VALUES(id_card_number),
      id_card_image_url = VALUES(id_card_image_url),
      selfie_image_url = VALUES(selfie_image_url),
      status = 'PENDING',
      reject_reason = NULL,
      reviewed_by = NULL,
      reviewed_at = NULL,
      submitted_at = NOW()
  `;
  const [result] = await db.query(sql, [
    userId,
    realName.trim(),
    idCardNumber.trim(),
    idCardImageUrl,
    selfieImageUrl,
  ]);
  return result.insertId || result.affectedRows;
};

/**
 * Find KYC records for admin queue
 * @param {object} param0
 */
const findAll = async ({ status = null, limit = 20, offset = 0 } = {}) => {
  let countSql = `SELECT COUNT(*) AS total FROM user_kyc k`;
  let dataSql = `
    SELECT k.*, u.email, u.display_name, u.role, u.is_verified
    FROM user_kyc k
    JOIN users u ON k.user_id = u.id
  `;
  const params = [];

  if (status) {
    countSql += ` WHERE k.status = ?`;
    dataSql += ` WHERE k.status = ?`;
    params.push(status);
  }

  dataSql += ` ORDER BY k.submitted_at DESC LIMIT ? OFFSET ?`;

  const [countRows] = await db.query(countSql, status ? [status] : []);
  const [rows] = await db.query(dataSql, [...params, limit, offset]);

  return { kycList: rows, total: countRows[0].total };
};

/**
 * Find KYC record by KYC ID
 * @param {number} id
 */
const findById = async (id) => {
  const sql = `
    SELECT k.*, u.email, u.display_name, u.role, u.is_verified, u.phone, u.line_id
    FROM user_kyc k
    JOIN users u ON k.user_id = u.id
    WHERE k.id = ?
    LIMIT 1
  `;
  const [rows] = await db.query(sql, [id]);
  return rows[0] || null;
};

/**
 * Approve KYC verification and upgrade user to VERIFIED_SELLER
 * @param {number} kycId
 * @param {number} adminId
 */
const approveKyc = async (kycId, adminId) => {
  const kyc = await findById(kycId);
  if (!kyc) return null;

  // 1. Update KYC record
  await db.query(
    `UPDATE user_kyc 
     SET status = 'APPROVED', reviewed_by = ?, reviewed_at = NOW(), reject_reason = NULL 
     WHERE id = ?`,
    [adminId, kycId]
  );

  // 2. Update user to verified and promote to VERIFIED_SELLER
  await db.query(
    `UPDATE users 
     SET is_verified = 1, role = CASE WHEN role = 'ADMIN' THEN 'ADMIN' ELSE 'VERIFIED_SELLER' END, updated_at = NOW() 
     WHERE id = ?`,
    [kyc.user_id]
  );

  return findById(kycId);
};

/**
 * Reject KYC verification
 * @param {number} kycId
 * @param {number} adminId
 * @param {string} reason
 */
const rejectKyc = async (kycId, adminId, reason) => {
  await db.query(
    `UPDATE user_kyc 
     SET status = 'REJECTED', reviewed_by = ?, reviewed_at = NOW(), reject_reason = ? 
     WHERE id = ?`,
    [adminId, reason, kycId]
  );
  return findById(kycId);
};

module.exports = {
  findByUserId,
  submitKyc,
  findAll,
  findById,
  approveKyc,
  rejectKyc,
};
