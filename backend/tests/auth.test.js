// El servicio de correo se reemplaza por una versión falsa: las pruebas nunca
// envían correos de verdad, y podemos leer el enlace que se habría enviado.
jest.mock('../src/services/email.service', () => ({
  sendPasswordResetEmail: jest.fn().mockResolvedValue()
}));

const { sendPasswordResetEmail } = require('../src/services/email.service');
const { db, resetDb, closeDb, client, registerUser } = require('./helpers');

beforeEach(async () => {
  await resetDb();
  sendPasswordResetEmail.mockClear();
});

afterAll(closeDb);

describe('POST /api/auth/register', () => {
  test('crea la cuenta y devuelve un token', async () => {
    const res = await client().post('/api/auth/register', {
      name: 'Laura',
      email: 'laura@test.com',
      password: 'clave12345'
    });

    expect(res.statusCode).toBe(201);
    expect(res.body.token).toBeDefined();
    expect(res.body.user.email).toBe('laura@test.com');
    expect(res.body.user.password_hash).toBeUndefined();
  });

  test('guarda la contraseña cifrada, nunca en texto normal', async () => {
    await registerUser({ email: 'laura@test.com', password: 'clave12345' });

    const [rows] = await db.query(
      'SELECT password_hash FROM users WHERE email = ?',
      ['laura@test.com']
    );

    expect(rows[0].password_hash).not.toBe('clave12345');
    expect(rows[0].password_hash.startsWith('$2')).toBe(true); // formato de bcrypt
  });

  test('guarda el correo en minúsculas', async () => {
    const res = await client().post('/api/auth/register', {
      name: 'Laura',
      email: 'LAURA@Test.com',
      password: 'clave12345'
    });

    expect(res.body.user.email).toBe('laura@test.com');
  });

  test('rechaza un correo repetido con 409, aunque cambien las mayúsculas', async () => {
    await registerUser({ email: 'laura@test.com' });

    const res = await client().post('/api/auth/register', {
      name: 'Otra Laura',
      email: 'LAURA@test.com',
      password: 'clave12345'
    });

    expect(res.statusCode).toBe(409);
  });

  test.each([
    ['sin nombre', { email: 'a@test.com', password: 'clave12345' }],
    ['sin correo', { name: 'A', password: 'clave12345' }],
    ['con un correo inválido', { name: 'A', email: 'abc', password: 'clave12345' }],
    ['con una contraseña de menos de 8 caracteres', { name: 'A', email: 'a@test.com', password: 'abc' }]
  ])('rechaza el registro %s con 400', async (_caso, body) => {
    const res = await client().post('/api/auth/register', body);

    expect(res.statusCode).toBe(400);
  });
});

describe('POST /api/auth/login', () => {
  test('inicia sesión con credenciales correctas', async () => {
    const user = await registerUser();

    const res = await client().post('/api/auth/login', {
      email: user.email,
      password: user.password
    });

    expect(res.statusCode).toBe(200);
    expect(res.body.token).toBeDefined();
    expect(res.body.user.email).toBe(user.email);
  });

  test('responde 401 con una contraseña incorrecta', async () => {
    const user = await registerUser();

    const res = await client().post('/api/auth/login', {
      email: user.email,
      password: 'otraClave999'
    });

    expect(res.statusCode).toBe(401);
  });

  test('responde 401 con el mismo mensaje si el correo no existe', async () => {
    const user = await registerUser();

    const wrongPassword = await client().post('/api/auth/login', {
      email: user.email,
      password: 'otraClave999'
    });
    const unknownEmail = await client().post('/api/auth/login', {
      email: 'nadie@test.com',
      password: 'clave12345'
    });

    expect(unknownEmail.statusCode).toBe(401);
    // Mismo mensaje en ambos casos: nadie puede averiguar qué correos existen
    expect(unknownEmail.body).toEqual(wrongPassword.body);
  });

  test('responde 400 si faltan datos', async () => {
    const res = await client().post('/api/auth/login', { email: 'a@test.com' });

    expect(res.statusCode).toBe(400);
  });
});

describe('recuperación de contraseña', () => {
  test('flujo completo: pedir el enlace, cambiar la contraseña y no reutilizar el código', async () => {
    const user = await registerUser();

    // 1. Pedir el enlace
    const forgot = await client().post('/api/auth/forgot-password', { email: user.email });
    expect(forgot.statusCode).toBe(200);
    expect(sendPasswordResetEmail).toHaveBeenCalledTimes(1);

    // 2. Leer el código del enlace que "se envió" (segundo argumento de la función)
    const resetUrl = sendPasswordResetEmail.mock.calls[0][1];
    const token = new URL(resetUrl).searchParams.get('token');
    expect(token).toBeTruthy();

    // 3. Usar el código para cambiar la contraseña
    const reset = await client().post('/api/auth/reset-password', {
      token,
      password: 'nuevaClave123'
    });
    expect(reset.statusCode).toBe(200);

    // 4. La contraseña nueva funciona y la vieja ya no
    const loginNew = await client().post('/api/auth/login', {
      email: user.email,
      password: 'nuevaClave123'
    });
    expect(loginNew.statusCode).toBe(200);

    const loginOld = await client().post('/api/auth/login', {
      email: user.email,
      password: user.password
    });
    expect(loginOld.statusCode).toBe(401);

    // 5. El código solo sirve una vez
    const again = await client().post('/api/auth/reset-password', {
      token,
      password: 'otraClave456'
    });
    expect(again.statusCode).toBe(400);
  });

  test('responde igual y no envía correo si el correo no existe', async () => {
    const user = await registerUser();

    const real = await client().post('/api/auth/forgot-password', { email: user.email });
    sendPasswordResetEmail.mockClear();

    const fake = await client().post('/api/auth/forgot-password', { email: 'nadie@test.com' });

    expect(fake.statusCode).toBe(200);
    expect(fake.body).toEqual(real.body);
    expect(sendPasswordResetEmail).not.toHaveBeenCalled();
  });

  test('rechaza un código inventado con 400', async () => {
    const res = await client().post('/api/auth/reset-password', {
      token: 'codigo-inventado',
      password: 'nuevaClave123'
    });

    expect(res.statusCode).toBe(400);
  });

  test('rechaza una contraseña nueva de menos de 8 caracteres con 400', async () => {
    const res = await client().post('/api/auth/reset-password', {
      token: 'cualquier-codigo',
      password: 'abc'
    });

    expect(res.statusCode).toBe(400);
  });
});
