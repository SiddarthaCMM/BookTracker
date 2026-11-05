-- ============================================================
-- Migración 005: Tabla email_verifications (RF-AUT-04)
-- ============================================================
-- Guarda los códigos de verificación de correo.
-- Solo se guarda el HASH SHA-256 del código, nunca en claro.
-- Vigencia: 24 horas. Pedir uno nuevo invalida los anteriores.
-- ============================================================

SET FOREIGN_KEY_CHECKS = 0;
START TRANSACTION;

CREATE TABLE IF NOT EXISTS `email_verifications` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `user_id` INT NOT NULL,
  `token_hash` CHAR(64) NOT NULL,            -- SHA-256 del código (hex = 64 chars)
  `expires_at` TIMESTAMP NOT NULL,           -- 24 horas tras crear
  `used_at` TIMESTAMP NULL DEFAULT NULL,     -- cuando se usó para verificar
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_user_active` (`user_id`, `used_at`),
  KEY `idx_token_hash` (`token_hash`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Limpieza: borrar códigos expirados/usados > 48h
DELETE FROM `email_verifications`
WHERE (expires_at < NOW() - INTERVAL 48 HOUR)
   OR (used_at IS NOT NULL AND used_at < NOW() - INTERVAL 48 HOUR);

SET FOREIGN_KEY_CHECKS = 1;
COMMIT;