import { STATUSES } from '../constants/tasks';

// Hoy en formato AAAA-MM-DD, con la fecha local del computador.
// Las fechas ISO se pueden comparar como texto: "2026-09-01" < "2026-10-04"
function todayString() {
  const now = new Date();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${now.getFullYear()}-${month}-${day}`;
}

// Convierte "2026-10-15" en "15 oct 2026".
// Se arma la fecha con año, mes y día por separado para evitar desfases de zona horaria.
function formatDate(isoDate) {
  const [year, month, day] = isoDate.split('-').map(Number);
  return new Date(year, month - 1, day).toLocaleDateString('es-CO', {
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  });
}

export default function TaskCard({ task, moving, onMove }) {
  // La tarea solo puede ir a la columna anterior o a la siguiente
  const index = STATUSES.findIndex((status) => status.value === task.status);
  const previous = STATUSES[index - 1];
  const next = STATUSES[index + 1];

  const overdue =
    Boolean(task.due_date) && task.due_date < todayString() && task.status !== 'completada';

  return (
    <article className="task-card">
      <h3>{task.title}</h3>

      {task.description && <p className="task-description">{task.description}</p>}

      <div className="task-meta">
        <span className={`badge priority-${task.priority}`}>Prioridad {task.priority}</span>
        {task.category_name && <span className="badge category">{task.category_name}</span>}
      </div>

      {task.due_date && (
        <p className={overdue ? 'task-due overdue' : 'task-due'}>
          {overdue ? 'Venció el ' : 'Vence el '}
          {formatDate(task.due_date)}
        </p>
      )}

      <div className="task-actions">
        {previous && (
          <button
            type="button"
            className="secondary"
            disabled={moving}
            onClick={() => onMove(task, previous.value)}
            aria-label={`Mover "${task.title}" a ${previous.label}`}
          >
            ← {previous.label}
          </button>
        )}
        {next && (
          <button
            type="button"
            className="secondary"
            disabled={moving}
            onClick={() => onMove(task, next.value)}
            aria-label={`Mover "${task.title}" a ${next.label}`}
          >
            {next.label} →
          </button>
        )}
      </div>
    </article>
  );
}
