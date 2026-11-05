const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');

function readEnv(filePath) {
  const env = {};
  for (const line of fs.readFileSync(filePath, 'utf8').split(/\r?\n/)) {
    const match = line.match(/^([A-Z0-9_]+)=(.*)$/);
    if (match) env[match[1]] = match[2].trim();
  }
  return env;
}

async function main() {
  const env = readEnv(path.join(__dirname, '..', '.env'));
  const conn = await mysql.createConnection({
    host: env.DB_HOST || '127.0.0.1',
    port: Number(env.DB_PORT || 3306),
    user: env.DB_USERNAME || 'root',
    password: env.DB_PASSWORD || '',
    database: env.DB_DATABASE || 'profilereel_ai',
  });

  const [existing] = await conn.query(
    "SHOW COLUMNS FROM job_applications LIKE 'interviewing_at'",
  );
  if (existing.length === 0) {
    await conn.query(
      'ALTER TABLE job_applications ADD COLUMN interviewing_at VARCHAR(255) NULL AFTER location',
    );
    console.log('ADDED interviewing_at');
  } else {
    console.log('ALREADY PRESENT');
  }

  const [columns] = await conn.query('SHOW COLUMNS FROM job_applications');
  console.log(columns.map((column) => `${column.Field}:${column.Null}`).join('\n'));
  await conn.end();
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
