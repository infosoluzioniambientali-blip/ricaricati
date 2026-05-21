import mysql from 'mysql2/promise';

const DB_URL = process.env.DATABASE_URL;

async function main() {
  const conn = await mysql.createConnection(DB_URL);
  
  const tables = ['users', 'installatori', 'ordini', 'pratiche', 'documenti', 'classifica', 'listino_riservato', 'listino_personalizzato', 'backup_config', 'backup_storico'];
  
  const backup = {
    exportedAt: new Date().toISOString(),
    version: '88f5d1fb',
    site: 'https://www.soluzionipratiche.info',
    tables: {}
  };
  
  for (const table of tables) {
    try {
      const [rows] = await conn.execute(`SELECT * FROM \`${table}\``);
      backup.tables[table] = rows;
      console.log(`✓ ${table}: ${rows.length} righe`);
    } catch (e) {
      console.log(`⚠ ${table}: ${e.message}`);
      backup.tables[table] = [];
    }
  }
  
  await conn.end();
  
  const json = JSON.stringify(backup, null, 2);
  process.stdout.write(json);
}

main().catch(console.error);
