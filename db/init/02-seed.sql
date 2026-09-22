-- ============================================================
--  eFootball Smart Marketplace & AI Valuation System
--  Master Data & Initial Seed Data
--  Path: db/init/02-seed.sql
-- ============================================================

USE efootball_db;

-- ── 1. Games ──────────────────────────────────────────────────
INSERT INTO games (id, name, slug, is_active) VALUES
  (1, 'eFootball 2025', 'efootball', 1)
ON DUPLICATE KEY UPDATE name = VALUES(name);

-- ── 2. Platforms ──────────────────────────────────────────────
INSERT INTO platforms (id, name, slug, is_active) VALUES
  (1, 'iOS', 'ios', 1),
  (2, 'Android', 'android', 1),
  (3, 'PlayStation', 'ps', 1)
ON DUPLICATE KEY UPDATE name = VALUES(name);

-- ── 3. Card Tiers ─────────────────────────────────────────────
INSERT INTO card_tiers (id, name, slug, weight, display_color) VALUES
  (1, 'Normal', 'normal', 1, '#9E9E9E'),
  (2, 'Epic', 'epic', 5, '#FFD700'),
  (3, 'Show Time', 'show_time', 7, '#00E5FF'),
  (4, 'Big Time', 'big_time', 8, '#FF1744')
ON DUPLICATE KEY UPDATE name = VALUES(name), weight = VALUES(weight), display_color = VALUES(display_color);

-- ── 4. Positions ──────────────────────────────────────────────
INSERT INTO positions (id, code, name, group_name) VALUES
  (1,  'GK',  'Goalkeeper',             'GK'),
  (2,  'CB',  'Centre Back',            'DEF'),
  (3,  'LB',  'Left Back',              'DEF'),
  (4,  'RB',  'Right Back',             'DEF'),
  (5,  'DMF', 'Defensive Midfielder',   'MID'),
  (6,  'CMF', 'Central Midfielder',     'MID'),
  (7,  'AMF', 'Attacking Midfielder',   'MID'),
  (8,  'LWF', 'Left Wing Forward',      'FWD'),
  (9,  'RWF', 'Right Wing Forward',     'FWD'),
  (10, 'CF',  'Centre Forward',         'FWD'),
  (11, 'SS',  'Second Striker',         'FWD')
ON DUPLICATE KEY UPDATE name = VALUES(name), group_name = VALUES(group_name);

-- ── 5. Dispute Reasons ────────────────────────────────────────
INSERT INTO dispute_reasons (id, code, description_th, is_active) VALUES
  (1, 'WRONG_ACCOUNT', 'บัญชีไม่ตรงกับที่ระบุในประกาศ (นักเตะหรือค่าพลังไม่ตรง)', 1),
  (2, 'LOGIN_FAILED', 'ข้อมูลบัญชีไม่ถูกต้อง (ไม่สามารถเข้าสู่ระบบ Konami ID ได้)', 1),
  (3, 'ACCOUNT_RECOVERED', 'บัญชีถูกดึงคืนหลังการรับมอบ (ผู้ขายกู้คืนบัญชี)', 1),
  (4, 'OTHER', 'ปัญหาอื่นๆ (ระบุในรายละเอียดเพิ่มเติม)', 1)
ON DUPLICATE KEY UPDATE description_th = VALUES(description_th);

-- ── 6. Initial Super Admin User ───────────────────────────────
-- Default password: Admin@123456 (bcrypt hash 10 rounds)
INSERT INTO users (id, email, password_hash, display_name, role, is_verified, is_suspended, is_banned) VALUES
  (1, 'admin@efootball-market.com', '$2a$10$SLQpeGxiX2ukNazadvaNGetMOJ4R7Kg4YZRuWyRKWZpJjPUxhUUzG', 'Super Administrator', 'ADMIN', 1, 0, 0)
ON DUPLICATE KEY UPDATE display_name = VALUES(display_name);

-- ── 7. Platform Settings ──────────────────────────────────────
INSERT INTO platform_settings (setting_key, setting_value, description, updated_by) VALUES
  ('platform_fee_rate', '0.05', 'อัตราค่าธรรมเนียมคนกลาง Platform (5%)', 1),
  ('payment_deadline_hours', '2', 'ระยะเวลาที่ผู้ซื้อต้องชำระเงินก่อนคำสั่งซื้อหมดอายุ (ชั่วโมง)', 1),
  ('handover_timeout_hours', '72', 'ระยะเวลาสูงสุดที่ผู้ขายต้องส่งมอบรหัสก่อนระบบยกเลิกและคืนเงิน (ชั่วโมง)', 1),
  ('buyer_confirm_deadline_hours', '24', 'ระยะเวลาที่ผู้ซื้อต้องเข้าตรวจสอบบัญชีก่อนเริ่มแจ้งเตือน (ชั่วโมง)', 1),
  ('auto_release_hours', '48', 'ระยะเวลาที่ระบบจะปล่อยเงินอัตโนมัติหากผู้ซื้อไม่ดำเนินการใดๆ (ชั่วโมง)', 1),
  ('dispute_sla_hours', '48', 'ระยะเวลา SLA ในการตัดสินข้อพิพาทของทีมงาน (ชั่วโมง)', 1),
  ('badge_great_value_threshold', '0.85', 'เกณฑ์ป้ายคุ้มค่ามาก: ราคาขาย <= 85% ของ Fair Price', 1),
  ('badge_overpriced_threshold', '1.15', 'เกณฑ์ป้ายแพงเกิน: ราคาขาย > 115% ของ Fair Price', 1)
ON DUPLICATE KEY UPDATE setting_value = VALUES(setting_value), description = VALUES(description);

-- ── 8. Master Player Cards (55+ Real eFootball Cards) ──────────
-- card_tier_id: 1=Normal, 2=Epic, 3=Show Time, 4=Big Time
-- game_id: 1=eFootball 2025
INSERT INTO player_cards (game_id, player_name, card_tier_id, position_id, nationality, club, overall_rating, base_value, season) VALUES
  -- Epic Tier
  (1, 'Lionel Messi',          4, 10, 'Argentina',   'FC Barcelona',          104, 5500.00, '2024-2025'),
  (1, 'Cristiano Ronaldo',     4, 10, 'Portugal',    'Real Madrid',           103, 5200.00, '2024-2025'),
  (1, 'Neymar Jr',             4, 8,  'Brazil',      'Santos FC',             102, 4800.00, '2024-2025'),
  (1, 'Ronaldinho Gaucho',     2, 7,  'Brazil',      'FC Barcelona',          103, 5000.00, '2024-2025'),
  (1, 'Diego Maradona',        2, 11, 'Argentina',   'SSC Napoli',            102, 4700.00, '2024-2025'),
  (1, 'Johan Cruyff',          2, 11, 'Netherlands', 'FC Barcelona',          103, 5100.00, '2024-2025'),
  (1, 'Ruud Gullit',           2, 7,  'Netherlands', 'AC Milan',              104, 5600.00, '2024-2025'),
  (1, 'Patrick Vieira',        2, 5,  'France',      'Arsenal FC',            104, 5700.00, '2024-2025'),
  (1, 'Paolo Maldini',         2, 2,  'Italy',       'AC Milan',              103, 5200.00, '2024-2025'),
  (1, 'Franz Beckenbauer',     2, 2,  'Germany',     'FC Bayern München',     102, 4900.00, '2024-2025'),
  (1, 'Alessandro Nesta',      2, 2,  'Italy',       'AC Milan',              102, 4800.00, '2024-2025'),
  (1, 'Oliver Kahn',           2, 1,  'Germany',     'FC Bayern München',     101, 4400.00, '2024-2025'),
  (1, 'Peter Schmeichel',      2, 1,  'Denmark',     'Manchester United',     102, 4600.00, '2024-2025'),
  (1, 'Iker Casillas',         2, 1,  'Spain',       'Real Madrid',           101, 4300.00, '2024-2025'),
  (1, 'Roberto Carlos',        2, 3,  'Brazil',      'Real Madrid',           102, 4800.00, '2024-2025'),
  (1, 'Cafu',                  2, 4,  'Brazil',      'AC Milan',              101, 4500.00, '2024-2025'),
  (1, 'David Beckham',         2, 9,  'England',     'Manchester United',     102, 4900.00, '2024-2025'),
  (1, 'Zico',                  2, 7,  'Brazil',      'Flamengo',              101, 4400.00, '2024-2025'),
  (1, 'Kaka',                  2, 7,  'Brazil',      'AC Milan',              103, 5000.00, '2024-2025'),
  (1, 'Thierry Henry',         2, 10, 'France',      'Arsenal FC',            102, 4900.00, '2024-2025'),
  (1, 'Romario',               2, 10, 'Brazil',      'FC Barcelona',          103, 5100.00, '2024-2025'),
  (1, 'Dennis Bergkamp',       2, 11, 'Netherlands', 'Arsenal FC',            101, 4500.00, '2024-2025'),
  (1, 'Andrea Pirlo',          2, 6,  'Italy',       'Juventus FC',           102, 4700.00, '2024-2025'),
  (1, 'Frank Rijkaard',        2, 5,  'Netherlands', 'AC Milan',              103, 5300.00, '2024-2025'),
  (1, 'Clarence Seedorf',      2, 6,  'Netherlands', 'AC Milan',              101, 4400.00, '2024-2025'),
  (1, 'Edgar Davids',          2, 5,  'Netherlands', 'Juventus FC',           102, 4600.00, '2024-2025'),
  (1, 'Xavi Hernandez',        2, 6,  'Spain',       'FC Barcelona',          102, 4800.00, '2024-2025'),
  (1, 'Andres Iniesta',        2, 6,  'Spain',       'FC Barcelona',          103, 5000.00, '2024-2025'),
  (1, 'Carles Puyol',          2, 2,  'Spain',       'FC Barcelona',          101, 4500.00, '2024-2025'),
  (1, 'Didier Drogba',         2, 10, 'Ivory Coast', 'Chelsea FC',            102, 4700.00, '2024-2025'),
  (1, 'Samuel Etoo',           2, 10, 'Cameroon',    'FC Barcelona',          102, 4800.00, '2024-2025'),
  (1, 'Fernando Torres',       2, 10, 'Spain',       'Liverpool FC',          102, 4800.00, '2024-2025'),
  (1, 'Wayne Rooney',          2, 10, 'England',     'Manchester United',     102, 4700.00, '2024-2025'),
  (1, 'Michael Owen',          2, 10, 'England',     'Liverpool FC',          101, 4300.00, '2024-2025'),
  (1, 'Steven Gerrard',        2, 6,  'England',     'Liverpool FC',          102, 4800.00, '2024-2025'),
  (1, 'Frank Lampard',         2, 6,  'England',     'Chelsea FC',            101, 4500.00, '2024-2025'),
  (1, 'Paul Scholes',          2, 6,  'England',     'Manchester United',     101, 4400.00, '2024-2025'),
  (1, 'Rivaldo',               2, 7,  'Brazil',      'FC Barcelona',          101, 4500.00, '2024-2025'),
  (1, 'Luis Figo',             2, 9,  'Portugal',    'Real Madrid',           101, 4400.00, '2024-2025'),
  (1, 'Roberto Baggio',        2, 11, 'Italy',       'Juventus FC',           102, 4800.00, '2024-2025'),

  -- Show Time Tier
  (1, 'Erling Haaland',        3, 10, 'Norway',      'Manchester City',       103, 4900.00, '2024-2025'),
  (1, 'Kylian Mbappe',         3, 10, 'France',      'Real Madrid',           104, 5300.00, '2024-2025'),
  (1, 'Jude Bellingham',       3, 7,  'England',     'Real Madrid',           103, 5000.00, '2024-2025'),
  (1, 'Vinicius Junior',       3, 8,  'Brazil',      'Real Madrid',           102, 4700.00, '2024-2025'),
  (1, 'Kevin De Bruyne',       3, 7,  'Belgium',     'Manchester City',       102, 4600.00, '2024-2025'),
  (1, 'Rodri',                 3, 5,  'Spain',       'Manchester City',       103, 5100.00, '2024-2025'),
  (1, 'Bukayo Saka',           3, 9,  'England',     'Arsenal FC',            101, 4300.00, '2024-2025'),
  (1, 'Mohamed Salah',         3, 9,  'Egypt',       'Liverpool FC',          102, 4600.00, '2024-2025'),
  (1, 'Harry Kane',            3, 10, 'England',     'FC Bayern München',     102, 4500.00, '2024-2025'),
  (1, 'Son Heung-min',         3, 8,  'South Korea', 'Tottenham Hotspur',     101, 4200.00, '2024-2025'),
  (1, 'Virgil van Dijk',       3, 2,  'Netherlands', 'Liverpool FC',          102, 4700.00, '2024-2025'),
  (1, 'William Saliba',        3, 2,  'France',      'Arsenal FC',            101, 4400.00, '2024-2025'),
  (1, 'Thibaut Courtois',      3, 1,  'Belgium',     'Real Madrid',           102, 4600.00, '2024-2025'),
  (1, 'Gianluigi Donnarumma',  3, 1,  'Italy',       'Paris Saint-Germain',   101, 4300.00, '2024-2025'),
  (1, 'Alisson Becker',        3, 1,  'Brazil',      'Liverpool FC',          101, 4300.00, '2024-2025');
