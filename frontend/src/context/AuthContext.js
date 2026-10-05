import { createContext } from 'react';

// El "contexto" es como una mochila compartida: guarda los datos de la sesión
// y cualquier pantalla puede abrirla sin que se los pasen de una en una.
// Aquí solo se crea; el componente que la llena está en AuthProvider.jsx
export const AuthContext = createContext(null);
