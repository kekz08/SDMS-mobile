const mysql = require('mysql2/promise');
const fs = require('fs').promises;
const path = require('path');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const DB_NAME = process.env.DB_NAME || 'sdms_db';

async function setupDatabase() {
  try {
    // Create database connection
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      multipleStatements: true // Enable running multiple SQL statements
    });

    console.log('Connected to MySQL server');

    // Create database if it doesn't exist
    await connection.query(`CREATE DATABASE IF NOT EXISTS ${DB_NAME}`);
    console.log('Database created or already exists:', DB_NAME);

    // Use the database
    await connection.query(`USE ${DB_NAME}`);
    console.log('Using database:', DB_NAME);

    // Read and execute the init_db.sql file
    const initSql = await fs.readFile(path.join(__dirname, 'init_db.sql'), 'utf8');
    await connection.query(initSql);
    console.log('Database tables created successfully');

    // Create admin user
    const adminPassword = 'admin123'; // Default admin password
    const hashedPassword = await bcrypt.hash(adminPassword, 10);
    
    // Read the create_admin.sql file
    let adminSql = await fs.readFile(path.join(__dirname, 'create_admin.sql'), 'utf8');
    
    // Replace the placeholder password with the hashed password
    adminSql = adminSql.replace('$2a$10$YourHashedPasswordHere', hashedPassword);
    
    // Execute the admin creation SQL
    await connection.query(adminSql);
    console.log('Admin user created or already exists');
    console.log('Admin credentials:');
    console.log('Email: admin@sdms.edu.ph');
    console.log('Password:', adminPassword);

    // Create upload directories
    const uploadDirs = [
      path.join(__dirname, 'uploads'),
      path.join(__dirname, 'uploads', 'profiles'),
      path.join(__dirname, 'uploads', 'documents')
    ];

    for (const dir of uploadDirs) {
      await fs.mkdir(dir, { recursive: true });
      console.log('Created directory:', dir);
    }

    console.log('Database and directories setup completed successfully');
    process.exit(0);
  } catch (error) {
    console.error('Error setting up database:', error);
    process.exit(1);
  }
}

setupDatabase(); 