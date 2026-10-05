import { useEffect, useState } from 'react';
import api from '../api/client';
import Column from '../components/Column';
import TaskForm from '../components/TaskForm';
import CategoryManager from '../components/CategoryManager';
import { STATUSES } from '../constants/tasks';

const CONNECTION_ERROR = 'No se pudo conectar con el servidor';

// Pantalla principal. Es la dueña de los datos: pide tareas y categorías al backend,
// las guarda en su estado y se las reparte a los componentes de adentro.
export default function Board() {
  const [tasks, setTasks] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [actionError, setActionError] = useState('');
  const [movingId, setMovingId] = useState(null); // tarea que se está moviendo ahora

  // Formulario: editing vale null (cerrado), 'new' (crear) o la tarea que se edita
  const [editing, setEditing] = useState(null);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');

  const formOpen = editing !== null;
  const editingTask = editing && editing !== 'new' ? editing : null;

  useEffect(() => {
    let ignore = false; // evita guardar datos si la pantalla ya se cerró

    async function loadData() {
      try {
        // Las dos peticiones salen a la vez, en lugar de esperar una y luego la otra
        const [tasksResponse, categoriesResponse] = await Promise.all([
          api.get('/tasks'),
          api.get('/categories')
        ]);
        if (!ignore) {
          setTasks(tasksResponse.data);
          setCategories(categoriesResponse.data);
        }
      } catch {
        if (!ignore) {
          setLoadError('No se pudieron cargar tus datos');
        }
      } finally {
        if (!ignore) {
          setLoading(false);
        }
      }
    }

    loadData();

    return () => {
      ignore = true;
    };
  }, []);

  function handleNew() {
    setFormError('');
    setEditing('new');
  }

  function handleEdit(task) {
    setFormError('');
    setEditing(task);
  }

  async function handleSave(values) {
    setFormError('');
    setSaving(true);
    try {
      if (editingTask) {
        const { data } = await api.patch(`/tasks/${editingTask.id}`, values);
        setTasks((current) => current.map((item) => (item.id === data.id ? data : item)));
      } else {
        const { data } = await api.post('/tasks', values);
        // Se crea una lista nueva con la tarea al inicio. En React nunca se modifica
        // el estado "a mano": se entrega una copia nueva y React redibuja.
        setTasks((current) => [data, ...current]);
      }
      setEditing(null);
    } catch (err) {
      setFormError(err.response?.data?.message || CONNECTION_ERROR);
    } finally {
      setSaving(false);
    }
  }

  async function handleMove(task, status) {
    setActionError('');
    setMovingId(task.id);
    try {
      const { data } = await api.patch(`/tasks/${task.id}`, { status });
      setTasks((current) => current.map((item) => (item.id === data.id ? data : item)));
    } catch (err) {
      setActionError(err.response?.data?.message || CONNECTION_ERROR);
    } finally {
      setMovingId(null);
    }
  }

  async function handleDelete(task) {
    // window.confirm abre el cuadro de confirmación del navegador
    if (!window.confirm(`¿Eliminar la tarea "${task.title}"? Esta acción no se puede deshacer.`)) {
      return;
    }

    setActionError('');
    try {
      await api.delete(`/tasks/${task.id}`);
      setTasks((current) => current.filter((item) => item.id !== task.id));
      if (editingTask && editingTask.id === task.id) {
        setEditing(null);
      }
    } catch (err) {
      setActionError(err.response?.data?.message || CONNECTION_ERROR);
    }
  }

  // Devuelve true si la categoría se creó, para que CategoryManager limpie su campo
  async function handleAddCategory(name) {
    setActionError('');
    try {
      const { data } = await api.post('/categories', { name });
      setCategories((current) =>
        [...current, data].sort((a, b) => a.name.localeCompare(b.name, 'es'))
      );
      return true;
    } catch (err) {
      setActionError(err.response?.data?.message || CONNECTION_ERROR);
      return false;
    }
  }

  async function handleDeleteCategory(category) {
    const message = `¿Eliminar la categoría "${category.name}"? Las tareas que la usan no se borran: quedarán sin categoría.`;
    if (!window.confirm(message)) {
      return;
    }

    setActionError('');
    try {
      await api.delete(`/categories/${category.id}`);
      setCategories((current) => current.filter((item) => item.id !== category.id));
      // El backend dejó esas tareas sin categoría; se refleja igual en pantalla
      setTasks((current) =>
        current.map((task) =>
          task.category_id === category.id
            ? { ...task, category_id: null, category_name: null }
            : task
        )
      );
    } catch (err) {
      setActionError(err.response?.data?.message || CONNECTION_ERROR);
    }
  }

  return (
    <>
      <div className="board-header">
        <h1>Tablero</h1>
        {!formOpen && (
          <button type="button" onClick={handleNew}>
            + Nueva tarea
          </button>
        )}
      </div>

      {formOpen && (
        <TaskForm
          key={editingTask ? editingTask.id : 'new'}
          task={editingTask}
          categories={categories}
          saving={saving}
          error={formError}
          onSubmit={handleSave}
          onCancel={() => setEditing(null)}
        />
      )}

      {actionError && (
        <p className="form-error" role="alert">
          {actionError}
        </p>
      )}

      {loading && <p>Cargando tablero...</p>}

      {loadError && (
        <p className="form-error" role="alert">
          {loadError}
        </p>
      )}

      {!loading && !loadError && (
        <>
          <div className="board">
            {STATUSES.map((status) => (
              <Column
                key={status.value}
                status={status}
                tasks={tasks.filter((task) => task.status === status.value)}
                movingId={movingId}
                onMove={handleMove}
                onEdit={handleEdit}
                onDelete={handleDelete}
              />
            ))}
          </div>

          <CategoryManager
            categories={categories}
            onAdd={handleAddCategory}
            onDelete={handleDeleteCategory}
          />
        </>
      )}
    </>
  );
}
