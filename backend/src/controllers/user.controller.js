const bcrypt = require('bcryptjs');
const db = require('../config/db');

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const PROFILE_FIELDS = 'id, name, email, avatar_url, created_at';

async function getProfile(req, res) {
  try {
    const [rows] = await db.query(
      `SELECT ${PROFILE_FIELDS} FROM users WHERE id = ?`,
      [req.user.id]
    );
    if (!rows[0]) {
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }
    res.json(rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error del servidor' });
  }
}

async function updateProfile(req, res) {
  try {
    const { name, email } = req.body;

    if (typeof name !== 'string' || typeof email !== 'string' || !name.trim() || !email.trim()) {
      return res.status(400).json({ message: 'Nombre y correo son obligatorios' });
    }

    const cleanEmail = email.trim().toLowerCase();

    if (!EMAIL_REGEX.test(cleanEmail)) {
      return res.status(400).json({ message: 'El correo no es válido' });
    }

    await db.query(
      'UPDATE users SET name = ?, email = ? WHERE id = ?',
      [name.trim(), cleanEmail, req.user.id]
    );

    const [rows] = await db.query(
      `SELECT ${PROFILE_FIELDS} FROM users WHERE id = ?`,
      [req.user.id]
    );
    if (!rows[0]) {
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }
    res.json(rows[0]);
  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ message: 'Ese correo ya está en uso' });
    }
    console.error(error);
    res.status(500).json({ message: 'Error del servidor' });
  }
}

async function changePassword(req, res) {
  try {
    const { currentPassword, newPassword } = req.body;

    if (
      typeof currentPassword !== 'string' || typeof newPassword !== 'string' ||
      !currentPassword || !newPassword
    ) {
      return res.status(400).json({ message: 'La contraseña actual y la nueva son obligatorias' });
    }
    if (newPassword.length < 8) {
      return res.status(400).json({ message: 'La nueva contraseña debe tener al menos 8 caracteres' });
    }
    if (newPassword === currentPassword) {
      return res.status(400).json({ message: 'La nueva contraseña debe ser distinta a la actual' });
    }

    const [rows] = await db.query(
      'SELECT password_hash FROM users WHERE id = ?',
      [req.user.id]
    );
    if (!rows[0]) {
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }

    const matches = await bcrypt.compare(currentPassword, rows[0].password_hash);
    if (!matches) {
      // Se usa 400 y no 401: un 401 haría creer al frontend que la sesión venció
      return res.status(400).json({ message: 'La contraseña actual es incorrecta' });
    }

    const newHash = await bcrypt.hash(newPassword, 10);
    await db.query('UPDATE users SET password_hash = ? WHERE id = ?', [newHash, req.user.id]);

    // Si había un enlace de recuperación pendiente, deja de servir
    await db.query('DELETE FROM password_resets WHERE user_id = ?', [req.user.id]);

    res.json({ message: 'Contraseña actualizada' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error del servidor' });
  }
}

module.exports = { getProfile, updateProfile, changePassword };