import { useEffect, useState } from 'react';
import api from '../api/client';
import Column from '../components/Column';
import TaskForm from '../components/TaskForm';
import CategoryManager from '../components/CategoryManager';
import FilterBar from '../components/FilterBar';
import { DEFAULT_FILTERS, STATUSES } from '../constants/tasks';

const CONNECTION_ERROR = 'No se pudo conectar con el servidor';

// Pantalla principal. Es la dueña de los datos: pide tareas y categorías al backend,
// las guarda en su estado y se las reparte a los componentes de adentro.
export default function Board() {
  const [tasks, setTasks] = useState([]);
  const [categories, setCategories] = useState([]);
  const [filters, setFilters] = useState(DEFAULT_FILTERS);
  const [reloadKey, setReloadKey] = useState(0); // al cambiarlo, se vuelven a pedir las tareas
  const [loading, setLoading] = useState(true); // solo para la primera carga
  const [loadError, setLoadError] = useState('');
  const [actionError, setActionError] = useState('');
  const [movingId, setMovingId] = useState(null); // tarea que se está moviendo ahora

  // Formulario: editing vale null (cerrado), 'new' (crear) o la tarea que se edita
  const [editing, setEditing] = useState(null);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');

  const formOpen = editing !== null;
  const editingTask = editing && editing !== 'new' ? editing : null;
  const hasFilters = Boolean(filters.priority || filters.category_id || filters.status);

  // Si se filtra por estado, solo se muestra esa columna (las otras quedarían vacías)
  const visibleStatuses = STATUSES.filter(
    (status) => !filters.status || status.value === filters.status
  );

  // Pide la lista de tareas otra vez, respetando los filtros activos
  function refresh() {
    setReloadKey((key) => key + 1);
  }

  // Las categorías se piden una sola vez
  useEffect(() => {
    let ignore = false;

    async function loadCategories() {
      try {
        const { data } = await api.get('/categories');
        if (!ignore) {
          setCategories(data);
        }
      } catch {
        if (!ignore) {
          setLoadError('No se pudieron cargar tus categorías');
        }
      }
    }

    loadCategories();

    return () => {
      ignore = true;
    };
  }, []);

  // Las tareas se piden al abrir la pantalla y cada vez que cambian los filtros o reloadKey
  useEffect(() => {
    let ignore = false; // si los filtros cambian rápido, se descarta la respuesta vieja

    async function loadTasks() {
      try {
        const [sort, order] = filters.sort.split(':');
        const params = { sort, order };
        if (filters.priority) params.priority = filters.priority;
        if (filters.category_id) params.category_id = filters.category_id;
        if (filters.status) params.status = filters.status;

        // axios convierte params en "?sort=due_date&order=asc&priority=alta..."
        const { data } = await api.get('/tasks', { params });
        if (!ignore) {
          setTasks(data);
          setLoadError('');
        }
      } catch {
        if (!ignore) {
          setLoadError('No se pudieron cargar tus tareas');
        }
      } finally {
        if (!ignore) {
          setLoading(false);
        }
      }
    }

    loadTasks();

    return () => {
      ignore = true;
    };
  }, [filters, reloadKey]);

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
        await api.patch(`/tasks/${editingTask.id}`, values);
      } else {
        await api.post('/tasks', values);
      }
      setEditing(null);
      refresh();
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
      await api.patch(`/tasks/${task.id}`, { status });
      refresh();
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
      if (editingTask && editingTask.id === task.id) {
        setEditing(null);
      }
      refresh();
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
      // Si se estaba filtrando por esa categoría, se quita el filtro
      setFilters((current) =>
        current.category_id === String(category.id) ? { ...current, category_id: '' } : current
      );
      refresh();
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
          <FilterBar
            filters={filters}
            categories={categories}
            hasFilters={hasFilters}
            onChange={setFilters}
            onClear={() => setFilters({ ...DEFAULT_FILTERS, sort: filters.sort })}
          />

          {/* aria-live avisa a los lectores de pantalla cuando cambia el resultado */}
          <p className="filter-summary" aria-live="polite">
            {tasks.length} {tasks.length === 1 ? 'tarea' : 'tareas'}
          </p>

          {hasFilters && tasks.length === 0 && (
            <p className="column-empty">Ninguna tarea coincide con los filtros.</p>
          )}

          <div className={visibleStatuses.length === 1 ? 'board single' : 'board'}>
            {visibleStatuses.map((status) => (
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
