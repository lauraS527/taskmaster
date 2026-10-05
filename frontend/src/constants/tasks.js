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
