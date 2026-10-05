import { useEffect, useState } from 'react';
import api from '../api/client';
import useAuth from '../hooks/useAuth';

const CONNECTION_ERROR = 'No se pudo conectar con el servidor';

export default function Profile() {
  const { updateUser } = useAuth();

  // Datos personales
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [createdAt, setCreatedAt] = useState('');
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [profileMessage, setProfileMessage] = useState('');
  const [profileError, setProfileError] = useState('');
  const [savingProfile, setSavingProfile] = useState(false);

  // Cambio de contraseña
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [passwordMessage, setPasswordMessage] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [savingPassword, setSavingPassword] = useState(false);

  // useEffect con [] se ejecuta una sola vez, cuando la pantalla aparece.
  // Pedimos el perfil al backend para mostrar datos frescos de la base de datos.
  useEffect(() => {
    let ignore = false; // evita guardar datos si la pantalla ya se cerró

    async function loadProfile() {
      try {
        const { data } = await api.get('/users/me');
        if (!ignore) {
          setName(data.name);
          setEmail(data.email);
          setCreatedAt(data.created_at);
        }
      } catch {
        if (!ignore) {
          setLoadError('No se pudo cargar tu perfil');
        }
      } finally {
        if (!ignore) {
          setLoading(false);
        }
      }
    }

    loadProfile();

    return () => {
      ignore = true;
    };
  }, []);

  async function handleProfileSubmit(event) {
    event.preventDefault();
    setProfileMessage('');
    setProfileError('');
    setSavingProfile(true);

    try {
      const { data } = await api.put('/users/me', { name, email });
      // Actualiza la sesión guardada para que la barra muestre el nombre nuevo
      updateUser({ id: data.id, name: data.name, email: data.email });
      setName(data.name);
      setEmail(data.email);
      setProfileMessage('Datos actualizados');
    } catch (err) {
      setProfileError(err.response?.data?.message || CONNECTION_ERROR);
    } finally {
      setSavingProfile(false);
    }
  }

  async function handlePasswordSubmit(event) {
    event.preventDefault();
    setPasswordMessage('');
    setPasswordError('');

    if (newPassword !== confirm) {
      setPasswordError('Las contraseñas nuevas no coinciden');
      return;
    }

    setSavingPassword(true);
    try {
      await api.put('/users/me/password', { currentPassword, newPassword });
      setCurrentPassword('');
      setNewPassword('');
      setConfirm('');
      setPasswordMessage('Contraseña actualizada');
    } catch (err) {
      setPasswordError(err.response?.data?.message || CONNECTION_ERROR);
    } finally {
      setSavingPassword(false);
    }
  }

  if (loading) {
    return <p>Cargando perfil...</p>;
  }

  if (loadError) {
    return (
      <p className="form-error" role="alert">
        {loadError}
      </p>
    );
  }

  const memberSince = createdAt
    ? new Date(createdAt).toLocaleDateString('es-CO', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      })
    : '';

  return (
    <>
      <h1>Mi perfil</h1>
      {memberSince && <p className="profile-since">Miembro desde el {memberSince}</p>}

      <form className="auth-card profile-card" onSubmit={handleProfileSubmit}>
        <h2>Datos personales</h2>

        {profileMessage && (
          <p className="form-success" role="status">
            {profileMessage}
          </p>
        )}
        {profileError && (
          <p className="form-error" role="alert">
            {profileError}
          </p>
        )}

        <label htmlFor="profile-name">Nombre</label>
        <input
          id="profile-name"
          type="text"
          value={name}
          onChange={(event) => setName(event.target.value)}
          autoComplete="name"
          required
        />

        <label htmlFor="profile-email">Correo</label>
        <input
          id="profile-email"
          type="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          autoComplete="email"
          required
        />

        <button type="submit" disabled={savingProfile}>
          {savingProfile ? 'Guardando...' : 'Guardar cambios'}
        </button>
      </form>

      <form className="auth-card profile-card" onSubmit={handlePasswordSubmit}>
        <h2>Cambiar contraseña</h2>

        {passwordMessage && (
          <p className="form-success" role="status">
            {passwordMessage}
          </p>
        )}
        {passwordError && (
          <p className="form-error" role="alert">
            {passwordError}
          </p>
        )}

        <label htmlFor="current-password">Contraseña actual</label>
        <input
          id="current-password"
          type="password"
          value={currentPassword}
          onChange={(event) => setCurrentPassword(event.target.value)}
          autoComplete="current-password"
          required
        />

        <label htmlFor="new-password">Contraseña nueva (mínimo 8 caracteres)</label>
        <input
          id="new-password"
          type="password"
          value={newPassword}
          onChange={(event) => setNewPassword(event.target.value)}
          autoComplete="new-password"
          minLength={8}
          required
        />

        <label htmlFor="confirm-password">Confirmar contraseña nueva</label>
        <input
          id="confirm-password"
          type="password"
          value={confirm}
          onChange={(event) => setConfirm(event.target.value)}
          autoComplete="new-password"
          minLength={8}
          required
        />

        <button type="submit" disabled={savingPassword}>
          {savingPassword ? 'Guardando...' : 'Cambiar contraseña'}
        </button>
      </form>
    </>
  );
}
