import { useEffect, useState } from 'react';
import api from '../api/client';
import Column from '../components/Column';
import { STATUSES } from '../constants/tasks';

const CONNECTION_ERROR = 'No se pudo conectar con el servidor';

// Pantalla principal. Es la dueña de los datos: pide las tareas al backend,
// las guarda en su estado y se las reparte a las columnas.
export default function Board() {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [actionError, setActionError] = useState('');
  const [newTitle, setNewTitle] = useState('');
  const [adding, setAdding] = useState(false);
  const [movingId, setMovingId] = useState(null); // tarea que se está moviendo ahora

  useEffect(() => {
    let ignore = false; // evita guardar datos si la pantalla ya se cerró

    async function loadTasks() {
      try {
        const { data } = await api.get('/tasks');
        if (!ignore) {
          setTasks(data);
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
  }, []);

  async function handleAdd(event) {
    event.preventDefault();
    const title = newTitle.trim();
    if (!title) {
      return;
    }

    setActionError('');
    setAdding(true);
    try {
      const { data } = await api.post('/tasks', { title });
      // Se crea una lista nueva con la tarea al inicio. En React nunca se modifica
      // el estado "a mano": se entrega una copia nueva y React redibuja.
      setTasks((current) => [data, ...current]);
      setNewTitle('');
    } catch (err) {
      setActionError(err.response?.data?.message || CONNECTION_ERROR);
    } finally {
      setAdding(false);
    }
  }

  async function handleMove(task, status) {
    setActionError('');
    setMovingId(task.id);
    try {
      // PATCH cambia solo el campo enviado: aquí, el estado
      const { data } = await api.patch(`/tasks/${task.id}`, { status });
      // Se reemplaza la tarea vieja por la que devolvió el backend
      setTasks((current) => current.map((item) => (item.id === data.id ? data : item)));
    } catch (err) {
      setActionError(err.response?.data?.message || CONNECTION_ERROR);
    } finally {
      setMovingId(null);
    }
  }

  return (
    <>
      <h1>Tablero</h1>

      <form className="quick-add" onSubmit={handleAdd}>
        <label htmlFor="new-task" className="visually-hidden">
          Título de la nueva tarea
        </label>
        <input
          id="new-task"
          type="text"
          placeholder="Escribe una tarea nueva..."
          value={newTitle}
          onChange={(event) => setNewTitle(event.target.value)}
          maxLength={150}
          required
        />
        <button type="submit" disabled={adding}>
          {adding ? 'Agregando...' : 'Agregar'}
        </button>
      </form>

      {actionError && (
        <p className="form-error" role="alert">
          {actionError}
        </p>
      )}

      {loading && <p>Cargando tareas...</p>}

      {loadError && (
        <p className="form-error" role="alert">
          {loadError}
        </p>
      )}

      {!loading && !loadError && (
        <div className="board">
          {STATUSES.map((status) => (
            <Column
              key={status.value}
              status={status}
              tasks={tasks.filter((task) => task.status === status.value)}
              movingId={movingId}
              onMove={handleMove}
            />
          ))}
        </div>
      )}
    </>
  );
}
