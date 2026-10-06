# TaskMaster

Aplicación web para crear, organizar y dar seguimiento a tareas personales o de equipo, con un tablero Kanban. 

**Demo en línea:** https://taskmaster-snowy-zeta.vercel.app
**Estado de la API:** https://taskmaster-api-a6ih.onrender.com/api/health

> **Arranque en frío:** el backend usa un plan gratuito que se "duerme" tras 15 minutos sin tráfico. La primera visita después de una pausa puede tardar cerca de un minuto en responder.
>
> **Correos de prueba:** la demo envía los correos de recuperación de contraseña a un buzón de pruebas (Mailtrap), no a bandejas reales.

## Funcionalidades

- **Autenticación:** registro, inicio de sesión, cierre de sesión y recuperación de contraseña por correo. Contraseñas cifradas con bcrypt y sesiones con JWT.
- **Perfil:** ver y editar nombre y correo, y cambiar la contraseña.
- **Tareas:** crear, ver, editar y eliminar, con descripción, fecha de vencimiento, prioridad (baja, media, alta) y estado (pendiente, en progreso, completada).
- **Categorías:** crear y eliminar etiquetas y asignarlas a las tareas.
- **Tablero Kanban:** tres columnas por estado, con movimiento entre columnas, filtros (prioridad, categoría, estado) y orden (fecha de vencimiento, prioridad, título, antigüedad).
- **Pruebas automáticas** del backend (79) con Jest y Supertest.
- **Despliegue** en la nube: base de datos, backend y frontend.

## Tecnologías

| Capa | Herramientas |
|---|---|
| Frontend | React (Vite), React Router, Axios |
| Backend | Node.js, Express 5, mysql2, bcryptjs, jsonwebtoken, Nodemailer |
| Base de datos | MySQL |
| Pruebas | Jest, Supertest |
| Despliegue | Aiven (MySQL), Render (backend), Vercel (frontend) |

## Arquitectura

```text
Navegador ──► Frontend (React, Vercel)
                  │  HTTPS + token JWT
                  ▼
              Backend (Express, Render) ──► MySQL (Aiven)
                  │
                  └──► Correo (Nodemailer → Mailtrap)
```

## Estructura del proyecto

```text
taskmaster/
├── backend/
│   ├── database/        # schema.sql y script de la base de pruebas
│   ├── src/
│   │   ├── config/      # conexión a MySQL
│   │   ├── controllers/ # lógica de cada ruta
│   │   ├── middlewares/ # verificación del token
│   │   ├── routes/      # definición de las rutas
│   │   ├── services/    # envío de correos
│   │   ├── app.js       # configuración de Express
│   │   └── server.js    # arranque del servidor
│   └── tests/           # pruebas automáticas
├── frontend/
│   └── src/
│       ├── api/         # cliente de Axios
│       ├── components/  # Navbar, Layout, Column, TaskCard, TaskForm, FilterBar...
│       ├── constants/   # estados, prioridades y opciones de orden
│       ├── context/     # sesión de usuario
│       ├── hooks/       # useAuth
│       ├── pages/       # Login, Register, Board, Profile...
│       └── routes/      # ruta protegida
└── docs/                # manuales y guion
```

## API

Todas las rutas empiezan con `/api`. Las marcadas con 🔒 exigen el encabezado `Authorization: Bearer <token>`.

| Método | Ruta | Descripción |
|---|---|---|
| GET | `/health` | Estado del servidor y de la base de datos |
| POST | `/auth/register` | Crear cuenta |
| POST | `/auth/login` | Iniciar sesión |
| POST | `/auth/forgot-password` | Solicitar enlace de recuperación |
| POST | `/auth/reset-password` | Crear nueva contraseña con el código del enlace |
| GET | `/users/me` 🔒 | Ver perfil |
| PUT | `/users/me` 🔒 | Editar nombre y correo |
| PUT | `/users/me/password` 🔒 | Cambiar contraseña |
| GET | `/categories` 🔒 | Listar categorías |
| POST | `/categories` 🔒 | Crear categoría |
| PUT | `/categories/:id` 🔒 | Renombrar categoría |
| DELETE | `/categories/:id` 🔒 | Eliminar categoría |
| GET | `/tasks` 🔒 | Listar tareas. Filtros: `status`, `priority`, `category_id`. Orden: `sort` (`due_date`, `priority`, `created_at`, `title`) y `order` (`asc`, `desc`) |
| POST | `/tasks` 🔒 | Crear tarea |
| GET | `/tasks/:id` 🔒 | Ver una tarea |
| PATCH | `/tasks/:id` 🔒 | Editar campos de una tarea (por ejemplo, su estado) |
| DELETE | `/tasks/:id` 🔒 | Eliminar tarea |

## Cómo ejecutarlo en tu computador

**Requisitos:** Node.js 20.19 o superior (o 22.12 o superior), MySQL y Git.

1. **Clona el repositorio**
   ```bash
   git clone https://github.com/lauraS527/taskmaster.git
   cd taskmaster
   ```
2. **Crea la base de datos:** ejecuta `backend/database/schema.sql` en MySQL (por ejemplo, desde MySQL Workbench).
3. **Backend**
   ```bash
   cd backend
   npm install
   ```
   Copia `.env.example` como `.env` y llena los valores (base de datos local, `JWT_SECRET`, credenciales de correo). Luego:
   ```bash
   npm run dev
   ```
   El servidor queda en `http://localhost:3000`. Comprueba `http://localhost:3000/api/health`.
4. **Frontend**, en otra terminal
   ```bash
   cd frontend
   npm install
   ```
   Crea `frontend/.env` con `VITE_API_URL=http://localhost:3000/api` y ejecuta:
   ```bash
   npm run dev
   ```
   Abre `http://localhost:5173`.

## Pruebas

Las pruebas usan una base de datos aparte (`taskmaster_test`) para no tocar tus datos. Desde `backend`:

```bash
npm run db:test   # crea la base de pruebas (una sola vez)
npm test          # ejecuta las 79 pruebas
```

## Despliegue

Los pasos completos están en [docs/manual-despliegue.md](docs/manual-despliegue.md). La guía de uso de la aplicación está en [docs/manual-usuario.md](docs/manual-usuario.md).

## Decisiones de seguridad

- Las contraseñas se guardan como hash (bcrypt); nunca en texto normal.
- Cada consulta de tareas y categorías filtra por el usuario de la sesión, así que nadie puede ver ni modificar datos ajenos.
- Las consultas SQL usan parámetros (`?`), y los campos de orden se eligen de una lista cerrada.
- La recuperación de contraseña responde igual exista o no el correo, para no revelar qué cuentas existen.
- Los códigos de recuperación se guardan cifrados, vencen en una hora y sirven una sola vez.
- Los secretos viven en variables de entorno, nunca en el repositorio.

## Limitaciones conocidas

- El plan gratuito del backend se duerme tras 15 minutos sin uso.
- Los correos de la demo llegan a un buzón de pruebas; para enviar correos reales haría falta un servicio de envío con dominio verificado.
- El token de sesión se guarda en `localStorage`; una alternativa más segura son cookies `httpOnly`.
- No incluye foto de perfil (opcional en el enunciado).
- No incluye pruebas automáticas del frontend.

## Autora

Laura N. Serna Cadavid · [GitHub](https://github.com/lauraS527)
