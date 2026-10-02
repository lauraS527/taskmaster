-- ============================================================
-- TaskMaster - Esquema de la base de datos
-- ============================================================

-- Crea la base de datos (si no existe) y la selecciona para usarla.
-- utf8mb4 permite guardar tildes, ñ y emojis sin problemas.
CREATE DATABASE IF NOT EXISTS taskmaster CHARACTER SET utf8mb4;
USE taskmaster;

-- ------------------------------------------------------------
-- Tabla users: una fila por cada persona registrada
-- ------------------------------------------------------------
CREATE TABLE users (
  id INT AUTO_INCREMENT PRIMARY KEY,            -- número único, se genera solo (1, 2, 3...)
  name VARCHAR(100) NOT NULL,                   -- NOT NULL = es obligatorio
  email VARCHAR(150) NOT NULL UNIQUE,           -- UNIQUE = no pueden existir dos iguales
  password_hash VARCHAR(255) NOT NULL,          -- contraseña cifrada, NUNCA en texto normal
  avatar_url VARCHAR(255),                      -- foto de perfil (opcional, puede quedar vacío)
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP -- fecha de registro, se llena sola
);

-- ------------------------------------------------------------
-- Tabla categories: las etiquetas que crea cada usuario
-- ------------------------------------------------------------
CREATE TABLE categories (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,                         -- a qué usuario pertenece la categoría
  name VARCHAR(50) NOT NULL,
  UNIQUE (user_id, name),                    -- un mismo usuario no puede tener dos categorías con el mismo nombre
  FOREIGN KEY (user_id) REFERENCES users(id)
    ON DELETE CASCADE                           -- si se borra el usuario, se borran sus categorías
);

-- ------------------------------------------------------------
-- Tabla tasks: las tareas
-- ------------------------------------------------------------
CREATE TABLE tasks (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,                         -- dueño de la tarea
  category_id INT NULL,                         -- categoría (opcional)
  title VARCHAR(150) NOT NULL,
  description TEXT,                             -- TEXT permite textos largos
  due_date DATE,                                -- fecha de vencimiento
  priority ENUM('baja', 'media', 'alta') DEFAULT 'media',
  status ENUM('pendiente', 'en_progreso', 'completada') DEFAULT 'pendiente',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id)
    ON DELETE CASCADE,                          -- si se borra el usuario, se borran sus tareas
  FOREIGN KEY (category_id) REFERENCES categories(id)
    ON DELETE SET NULL                          -- si se borra la categoría, la tarea se conserva sin categoría
);

-- ------------------------------------------------------------
-- Tabla password_resets: códigos temporales para recuperar contraseña
-- ------------------------------------------------------------
CREATE TABLE password_resets (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  token_hash VARCHAR(255) NOT NULL,             -- el código se guarda cifrado, igual que las contraseñas
  expires_at DATETIME NOT NULL,                 -- a partir de cuándo deja de servir
  FOREIGN KEY (user_id) REFERENCES users(id)
    ON DELETE CASCADE
);
