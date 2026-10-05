import { useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import useAuth from '../hooks/useAuth';

export default function Login() {
  const { token, login } = useAuth();

  // useState = la memoria del componente. Cuando cambia, la pantalla se redibuja.
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Si ya hay sesión (o la acabas de iniciar), te lleva al inicio
  if (token) {
    return <Navigate to="/" replace />;
  }

  async function handleSubmit(event) {
    event.preventDefault(); // evita que el navegador recargue la página
    setError('');
    setLoading(true);

    try {
      await login(email, password);
      // Al guardarse el token, este componente se redibuja y el <Navigate> de arriba te redirige
    } catch (err) {
      // El backend devuelve mensajes como "Credenciales inválidas"
      setError(err.response?.data?.message || 'No se pudo conectar con el servidor');
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="auth-page">
      <form className="auth-card" onSubmit={handleSubmit}>
        <h1>TaskMaster</h1>
        <p className="auth-subtitle">Inicia sesión para ver tus tareas</p>

        {error && (
          <p className="form-error" role="alert">
            {error}
          </p>
        )}

        <label htmlFor="email">Correo</label>
        <input
          id="email"
          type="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          autoComplete="email"
          required
        />

        <label htmlFor="password">Contraseña</label>
        <input
          id="password"
          type="password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          autoComplete="current-password"
          required
        />

        <button type="submit" disabled={loading}>
          {loading ? 'Entrando...' : 'Iniciar sesión'}
        </button>

        <p className="auth-footer">
          <Link to="/forgot-password">¿Olvidaste tu contraseña?</Link>
        </p>

        <p className="auth-footer">
          ¿No tienes cuenta? <Link to="/register">Regístrate</Link>
        </p>
      </form>
    </main>
  );
}
