import useAuth from '../hooks/useAuth';

// Pantalla provisional: en la Fase 9C aquí irá el tablero Kanban.
// La barra de navegación (con "Cerrar sesión") la dibuja el Layout.
export default function Home() {
  const { user } = useAuth();

  return (
    <>
      <h1>Hola, {user?.name}</h1>
      <p>Aquí irá tu tablero de tareas.</p>
    </>
  );
}
