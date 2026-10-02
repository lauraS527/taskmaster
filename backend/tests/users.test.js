const { resetDb, closeDb, client, registerUser } = require('./helpers');

beforeEach(resetDb);
afterAll(closeDb);

describe('acceso sin sesión', () => {
  test.each([
    ['get', '/api/users/me'],
    ['put', '/api/users/me'],
    ['put', '/api/users/me/password']
  ])('%s %s responde 401 sin token', async (method, url) => {
    const res = await client()[method](url);

    expect(res.statusCode).toBe(401);
  });

  test('rechaza un token falso con 401', async () => {
    const res = await client('token-falso').get('/api/users/me');

    expect(res.statusCode).toBe(401);
  });
});

describe('GET /api/users/me', () => {
  test('devuelve el perfil sin la contraseña', async () => {
    const user = await registerUser({ name: 'Laura', email: 'laura@test.com' });

    const res = await client(user.token).get('/api/users/me');

    expect(res.statusCode).toBe(200);
    expect(res.body).toMatchObject({ id: user.id, name: 'Laura', email: 'laura@test.com' });
    expect(res.body.password_hash).toBeUndefined();
  });
});

describe('PUT /api/users/me', () => {
  test('actualiza nombre y correo, y el token sigue funcionando', async () => {
    const user = await registerUser();

    const update = await client(user.token).put('/api/users/me', {
      name: 'Laura Editada',
      email: 'Laura.Nueva@Test.com'
    });

    expect(update.statusCode).toBe(200);
    expect(update.body).toMatchObject({ name: 'Laura Editada', email: 'laura.nueva@test.com' });

    // El token solo guarda el id, así que sigue siendo válido tras cambiar el correo
    const profile = await client(user.token).get('/api/users/me');
    expect(profile.statusCode).toBe(200);
    expect(profile.body.name).toBe('Laura Editada');
  });

  test('rechaza un correo que ya usa otra cuenta con 409', async () => {
    const user = await registerUser();
    await registerUser({ email: 'otra@test.com' });

    const res = await client(user.token).put('/api/users/me', {
      name: 'Laura',
      email: 'otra@test.com'
    });

    expect(res.statusCode).toBe(409);
  });

  test.each([
    ['con un correo inválido', { name: 'Laura', email: 'abc' }],
    ['sin nombre', { name: '  ', email: 'a@test.com' }],
    ['sin correo', { name: 'Laura' }]
  ])('rechaza la edición %s con 400', async (_caso, body) => {
    const user = await registerUser();

    const res = await client(user.token).put('/api/users/me', body);

    expect(res.statusCode).toBe(400);
  });
});

describe('PUT /api/users/me/password', () => {
  test('cambia la contraseña cuando la actual es correcta', async () => {
    const user = await registerUser();

    const res = await client(user.token).put('/api/users/me/password', {
      currentPassword: user.password,
      newPassword: 'otraClave456'
    });
    expect(res.statusCode).toBe(200);

    const loginNew = await client().post('/api/auth/login', {
      email: user.email,
      password: 'otraClave456'
    });
    expect(loginNew.statusCode).toBe(200);

    const loginOld = await client().post('/api/auth/login', {
      email: user.email,
      password: user.password
    });
    expect(loginOld.statusCode).toBe(401);
  });

  test.each([
    ['la actual es incorrecta', { currentPassword: 'incorrecta99', newPassword: 'otraClave456' }],
    ['la nueva tiene menos de 8 caracteres', { currentPassword: 'clave12345', newPassword: 'abc' }],
    ['la nueva es igual a la actual', { currentPassword: 'clave12345', newPassword: 'clave12345' }],
    ['faltan datos', { currentPassword: 'clave12345' }]
  ])('responde 400 si %s', async (_caso, body) => {
    const user = await registerUser();

    const res = await client(user.token).put('/api/users/me/password', body);

    expect(res.statusCode).toBe(400);
  });
});
