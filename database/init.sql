-- ============================================================
-- init.sql
-- Se ejecuta automáticamente por la imagen oficial de MySQL
-- (todo archivo .sql en /docker-entrypoint-initdb.d se corre
-- solo la PRIMERA vez que se crea el volumen de datos).
-- ============================================================

CREATE DATABASE IF NOT EXISTS electric_services_db
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE electric_services_db;

-- Tabla relacional para almacenar los mensajes de contacto
CREATE TABLE IF NOT EXISTS contact_messages (
  id              INT AUTO_INCREMENT PRIMARY KEY,
  full_name       VARCHAR(120)      NOT NULL,
  email           VARCHAR(150)      NOT NULL,
  phone           VARCHAR(30)       NULL,
  service_type    ENUM(
                    'instalacion_electrica',
                    'reparacion',
                    'mantenimiento',
                    'certificacion',
                    'otro'
                  ) NOT NULL DEFAULT 'otro',
  message         TEXT              NOT NULL,
  status          ENUM('nuevo', 'contactado', 'resuelto') NOT NULL DEFAULT 'nuevo',
  created_at      TIMESTAMP         NOT NULL DEFAULT CURRENT_TIMESTAMP,

  INDEX idx_email (email),
  INDEX idx_status (status),
  INDEX idx_created_at (created_at)
) ENGINE=InnoDB;

-- Otorga permisos al usuario de aplicación sobre esta base de datos.
-- (El usuario ya se crea vía las variables MYSQL_USER / MYSQL_PASSWORD
-- de la imagen oficial, esto es un refuerzo explícito).
GRANT SELECT, INSERT, UPDATE ON electric_services_db.contact_messages TO 'electric_app'@'%';
FLUSH PRIVILEGES;
