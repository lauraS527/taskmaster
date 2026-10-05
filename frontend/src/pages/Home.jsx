import useAuth from '../hooks/useAuth';

// Pantalla provisional: en la Fase 9 aquí irá el tablero Kanban.
export default function Home() {
  const { user, logout } = useAuth();

  return (
    <main className="home-page">
      <h1>Hola, {user?.name}</h1>
      <p>Aquí irá tu tablero de tareas.</p>
      <button onClick={logout}>Cerrar sesión</button>
    </main>
  );
}
