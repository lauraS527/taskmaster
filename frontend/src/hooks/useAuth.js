import { useContext } from 'react';
import { AuthContext } from '../context/AuthContext';

// Atajo para abrir la "mochila" de la sesión desde cualquier pantalla:
//   const { user, token, login, logout } = useAuth();
export default function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error('useAuth debe usarse dentro de <AuthProvider>');
  }

  return context;
}
