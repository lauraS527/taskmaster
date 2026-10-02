const { resetDb, closeDb, client, registerUser } = require('./helpers');

let user;

beforeEach(async () => {
  await resetDb();
  user = await registerUser();
});

afterAll(closeDb);

const api = () => client(user.token);

async function createCategory(name, token = user.token) {
  const res = await client(token).post('/api/categories', { name });
  expect(res.statusCode).toBe(201);
  return res.body;
}

describe('acceso sin sesión', () => {
  test('GET /api/categories responde 401 sin token', async () => {
    const res = await client().get('/api/categories');

    expect(res.statusCode).toBe(401);
  });
});

describe('POST y GET /api/categories', () => {
  test('crea categorías y las lista ordenadas por nombre', async () => {
    await createCategory('Trabajo');
    await createCategory('Estudio');

    const res = await api().get('/api/categories');

    expect(res.statusCode).toBe(200);
    expect(res.body.map((category) => category.name)).toEqual(['Estudio', 'Trabajo']);
  });

  test('rechaza un nombre repetido con 409', async () => {
    await createCategory('Trabajo');

    const res = await api().post('/api/categories', { name: 'Trabajo' });

    expect(res.statusCode).toBe(409);
  });

  test('dos cuentas distintas pueden tener una categoría con el mismo nombre', async () => {
    const other = await registerUser({ email: 'otra@test.com' });

    await createCategory('Trabajo');
    const res = await client(other.token).post('/api/categories', { name: 'Trabajo' });

    expect(res.statusCode).toBe(201);
  });

  test.each([
    ['vacío', { name: '   ' }],
    ['ausente', {}],
    ['de más de 50 caracteres', { name: 'a'.repeat(51) }]
  ])('rechaza un nombre %s con 400', async (_caso, body) => {
    const res = await api().post('/api/categories', body);

    expect(res.statusCode).toBe(400);
  });
});

describe('PUT y DELETE /api/categories/:id', () => {
  test('renombra una categoría', async () => {
    const category = await createCategory('Estudio');

    const res = await api().put(`/api/categories/${category.id}`, { name: 'Universidad' });
    expect(res.statusCode).toBe(200);
    expect(res.body.name).toBe('Universidad');

    const list = await api().get('/api/categories');
    expect(list.body.map((item) => item.name)).toEqual(['Universidad']);
  });

  test('elimina una categoría', async () => {
    const category = await createCategory('Estudio');

    const res = await api().delete(`/api/categories/${category.id}`);
    expect(res.statusCode).toBe(200);

    const list = await api().get('/api/categories');
    expect(list.body).toEqual([]);
  });

  test('responde 400 con un id inválido y 404 con un id que no existe', async () => {
    const invalid = await api().delete('/api/categories/abc');
    const missing = await api().delete('/api/categories/99999');

    expect(invalid.statusCode).toBe(400);
    expect(missing.statusCode).toBe(404);
  });
});

describe('aislamiento entre cuentas', () => {
  test('otra cuenta no puede renombrar ni borrar mis categorías', async () => {
    const category = await createCategory('Trabajo');
    const other = await registerUser({ email: 'otra@test.com' });
    const url = `/api/categories/${category.id}`;

    const rename = await client(other.token).put(url, { name: 'Hackeada' });
    const remove = await client(other.token).delete(url);

    expect(rename.statusCode).toBe(404);
    expect(remove.statusCode).toBe(404);

    // La categoría sigue intacta para su dueña
    const list = await api().get('/api/categories');
    expect(list.body.map((item) => item.name)).toEqual(['Trabajo']);

    // Y la otra cuenta no la ve en su lista
    const otherList = await client(other.token).get('/api/categories');
    expect(otherList.body).toEqual([]);
  });
});
