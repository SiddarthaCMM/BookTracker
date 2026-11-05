-- ============================================================
-- Migración 002: Ajustes para login robusto (RF-AUT-02)
-- ============================================================
-- - Garantiza columnas necesarias en users (is_active, last_login_at).
-- - Limpia intentos viejos de login_attempts.
-- - (La tabla login_attempts ya fue creada en la migración 001.)
-- ============================================================

SET FOREIGN_KEY_CHECKS = 0;
START TRANSACTION;

-- 1) Asegurar columna is_active (RF-AUT-02: cuentas desactivadas)
SET @sql := IF((SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'users' AND COLUMN_NAME = 'is_active') = 0,
  'ALTER TABLE `users` ADD COLUMN `is_active` TINYINT(1) NOT NULL DEFAULT 1',
  'SELECT 1'); PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- 2) Asegurar columna last_login_at
SET @sql := IF((SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'users' AND COLUMN_NAME = 'last_login_at') = 0,
  'ALTER TABLE `users` ADD COLUMN `last_login_at` TIMESTAMP NULL DEFAULT NULL',
  'SELECT 1'); PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- 3) Tabla login_attempts (idempotente)
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

-- 4) Limpieza de intentos viejos (>24h) en cada ejecución
DELETE FROM `login_attempts` WHERE `created_at` < (NOW() - INTERVAL 24 HOUR);

SET FOREIGN_KEY_CHECKS = 1;
COMMIT;