const mysql = require('mysql2/promise');

const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  port: Number(process.env.DB_PORT) || 3306,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

async function testConnection() {
  try {
    const connection = await pool.getConnection();
    console.log('✅ contact-service conectado a MySQL correctamente');
    connection.release();
  } catch (error) {
    console.error('❌ contact-service no pudo conectar a MySQL:', error.message);
  }
}

module.exports = { pool, testConnection };
