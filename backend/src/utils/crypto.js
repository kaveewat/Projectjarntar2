const crypto = require('crypto');

/**
 * AES-256-GCM Encryption / Decryption Utility
 */

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16; // 128-bit IV for AES-GCM
const AUTH_TAG_LENGTH = 16; // 128-bit auth tag

/**
 * Derive a 32-byte key from environment secret
 * Guarantees exactly 256 bits regardless of secret length
 */
const getSecretKey = () => {
  const secret =
    process.env.HANDOVER_ENCRYPTION_KEY ||
    process.env.ENCRYPTION_KEY ||
    process.env.JWT_SECRET ||
    'efootball-secret-encryption-key-32b-seed';
  return crypto.createHash('sha256').update(secret).digest();
};

/**
 * Encrypt plaintext string into AES-256-GCM ciphertext with IV and auth tag
 * @param {string|object} data - Data to encrypt
 * @returns {{ ciphertext: string, iv: string, authTag: string }}
 */
const encrypt = (data) => {
  const text = typeof data === 'object' ? JSON.stringify(data) : String(data);
  const key = getSecretKey();
  const iv = crypto.randomBytes(IV_LENGTH);

  const cipher = crypto.createCipheriv(ALGORITHM, key, iv, {
    authTagLength: AUTH_TAG_LENGTH,
  });

  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  const authTag = cipher.getAuthTag().toString('hex');

  return {
    ciphertext: encrypted,
    iv: iv.toString('hex'),
    authTag,
  };
};

/**
 * Decrypt AES-256-GCM ciphertext back into plaintext
 * @param {string} ciphertext - Encrypted text in hex
 * @param {string} iv - Hex IV string
 * @param {string} authTag - Hex authentication tag
 * @returns {string} - Decrypted plaintext
 */
const decrypt = (ciphertext, iv, authTag) => {
  const key = getSecretKey();
  const ivBuffer = Buffer.from(iv, 'hex');
  const authTagBuffer = Buffer.from(authTag, 'hex');

  const decipher = crypto.createDecipheriv(ALGORITHM, key, ivBuffer, {
    authTagLength: AUTH_TAG_LENGTH,
  });

  decipher.setAuthTag(authTagBuffer);

  let decrypted = decipher.update(ciphertext, 'hex', 'utf8');
  decrypted += decipher.final('utf8');

  return decrypted;
};

module.exports = {
  encrypt,
  decrypt,
};
