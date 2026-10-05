import { useState } from 'react';

// Lista las categorías del usuario, permite crear nuevas y borrar las que ya no use.
// No habla con el backend: avisa a Board con onAdd y onDelete.
export default function CategoryManager({ categories, onAdd, onDelete }) {
  const [name, setName] = useState('');
  const [adding, setAdding] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    const clean = name.trim();
    if (!clean) {
      return;
    }

    setAdding(true);
    const created = await onAdd(clean); // devuelve true si se creó
    if (created) {
      setName('');
    }
    setAdding(false);
  }

  return (
    <section className="categories" aria-labelledby="categories-title">
      <h2 id="categories-title">Categorías</h2>

      {categories.length === 0 ? (
        <p className="column-empty">Aún no tienes categorías</p>
      ) : (
        <ul className="category-list">
          {categories.map((category) => (
            <li key={category.id} className="category-chip">
              <span>{category.name}</span>
              <button
                type="button"
                className="chip-delete"
                onClick={() => onDelete(category)}
                aria-label={`Eliminar la categoría ${category.name}`}
              >
                ×
              </button>
            </li>
          ))}
        </ul>
      )}

      <form className="category-form" onSubmit={handleSubmit}>
        <label htmlFor="new-category" className="visually-hidden">
          Nombre de la nueva categoría
        </label>
        <input
          id="new-category"
          type="text"
          placeholder="Nueva categoría..."
          value={name}
          onChange={(event) => setName(event.target.value)}
          maxLength={50}
          required
        />
        <button type="submit" className="secondary" disabled={adding}>
          {adding ? 'Agregando...' : 'Agregar categoría'}
        </button>
      </form>
    </section>
  );
}
