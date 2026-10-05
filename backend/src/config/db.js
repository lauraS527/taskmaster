const mysql = require('mysql2/promise');

// En la nube (por ejemplo Aiven) la conexión a MySQL va cifrada.
// DB_SSL=true la activa. Si además se entrega DB_SSL_CA (el certificado de la
// entidad que firma el servidor), el servidor se verifica; si no, solo se cifra.
// En tu computador no se define DB_SSL y todo sigue funcionando igual que antes.
function buildSsl() {
  if (process.env.DB_SSL !== 'true') {
    return undefined;
  }

  // Los certificados tienen saltos de línea; en una variable de entorno se escriben como \n
  const ca = process.env.DB_SSL_CA ? process.env.DB_SSL_CA.replace(/\\n/g, '\n') : undefined;

  return ca ? { ca } : { rejectUnauthorized: false };
}

const pool = mysql.createPool({
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT) || 3306, // los servicios en la nube usan puertos distintos al 3306
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  ssl: buildSsl(),
  waitForConnections: true,
  connectionLimit: 10
});

module.exports = pool;
