import mysql2 from 'mysql2/promise';
import { createHash } from 'crypto';
import { readFileSync } from 'fs';

const conn = await mysql2.createConnection(process.env.DATABASE_URL);

const journal = JSON.parse(readFileSync('./drizzle/meta/_journal.json', 'utf8'));
const [existing] = await conn.query('SELECT hash FROM __drizzle_migrations');
const existingHashes = new Set(existing.map(r => r.hash));

// Migrazioni pendenti
const pending = [];
for (const entry of journal.entries) {
  const sqlFile = `./drizzle/${entry.tag}.sql`;
  let content;
  try { content = readFileSync(sqlFile, 'utf8'); } catch { continue; }
  const hash = createHash('sha256').update(content).digest('hex');
  if (!existingHashes.has(hash)) {
    pending.push({ tag: entry.tag, hash, content });
  }
}

console.log('Pending migrations:', pending.map(p => p.tag));

for (const mig of pending) {
  console.log(`\nProcessing: ${mig.tag}`);
  // Dividi in statement singoli
  const statements = mig.content
    .split('--> statement-breakpoint')
    .map(s => s.trim())
    .filter(s => s.length > 0);
  
  let allOk = true;
  for (const stmt of statements) {
    if (!stmt || stmt.startsWith('--')) continue;
    try {
      await conn.query(stmt);
      console.log(`  ✅ OK: ${stmt.substring(0, 60)}...`);
    } catch (e) {
      if (e.code === 'ER_DUP_FIELDNAME' || e.code === 'ER_TABLE_EXISTS_ERROR' || e.code === 'ER_DUP_KEYNAME') {
        console.log(`  ⚠️  Already exists (skipped): ${stmt.substring(0, 60)}`);
      } else {
        console.log(`  ❌ Error: ${e.message}`);
        console.log(`     SQL: ${stmt.substring(0, 100)}`);
        allOk = false;
      }
    }
  }
  
  // Registra la migrazione come applicata (anche se alcune istruzioni erano già presenti)
  const now = Date.now();
  await conn.query('INSERT INTO __drizzle_migrations (hash, created_at) VALUES (?, ?)', [mig.hash, now]);
  console.log(`  📝 Registered migration hash: ${mig.hash.substring(0,16)}`);
}

await conn.end();
console.log('\n✅ Done!');
process.exit(0);
