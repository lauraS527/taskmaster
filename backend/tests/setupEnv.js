// Jest ejecuta este archivo ANTES de cargar cada archivo de pruebas.
// Su trabajo principal: hacer que las pruebas usen la base de datos de PRUEBAS
// y nunca la real.

require('dotenv').config({ quiet: true });

process.env.DB_NAME = process.env.DB_NAME_TEST || 'taskmaster_test';
process.env.JWT_SECRET = process.env.JWT_SECRET || 'secreto-solo-para-pruebas';
process.env.CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:5173';

// Freno de seguridad: las pruebas borran datos, así que solo se permite una
// base cuyo nombre termine en "_test".
if (!process.env.DB_NAME.endsWith('_test')) {
  throw new Error(
    `Por seguridad, las pruebas solo pueden usar una base que termine en "_test" (recibí "${process.env.DB_NAME}")`
  );
}
