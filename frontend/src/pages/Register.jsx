import { useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import useAuth from '../hooks/useAuth';

export default function Register() {
  const { token, register } = useAuth();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  if (token) {
    return <Navigate to="/" replace />;
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError('');
    setLoading(true);

    try {
      await register(name, email, password);
      // El backend ya devuelve un token al registrar, así que la sesión queda iniciada
    } catch (err) {
      setError(err.response?.data?.message || 'No se pudo conectar con el servidor');
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="auth-page">
      <form className="auth-card" onSubmit={handleSubmit}>
        <h1>Crear cuenta</h1>
        <p className="auth-subtitle">Organiza tus tareas en un solo lugar</p>

        {error && (
          <p className="form-error" role="alert">
            {error}
          </p>
        )}

        <label htmlFor="name">Nombre</label>
        <input
          id="name"
          type="text"
          value={name}
          onChange={(event) => setName(event.target.value)}
          autoComplete="name"
          required
        />

        <label htmlFor="email">Correo</label>
        <input
          id="email"
          type="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          autoComplete="email"
          required
        />

        <label htmlFor="password">Contraseña (mínimo 8 caracteres)</label>
        <input
          id="password"
          type="password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          autoComplete="new-password"
          minLength={8}
          required
        />

        <button type="submit" disabled={loading}>
          {loading ? 'Creando cuenta...' : 'Registrarme'}
        </button>

        <p className="auth-footer">
          ¿Ya tienes cuenta? <Link to="/login">Inicia sesión</Link>
        </p>
      </form>
    </main>
  );
}
