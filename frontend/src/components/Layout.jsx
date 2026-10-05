import { Outlet } from 'react-router-dom';
import Navbar from './Navbar';

// Marco común de las pantallas con sesión: la barra arriba y, debajo,
// la pantalla que corresponda a la dirección (<Outlet />).
export default function Layout() {
  return (
    <>
      <Navbar />
      <main className="page">
        <Outlet />
      </main>
    </>
  );
}
