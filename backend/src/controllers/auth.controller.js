const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../config/db');

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function createToken(userId) {
  return jwt.sign({ id: userId }, process.env.JWT_SECRET, { expiresIn: '2h' });
}

async function register(req, res) {
  try {
    const { name, email, password } = req.body;

    if (
      typeof name !== 'string' || typeof email !== 'string' ||
      typeof password !== 'string' || !name.trim() || !email.trim() || !password
    ) {
      return res.status(400).json({ message: 'Nombre, correo y contraseña son obligatorios' });
    }

    const cleanEmail = email.trim().toLowerCase();

    if (!EMAIL_REGEX.test(cleanEmail)) {
      return res.status(400).json({ message: 'El correo no es válido' });
    }
    if (password.length < 8) {
      return res.status(400).json({ message: 'La contraseña debe tener al menos 8 caracteres' });
    }

    const hash = await bcrypt.hash(password, 10);

    const [result] = await db.query(
      'INSERT INTO users (name, email, password_hash) VALUES (?, ?, ?)',
      [name.trim(), cleanEmail, hash]
    );

    res.status(201).json({
      token: createToken(result.insertId),
      user: { id: result.insertId, name: name.trim(), email: cleanEmail }
    });
  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ message: 'Ese correo ya está registrado' });
    }
    console.error(error);
    res.status(500).json({ message: 'Error del servidor' });
  }
}

async function login(req, res) {
  try {
    const { email, password } = req.body;

    if (typeof email !== 'string' || typeof password !== 'string' || !email.trim() || !password) {
      return res.status(400).json({ message: 'Correo y contraseña son obligatorios' });
    }

    const [rows] = await db.query(
      'SELECT id, name, email, password_hash FROM users WHERE email = ?',
      [email.trim().toLowerCase()]
    );
    const user = rows[0];

    // Mismo mensaje si el correo no existe o la contraseña es incorrecta:
    // así nadie puede averiguar qué correos están registrados.
    if (!user || !(await bcrypt.compare(password, user.password_hash))) {
      return res.status(401).json({ message: 'Credenciales inválidas' });
    }

    res.json({
      token: createToken(user.id),
      user: { id: user.id, name: user.name, email: user.email }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error del servidor' });
  }
}

async function me(req, res) {
  try {
    const [rows] = await db.query(
      'SELECT id, name, email, avatar_url, created_at FROM users WHERE id = ?',
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

module.exports = { register, login, me };