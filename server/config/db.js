const mysql = require('mysql2/promise');
require('dotenv').config();

// Create the connection pool
const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'sdms_db',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// Test the connection
pool.getConnection()
  .then(connection => {
    console.log('Database connected successfully');
    console.log('Using database:', process.env.DB_NAME || 'sdms_db');
    connection.release();
  })
  .catch(err => {
    console.error('Error connecting to the database:', err);
    console.error('Error Code:', err.code);
    console.error('Error Message:', err.message);
  });

module.exports = pool; 