// Los estados de una tarea, en el orden en que aparecen las columnas del tablero.
// "value" es lo que guarda la base de datos; "label" es lo que lee la persona.
export const STATUSES = [
  { value: 'pendiente', label: 'Pendiente' },
  { value: 'en_progreso', label: 'En progreso' },
  { value: 'completada', label: 'Completada' }
];

export const PRIORITIES = [
  { value: 'baja', label: 'Baja' },
  { value: 'media', label: 'Media' },
  { value: 'alta', label: 'Alta' }
];

// Cada opción de orden combina dos datos del backend: la columna (sort) y la dirección (order).
// Se guardan juntos como "columna:dirección" para usar un solo <select>.
export const SORT_OPTIONS = [
  { value: 'created_at:desc', label: 'Más recientes' },
  { value: 'created_at:asc', label: 'Más antiguas' },
  { value: 'due_date:asc', label: 'Vencimiento: más próximo primero' },
  { value: 'due_date:desc', label: 'Vencimiento: más lejano primero' },
  { value: 'priority:desc', label: 'Prioridad: alta primero' },
  { value: 'priority:asc', label: 'Prioridad: baja primero' },
  { value: 'title:asc', label: 'Título: A a Z' },
  { value: 'title:desc', label: 'Título: Z a A' }
];

// Filtros iniciales: cadena vacía = "sin filtrar por este campo"
export const DEFAULT_FILTERS = {
  priority: '',
  category_id: '',
  status: '',
  sort: 'created_at:desc'
};
