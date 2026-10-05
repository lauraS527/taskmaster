import axios from 'axios';

// Un único cliente para hablar con el backend. La dirección sale del archivo .env
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL
});

// Interceptor de petición: antes de enviar cualquier petición,
// agrega el token si hay una sesión guardada (igual que lo hacías a mano en Thunder Client).
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Interceptor de respuesta: si el backend responde 401 (no autenticado) y había
// una sesión guardada, el token venció (dura 2 horas). Se limpia la sesión
// y se manda a la persona a iniciar sesión otra vez.
// Las rutas /auth/* se excluyen: un 401 en el login significa "credenciales
// incorrectas", no "sesión vencida".
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status;
    const url = error.config?.url ?? '';
    const isAuthRoute = url.startsWith('/auth/');

    if (status === 401 && localStorage.getItem('token') && !isAuthRoute) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.assign('/login');
    }

    return Promise.reject(error);
  }
);

export default api;
