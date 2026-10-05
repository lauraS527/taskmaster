import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import api from '../api/client';

export default function ResetPassword() {
  // El correo trae un enlace como /reset-password?token=abc123...
  // useSearchParams lee lo que viene después del signo "?"
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');

  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);
  const [loading, setLoading] = useState(false);

  // Si alguien entra a esta dirección sin el código, no hay nada que hacer
  if (!token) {
    return (
      <main className="auth-page">
        <div className="auth-card">
          <h1>Enlace no válido</h1>
          <p className="form-error" role="alert">
            Falta el código de recuperación. Solicita un enlace nuevo.
          </p>
          <p className="auth-footer">
            <Link to="/forgot-password">Solicitar un enlace nuevo</Link>
          </p>
        </div>
      </main>
    );
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError('');

    // Esta comprobación es solo del frontend: el backend nunca ve el campo "confirmar"
    if (password !== confirm) {
      setError('Las contraseñas no coinciden');
      return;
    }

    setLoading(true);
    try {
      await api.post('/auth/reset-password', { token, password });
      setDone(true);
    } catch (err) {
      setError(err.response?.data?.message || 'No se pudo conectar con el servidor');
    } finally {
      setLoading(false);
    }
  }

  if (done) {
    return (
      <main className="auth-page">
        <div className="auth-card">
          <h1>Contraseña actualizada</h1>
          <p className="form-success" role="status">
            Ya puedes iniciar sesión con tu nueva contraseña.
          </p>
          <p className="auth-footer">
            <Link to="/login">Iniciar sesión</Link>
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="auth-page">
      <form className="auth-card" onSubmit={handleSubmit}>
        <h1>Nueva contraseña</h1>
        <p className="auth-subtitle">Elige una contraseña de al menos 8 caracteres</p>

        {error && (
          <p className="form-error" role="alert">
            {error}
          </p>
        )}

        <label htmlFor="password">Nueva contraseña</label>
        <input
          id="password"
          type="password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          autoComplete="new-password"
          minLength={8}
          required
        />

        <label htmlFor="confirm">Confirmar contraseña</label>
        <input
          id="confirm"
          type="password"
          value={confirm}
          onChange={(event) => setConfirm(event.target.value)}
          autoComplete="new-password"
          minLength={8}
          required
        />

        <button type="submit" disabled={loading}>
          {loading ? 'Guardando...' : 'Cambiar contraseña'}
        </button>

        <p className="auth-footer">
          <Link to="/forgot-password">Solicitar un enlace nuevo</Link>
        </p>
      </form>
    </main>
  );
}
