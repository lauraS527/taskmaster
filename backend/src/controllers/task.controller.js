const db = require('../config/db');

const PRIORITIES = ['baja', 'media', 'alta'];
const STATUSES = ['pendiente', 'en_progreso', 'completada'];

// Columnas que devuelve cada consulta. DATE_FORMAT entrega la fecha como
// "2026-10-15" y evita desfases de zona horaria.
const TASK_FIELDS = `
  t.id, t.title, t.description,
  DATE_FORMAT(t.due_date, '%Y-%m-%d') AS due_date,
  t.priority, t.status, t.category_id,
  c.name AS category_name, t.created_at
`;
const TASK_FROM = 'FROM tasks t LEFT JOIN categories c ON c.id = t.category_id';

// Orden permitido. Esta lista cerrada evita inyectar SQL por el parámetro "sort".
// En due_date, las tareas sin fecha quedan siempre al final.
const SORT_COLUMNS = {
  due_date: 't.due_date',
  priority: 't.priority',
  created_at: 't.created_at',
  title: 't.title'
};

function parseId(value) {
  const id = Number(value);
  return Number.isInteger(id) && id > 0 ? id : null;
}

function isValidDate(value) {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return false;
  }
  const [year, month, day] = value.split('-').map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  return (
    date.getUTCFullYear() === year &&
    date.getUTCMonth() === month - 1 &&
    date.getUTCDate() === day
  );
}

// Valida lo que llega y devuelve solo los campos permitidos.
// partial = true: sirve para editar (se aceptan solo los campos enviados).
function parseTaskInput(body, { partial }) {
  const data = {};

  if (!partial || body.title !== undefined) {
    if (typeof body.title !== 'string' || !body.title.trim()) {
      return { error: 'El título es obligatorio' };
    }
    if (body.title.trim().length > 150) {
      return { error: 'El título no puede superar 150 caracteres' };
    }
    data.title = body.title.trim();
  }

  if (body.description !== undefined) {
    if (body.description !== null && typeof body.description !== 'string') {
      return { error: 'La descripción debe ser texto' };
    }
    const description = body.description ? body.description.trim() : '';
    if (description.length > 2000) {
      return { error: 'La descripción no puede superar 2000 caracteres' };
    }
    data.description = description || null;
  }

  if (body.due_date !== undefined) {
    if (body.due_date !== null && !isValidDate(body.due_date)) {
      return { error: 'La fecha debe tener el formato AAAA-MM-DD y ser real' };
    }
    data.due_date = body.due_date;
  }

  if (body.priority !== undefined) {
    if (!PRIORITIES.includes(body.priority)) {
      return { error: 'La prioridad debe ser baja, media o alta' };
    }
    data.priority = body.priority;
  }

  if (body.status !== undefined) {
    if (!STATUSES.includes(body.status)) {
      return { error: 'El estado debe ser pendiente, en_progreso o completada' };
    }
    data.status = body.status;
  }

  if (body.category_id !== undefined) {
    if (body.category_id !== null && !parseId(body.category_id)) {
      return { error: 'La categoría no es válida' };
    }
    data.category_id = body.category_id === null ? null : parseId(body.category_id);
  }

  if (partial && Object.keys(data).length === 0) {
    return { error: 'No enviaste ningún campo para actualizar' };
  }

  return { data };
}

async function categoryBelongsToUser(categoryId, userId) {
  const [rows] = await db.query(
    'SELECT id FROM categories WHERE id = ? AND user_id = ?',
    [categoryId, userId]
  );
  return rows.length > 0;
}

async function findTask(id, userId) {
  const [rows] = await db.query(
    `SELECT ${TASK_FIELDS} ${TASK_FROM} WHERE t.id = ? AND t.user_id = ?`,
    [id, userId]
  );
  return rows[0] || null;
}

async function createTask(req, res) {
  try {
    const { data, error } = parseTaskInput(req.body || {}, { partial: false });
    if (error) {
      return res.status(400).json({ message: error });
    }

    if (data.category_id && !(await categoryBelongsToUser(data.category_id, req.user.id))) {
      return res.status(400).json({ message: 'La categoría no existe' });
    }

    const [result] = await db.query(
      `INSERT INTO tasks (user_id, category_id, title, description, due_date, priority, status)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        req.user.id,
        data.category_id ?? null,
        data.title,
        data.description ?? null,
        data.due_date ?? null,
        data.priority ?? 'media',
        data.status ?? 'pendiente'
      ]
    );

    res.status(201).json(await findTask(result.insertId, req.user.id));
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error del servidor' });
  }
}

async function getTasks(req, res) {
  try {
    const { status, priority, category_id, sort, order } = req.query;

    const where = ['t.user_id = ?'];
    const params = [req.user.id];

    if (status !== undefined) {
      if (!STATUSES.includes(status)) {
        return res.status(400).json({ message: 'Estado inválido' });
      }
      where.push('t.status = ?');
      params.push(status);
    }

    if (priority !== undefined) {
      if (!PRIORITIES.includes(priority)) {
        return res.status(400).json({ message: 'Prioridad inválida' });
      }
      where.push('t.priority = ?');
      params.push(priority);
    }

    if (category_id !== undefined) {
      const categoryId = parseId(category_id);
      if (!categoryId) {
        return res.status(400).json({ message: 'Categoría inválida' });
      }
      where.push('t.category_id = ?');
      params.push(categoryId);
    }

    const sortKey = sort ?? 'created_at';
    if (!Object.prototype.hasOwnProperty.call(SORT_COLUMNS, sortKey)) {
      return res.status(400).json({ message: 'Orden inválido' });
    }

    if (order !== undefined && !['asc', 'desc'].includes(order)) {
      return res.status(400).json({ message: 'El orden debe ser asc o desc' });
    }
    // Sin "sort" se muestran primero las tareas más recientes
    const direction = (order ?? (sort === undefined ? 'desc' : 'asc')) === 'desc' ? 'DESC' : 'ASC';

// Las tareas sin fecha quedan siempre al final, sea el orden asc o desc
    const nullsLast = sortKey === 'due_date' ? 't.due_date IS NULL, ' : '';

    const [rows] = await db.query(
        `SELECT ${TASK_FIELDS} ${TASK_FROM}
        WHERE ${where.join(' AND ')}
        ORDER BY ${nullsLast}${SORT_COLUMNS[sortKey]} ${direction}, t.id ${direction}`,
        params
    );

    res.json(rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error del servidor' });
  }
}

async function getTask(req, res) {
  try {
    const id = parseId(req.params.id);
    if (!id) {
      return res.status(400).json({ message: 'Id inválido' });
    }

    const task = await findTask(id, req.user.id);
    if (!task) {
      return res.status(404).json({ message: 'Tarea no encontrada' });
    }

    res.json(task);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error del servidor' });
  }
}

async function updateTask(req, res) {
  try {
    const id = parseId(req.params.id);
    if (!id) {
      return res.status(400).json({ message: 'Id inválido' });
    }

    const { data, error } = parseTaskInput(req.body || {}, { partial: true });
    if (error) {
      return res.status(400).json({ message: error });
    }

    if (!(await findTask(id, req.user.id))) {
      return res.status(404).json({ message: 'Tarea no encontrada' });
    }

    if (data.category_id && !(await categoryBelongsToUser(data.category_id, req.user.id))) {
      return res.status(400).json({ message: 'La categoría no existe' });
    }

    // Los nombres de columna salen de parseTaskInput (lista fija),
    // nunca de lo que escribe el usuario. Los valores van con "?".
    const columns = Object.keys(data).map((key) => `${key} = ?`).join(', ');
    await db.query(
      `UPDATE tasks SET ${columns} WHERE id = ? AND user_id = ?`,
      [...Object.values(data), id, req.user.id]
    );

    res.json(await findTask(id, req.user.id));
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error del servidor' });
  }
}

async function deleteTask(req, res) {
  try {
    const id = parseId(req.params.id);
    if (!id) {
      return res.status(400).json({ message: 'Id inválido' });
    }

    const [result] = await db.query(
      'DELETE FROM tasks WHERE id = ? AND user_id = ?',
      [id, req.user.id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Tarea no encontrada' });
    }

    res.json({ message: 'Tarea eliminada' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error del servidor' });
  }
}

module.exports = { createTask, getTasks, getTask, updateTask, deleteTask };