const mysql = require('mysql2/promise');

async function migrate() {
  const conn = await mysql.createConnection({
    host: '127.0.0.1',
    port: 3306,
    user: 'root',
    password: 'anil@2005',
    database: 'profilereel_ai',
  });

  const [cols] = await conn.query('SHOW COLUMNS FROM users');
  const existing = cols.map((c) => c.Field);
  console.log('Existing columns:', existing);

  const toAdd = [
    { name: 'name', def: 'VARCHAR(255) NULL' },
    { name: 'linkedinId', def: 'VARCHAR(255) NULL' },
    { name: 'headline', def: 'VARCHAR(255) NULL' },
    { name: 'avatarUrl', def: 'TEXT NULL' },
    { name: 'isPro', def: 'TINYINT(1) NOT NULL DEFAULT 0' },
    { name: 'proExpiresAt', def: 'DATETIME NULL' },
    { name: 'lastPaymentId', def: 'VARCHAR(255) NULL' },
  ];

  for (const col of toAdd) {
    if (!existing.includes(col.name)) {
      await conn.query(`ALTER TABLE users ADD COLUMN ${col.name} ${col.def}`);
      console.log('Added column:', col.name);
    }
  }

  const [updated] = await conn.query('SHOW COLUMNS FROM users');
  console.log('Updated columns:', updated.map((c) => c.Field));
  await conn.end();
}

migrate().catch(console.error);

