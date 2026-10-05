import { Navigate, Route, Routes } from 'react-router-dom';
import ProtectedRoute from './routes/ProtectedRoute';
import Login from './pages/Login';
import Register from './pages/Register';
import Home from './pages/Home';

// Aquí se decide qué pantalla se muestra según la dirección de la barra del navegador.
export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />

      {/* Todo lo que esté dentro de ProtectedRoute exige sesión */}
      <Route element={<ProtectedRoute />}>
        <Route path="/" element={<Home />} />
      </Route>

      {/* Cualquier otra dirección vuelve al inicio */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
