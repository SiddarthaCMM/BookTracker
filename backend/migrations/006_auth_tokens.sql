-- ============================================================
-- Migración 006: Tabla auth_tokens (RF-AUT-05)
-- ============================================================
-- El token se guarda SOLO como hash SHA-256. Nunca en claro.
-- Caducidad deslizante: 30 días si remember_me, 24h si no.
-- Cada uso actualiza last_used_at y renueva expires_at.
--
-- MIGRACIÓN PEREZOSA: los tokens que ya están en users.token
-- (texto plano) seguirán funcionando vía el middleware hasta que
-- cada usuario vuelva a iniciar sesión; en ese momento se migran
-- a auth_tokens y se eliminan de users.token.
-- ============================================================

SET FOREIGN_KEY_CHECKS = 0;
START TRANSACTION;

CREATE TABLE IF NOT EXISTS `auth_tokens` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `user_id` INT NOT NULL,
  `token_hash` CHAR(64) NOT NULL,            -- SHA-256 del token (hex = 64 chars)
  `device_label` VARCHAR(120) DEFAULT NULL,  -- info legible del dispositivo
  `expires_at` TIMESTAMP NOT NULL,
  `last_used_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `revoked_at` TIMESTAMP NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_token_hash` (`token_hash`),
  KEY `idx_user_active` (`user_id`, `revoked_at`),
  KEY `idx_expires` (`expires_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Limpieza de tokens expirados/revocados > 35 días
DELETE FROM `auth_tokens`
WHERE (expires_at < NOW() - INTERVAL 35 DAY)
   OR (revoked_at IS NOT NULL AND revoked_at < NOW() - INTERVAL 35 DAY);

SET FOREIGN_KEY_CHECKS = 1;
COMMIT;