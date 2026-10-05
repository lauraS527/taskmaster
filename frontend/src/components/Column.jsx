import TaskCard from './TaskCard';

// Una columna del tablero: recibe el estado que representa y solo las tareas de ese estado.
export default function Column({ status, tasks, movingId, onMove, onEdit, onDelete }) {
  const headingId = `column-${status.value}`;

  return (
    <section className="column" aria-labelledby={headingId}>
      <h2 id={headingId}>
        {status.label} <span className="column-count">{tasks.length}</span>
      </h2>

      {tasks.length === 0 ? (
        <p className="column-empty">Sin tareas</p>
      ) : (
        // "key" ayuda a React a distinguir una tarjeta de otra cuando la lista cambia
        tasks.map((task) => (
          <TaskCard
            key={task.id}
            task={task}
            moving={movingId === task.id}
            onMove={onMove}
            onEdit={onEdit}
            onDelete={onDelete}
          />
        ))
      )}
    </section>
  );
}
