/**
 * export_db.mjs — Backup completo database TiDB/MySQL per progetti Manus WebDev
 *
 * Usage:
 *   DATABASE_URL=<url> node export_db.mjs [output_dir]
 *
 * Output:
 *   <output_dir>/database_dump.sql  — SQL INSERT completo per tutte le tabelle
 *
 * Il DATABASE_URL viene letto automaticamente dal processo Node in esecuzione
 * se non passato come variabile d'ambiente.
 */
import mysql from "mysql2/promise";
import fs from "fs";
import path from "path";

// --- Configurazione ---
const dbUrl = process.env.DATABASE_URL;
if (!dbUrl) {
  console.error("❌ DATABASE_URL non trovato. Esporta la variabile prima di eseguire.");
  console.error("   Suggerimento: DATABASE_URL=$(cat /proc/$(pgrep -f 'node.*server' | head -1)/environ | tr '\\0' '\\n' | grep '^DATABASE_URL=' | sed 's/^DATABASE_URL=//') node export_db.mjs");
  process.exit(1);
}

const outputDir = process.argv[2] ?? `/home/ubuntu/backup_${new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19)}`;
fs.mkdirSync(outputDir, { recursive: true });
const outputFile = path.join(outputDir, "database_dump.sql");

// --- Connessione ---
const url = new URL(dbUrl.replace(/\?.*$/, ""));
const dbName = url.pathname.replace("/", "");

const conn = await mysql.createConnection({
  host: url.hostname,
  port: parseInt(url.port) || 4000,
  user: url.username,
  password: url.password,
  database: dbName,
  ssl: { rejectUnauthorized: true },
});

console.log(`✓ Connesso a ${url.hostname}:${url.port} / ${dbName}`);

// --- Dump ---
const lines = [
  `-- Backup Manus WebDev`,
  `-- Database: ${dbName}`,
  `-- Data: ${new Date().toISOString()}`,
  `-- =============================================`,
  ``,
  `SET FOREIGN_KEY_CHECKS=0;`,
  `SET NAMES utf8mb4;`,
  ``,
];

const [tables] = await conn.query(`SHOW TABLES`);
const tableNames = tables.map(r => Object.values(r)[0]);
console.log(`Tabelle: ${tableNames.join(", ")}`);

for (const table of tableNames) {
  process.stdout.write(`  → ${table}... `);

  // CREATE TABLE
  const [[createResult]] = await conn.query(`SHOW CREATE TABLE \`${table}\``);
  lines.push(`-- ----------------------------`);
  lines.push(`-- ${table}`);
  lines.push(`-- ----------------------------`);
  lines.push(`DROP TABLE IF EXISTS \`${table}\`;`);
  lines.push(createResult["Create Table"] + ";");
  lines.push(``);

  // INSERT dati
  const [rows] = await conn.query(`SELECT * FROM \`${table}\``);
  if (rows.length > 0) {
    lines.push(`-- Dati (${rows.length} righe)`);
    for (const row of rows) {
      const cols = Object.keys(row).map(c => `\`${c}\``).join(", ");
      const vals = Object.values(row).map(v => {
        if (v === null) return "NULL";
        if (v instanceof Date) return `'${v.toISOString().replace("T", " ").replace("Z", "")}'`;
        if (typeof v === "number" || typeof v === "bigint") return String(v);
        if (typeof v === "boolean") return v ? "1" : "0";
        return `'${String(v).replace(/\\/g, "\\\\").replace(/'/g, "\\'").replace(/\n/g, "\\n").replace(/\r/g, "\\r")}'`;
      }).join(", ");
      lines.push(`INSERT INTO \`${table}\` (${cols}) VALUES (${vals});`);
    }
    lines.push(``);
    console.log(`${rows.length} righe`);
  } else {
    lines.push(`-- (vuota)`);
    lines.push(``);
    console.log(`vuota`);
  }
}

lines.push(`SET FOREIGN_KEY_CHECKS=1;`);
lines.push(`-- Fine backup`);

fs.writeFileSync(outputFile, lines.join("\n"), "utf8");
await conn.end();

const size = (fs.statSync(outputFile).size / 1024).toFixed(1);
console.log(`\n✅ Dump: ${outputFile} (${size} KB)`);
console.log(`OUTPUT_DIR=${outputDir}`);
