const mysql = require('mysql2/promise');

async function createTable() {
  const conn = await mysql.createConnection({
    host: process.env.DB_HOST || '127.0.0.1',
    port: parseInt(process.env.DB_PORT || '3306', 10),
    user: process.env.DB_USERNAME || 'root',
    password: process.env.DB_PASSWORD || 'anil@2005',
    database: process.env.DB_DATABASE || 'profilereel_ai',
  });

  const sql = `
    CREATE TABLE IF NOT EXISTS job_applications (
      id VARCHAR(36) PRIMARY KEY,
      job_id VARCHAR(100) NOT NULL,
      job_title VARCHAR(255) NOT NULL,
      company_name VARCHAR(255) NOT NULL,
      full_name VARCHAR(255) NOT NULL,
      email VARCHAR(255) NOT NULL,
      phone VARCHAR(50) NOT NULL,
      linkedin_url VARCHAR(500) NULL,
      current_salary VARCHAR(100) NULL,
      expected_salary VARCHAR(100) NULL,
      location VARCHAR(255) NULL,
      resume_file_name VARCHAR(255) NULL,
      resume_data LONGTEXT NULL,
      status VARCHAR(50) DEFAULT 'applied',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `;

  await conn.query(sql);
  console.log('Successfully created or verified table job_applications!');

  const [columns] = await conn.query('DESCRIBE job_applications');
  console.log('Table structure:');
  console.table(columns);

  await conn.end();
}

createTable().catch((err) => {
  console.error('Error creating table:', err);
  process.exit(1);
});

