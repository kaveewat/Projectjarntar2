-- ============================================================
--  eFootball Smart Marketplace & AI Valuation System
--  Database Initialization Script
--  Path: db/init/01-init.sql
--  MySQL Version: 8.0+
--  Charset: utf8mb4 / Collation: utf8mb4_unicode_ci
-- ============================================================

CREATE DATABASE IF NOT EXISTS efootball_db
  CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

USE efootball_db;

-- ============================================================
-- 1. Master / Reference Data Tables
-- ============================================================

CREATE TABLE IF NOT EXISTS games (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  slug VARCHAR(50) NOT NULL UNIQUE,
  is_active TINYINT(1) DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS platforms (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(50) NOT NULL,
  slug VARCHAR(30) NOT NULL UNIQUE,
  is_active TINYINT(1) DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS card_tiers (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(50) NOT NULL,
  slug VARCHAR(30) NOT NULL UNIQUE,
  weight INT UNSIGNED NOT NULL DEFAULT 1,
  display_color VARCHAR(10) NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS positions (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  code VARCHAR(5) NOT NULL UNIQUE,
  name VARCHAR(30) NOT NULL,
  group_name ENUM('GK', 'DEF', 'MID', 'FWD') NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS dispute_reasons (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  code VARCHAR(50) NOT NULL UNIQUE,
  description_th VARCHAR(255) NOT NULL,
  is_active TINYINT(1) DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS platform_settings (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  setting_key VARCHAR(100) NOT NULL UNIQUE,
  setting_value TEXT NOT NULL,
  description TEXT NULL,
  updated_by INT UNSIGNED NULL,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- 2. User & Identity Tables
-- ============================================================

CREATE TABLE IF NOT EXISTS users (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  email VARCHAR(255) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  display_name VARCHAR(100) NOT NULL,
  phone VARCHAR(20) NULL,
  line_id VARCHAR(100) NULL,
  role ENUM('ADMIN', 'MODERATOR', 'VERIFIED_SELLER', 'SELLER', 'BUYER') NOT NULL DEFAULT 'BUYER',
  is_verified TINYINT(1) DEFAULT 0,
  is_suspended TINYINT(1) DEFAULT 0,
  is_banned TINYINT(1) DEFAULT 0,
  email_verified_at DATETIME NULL,
  last_login_at DATETIME NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted_at DATETIME NULL,
  INDEX idx_users_role (role),
  INDEX idx_users_status (is_suspended, is_banned)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS user_kyc (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id INT UNSIGNED NOT NULL UNIQUE,
  real_name VARCHAR(255) NOT NULL,
  id_card_number VARCHAR(255) NOT NULL,
  id_card_image_url VARCHAR(500) NOT NULL,
  selfie_image_url VARCHAR(500) NULL,
  status ENUM('PENDING', 'APPROVED', 'REJECTED') NOT NULL DEFAULT 'PENDING',
  reviewed_by INT UNSIGNED NULL,
  reviewed_at DATETIME NULL,
  reject_reason TEXT NULL,
  submitted_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (reviewed_by) REFERENCES users(id) ON DELETE SET NULL,
  INDEX idx_kyc_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Update foreign key on platform_settings now that users table exists
ALTER TABLE platform_settings
  ADD CONSTRAINT fk_platform_settings_user
  FOREIGN KEY (updated_by) REFERENCES users(id) ON DELETE SET NULL;

-- ============================================================
-- 3. Player Cards Master Catalog
-- ============================================================

CREATE TABLE IF NOT EXISTS player_cards (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  game_id INT UNSIGNED NOT NULL,
  player_name VARCHAR(100) NOT NULL,
  card_tier_id INT UNSIGNED NOT NULL,
  position_id INT UNSIGNED NOT NULL,
  nationality VARCHAR(60) NULL,
  club VARCHAR(100) NULL,
  overall_rating TINYINT UNSIGNED NOT NULL CHECK (overall_rating BETWEEN 1 AND 110),
  base_value DECIMAL(15,2) DEFAULT 0.00,
  is_active TINYINT(1) DEFAULT 1,
  season VARCHAR(20) NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (game_id) REFERENCES games(id),
  FOREIGN KEY (card_tier_id) REFERENCES card_tiers(id),
  FOREIGN KEY (position_id) REFERENCES positions(id),
  INDEX idx_player_cards_name (player_name),
  INDEX idx_player_cards_tier (card_tier_id),
  INDEX idx_player_cards_rating (overall_rating)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- 4. AI Squad Scanning & Valuation Tables
-- ============================================================

CREATE TABLE IF NOT EXISTS squad_scans (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id INT UNSIGNED NOT NULL,
  game_id INT UNSIGNED NOT NULL,
  image_urls JSON NOT NULL,
  status ENUM('PENDING', 'PROCESSING', 'COMPLETED', 'FAILED') NOT NULL DEFAULT 'PENDING',
  ai_model VARCHAR(100) NULL,
  ai_raw_response JSON NULL,
  error_message TEXT NULL,
  processing_time_ms INT UNSIGNED NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  completed_at DATETIME NULL,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (game_id) REFERENCES games(id),
  INDEX idx_scans_user (user_id),
  INDEX idx_scans_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS scan_player_results (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  scan_id INT UNSIGNED NOT NULL,
  player_card_id INT UNSIGNED NULL,
  detected_name VARCHAR(100) NOT NULL,
  detected_tier VARCHAR(50) NULL,
  detected_position VARCHAR(10) NULL,
  confidence_score DECIMAL(5,4) NULL,
  is_confirmed TINYINT(1) DEFAULT 1,
  is_corrected TINYINT(1) DEFAULT 0,
  FOREIGN KEY (scan_id) REFERENCES squad_scans(id) ON DELETE CASCADE,
  FOREIGN KEY (player_card_id) REFERENCES player_cards(id) ON DELETE SET NULL,
  INDEX idx_scan_player_scan (scan_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS valuations (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  scan_id INT UNSIGNED NOT NULL UNIQUE,
  fair_price_min DECIMAL(12,2) NOT NULL,
  fair_price_max DECIMAL(12,2) NOT NULL,
  algorithm_version VARCHAR(20) NOT NULL,
  factors_used JSON NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (scan_id) REFERENCES squad_scans(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- 5. Listing & Marketplace Tables
-- ============================================================

CREATE TABLE IF NOT EXISTS account_listings (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  seller_id INT UNSIGNED NOT NULL,
  game_id INT UNSIGNED NOT NULL,
  platform_id INT UNSIGNED NOT NULL,
  squad_scan_id INT UNSIGNED NULL,
  valuation_id INT UNSIGNED NULL,
  title VARCHAR(200) NOT NULL,
  description TEXT NULL,
  asking_price DECIMAL(12,2) NOT NULL,
  fair_price_min DECIMAL(12,2) NULL,
  fair_price_max DECIMAL(12,2) NULL,
  value_badge ENUM('GREAT_VALUE', 'FAIR', 'OVERPRICED') NULL,
  team_strength SMALLINT UNSIGNED NULL,
  status ENUM('DRAFT', 'SCANNING', 'SCAN_FAILED', 'PENDING_REVIEW', 'ACTIVE', 'RESERVED', 'SOLD', 'CANCELLED', 'SUSPENDED') NOT NULL DEFAULT 'DRAFT',
  suspended_reason TEXT NULL,
  view_count INT UNSIGNED DEFAULT 0,
  sold_at DATETIME NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted_at DATETIME NULL,
  FOREIGN KEY (seller_id) REFERENCES users(id),
  FOREIGN KEY (game_id) REFERENCES games(id),
  FOREIGN KEY (platform_id) REFERENCES platforms(id),
  FOREIGN KEY (squad_scan_id) REFERENCES squad_scans(id) ON DELETE SET NULL,
  FOREIGN KEY (valuation_id) REFERENCES valuations(id) ON DELETE SET NULL,
  INDEX idx_listings_seller (seller_id),
  INDEX idx_listings_status (status),
  INDEX idx_listings_price (asking_price),
  INDEX idx_listings_strength (team_strength),
  INDEX idx_listings_created (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS listing_player_cards (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  listing_id INT UNSIGNED NOT NULL,
  player_card_id INT UNSIGNED NOT NULL,
  is_ai_detected TINYINT(1) DEFAULT 1,
  UNIQUE KEY uq_listing_player (listing_id, player_card_id),
  INDEX idx_listing_player_card (player_card_id),
  FOREIGN KEY (listing_id) REFERENCES account_listings(id) ON DELETE CASCADE,
  FOREIGN KEY (player_card_id) REFERENCES player_cards(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- 6. Orders, Payments, Escrow & Payouts
-- ============================================================

CREATE TABLE IF NOT EXISTS orders (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  order_number VARCHAR(30) NOT NULL UNIQUE,
  listing_id INT UNSIGNED NOT NULL,
  buyer_id INT UNSIGNED NOT NULL,
  seller_id INT UNSIGNED NOT NULL,
  amount DECIMAL(12,2) NOT NULL,
  platform_fee DECIMAL(12,2) NOT NULL,
  seller_payout DECIMAL(12,2) NOT NULL,
  fee_rate DECIMAL(5,4) NOT NULL,
  status ENUM(
    'CREATED',
    'PENDING_PAYMENT',
    'PAYMENT_SUBMITTED',
    'PAYMENT_APPROVED',
    'HANDOVER_OPEN',
    'HANDOVER_INFO_PROVIDED',
    'BUYER_REVIEWING',
    'AUTO_RELEASE_PENDING',
    'COMPLETED',
    'DISPUTED',
    'DISPUTE_RESOLVED_SELLER',
    'DISPUTE_RESOLVED_BUYER',
    'REFUNDED',
    'CANCELLED',
    'EXPIRED'
  ) NOT NULL DEFAULT 'CREATED',
  payment_deadline DATETIME NULL,
  handover_deadline DATETIME NULL,
  auto_release_at DATETIME NULL,
  completed_at DATETIME NULL,
  cancelled_at DATETIME NULL,
  cancel_reason TEXT NULL,
  cancelled_by INT UNSIGNED NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (listing_id) REFERENCES account_listings(id),
  FOREIGN KEY (buyer_id) REFERENCES users(id),
  FOREIGN KEY (seller_id) REFERENCES users(id),
  FOREIGN KEY (cancelled_by) REFERENCES users(id) ON DELETE SET NULL,
  INDEX idx_orders_buyer (buyer_id),
  INDEX idx_orders_seller (seller_id),
  INDEX idx_orders_status (status),
  INDEX idx_orders_created (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS payments (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  order_id INT UNSIGNED NOT NULL,
  amount DECIMAL(12,2) NOT NULL,
  payment_method ENUM('PROMPTPAY', 'BANK_TRANSFER', 'OTHER') NOT NULL DEFAULT 'PROMPTPAY',
  payment_proof_url VARCHAR(500) NOT NULL,
  bank_reference VARCHAR(100) NULL,
  status ENUM('SUBMITTED', 'APPROVED', 'REJECTED') NOT NULL DEFAULT 'SUBMITTED',
  submitted_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  reviewed_by INT UNSIGNED NULL,
  reviewed_at DATETIME NULL,
  reject_reason TEXT NULL,
  FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
  FOREIGN KEY (reviewed_by) REFERENCES users(id) ON DELETE SET NULL,
  INDEX idx_payments_order (order_id),
  INDEX idx_payments_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS escrow_records (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  order_id INT UNSIGNED NOT NULL UNIQUE,
  amount_held DECIMAL(12,2) NOT NULL,
  platform_fee DECIMAL(12,2) NOT NULL,
  seller_payout DECIMAL(12,2) NOT NULL,
  status ENUM('HELD', 'FROZEN', 'RELEASED', 'REFUNDED') NOT NULL DEFAULT 'HELD',
  held_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  released_at DATETIME NULL,
  refunded_at DATETIME NULL,
  action_by INT UNSIGNED NULL,
  action_note TEXT NULL,
  FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
  FOREIGN KEY (action_by) REFERENCES users(id) ON DELETE SET NULL,
  INDEX idx_escrow_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS seller_payouts (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  escrow_id INT UNSIGNED NOT NULL,
  seller_id INT UNSIGNED NOT NULL,
  amount DECIMAL(12,2) NOT NULL,
  bank_name VARCHAR(100) NULL,
  bank_account_number VARCHAR(50) NULL,
  bank_account_name VARCHAR(150) NULL,
  bank_reference VARCHAR(100) NULL,
  transfer_slip_url VARCHAR(500) NULL,
  status ENUM('PENDING', 'PROCESSING', 'COMPLETED', 'FAILED') NOT NULL DEFAULT 'PENDING',
  processed_by INT UNSIGNED NULL,
  processed_at DATETIME NULL,
  note TEXT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (escrow_id) REFERENCES escrow_records(id) ON DELETE CASCADE,
  FOREIGN KEY (seller_id) REFERENCES users(id),
  FOREIGN KEY (processed_by) REFERENCES users(id) ON DELETE SET NULL,
  INDEX idx_payouts_seller (seller_id),
  INDEX idx_payouts_status (status),
  INDEX idx_payouts_created (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- 7. Handover Room & Security Tables
-- ============================================================

CREATE TABLE IF NOT EXISTS handover_rooms (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  order_id INT UNSIGNED NOT NULL UNIQUE,
  status ENUM('WAITING_SELLER', 'INFO_PROVIDED', 'BUYER_REVIEWING', 'CONFIRMED', 'DISPUTED', 'EXPIRED_SELLER', 'AUTO_RELEASED') NOT NULL DEFAULT 'WAITING_SELLER',
  opened_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  seller_submitted_at DATETIME NULL,
  buyer_confirmed_at DATETIME NULL,
  expires_at DATETIME NOT NULL,
  auto_release_at DATETIME NULL,
  data_deleted_at DATETIME NULL,
  FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
  INDEX idx_handover_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS handover_messages (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  room_id INT UNSIGNED NOT NULL,
  sender_role ENUM('SELLER', 'SYSTEM') NOT NULL DEFAULT 'SELLER',
  content_encrypted TEXT NOT NULL,
  encryption_iv VARCHAR(100) NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  deleted_at DATETIME NULL,
  FOREIGN KEY (room_id) REFERENCES handover_rooms(id) ON DELETE CASCADE,
  INDEX idx_handover_messages_room (room_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS handover_access_logs (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  room_id INT UNSIGNED NOT NULL,
  user_id INT UNSIGNED NOT NULL,
  action ENUM('ROOM_OPENED', 'INFO_SUBMITTED', 'INFO_VIEWED', 'CONFIRMED', 'DISPUTE_OPENED', 'ROOM_CLOSED') NOT NULL,
  ip_address VARCHAR(50) NULL,
  user_agent VARCHAR(500) NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (room_id) REFERENCES handover_rooms(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_handover_logs_room (room_id),
  INDEX idx_handover_logs_user (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- 8. Dispute Resolution Tables
-- ============================================================

CREATE TABLE IF NOT EXISTS disputes (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  order_id INT UNSIGNED NOT NULL UNIQUE,
  opened_by INT UNSIGNED NOT NULL,
  dispute_reason_id INT UNSIGNED NOT NULL,
  description TEXT NOT NULL,
  status ENUM('OPEN', 'UNDER_REVIEW', 'RESOLVED_SELLER', 'RESOLVED_BUYER') NOT NULL DEFAULT 'OPEN',
  assigned_to INT UNSIGNED NULL,
  resolution_note TEXT NULL,
  resolved_by INT UNSIGNED NULL,
  opened_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  resolved_at DATETIME NULL,
  sla_deadline DATETIME NULL,
  FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
  FOREIGN KEY (opened_by) REFERENCES users(id),
  FOREIGN KEY (dispute_reason_id) REFERENCES dispute_reasons(id),
  FOREIGN KEY (assigned_to) REFERENCES users(id) ON DELETE SET NULL,
  FOREIGN KEY (resolved_by) REFERENCES users(id) ON DELETE SET NULL,
  INDEX idx_disputes_status (status),
  INDEX idx_disputes_assigned (assigned_to)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS dispute_evidence (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  dispute_id INT UNSIGNED NOT NULL,
  uploaded_by INT UNSIGNED NOT NULL,
  file_url VARCHAR(500) NOT NULL,
  file_type VARCHAR(50) NULL,
  description TEXT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (dispute_id) REFERENCES disputes(id) ON DELETE CASCADE,
  FOREIGN KEY (uploaded_by) REFERENCES users(id),
  INDEX idx_evidence_dispute (dispute_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS dispute_comments (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  dispute_id INT UNSIGNED NOT NULL,
  author_id INT UNSIGNED NOT NULL,
  message TEXT NOT NULL,
  is_internal TINYINT(1) DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (dispute_id) REFERENCES disputes(id) ON DELETE CASCADE,
  FOREIGN KEY (author_id) REFERENCES users(id),
  INDEX idx_comments_dispute (dispute_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- 9. Logs & Audit Trail (Append-Only)
-- ============================================================

CREATE TABLE IF NOT EXISTS order_status_logs (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  order_id INT UNSIGNED NOT NULL,
  from_status VARCHAR(50) NULL,
  to_status VARCHAR(50) NOT NULL,
  changed_by INT UNSIGNED NULL,
  note TEXT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
  FOREIGN KEY (changed_by) REFERENCES users(id) ON DELETE SET NULL,
  INDEX idx_order_logs_order (order_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS listing_status_logs (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  listing_id INT UNSIGNED NOT NULL,
  from_status VARCHAR(50) NULL,
  to_status VARCHAR(50) NOT NULL,
  changed_by INT UNSIGNED NULL,
  note TEXT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (listing_id) REFERENCES account_listings(id) ON DELETE CASCADE,
  FOREIGN KEY (changed_by) REFERENCES users(id) ON DELETE SET NULL,
  INDEX idx_listing_logs_listing (listing_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS escrow_status_logs (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  escrow_id INT UNSIGNED NOT NULL,
  order_id INT UNSIGNED NOT NULL,
  from_status VARCHAR(50) NULL,
  to_status VARCHAR(50) NOT NULL,
  amount DECIMAL(12,2) NOT NULL,
  action_by INT UNSIGNED NULL,
  action_note TEXT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (escrow_id) REFERENCES escrow_records(id) ON DELETE CASCADE,
  FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
  FOREIGN KEY (action_by) REFERENCES users(id) ON DELETE SET NULL,
  INDEX idx_escrow_logs_escrow (escrow_id),
  INDEX idx_escrow_logs_order (order_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS audit_logs (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  actor_id INT UNSIGNED NOT NULL,
  action VARCHAR(100) NOT NULL,
  target_type VARCHAR(50) NOT NULL,
  target_id INT UNSIGNED NOT NULL,
  before_data JSON NULL,
  after_data JSON NULL,
  ip_address VARCHAR(50) NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (actor_id) REFERENCES users(id),
  INDEX idx_audit_target (target_type, target_id),
  INDEX idx_audit_actor (actor_id, created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- 10. Notification & Analytics Tables
-- ============================================================

CREATE TABLE IF NOT EXISTS notifications (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id INT UNSIGNED NOT NULL,
  type VARCHAR(50) NOT NULL,
  title VARCHAR(200) NOT NULL,
  message TEXT NOT NULL,
  reference_type VARCHAR(50) NULL,
  reference_id INT UNSIGNED NULL,
  is_read TINYINT(1) DEFAULT 0,
  read_at DATETIME NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_notifications_user (user_id, is_read),
  INDEX idx_notifications_created (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS price_history (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  listing_id INT UNSIGNED NOT NULL,
  order_id INT UNSIGNED NOT NULL,
  game_id INT UNSIGNED NOT NULL,
  platform_id INT UNSIGNED NOT NULL,
  sold_price DECIMAL(12,2) NOT NULL,
  fair_price_min DECIMAL(12,2) NULL,
  fair_price_max DECIMAL(12,2) NULL,
  team_strength SMALLINT UNSIGNED NULL,
  rare_player_count TINYINT UNSIGNED NULL,
  sold_at DATETIME NOT NULL,
  FOREIGN KEY (listing_id) REFERENCES account_listings(id) ON DELETE CASCADE,
  FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
  FOREIGN KEY (game_id) REFERENCES games(id),
  FOREIGN KEY (platform_id) REFERENCES platforms(id),
  INDEX idx_price_history_game (game_id, platform_id),
  INDEX idx_price_history_strength (team_strength)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
