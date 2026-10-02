// Crea (o recrea desde cero) la base de datos de PRUEBAS: taskmaster_test.
// Usa el mismo schema.sql del proyecto, cambiando solo el nombre de la base.
// Uso:  npm run db:test
//
// Seguridad: este script solo toca la base "taskmaster_test".
// Tu base real ("taskmaster") nunca se modifica.

require('dotenv').config({ quiet: true });
const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');

const TEST_DB = 'taskmaster_test';

async function main() {
  const schema = fs
    .readFileSync(path.join(__dirname, 'schema.sql'), 'utf8')
    .replace(/\btaskmaster\b/g, TEST_DB);

  const connection = await mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    multipleStatements: true // permite ejecutar todo el archivo de una vez
  });

  try {
    await connection.query(`DROP DATABASE IF EXISTS ${TEST_DB}`);
    await connection.query(schema);
    console.log(`Base de datos ${TEST_DB} lista`);
  } finally {
    await connection.end();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
