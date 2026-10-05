import { useState } from 'react';
import { PRIORITIES, STATUSES } from '../constants/tasks';

// Formulario para crear (task = null) o editar (task = la tarea) una tarea.
// Cada campo es un "input controlado": su valor vive en el estado del componente.
export default function TaskForm({ task, categories, saving, error, onSubmit, onCancel }) {
  const [title, setTitle] = useState(task?.title ?? '');
  const [description, setDescription] = useState(task?.description ?? '');
  const [dueDate, setDueDate] = useState(task?.due_date ?? '');
  const [priority, setPriority] = useState(task?.priority ?? 'media');
  const [status, setStatus] = useState(task?.status ?? 'pendiente');
  // Los <select> trabajan con texto, por eso el id de la categoría se guarda como texto
  const [categoryId, setCategoryId] = useState(task?.category_id ? String(task.category_id) : '');

  function handleSubmit(event) {
    event.preventDefault();

    // Si la categoría elegida se borró mientras el formulario estaba abierto, se envía sin categoría
    const categoryStillExists = categories.some((category) => String(category.id) === categoryId);

    onSubmit({
      title: title.trim(),
      description: description.trim() || null,
      due_date: dueDate || null,
      priority,
      status,
      category_id: categoryStillExists ? Number(categoryId) : null
    });
  }

  return (
    <form className="auth-card profile-card" onSubmit={handleSubmit}>
      <h2>{task ? 'Editar tarea' : 'Nueva tarea'}</h2>

      {error && (
        <p className="form-error" role="alert">
          {error}
        </p>
      )}

      <label htmlFor="task-title">Título</label>
      <input
        id="task-title"
        type="text"
        value={title}
        onChange={(event) => setTitle(event.target.value)}
        maxLength={150}
        required
        autoFocus
      />

      <label htmlFor="task-description">Descripción (opcional)</label>
      <textarea
        id="task-description"
        value={description}
        onChange={(event) => setDescription(event.target.value)}
        maxLength={2000}
      />

      <label htmlFor="task-due">Fecha de vencimiento (opcional)</label>
      <input
        id="task-due"
        type="date"
        value={dueDate}
        onChange={(event) => setDueDate(event.target.value)}
      />

      <label htmlFor="task-priority">Prioridad</label>
      <select
        id="task-priority"
        value={priority}
        onChange={(event) => setPriority(event.target.value)}
      >
        {PRIORITIES.map((item) => (
          <option key={item.value} value={item.value}>
            {item.label}
          </option>
        ))}
      </select>

      <label htmlFor="task-status">Estado</label>
      <select id="task-status" value={status} onChange={(event) => setStatus(event.target.value)}>
        {STATUSES.map((item) => (
          <option key={item.value} value={item.value}>
            {item.label}
          </option>
        ))}
      </select>

      <label htmlFor="task-category">Categoría</label>
      <select
        id="task-category"
        value={categoryId}
        onChange={(event) => setCategoryId(event.target.value)}
      >
        <option value="">Sin categoría</option>
        {categories.map((category) => (
          <option key={category.id} value={category.id}>
            {category.name}
          </option>
        ))}
      </select>

      <div className="form-actions">
        <button type="submit" disabled={saving}>
          {saving ? 'Guardando...' : task ? 'Guardar cambios' : 'Crear tarea'}
        </button>
        <button type="button" className="secondary" onClick={onCancel}>
          Cancelar
        </button>
      </div>
    </form>
  );
}
