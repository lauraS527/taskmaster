import { PRIORITIES, SORT_OPTIONS, STATUSES } from '../constants/tasks';

// Barra de filtros y orden. No pide datos: cada cambio avisa a Board con onChange,
// y Board vuelve a pedir las tareas al backend con los filtros nuevos.
export default function FilterBar({ filters, categories, hasFilters, onChange, onClear }) {
  // Devuelve una función para cada campo, que copia los filtros y cambia solo ese campo
  function update(field) {
    return (event) => onChange({ ...filters, [field]: event.target.value });
  }

  return (
    <section className="filter-bar" aria-label="Filtros y orden del tablero">
      <div className="filter-field">
        <label htmlFor="filter-priority">Prioridad</label>
        <select id="filter-priority" value={filters.priority} onChange={update('priority')}>
          <option value="">Todas</option>
          {PRIORITIES.map((item) => (
            <option key={item.value} value={item.value}>
              {item.label}
            </option>
          ))}
        </select>
      </div>

      <div className="filter-field">
        <label htmlFor="filter-category">Categoría</label>
        <select id="filter-category" value={filters.category_id} onChange={update('category_id')}>
          <option value="">Todas</option>
          {categories.map((category) => (
            <option key={category.id} value={category.id}>
              {category.name}
            </option>
          ))}
        </select>
      </div>

      <div className="filter-field">
        <label htmlFor="filter-status">Estado</label>
        <select id="filter-status" value={filters.status} onChange={update('status')}>
          <option value="">Todos</option>
          {STATUSES.map((item) => (
            <option key={item.value} value={item.value}>
              {item.label}
            </option>
          ))}
        </select>
      </div>

      <div className="filter-field">
        <label htmlFor="filter-sort">Ordenar por</label>
        <select id="filter-sort" value={filters.sort} onChange={update('sort')}>
          {SORT_OPTIONS.map((item) => (
            <option key={item.value} value={item.value}>
              {item.label}
            </option>
          ))}
        </select>
      </div>

      {hasFilters && (
        <button type="button" className="secondary" onClick={onClear}>
          Limpiar filtros
        </button>
      )}
    </section>
  );
}
