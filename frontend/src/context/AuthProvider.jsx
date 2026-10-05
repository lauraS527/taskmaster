import { useState } from 'react';
import api from '../api/client';
import { AuthContext } from './AuthContext';

// Lee el usuario guardado; si el texto está dañado, devuelve null en vez de romper la app
function readStoredUser() {
  try {
    return JSON.parse(localStorage.getItem('user'));
  } catch {
    return null;
  }
}

export default function AuthProvider({ children }) {
  // useState(() => ...) lee localStorage una sola vez, al abrir la página.
  // Así la sesión sobrevive cuando recargas con F5.
  const [token, setToken] = useState(() => localStorage.getItem('token'));
  const [user, setUser] = useState(readStoredUser);

  function saveSession(data) {
    localStorage.setItem('token', data.token);
    localStorage.setItem('user', JSON.stringify(data.user));
    setToken(data.token);
    setUser(data.user);
  }

  async function login(email, password) {
    const { data } = await api.post('/auth/login', { email, password });
    saveSession(data);
  }

  async function register(name, email, password) {
    const { data } = await api.post('/auth/register', { name, email, password });
    saveSession(data);
  }

  function logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setToken(null);
    setUser(null);
  }

  return (
    <AuthContext.Provider value={{ token, user, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}
