-- ============================================================
-- Migración 004: Tabla password_resets (RF-AUT-03)
-- ============================================================
-- Guarda los códigos de recuperación de contraseña.
-- Importante: solo se guarda el HASH del código, nunca el código
-- en claro (igual que las contraseñas).
-- Un usuario solo puede tener un código activo a la vez: pedir uno
-- nuevo invalida (used_at = NOW()) los anteriores.
-- ============================================================

SET FOREIGN_KEY_CHECKS = 0;
START TRANSACTION;

CREATE TABLE IF NOT EXISTS `password_resets` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `user_id` INT NOT NULL,
  `token_hash` CHAR(64) NOT NULL,            -- SHA-256 del código (hex = 64 chars)
  `expires_at` TIMESTAMP NOT NULL,           -- 60 minutos tras crear
  `used_at` TIMESTAMP NULL DEFAULT NULL,     -- cuando se usó para cambiar la contraseña
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_user_active` (`user_id`, `used_at`),
  KEY `idx_token_hash` (`token_hash`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Limpieza: borrar códigos ya expirados y usados > 24h en cada ejecución
DELETE FROM `password_resets`
WHERE (expires_at < NOW() - INTERVAL 24 HOUR)
   OR (used_at IS NOT NULL AND used_at < NOW() - INTERVAL 24 HOUR);

SET FOREIGN_KEY_CHECKS = 1;
COMMIT;