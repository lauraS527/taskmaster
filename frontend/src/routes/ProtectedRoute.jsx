import { Navigate, Outlet } from 'react-router-dom';
import useAuth from '../hooks/useAuth';

// El guardia del frontend: si hay sesión, deja ver las pantallas de adentro (<Outlet />);
// si no, redirige al login.
// Ojo: esto es solo comodidad de la interfaz. La seguridad real la pone el backend
// (el middleware auth), porque cualquiera puede manipular lo que hay en su navegador.
export default function ProtectedRoute() {
  const { token } = useAuth();

  return token ? <Outlet /> : <Navigate to="/login" replace />;
}
