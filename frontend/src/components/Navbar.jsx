import { NavLink } from 'react-router-dom';
import useAuth from '../hooks/useAuth';

export default function Navbar() {
  const { user, logout } = useAuth();

  return (
    <header className="navbar">
      <span className="navbar-brand">TaskMaster</span>

      <nav className="navbar-links" aria-label="Principal">
        {/* NavLink agrega solo la clase "active" al enlace de la pantalla actual.
            "end" evita que "/" quede marcado también cuando estás en "/profile" */}
        <NavLink to="/" end>
          Tablero
        </NavLink>
        <NavLink to="/profile">Perfil</NavLink>

        <span className="navbar-user">{user?.name}</span>

        <button type="button" onClick={logout}>
          Cerrar sesión
        </button>
      </nav>
    </header>
  );
}
