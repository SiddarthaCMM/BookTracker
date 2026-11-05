-- ============================================================
-- Migración 001: Tabla users para soporte de registro y roles
-- ============================================================
-- Objetivo: llevar la tabla `users` al esquema definido en
-- la sección 3 del documento de requerimientos, SIN perder
-- los usuarios existentes (en particular el admin id=3).
--
-- Idempotente: se puede ejecutar varias veces sin romper.
-- Requisitos: MySQL 5.7+ / MariaDB 10.2+.
-- ============================================================

SET FOREIGN_KEY_CHECKS = 0;
START TRANSACTION;

-- ------------------------------------------------------------
-- 1) Tabla users: pasar de (email, password) al esquema nuevo
-- ------------------------------------------------------------

-- 1.1) Si la columna password existe pero password_hash no,
--      renombramos password -> password_hash.
SET @col_password_exists := (
  SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'users'
    AND COLUMN_NAME = 'password'
);

SET @col_password_hash_exists := (
  SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'users'
    AND COLUMN_NAME = 'password_hash'
);

SET @sql := IF(@col_password_exists = 1 AND @col_password_hash_exists = 0,
  'ALTER TABLE `users` CHANGE `password` `password_hash` VARCHAR(255) NOT NULL',
  'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- 1.2) Añadir columnas nuevas si no existen.

-- username
SET @sql := IF((SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'users' AND COLUMN_NAME = 'username') = 0,
  'ALTER TABLE `users` ADD COLUMN `username` VARCHAR(20) DEFAULT NULL AFTER `email`',
  'SELECT 1'); PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- role
SET @sql := IF((SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'users' AND COLUMN_NAME = 'role') = 0,
  'ALTER TABLE `users` ADD COLUMN `role` VARCHAR(10) NOT NULL DEFAULT ''user'' AFTER `password_hash`',
  'SELECT 1'); PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- display_name
SET @sql := IF((SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'users' AND COLUMN_NAME = 'display_name') = 0,
  'ALTER TABLE `users` ADD COLUMN `display_name` VARCHAR(100) DEFAULT NULL AFTER `role`',
  'SELECT 1'); PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- birth_date
SET @sql := IF((SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'users' AND COLUMN_NAME = 'birth_date') = 0,
  'ALTER TABLE `users` ADD COLUMN `birth_date` DATE DEFAULT NULL AFTER `display_name`',
  'SELECT 1'); PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- language
SET @sql := IF((SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'users' AND COLUMN_NAME = 'language') = 0,
  'ALTER TABLE `users` ADD COLUMN `language` VARCHAR(2) NOT NULL DEFAULT ''es'' AFTER `birth_date`',
  'SELECT 1'); PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- avatar_path
SET @sql := IF((SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'users' AND COLUMN_NAME = 'avatar_path') = 0,
  'ALTER TABLE `users` ADD COLUMN `avatar_path` VARCHAR(500) DEFAULT NULL AFTER `language`',
  'SELECT 1'); PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- is_active
SET @sql := IF((SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'users' AND COLUMN_NAME = 'is_active') = 0,
  'ALTER TABLE `users` ADD COLUMN `is_active` TINYINT(1) NOT NULL DEFAULT 1 AFTER `avatar_path`',
  'SELECT 1'); PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- email_verified_at
SET @sql := IF((SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'users' AND COLUMN_NAME = 'email_verified_at') = 0,
  'ALTER TABLE `users` ADD COLUMN `email_verified_at` TIMESTAMP NULL DEFAULT NULL AFTER `is_active`',
  'SELECT 1'); PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- last_login_at
SET @sql := IF((SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'users' AND COLUMN_NAME = 'last_login_at') = 0,
  'ALTER TABLE `users` ADD COLUMN `last_login_at` TIMESTAMP NULL DEFAULT NULL AFTER `email_verified_at`',
  'SELECT 1'); PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- updated_at
SET @sql := IF((SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'users' AND COLUMN_NAME = 'updated_at') = 0,
  'ALTER TABLE `users` ADD COLUMN `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP AFTER `created_at`',
  'SELECT 1'); PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- 1.3) Token: el PHP actual usa `users.token`. Lo dejamos tal cual
--      por compatibilidad hacia atrás hasta implementar auth_tokens
--      (RF-AUT-05). Si no existe, lo creamos vacío.
SET @sql := IF((SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'users' AND COLUMN_NAME = 'token') = 0,
  'ALTER TABLE `users` ADD COLUMN `token` VARCHAR(64) DEFAULT NULL AFTER `password_hash`',
  'SELECT 1'); PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- 1.4) Índice único sobre username (case-insensitive).
SET @has_username_idx := (
  SELECT COUNT(*) FROM INFORMATION_SCHEMA.STATISTICS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'users' AND INDEX_NAME = 'uq_username_lc'
);
SET @sql := IF(@has_username_idx = 0,
  CONCAT('ALTER TABLE `users` ADD COLUMN `username_lc` VARCHAR(20) GENERATED ALWAYS AS (LOWER(`username`)) STORED, ',
         'ADD UNIQUE KEY `uq_username_lc` (`username_lc`)'),
  'SELECT 1'); PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- ------------------------------------------------------------
-- 2) Migración de datos del usuario existente (admin@test.com)
-- ------------------------------------------------------------
UPDATE `users`
SET `username` = SUBSTRING_INDEX(`email`, '@', 1)
WHERE `username` IS NULL OR `username` = '';

UPDATE `users`
SET `role` = 'admin'
WHERE `email` = 'admin@test.com';

UPDATE `users`
SET `email_verified_at` = COALESCE(`email_verified_at`, NOW())
WHERE `email` = 'admin@test.com';

-- ------------------------------------------------------------
-- 3) Tabla login_attempts (rate-limit: registro y login)
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `login_attempts` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `ip_address` VARCHAR(45) NOT NULL,
  `email` VARCHAR(254) DEFAULT NULL,
  `event_type` VARCHAR(20) NOT NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_ip_event_time` (`ip_address`, `event_type`, `created_at`),
  KEY `idx_email_event_time` (`email`, `event_type`, `created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

DELETE FROM `login_attempts` WHERE `created_at` < (NOW() - INTERVAL 24 HOUR);

SET FOREIGN_KEY_CHECKS = 1;
COMMIT;

SELECT
  (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'users' AND COLUMN_NAME IN ('password_hash','role','username','display_name','birth_date','language','avatar_path','is_active','email_verified_at','last_login_at','updated_at')) AS cols_users,
  (SELECT COUNT(*) FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'login_attempts') AS tabla_login_attempts_ok;