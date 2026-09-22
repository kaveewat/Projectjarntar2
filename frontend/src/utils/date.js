/**
 * Date and Time Utilities for eFootball Smart Marketplace
 * Handles UTC string conversions from MySQL and Thai localization.
 */

/**
 * Safely parse UTC date string from MySQL or ISO timestamp
 * @param {string|Date} dateStr 
 * @returns {Date|null}
 */
export const parseDate = (dateStr) => {
  if (!dateStr) return null;
  if (dateStr instanceof Date) return dateStr;
  if (typeof dateStr === 'string') {
    // MySQL format: 'YYYY-MM-DD HH:mm:ss' (stored in UTC)
    if (/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/.test(dateStr)) {
      return new Date(dateStr.replace(' ', 'T') + 'Z');
    }
  }
  return new Date(dateStr);
};

/**
 * Format relative time in Thai (e.g. "เมื่อสักครู่", "5 นาทีที่แล้ว", "2 ชั่วโมงที่แล้ว")
 * @param {string|Date} dateStr 
 * @returns {string}
 */
export const formatRelativeTimeThai = (dateStr) => {
  if (!dateStr) return '';
  try {
    const d = parseDate(dateStr);
    if (!d || isNaN(d.getTime())) return '';
    const diffMs = Date.now() - d.getTime();
    const diffMins = Math.floor(diffMs / 60000);

    if (diffMins < 1) return 'เมื่อสักครู่';
    if (diffMins < 60) return `${diffMins} นาทีที่แล้ว`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours} ชั่วโมงที่แล้ว`;
    const diffDays = Math.floor(diffHours / 24);
    if (diffDays < 7) return `${diffDays} วันที่แล้ว`;
    return d.toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: 'numeric' });
  } catch {
    return '';
  }
};

/**
 * Format full Thai datetime (e.g. "21 ก.ย. 2569, 21:55")
 * @param {string|Date} dateStr 
 * @returns {string}
 */
export const formatThaiDateTime = (dateStr) => {
  if (!dateStr) return '-';
  try {
    const d = parseDate(dateStr);
    if (!d || isNaN(d.getTime())) return '-';
    return d.toLocaleString('th-TH', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return String(dateStr);
  }
};
