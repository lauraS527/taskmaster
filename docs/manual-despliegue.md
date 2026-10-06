# Manual de despliegue de TaskMaster

Este manual explica cómo publicar TaskMaster en línea desde cero. Cada pieza va en un servicio distinto:

| Pieza | Servicio | Carpeta del repositorio |
|---|---|---|
| Base de datos MySQL | Aiven (plan gratuito) | `backend/database/schema.sql` |
| Backend (Node y Express) | Render (plan gratuito) | `backend` |
| Frontend (React) | Vercel | `frontend` |

**Instalación de referencia:**
- Frontend: https://taskmaster-snowy-zeta.vercel.app
- Backend: https://taskmaster-api-a6ih.onrender.com

> Los planes gratuitos y los nombres de los menús de cada plataforma cambian con el tiempo. Revisa sus condiciones antes de empezar.

**El orden importa:** primero la base de datos, luego el backend, después el frontend, y al final se ajusta el backend con la dirección del frontend.

## Requisitos previos

- El código subido a un repositorio de GitHub, con `backend` y `frontend` en la raíz.
- Cuentas en Aiven, Render, Vercel y Mailtrap.
- MySQL Workbench (u otro cliente de MySQL) para cargar las tablas.
- `frontend/vercel.json` presente en el repositorio. Sin él, los enlaces directos como `/reset-password` darían "404".

## Parte 1: Base de datos en Aiven

1. Crea un servicio **MySQL** con el plan **Free** y espera a que esté en estado **Running**.
2. En la página del servicio anota **Host**, **Port**, **User** y **Password**. Descarga también el certificado CA.
3. En MySQL Workbench, crea una conexión con esos datos y, en la pestaña **SSL**, elige **Use SSL: Require**.
4. Abre `backend/database/schema.sql` y ejecútalo.
5. Verifica con `USE taskmaster; SHOW TABLES;`. Deben aparecer: `categories`, `password_resets`, `tasks` y `users`.

Si Aiven rechaza `CREATE DATABASE`, usa la base que trae por defecto (suele llamarse `defaultdb`): quita las dos primeras líneas del script, ejecuta `USE defaultdb;` y luego el resto. En ese caso, `DB_NAME` será `defaultdb`.

> Aiven puede apagar servicios que lleven tiempo sin uso, avisando antes. Se pueden volver a encender desde su consola.

## Parte 2: Backend en Render

1. En Render, crea un **Web Service** y conéctalo al repositorio.
2. Configura:

| Campo | Valor |
|---|---|
| Name | `taskmaster-api` (define la dirección) |
| Region | La más cercana a la base de datos (no se puede cambiar después) |
| Branch | `main` |
| Root Directory | `backend` |
| Build Command | `npm install` |
| Start Command | `npm start` |
| Instance Type | Free |
| Health Check Path (en Advanced) | `/api/health` |

3. En **Environment**, agrega las variables:

| Variable | Valor |
|---|---|
| `DB_HOST` | Host del servicio de base de datos |
| `DB_PORT` | Puerto del servicio (no es 3306) |
| `DB_USER` | Usuario de la base de datos |
| `DB_PASSWORD` | Contraseña de la base de datos |
| `DB_NAME` | `taskmaster` (o `defaultdb`) |
| `DB_SSL` | `true` |
| `JWT_SECRET` | Texto largo y aleatorio, distinto al de desarrollo |
| `CLIENT_URL` | Dirección exacta del frontend, con `https://` y **sin barra final** |
| `MAIL_HOST`, `MAIL_PORT`, `MAIL_USER`, `MAIL_PASS`, `MAIL_FROM` | Credenciales SMTP del buzón de Mailtrap |

No definas `PORT`: Render lo asigna solo.

Para generar un `JWT_SECRET`:
```bash
node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
```

4. Crea el servicio. Cuando esté **Live**, abre `https://<tu-servicio>.onrender.com/api/health`. Debe responder `{"status":"ok","database":"conectada"}`.

## Parte 3: Frontend en Vercel

1. En Vercel, importa el repositorio como **Project**.
2. Configura:

| Campo | Valor |
|---|---|
| Framework Preset | Vite |
| Root Directory | `frontend` |
| Build Command | `npm run build` |
| Output Directory | `dist` |

3. Agrega la variable de entorno **antes** del primer despliegue:

| Variable | Valor |
|---|---|
| `VITE_API_URL` | `https://<tu-servicio>.onrender.com/api` (termina en `/api`, sin barra final) |

Vite incrusta esta variable al compilar. Si la cambias después, hay que redesplegar.

4. Presiona **Deploy**. Vercel te dará la dirección del frontend.

## Parte 4: Conectar frontend y backend

1. En Render, abre `Environment` y pon en `CLIENT_URL` la dirección **principal** del frontend (la que aparece en **Domains** en Vercel).
2. Guarda. Render redespliega solo.

`CLIENT_URL` cumple dos funciones: el backend solo acepta peticiones de esa dirección (CORS) y el enlace del correo de recuperación se arma con ella.

## Parte 5: Verificación

1. Abre `/api/health` del backend (puede tardar si estaba dormido).
2. Abre el frontend: debe cargar **Iniciar sesión**.
3. Regístrate y entra al tablero.
4. Crea una categoría y una tarea, y muévela de columna.
5. Recarga con F5 en `/profile`: debe seguir mostrando el perfil.
6. Pide la recuperación de contraseña, abre el correo en Mailtrap y haz clic en el enlace: debe abrir el frontend desplegado.
7. En el cliente de MySQL conectado a la nube, `SELECT id, email FROM users;` debe mostrar la cuenta nueva.

## Mantenimiento

- **Despliegues automáticos:** cada `git push` a `main` redespliega el backend en Render y el frontend en Vercel. Cambiar variables de entorno en Render también redespliega.
- **Arranque en frío:** el servicio gratuito de Render se duerme tras 15 minutos sin tráfico y la primera petición después puede tardar cerca de un minuto.
- **Correos:** Mailtrap en modo de pruebas no entrega a bandejas reales. Para enviar correos reales hace falta un servicio de envío con un dominio verificado.
- **Secretos:** nunca subas archivos `.env` al repositorio. Si un secreto se filtra, cámbialo de inmediato.

## Solución de problemas

| Síntoma | Causa probable |
|---|---|
| El build de Render no encuentra `package.json` | `Root Directory` no es `backend` |
| El build de Vercel no encuentra el proyecto | `Root Directory` no es `frontend` |
| `/api/health` responde `"sin conexión"` | Algún dato de la base está mal. El error exacto aparece en **Logs** de Render |
| `Access denied for user` | `DB_USER` o `DB_PASSWORD` incorrectos |
| `ETIMEDOUT` o `ECONNREFUSED` | `DB_HOST` o `DB_PORT` incorrectos, o el servicio de base de datos está apagado |
| `Unknown database` | `DB_NAME` no coincide con la base creada |
| `blocked by CORS policy` en la consola del navegador | `CLIENT_URL` no coincide exactamente con la dirección del frontend |
| Las peticiones van a `undefined` o a `localhost` | `VITE_API_URL` no existía al compilar: créala y redespliega |
| Recargar `/profile` o `/reset-password` da "404" | Falta `frontend/vercel.json` |
| El enlace del correo abre `localhost` | `CLIENT_URL` en Render conserva el valor antiguo |
| La primera carga tarda cerca de un minuto | El backend gratuito está despertando; es normal |
