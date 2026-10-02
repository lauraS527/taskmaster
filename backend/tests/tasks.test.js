const { resetDb, closeDb, client, registerUser } = require('./helpers');

let user;

beforeEach(async () => {
  await resetDb();
  user = await registerUser();
});

afterAll(closeDb);

const api = () => client(user.token);
const titles = (res) => res.body.map((task) => task.title);

async function createTask(body, token = user.token) {
  const res = await client(token).post('/api/tasks', body);
  expect(res.statusCode).toBe(201);
  return res.body;
}

async function createCategory(name, token = user.token) {
  const res = await client(token).post('/api/categories', { name });
  expect(res.statusCode).toBe(201);
  return res.body;
}

describe('acceso sin sesión', () => {
  test('GET /api/tasks responde 401 sin token', async () => {
    const res = await client().get('/api/tasks');

    expect(res.statusCode).toBe(401);
  });
});

describe('POST /api/tasks', () => {
  test('usa prioridad media y estado pendiente por defecto', async () => {
    const res = await api().post('/api/tasks', { title: 'Estudiar SQL' });

    expect(res.statusCode).toBe(201);
    expect(res.body).toMatchObject({
      title: 'Estudiar SQL',
      priority: 'media',
      status: 'pendiente',
      category_id: null,
      due_date: null
    });
  });

  test('guarda todos los campos y devuelve el nombre de la categoría', async () => {
    const category = await createCategory('Trabajo');

    const task = await createTask({
      title: 'Entregar informe',
      description: 'Revisar datos',
      due_date: '2026-10-15',
      priority: 'alta',
      category_id: category.id
    });

    expect(task).toMatchObject({
      title: 'Entregar informe',
      description: 'Revisar datos',
      due_date: '2026-10-15',
      priority: 'alta',
      category_id: category.id,
      category_name: 'Trabajo'
    });
  });

  test.each([
    ['sin título', { description: 'sin título' }],
    ['con una prioridad inválida', { title: 'T', priority: 'urgente' }],
    ['con un estado inválido', { title: 'T', status: 'hecho' }],
    ['con una fecha de formato incorrecto', { title: 'T', due_date: '15/10/2026' }],
    ['con una fecha que no existe', { title: 'T', due_date: '2026-02-30' }],
    ['con un título de más de 150 caracteres', { title: 'a'.repeat(151) }]
  ])('rechaza una tarea %s con 400', async (_caso, body) => {
    const res = await api().post('/api/tasks', body);

    expect(res.statusCode).toBe(400);
  });

  test('rechaza una categoría que no existe con 400', async () => {
    const res = await api().post('/api/tasks', { title: 'T', category_id: 99999 });

    expect(res.statusCode).toBe(400);
  });

  test('rechaza la categoría de otra cuenta con 400', async () => {
    const other = await registerUser({ email: 'otra@test.com' });
    const foreignCategory = await createCategory('Ajena', other.token);

    const res = await api().post('/api/tasks', { title: 'T', category_id: foreignCategory.id });

    expect(res.statusCode).toBe(400);
  });

  test('ignora un user_id enviado en el cuerpo: la tarea siempre es de quien tiene la sesión', async () => {
    const other = await registerUser({ email: 'otra@test.com' });

    await createTask({ title: 'Mía', user_id: other.id });

    const mine = await api().get('/api/tasks');
    const theirs = await client(other.token).get('/api/tasks');
    expect(titles(mine)).toEqual(['Mía']);
    expect(theirs.body).toEqual([]);
  });
});

describe('GET /api/tasks (filtros y orden)', () => {
  beforeEach(async () => {
    const work = await createCategory('Trabajo');
    await createTask({
      title: 'Informe',
      priority: 'alta',
      status: 'pendiente',
      due_date: '2026-10-20',
      category_id: work.id
    });
    await createTask({
      title: 'Leer',
      priority: 'baja',
      status: 'en_progreso',
      due_date: '2026-10-10'
    });
    await createTask({
      title: 'Ideas',
      priority: 'media',
      status: 'completada'
    });
  });

  test('sin filtros devuelve todas las tareas del usuario', async () => {
    const res = await api().get('/api/tasks');

    expect(res.statusCode).toBe(200);
    expect(titles(res).sort()).toEqual(['Ideas', 'Informe', 'Leer']);
  });

  test('filtra por prioridad', async () => {
    const res = await api().get('/api/tasks?priority=alta');

    expect(titles(res)).toEqual(['Informe']);
  });

  test('filtra por estado', async () => {
    const res = await api().get('/api/tasks?status=en_progreso');

    expect(titles(res)).toEqual(['Leer']);
  });

  test('filtra por categoría', async () => {
    const [category] = (await api().get('/api/categories')).body;

    const res = await api().get(`/api/tasks?category_id=${category.id}`);

    expect(titles(res)).toEqual(['Informe']);
  });

  test('combina varios filtros', async () => {
    const match = await api().get('/api/tasks?status=pendiente&priority=alta');
    const noMatch = await api().get('/api/tasks?status=completada&priority=alta');

    expect(titles(match)).toEqual(['Informe']);
    expect(noMatch.body).toEqual([]);
  });

  test('ordena por fecha de vencimiento y deja las tareas sin fecha al final', async () => {
    const asc = await api().get('/api/tasks?sort=due_date');
    const desc = await api().get('/api/tasks?sort=due_date&order=desc');

    expect(titles(asc)).toEqual(['Leer', 'Informe', 'Ideas']);
    expect(titles(desc)).toEqual(['Informe', 'Leer', 'Ideas']);
  });

  test('ordena por prioridad (baja < media < alta)', async () => {
    const asc = await api().get('/api/tasks?sort=priority');
    const desc = await api().get('/api/tasks?sort=priority&order=desc');

    expect(titles(asc)).toEqual(['Leer', 'Ideas', 'Informe']);
    expect(titles(desc)).toEqual(['Informe', 'Ideas', 'Leer']);
  });

  test('ordena por título', async () => {
    const res = await api().get('/api/tasks?sort=title');

    expect(titles(res)).toEqual(['Ideas', 'Informe', 'Leer']);
  });

  test.each([
    ['un sort que no está permitido', '?sort=password'],
    ['un estado inválido', '?status=hecho'],
    ['una prioridad inválida', '?priority=urgente'],
    ['una categoría inválida', '?category_id=abc'],
    ['un order inválido', '?order=sideways']
  ])('responde 400 con %s', async (_caso, query) => {
    const res = await api().get(`/api/tasks${query}`);

    expect(res.statusCode).toBe(400);
  });
});

describe('GET, PATCH y DELETE /api/tasks/:id', () => {
  let task;

  beforeEach(async () => {
    task = await createTask({ title: 'Mi tarea', priority: 'alta' });
  });

  test('GET devuelve la tarea; 404 si no existe; 400 si el id es inválido', async () => {
    const found = await api().get(`/api/tasks/${task.id}`);
    const missing = await api().get('/api/tasks/99999');
    const invalid = await api().get('/api/tasks/abc');

    expect(found.statusCode).toBe(200);
    expect(found.body.title).toBe('Mi tarea');
    expect(missing.statusCode).toBe(404);
    expect(invalid.statusCode).toBe(400);
  });

  test('PATCH cambia el estado sin tocar los demás campos (así se mueve entre columnas)', async () => {
    const inProgress = await api().patch(`/api/tasks/${task.id}`, { status: 'en_progreso' });
    expect(inProgress.statusCode).toBe(200);
    expect(inProgress.body).toMatchObject({
      status: 'en_progreso',
      title: 'Mi tarea',
      priority: 'alta'
    });

    const done = await api().patch(`/api/tasks/${task.id}`, { status: 'completada' });
    expect(done.body.status).toBe('completada');
  });

  test('PATCH asigna y quita la categoría', async () => {
    const category = await createCategory('Trabajo');

    const assigned = await api().patch(`/api/tasks/${task.id}`, { category_id: category.id });
    expect(assigned.body.category_name).toBe('Trabajo');

    const removed = await api().patch(`/api/tasks/${task.id}`, { category_id: null });
    expect(removed.body.category_id).toBeNull();
    expect(removed.body.category_name).toBeNull();
  });

  test('PATCH rechaza la categoría de otra cuenta con 400', async () => {
    const other = await registerUser({ email: 'otra@test.com' });
    const foreignCategory = await createCategory('Ajena', other.token);

    const res = await api().patch(`/api/tasks/${task.id}`, { category_id: foreignCategory.id });

    expect(res.statusCode).toBe(400);
  });

  test.each([
    ['un cuerpo vacío', {}],
    ['una prioridad inválida', { priority: 'urgente' }],
    ['un estado inválido', { status: 'hecho' }],
    ['un título vacío', { title: '   ' }]
  ])('PATCH responde 400 con %s', async (_caso, body) => {
    const res = await api().patch(`/api/tasks/${task.id}`, body);

    expect(res.statusCode).toBe(400);
  });

  test('DELETE elimina la tarea', async () => {
    const res = await api().delete(`/api/tasks/${task.id}`);
    expect(res.statusCode).toBe(200);

    const after = await api().get(`/api/tasks/${task.id}`);
    expect(after.statusCode).toBe(404);
  });

  test('DELETE responde 404 si no existe y 400 si el id es inválido', async () => {
    const missing = await api().delete('/api/tasks/99999');
    const invalid = await api().delete('/api/tasks/abc');

    expect(missing.statusCode).toBe(404);
    expect(invalid.statusCode).toBe(400);
  });

  test('al borrar la categoría, la tarea se conserva sin categoría', async () => {
    const category = await createCategory('Trabajo');
    await api().patch(`/api/tasks/${task.id}`, { category_id: category.id });

    const removeCategory = await api().delete(`/api/categories/${category.id}`);
    expect(removeCategory.statusCode).toBe(200);

    const res = await api().get(`/api/tasks/${task.id}`);
    expect(res.statusCode).toBe(200);
    expect(res.body.category_id).toBeNull();
    expect(res.body.category_name).toBeNull();
  });
});

describe('aislamiento entre cuentas', () => {
  test('otra cuenta no puede ver, editar ni borrar mis tareas', async () => {
    const task = await createTask({ title: 'Privada' });
    const other = await registerUser({ email: 'otra@test.com' });
    const url = `/api/tasks/${task.id}`;

    const read = await client(other.token).get(url);
    const edit = await client(other.token).patch(url, { title: 'Hackeada' });
    const remove = await client(other.token).delete(url);
    const list = await client(other.token).get('/api/tasks');

    expect(read.statusCode).toBe(404);
    expect(edit.statusCode).toBe(404);
    expect(remove.statusCode).toBe(404);
    expect(list.body).toEqual([]);

    // La tarea sigue intacta para su dueña
    const mine = await api().get(url);
    expect(mine.statusCode).toBe(200);
    expect(mine.body.title).toBe('Privada');
  });
});
