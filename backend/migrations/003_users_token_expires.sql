-- ============================================================
-- Migración 003: Columna token_expires_at en users (RF-AUT-02)
-- ============================================================
-- Permite que login.php guarde cuándo caduca el token (24h si
-- remember_me=false, 30 días si true). El middleware que valida
-- el token en otros endpoints se actualizará en fases siguientes.
-- ============================================================

SET @sql := IF((SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'users' AND COLUMN_NAME = 'token_expires_at') = 0,
  'ALTER TABLE `users` ADD COLUMN `token_expires_at` TIMESTAMP NULL DEFAULT NULL AFTER `token`',
  'SELECT 1'); PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;