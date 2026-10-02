const db = require('../config/db');

function parseId(value) {
  const id = Number(value);
  return Number.isInteger(id) && id > 0 ? id : null;
}

function validateName(name) {
  if (typeof name !== 'string' || !name.trim()) {
    return 'El nombre es obligatorio';
  }
  if (name.trim().length > 50) {
    return 'El nombre no puede superar 50 caracteres';
  }
  return null;
}

async function getCategories(req, res) {
  try {
    const [rows] = await db.query(
      'SELECT id, name FROM categories WHERE user_id = ? ORDER BY name',
      [req.user.id]
    );
    res.json(rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error del servidor' });
  }
}

async function createCategory(req, res) {
  try {
    const error = validateName(req.body.name);
    if (error) {
      return res.status(400).json({ message: error });
    }
    const name = req.body.name.trim();

    const [result] = await db.query(
      'INSERT INTO categories (user_id, name) VALUES (?, ?)',
      [req.user.id, name]
    );

    res.status(201).json({ id: result.insertId, name });
  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ message: 'Ya tienes una categoría con ese nombre' });
    }
    console.error(error);
    res.status(500).json({ message: 'Error del servidor' });
  }
}

async function updateCategory(req, res) {
  try {
    const id = parseId(req.params.id);
    if (!id) {
      return res.status(400).json({ message: 'Id inválido' });
    }

    const error = validateName(req.body.name);
    if (error) {
      return res.status(400).json({ message: error });
    }
    const name = req.body.name.trim();

    const [result] = await db.query(
      'UPDATE categories SET name = ? WHERE id = ? AND user_id = ?',
      [name, id, req.user.id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Categoría no encontrada' });
    }

    res.json({ id, name });
  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ message: 'Ya tienes una categoría con ese nombre' });
    }
    console.error(error);
    res.status(500).json({ message: 'Error del servidor' });
  }
}

async function deleteCategory(req, res) {
  try {
    const id = parseId(req.params.id);
    if (!id) {
      return res.status(400).json({ message: 'Id inválido' });
    }

    const [result] = await db.query(
      'DELETE FROM categories WHERE id = ? AND user_id = ?',
      [id, req.user.id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Categoría no encontrada' });
    }

    res.json({ message: 'Categoría eliminada' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error del servidor' });
  }
}

module.exports = { getCategories, createCategory, updateCategory, deleteCategory };