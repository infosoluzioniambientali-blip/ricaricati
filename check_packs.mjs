import { drizzle } from "drizzle-orm/mysql2";
import mysql from "mysql2/promise";
import { packConfigurazione, promoInstallatore } from "./drizzle/schema.ts";

const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
});

const db = drizzle(pool);

async function checkPacks() {
  try {
    const packs = await db.select().from(packConfigurazione);
    console.log("Pack Configurazione:", packs);
    
    const promos = await db.select().from(promoInstallatore);
    console.log("Promo Installatore:", promos);
  } catch (err) {
    console.error("Errore:", err);
  } finally {
    process.exit(0);
  }
}

checkPacks();
