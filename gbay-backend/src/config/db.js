const mysql = require('mysql2');

const db = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASS,
  database: process.env.DB_NAME
});

// Error handler for pool
db.on('error', (err) => {
  console.error('Database pool error:', err);
  if (err.code === 'PROTOCOL_CONNECTION_LOST') {
    console.error('Connection lost');
  }
  if (err.code === 'PROTOCOL_ENQUEUE_AFTER_FATAL_ERROR') {
    console.error('Fatal error - enqueue after error');
  }
  if (err.code === 'PROTOCOL_ENQUEUE_AFTER_DESTROY') {
    console.error('Error - enqueue after destroy');
  }
});

module.exports = db;
