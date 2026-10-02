const request = require('supertest');
const app = require('../src/app');
const db = require('../src/config/db');

// Borra todos los usuarios. Por el ON DELETE CASCADE del esquema, también se
// borran sus categorías, tareas y códigos de recuperación.
// Se ejecuta antes de cada prueba para que ninguna dependa de otra.
async function resetDb() {
  await db.query('DELETE FROM users');
}

// Cierra las conexiones a MySQL. Si no se hace, Jest se queda esperando al terminar.
function closeDb() {
  return db.end();
}

// Cliente HTTP para llamar a la API sin encender el servidor.
// Si le das un token, lo envía en el encabezado Authorization.
//   client().get('/api/tasks')                     -> sin sesión
//   client(token).post('/api/tasks', { title: 'x' }) -> con sesión
function client(token) {
  const call = (method) => (url, body) => {
    let req = request(app)[method](url);
    if (token) {
      req = req.set('Authorization', `Bearer ${token}`);
    }
    return body === undefined ? req : req.send(body);
  };

  return {
    get: call('get'),
    post: call('post'),
    put: call('put'),
    patch: call('patch'),
    delete: call('delete')
  };
}

// Crea un usuario usando la API real y devuelve sus datos junto con su token.
async function registerUser(overrides = {}) {
  const user = {
    name: 'Usuario Prueba',
    email: 'prueba@test.com',
    password: 'clave12345',
    ...overrides
  };

  const res = await client().post('/api/auth/register', user);
  if (res.statusCode !== 201) {
    throw new Error(`No se pudo crear el usuario de prueba: ${JSON.stringify(res.body)}`);
  }

  return { ...user, id: res.body.user.id, token: res.body.token };
}

module.exports = { db, resetDb, closeDb, client, registerUser };
