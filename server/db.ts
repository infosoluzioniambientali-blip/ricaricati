import { eq, desc, sql, and, inArray, like, ne, isNull, isNotNull } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import {
  InsertUser,
  users,
  installatori,
  ordini,
  pratiche,
  documenti,
  ricariche,
  backupConfig,
  backupStorico,
  listinoPersonalizzato,
  prospectInstallatori,
  immobiliFotovoltaico,
  pec,
  InsertInstallatore,
  InsertOrdine,
  InsertPratica,
  InsertDocumento,
  InsertRicarica,
  InsertProspectInstallatore,
  InsertImmobileFotovoltaico,
  InsertPec,
  configDocumenti,
  InsertConfigDocumento,
  packConfigurazione,
  InsertPackConfigurazione,
  ricaricheConfigurazione,
  InsertRicaricaConfigurazione,
  promoInstallatore,
  InsertPromoInstallatore,
  premiBollette,
  InsertPremiBolletta,
  premiNominativi,
  InsertPremiNominativo,
  premiCodici,
  InsertPremiCodice,
  prospectOrdiniProbabili,
} from "../drizzle/schema";
import { ENV } from "./_core/env";

let _db: ReturnType<typeof drizzle> | null = null;

export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

// ─── USERS ───────────────────────────────────────────────────────────────────

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) throw new Error("User openId is required for upsert");
  const db = await getDb();
  if (!db) return;
  const values: InsertUser = { openId: user.openId };
  const updateSet: Record<string, unknown> = {};
  const textFields = ["name", "email", "loginMethod"] as const;
  for (const field of textFields) {
    const value = user[field];
    if (value === undefined) continue;
    const normalized = value ?? null;
    values[field] = normalized;
    updateSet[field] = normalized;
  }
  if (user.lastSignedIn !== undefined) {
    values.lastSignedIn = user.lastSignedIn;
    updateSet.lastSignedIn = user.lastSignedIn;
  }
  if (user.role !== undefined) {
    values.role = user.role;
    updateSet.role = user.role;
  } else if (user.openId === ENV.ownerOpenId) {
    values.role = "admin";
    updateSet.role = "admin";
  }
  if (!values.lastSignedIn) values.lastSignedIn = new Date();
  if (Object.keys(updateSet).length === 0) updateSet.lastSignedIn = new Date();
  await db.insert(users).values(values).onDuplicateKeyUpdate({ set: updateSet });
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
  return result[0];
}

// ─── INSTALLATORI ─────────────────────────────────────────────────────────────

export async function getInstallatoreByUserId(userId: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(installatori).where(eq(installatori.userId, userId)).limit(1);
  return result[0];
}

// Genera un codice promo univoco per l'installatore (es. INST-A1B2C3)
export function generateCodicePromo(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < 6; i++) code += chars[Math.floor(Math.random() * chars.length)];
  return `PROMO-${code}`;
}

export async function createInstallatore(data: InsertInstallatore) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  // Genera codice promo univoco
  let codicePromo: string;
  let attempts = 0;
  do {
    codicePromo = generateCodicePromo();
    const existing = await db.select({ id: installatori.id }).from(installatori).where(eq(installatori.codicePromo, codicePromo)).limit(1);
    if (existing.length === 0) break;
    attempts++;
  } while (attempts < 10);
  await db.insert(installatori).values({ ...data, codicePromo });
  const result = await db.select().from(installatori).where(eq(installatori.userId, data.userId)).limit(1);
  return result[0];
}

export async function updateInstallatoreStato(id: number, stato: "in_attesa" | "approvato" | "rifiutato") {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  await db.update(installatori).set({ stato }).where(eq(installatori.id, id));
}

export async function getAllInstallatori() {
  const db = await getDb();
  if (!db) return [];
  return db
    .select({ installatore: installatori, user: users })
    .from(installatori)
    .leftJoin(users, eq(installatori.userId, users.id))
    .orderBy(desc(installatori.createdAt));
}

export async function getClassificaInstallatori() {
  const db = await getDb();
  if (!db) return [];
  // Calcola fatturato reale dagli ordini pagati (pack + singoli) per ogni installatore
  // Se l'installatore ha un totaleFatturato manuale > 0, usa quello; altrimenti somma dagli ordini
  const rows = await db
    .select({ installatore: installatori, user: users })
    .from(installatori)
    .leftJoin(users, eq(installatori.userId, users.id))
    .where(eq(installatori.stato, "approvato"));

  // Per ogni installatore, calcola il fatturato dagli ordini pagati
  const result = await Promise.all(rows.map(async (row) => {
    const ordiniPagati = await db!
      .select({ importo: ordini.importo })
      .from(ordini)
      .where(and(eq(ordini.installatoreId, row.installatore.id), eq(ordini.stato, "pagato")));
    const fatturatoCalcolato = ordiniPagati.reduce((sum, o) => sum + parseFloat(o.importo as string || "0"), 0);
    // Somma il valore manuale (correzione admin) al fatturato calcolato dagli ordini
    const fatturatoManuale = parseFloat(row.installatore.totaleFatturato as string || "0");
    const fatturato = fatturatoCalcolato + fatturatoManuale;
    return { ...row, fatturato, fatturatoCalcolato, fatturatoManuale };
  }));

  return result.sort((a, b) => b.fatturato - a.fatturato).slice(0, 50);
}

export async function getTotaleFatturato() {
  const db = await getDb();
  if (!db) return 0;
  // Somma tutti gli ordini pagati (pack + singoli) — include pratiche singole
  const result = await db
    .select({ total: sql<string>`SUM(${ordini.importo})` })
    .from(ordini)
    .where(eq(ordini.stato, "pagato"));
  return parseFloat(result[0]?.total ?? "0");
}

export async function getTotaleCorsa100K() {
  const db = await getDb();
  if (!db) return 0;
  // Corsa €100K: solo dai pacchetti (pack1, pack2, pack3, custom) — NON le pratiche singole
  const result = await db
    .select({ total: sql<string>`SUM(${ordini.importo})` })
    .from(ordini)
    .where(and(eq(ordini.stato, "pagato"), sql`${ordini.packId} != 'singolo'`));
  return parseFloat(result[0]?.total ?? "0");
}

export async function getTotaleQuota600K() {
  const db = await getDb();
  if (!db) return 0;
  // Quota €600K: somma degli importi stimati degli ordini probabili accettati
  const result = await db
    .select({ total: sql<string>`SUM(${prospectOrdiniProbabili.importoStimato})` })
    .from(prospectOrdiniProbabili)
    .where(eq(prospectOrdiniProbabili.stato, "accettato"));
  return parseFloat(result[0]?.total ?? "0");
}

export async function correggiTotaleFatturatoInstallatore(installatoreId: number, valore: number) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  await db
    .update(installatori)
    .set({ totaleFatturato: String(valore) })
    .where(eq(installatori.id, installatoreId));
}

// ─── ORDINI ──────────────────────────────────────────────────────────────────

export async function createOrdine(data: InsertOrdine) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  
  // Associa automaticamente userId all'installatore se non è già associato
  if (data.installatoreId && data.userId) {
    const inst = await db.select().from(installatori).where(eq(installatori.id, data.installatoreId)).limit(1);
    if (inst.length > 0 && !inst[0].userId) {
      await db.update(installatori).set({ userId: data.userId }).where(eq(installatori.id, data.installatoreId));
    }
  }
  
  await db.insert(ordini).values(data);
  const result = await db
    .select()
    .from(ordini)
    .where(and(eq(ordini.userId, data.userId), eq(ordini.emailAcquirente, data.emailAcquirente)))
    .orderBy(desc(ordini.createdAt))
    .limit(1);
  return result[0];
}

export async function getAllOrdini() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(ordini).orderBy(desc(ordini.createdAt));
}

export async function getOrdiniByUserId(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(ordini).where(eq(ordini.userId, userId)).orderBy(desc(ordini.createdAt));
}

export async function getOrdineById(id: number) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.select().from(ordini).where(eq(ordini.id, id)).limit(1);
  return result[0] ?? null;
}
export async function updateOrdineStato(id: number, stato: "in_attesa" | "pagato" | "annullato") {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  // Leggi lo stato precedente e l'importo prima di aggiornare
  const ordineAttuale = await getOrdineById(id);
  await db.update(ordini).set({ stato }).where(eq(ordini.id, id));
  // Aggiorna totaleFatturato dell'installatore se necessario
  if (ordineAttuale && ordineAttuale.installatoreId) {
    const statoPrecedente = ordineAttuale.stato;
    const importo = parseFloat(ordineAttuale.importo ?? "0");
    if (stato === "pagato" && statoPrecedente !== "pagato") {
      // Incrementa totaleFatturato
      await db
        .update(installatori)
        .set({ totaleFatturato: sql`${installatori.totaleFatturato} + ${importo}` })
        .where(eq(installatori.id, ordineAttuale.installatoreId));
      
      // Inizializza il credito in euro per questo ordine (sistema nuovo)
      // Il creditoTotale corrisponde all'importo pagato del pack:
      // Pack1=€2.000, Pack2=€3.150, Pack3=€5.100; singolo=importo pagato
      const _creditoMap: Record<string, number> = { pack1: 2000, pack2: 3150, pack3: 5100 };
      const creditoTotale = _creditoMap[ordineAttuale.packId] ?? importo;
      await db.update(ordini).set({
        creditoTotale: String(creditoTotale),
        creditoResiduo: String(creditoTotale),
      }).where(eq(ordini.id, id));
      
      // Se è un ordine singolo (packId="singolo"), crea una pratica singola
      if (ordineAttuale.packId === "singolo") {
        const user = await db
          .select()
          .from(users)
          .where(eq(users.id, ordineAttuale.userId ?? 0))
          .limit(1);
        if (user[0]) {
          await db.insert(pratiche).values({
            installatoreId: ordineAttuale.installatoreId,
            userId: ordineAttuale.userId ?? 0,
            tipologia: "residenziale", // Default: può essere modificato dopo
            tipoIter: "connessione_semplificato", // Default
            statoIter: "documenti_raccolti",
            stato: "bozza",
            note: `Pratica singola - Ordine #${ordineAttuale.id}`,
          });
        }
      }
    } else if (stato === "annullato" && statoPrecedente === "pagato") {
      // Decrementa totaleFatturato (non scendere sotto 0)
      await db
        .update(installatori)
        .set({ totaleFatturato: sql`GREATEST(0, ${installatori.totaleFatturato} - ${importo})` })
        .where(eq(installatori.id, ordineAttuale.installatoreId));
    }
  }
}

// ─── PRATICHE ────────────────────────────────────────────────────────────────

export async function createPratica(data: InsertPratica) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  await db.insert(pratiche).values(data);
  const result = await db
    .select()
    .from(pratiche)
    .where(eq(pratiche.installatoreId, data.installatoreId))
    .orderBy(desc(pratiche.createdAt))
    .limit(1);
  return result[0];
}

export async function getPraticheByInstallatoreId(installatoreId: number) {
  const db = await getDb();
  if (!db) return [];
  // Include il packId dell'ordine associato per distinguere pratiche da pack vs singole
  const rows = await db
    .select({
      id: pratiche.id,
      installatoreId: pratiche.installatoreId,
      userId: pratiche.userId,
      tipologia: pratiche.tipologia,
      tipoIter: pratiche.tipoIter,
      statoIter: pratiche.statoIter,
      potenzaKw: pratiche.potenzaKw,
      indirizzoImpianto: pratiche.indirizzoImpianto,
      comuneImpianto: pratiche.comuneImpianto,
      provinciaImpianto: pratiche.provinciaImpianto,
      nomeTitolare: pratiche.nomeTitolare,
      note: pratiche.note,
      noteAdmin: pratiche.noteAdmin,
      stato: pratiche.stato,
      ordineId: pratiche.ordineId,
      createdAt: pratiche.createdAt,
      updatedAt: pratiche.updatedAt,
      ordinePackId: ordini.packId,
    })
    .from(pratiche)
    .leftJoin(ordini, eq(pratiche.ordineId, ordini.id))
    .where(eq(pratiche.installatoreId, installatoreId))
    .orderBy(desc(pratiche.createdAt));
  return rows;
}

export async function getAllPratiche() {
  const db = await getDb();
  if (!db) return [];
  return db
    .select({ pratica: pratiche, installatore: installatori })
    .from(pratiche)
    .leftJoin(installatori, eq(pratiche.installatoreId, installatori.id))
    .orderBy(desc(pratiche.createdAt));
}

export async function updatePraticaStato(
  id: number,
  stato: "bozza" | "inviata" | "in_lavorazione" | "completata" | "rifiutata",
  noteAdmin?: string,
  statoIter?: string
) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  await db.update(pratiche).set({
    stato,
    ...(noteAdmin !== undefined ? { noteAdmin } : {}),
    ...(statoIter !== undefined ? { statoIter } : {}),
  }).where(eq(pratiche.id, id));
}

// ─── DOCUMENTI ───────────────────────────────────────────────────────────────

export async function createDocumento(data: InsertDocumento) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  await db.insert(documenti).values(data);
}

export async function getDocumentiByPraticaId(praticaId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(documenti).where(eq(documenti.praticaId, praticaId));
}

// ─── RICARICHE ───────────────────────────────────────────────────────────────

export async function createRicarica(data: InsertRicarica) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  await db.insert(ricariche).values(data);
}

export async function getRicaricheByInstallatoreId(installatoreId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(ricariche).where(eq(ricariche.installatoreId, installatoreId)).orderBy(desc(ricariche.createdAt));
}

// ─── STATISTICHE ADMIN ───────────────────────────────────────────────────────

export async function getStatisticheAdmin() {
  const db = await getDb();
  if (!db) return { totaleOrdini: 0, ordiniInAttesa: 0, totaleInstallatori: 0, totalePratiche: 0, fatturatoTotale: 0, fatturaPack: 0, fatturatichesingole: 0, totalePacchetti: 0, pacchettiBytipo: {} };
  
  const [ordiniCount, ordiniInAttesaCount, installatoriCount, praticheCount, fatturatoTotale, fatturaPack, fatturatichesingole, pacchetti] = await Promise.all([
    db.select({ count: sql<number>`COUNT(*)` }).from(ordini).where(eq(ordini.stato, "pagato")),
    db.select({ count: sql<number>`COUNT(*)` }).from(ordini).where(eq(ordini.stato, "in_attesa")),
    db.select({ count: sql<number>`COUNT(*)` }).from(installatori),
    db.select({ count: sql<number>`COUNT(*)` }).from(pratiche),
    db.select({ total: sql<string>`SUM(${ordini.importo})` }).from(ordini).where(eq(ordini.stato, "pagato")),
    db.select({ total: sql<string>`SUM(${ordini.importo})` }).from(ordini).where(and(eq(ordini.stato, "pagato"), ne(ordini.packId, "singolo"))),
    db.select({ total: sql<string>`SUM(${ordini.importo})` }).from(ordini).where(and(eq(ordini.stato, "pagato"), eq(ordini.packId, "singolo"))),
    db.select({ packId: ordini.packId, count: sql<number>`COUNT(*)` }).from(ordini).where(and(eq(ordini.stato, "pagato"), ne(ordini.packId, "singolo"))).groupBy(ordini.packId),
  ]);
  
  const packLabels: Record<string, string> = {
    pack1: "Pack 1 — €2.000",
    pack2: "Pack 2 — €3.150",
    pack3: "Pack 3 — €5.100",
  };
  
  const pacchettiBytipo = pacchetti.reduce((acc, p) => {
    const label = packLabels[p.packId] || p.packId;
    acc[label] = p.count;
    return acc;
  }, {} as Record<string, number>);
  
  const totalePacchetti = Object.values(pacchettiBytipo).reduce((a, b) => a + b, 0);
  
  return {
    totaleOrdini: Number(ordiniCount[0]?.count ?? 0),
    ordiniInAttesa: Number(ordiniInAttesaCount[0]?.count ?? 0),
    totaleInstallatori: Number(installatoriCount[0]?.count ?? 0),
    totalePratiche: Number(praticheCount[0]?.count ?? 0),
    fatturatoTotale: parseFloat(fatturatoTotale[0]?.total ?? "0"),
    fatturaPack: parseFloat(fatturaPack[0]?.total ?? "0"),
    fatturatichesingole: parseFloat(fatturatichesingole[0]?.total ?? "0"),
    totalePacchetti,
    pacchettiBytipo,
  };
}

export async function getAllDocumenti() {
  const db = await getDb();
  if (!db) return [];
  return db
    .select({
      documento: documenti,
      installatore: installatori,
    })
    .from(documenti)
    .leftJoin(installatori, eq(documenti.installatoreId, installatori.id))
    .orderBy(desc(documenti.createdAt));
}

// ─── CRUD ADMIN ──────────────────────────────────────────────────────────────

export async function updateInstallatore(id: number, data: Partial<InsertInstallatore>) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  await db.update(installatori).set(data).where(eq(installatori.id, id));
}

export async function deleteInstallatore(id: number) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  await db.delete(installatori).where(eq(installatori.id, id));
}

export async function getInstallatoreById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(installatori).where(eq(installatori.id, id)).limit(1);
  return result[0];
}

export async function createInstallatoreAdmin(data: InsertInstallatore) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  // Genera codice promo univoco se non fornito
  if (!data.codicePromo) {
    let codicePromo: string;
    let attempts = 0;
    do {
      codicePromo = generateCodicePromo();
      const existing = await db.select({ id: installatori.id }).from(installatori).where(eq(installatori.codicePromo, codicePromo)).limit(1);
      if (existing.length === 0) break;
      attempts++;
    } while (attempts < 10);
    data = { ...data, codicePromo };
  }
  await db.insert(installatori).values(data);
  const result = await db.select().from(installatori).orderBy(desc(installatori.createdAt)).limit(1);
  return result[0];
}

export async function updateOrdine(id: number, data: Partial<InsertOrdine>) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  await db.update(ordini).set(data).where(eq(ordini.id, id));
}

export async function deleteOrdine(id: number) {
  throw new Error("PROTEZIONE CRITICA: Impossibile cancellare un ordine. Contattare l'amministratore.");
}

export async function createOrdineAdmin(data: InsertOrdine) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  await db.insert(ordini).values(data);
  const result = await db.select().from(ordini).orderBy(desc(ordini.createdAt)).limit(1);
  const ordineCreato = result[0];
  // Se l'ordine viene creato come pagato, aggiorna totaleFatturato dell'installatore
  if (ordineCreato && ordineCreato.stato === "pagato" && ordineCreato.installatoreId) {
    const importo = parseFloat(ordineCreato.importo ?? "0");
    await db
      .update(installatori)
      .set({ totaleFatturato: sql`${installatori.totaleFatturato} + ${importo}` })
      .where(eq(installatori.id, ordineCreato.installatoreId));
  }
  return ordineCreato;
}

export async function updatePratica(id: number, data: Partial<InsertPratica>) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  await db.update(pratiche).set(data).where(eq(pratiche.id, id));
}

export async function deletePratica(id: number) {
  throw new Error("PROTEZIONE CRITICA: Impossibile cancellare una pratica. Contattare l'amministratore.");
}

export async function createPraticaAdmin(data: InsertPratica) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  await db.insert(pratiche).values(data);
  const result = await db.select().from(pratiche).orderBy(desc(pratiche.createdAt)).limit(1);
  return result[0];
}

export async function deleteDocumento(id: number) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  await db.delete(documenti).where(eq(documenti.id, id));
}
export async function updateDocumentoRevisione(id: number, statoRevisione: "in_attesa" | "approvato" | "rifiutato", notaRevisione: string | null) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  await db.update(documenti).set({ statoRevisione, notaRevisione }).where(eq(documenti.id, id));
}

// ─── SISTEMA CREDITO IN EURO ────────────────────────────────────────────────

// Credito totale per pack (importo del pacchetto)
export const CREDITO_PER_PACK: Record<string, number> = {
  pack1: 2000,
  pack2: 3150,
  pack3: 5100,
};

// Prezzo pratica residenziale per pack (quanto scala dal credito)
// Prezzi per pratica residenziale per pack:
// Pack1: 16 pratiche × €125 = €2.000 | Pack2: 30 × €105 = €3.150 | Pack3: 60 × €85 = €5.100
export const PREZZO_RES_PER_PACK: Record<string, number> = {
  pack1: 125,
  pack2: 105,
  pack3: 85,
};

// Prezzi per pratica business per pack:
// Pack1: 5 × €400 = €2.000 | Pack2: 9 × €350 = €3.150 | Pack3: 20 × €250 = €5.000
export const PREZZO_BUS_PER_PACK: Record<string, number> = {
  pack1: 400,
  pack2: 350,
  pack3: 250,
};

// ─── CONTATORE PRATICHE PACK ─────────────────────────────────────────────────

// Pratiche incluse per pack
// Pratiche totali per pack (residenziali + business)
// Pack 1: 16 res + 5 bus = 21 | Pack 2: 30 res + 9 bus = 39 | Pack 3: 60 res + 20 bus = 80
export const PRATICHE_PER_PACK: Record<string, number> = {
  pack1: 21,
  pack2: 39,
  pack3: 80,
};
// Pratiche residenziali per pack
export const PRATICHE_RES_PER_PACK: Record<string, number> = {
  pack1: 16,
  pack2: 30,
  pack3: 60,
};
// Pratiche business per pack
export const PRATICHE_BUS_PER_PACK: Record<string, number> = {
  pack1: 5,
  pack2: 9,
  pack3: 20,
};

// Recupera l'ordine attivo (pagato) di un installatore con saldo rimanente
export async function getOrdineAttivoInstallatore(installatoreId: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db
    .select()
    .from(ordini)
    .where(and(eq(ordini.installatoreId, installatoreId), eq(ordini.stato, "pagato"), ne(ordini.packId, "singolo")))
    .orderBy(desc(ordini.createdAt))
    .limit(1);
  return result[0];
}

// Scala una pratica dall'ordine attivo dell'installatore (sistema legacy contatori)
export async function scalaPraticaDaOrdine(installatoreId: number, tipologia?: "residenziale" | "business") {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  const ordineAttivo = await getOrdineAttivoInstallatore(installatoreId);
  if (!ordineAttivo) return null;
  const pratiche_incluse = ordineAttivo.pratiche_incluse || PRATICHE_PER_PACK[ordineAttivo.packId] || 0;
  const pratiche_usate = (ordineAttivo.pratiche_usate || 0) + 1;
  // Aggiorna anche il contatore per tipo (residenziale/business/mista)
  const updateData: Record<string, any> = { pratiche_usate };
  if (tipologia === "residenziale") {
    updateData.pratiche_usate_residenziali = (ordineAttivo.pratiche_usate_residenziali || 0) + 1;
  } else if (tipologia === "business") {
    updateData.pratiche_usate_business = (ordineAttivo.pratiche_usate_business || 0) + 1;
  } else if (tipologia === "mista") {
    // Per le pratiche miste, incrementa entrambi i contatori
    updateData.pratiche_usate_residenziali = (ordineAttivo.pratiche_usate_residenziali || 0) + 1;
    updateData.pratiche_usate_business = (ordineAttivo.pratiche_usate_business || 0) + 1;
  }
  await db.update(ordini).set(updateData).where(eq(ordini.id, ordineAttivo.id));
  return { pratiche_incluse, pratiche_usate, rimanenti: pratiche_incluse - pratiche_usate };
}

// Scala il credito in euro da un ordine specifico (nuovo sistema)
export async function scalaCredito(ordineId: number, tipologia: "residenziale" | "business") {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  const result = await db.select().from(ordini).where(eq(ordini.id, ordineId)).limit(1);
  if (!result.length) return null;
  const ordine = result[0];
  // Determina il prezzo da scalare in base al tipo di pratica e al pack
  let prezzoScalare = 0;
  if (ordine.packId === "singolo") {
    // Per pratiche singole, il prezzo è l'importo dell'ordine
    prezzoScalare = parseFloat(ordine.importo as string) || 0;
  } else if (ordine.packId === "custom" || !PREZZO_RES_PER_PACK[ordine.packId]) {
    // Pack personalizzato/promo: usa i prezzi salvati sull'ordine stesso
    if (tipologia === "residenziale") {
      prezzoScalare = parseFloat((ordine as any).prezzoResidenziale as string) || 0;
    } else {
      prezzoScalare = parseFloat((ordine as any).prezzoBusiness as string) || 0;
    }
    // Fallback: se non ci sono prezzi unitari, scala proporzionalmente dall'importo totale
    if (prezzoScalare === 0 && parseFloat(ordine.importo as string) > 0) {
      const totIncluse = ((ordine as any).pratiche_incluse_residenziali || 0) + ((ordine as any).pratiche_incluse_business || 0);
      prezzoScalare = totIncluse > 0 ? parseFloat(ordine.importo as string) / totIncluse : 0;
    }
  } else {
    // Pack standard: usa il prezzo per tipologia
    if (tipologia === "residenziale") {
      prezzoScalare = PREZZO_RES_PER_PACK[ordine.packId] || 0;
    } else {
      prezzoScalare = PREZZO_BUS_PER_PACK[ordine.packId] || 0;
    }
  }
  const creditoAttuale = parseFloat(ordine.creditoResiduo as string) || 0;
  let nuovoCredito = creditoAttuale - prezzoScalare;
  let creditoOmaggiato = 0;
  // Se il credito residuo non copre la pratica, il resto viene omaggiato
  if (nuovoCredito < 0 && creditoAttuale > 0) {
    creditoOmaggiato = Math.abs(nuovoCredito);
    nuovoCredito = 0;
  }
  await db.update(ordini).set({ creditoResiduo: String(nuovoCredito) }).where(eq(ordini.id, ordineId));
  // Notifica admin se il credito si azzera o va in negativo
  if (nuovoCredito <= 0 && creditoAttuale > 0) {
    try {
      const { notifyOwner } = await import("./_core/notification");
      const msgOmaggio = creditoOmaggiato > 0 ? `\n\n🎁 CREDITO OMAGGIATO: €${creditoOmaggiato.toFixed(2)} (credito residuo €${creditoAttuale.toFixed(2)} < prezzo pratica €${prezzoScalare.toFixed(2)})` : "";
      await notifyOwner({
        title: `⚠️ Credito esaurito — Ordine #${ordineId}`,
        content: `Il credito dell'ordine #${ordineId} (Pack: ${ordine.packId}) si è azzerato.\n\nCredito precedente: €${creditoAttuale.toFixed(2)}\nUltima pratica scalata: €${prezzoScalare.toFixed(2)}\nCredito residuo: €${nuovoCredito.toFixed(2)}${msgOmaggio}\n\nL'installatore può continuare a creare pratiche in credito negativo. Contattare il cliente per il rinnovo.`,
      });
    } catch (e) {
      console.error("Notifica admin fallita:", e);
    }
  }
  return { creditoScalato: prezzoScalare, creditoResiduo: nuovoCredito, creditoOmaggiato };
}

// Inizializza il credito di un ordine quando viene pagato
export async function inizializzaCredito(ordineId: number) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  const result = await db.select().from(ordini).where(eq(ordini.id, ordineId)).limit(1);
  if (!result.length) return null;
  const ordine = result[0];
  const creditoTotale = CREDITO_PER_PACK[ordine.packId] || parseFloat(ordine.importo as string) || 0;
  await db.update(ordini).set({
    creditoTotale: String(creditoTotale),
    creditoResiduo: String(creditoTotale),
  }).where(eq(ordini.id, ordineId));
  return { creditoTotale, creditoResiduo: creditoTotale };
}

// Recupera il riepilogo pack di un installatore
// Recupera l'ordine attivo con credito residuo per un installatore (nuovo sistema)
export async function getOrdiniConCredito(installatoreId: number) {
  const db = await getDb();
  if (!db) return null;
  // Recupera l'ordine più recente pagato (esclusi ordini singoli) che ha credito residuo
  const result = await db
    .select()
    .from(ordini)
    .where(and(
      eq(ordini.installatoreId, installatoreId),
      eq(ordini.stato, "pagato"),
      ne(ordini.packId, "singolo")
    ))
    .orderBy(desc(ordini.createdAt))
    .limit(1);
  return result[0] || null;
}

export async function getPackRiepilogo(installatoreId: number) {
  const db = await getDb();
  if (!db) return null;
  // Recupera TUTTI i pack pagati (esclusi ordini singoli) per sommare le pratiche
  const tuttiOrdini = await db
    .select()
    .from(ordini)
    .where(and(
      eq(ordini.installatoreId, installatoreId),
      eq(ordini.stato, "pagato"),
      ne(ordini.packId, "singolo")
    ))
    .orderBy(desc(ordini.createdAt));
  if (tuttiOrdini.length === 0) return null;
  // Somma su tutti i pack attivi
  let pratiche_incluse = 0;
  let pratiche_usate = 0;
  let pratiche_incluse_residenziali = 0;
  let pratiche_incluse_business = 0;
  let pratiche_usate_residenziali = 0;
  let pratiche_usate_business = 0;
  for (const o of tuttiOrdini) {
    pratiche_incluse += o.pratiche_incluse || PRATICHE_PER_PACK[o.packId] || 0;
    pratiche_usate += o.pratiche_usate || 0;
    pratiche_incluse_residenziali += o.pratiche_incluse_residenziali || PRATICHE_RES_PER_PACK[o.packId] || 0;
    pratiche_incluse_business += o.pratiche_incluse_business || PRATICHE_BUS_PER_PACK[o.packId] || 0;
    pratiche_usate_residenziali += o.pratiche_usate_residenziali || 0;
    pratiche_usate_business += o.pratiche_usate_business || 0;
  }
  const ultimo = tuttiOrdini[0];
  return {
    packId: ultimo.packId,
    importo: ultimo.importo,
    pratiche_incluse,
    pratiche_usate,
    rimanenti: Math.max(0, pratiche_incluse - pratiche_usate),
    pratiche_incluse_residenziali,
    pratiche_incluse_business,
    pratiche_usate_residenziali,
    pratiche_usate_business,
    rimanenti_residenziali: Math.max(0, pratiche_incluse_residenziali - pratiche_usate_residenziali),
    rimanenti_business: Math.max(0, pratiche_incluse_business - pratiche_usate_business),
    ordineId: ultimo.id,
    nomeAcquirente: ultimo.nomeAcquirente,
    createdAt: ultimo.createdAt,
  };
}

export async function getPraticheByInstallatoreIdAdmin(installatoreId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(pratiche).where(eq(pratiche.installatoreId, installatoreId)).orderBy(desc(pratiche.createdAt));
}

// ─── BACKUP CONFIG & STORICO ──────────────────────────────────────────────────

export async function getBackupConfig() {
  const db = await getDb();
  if (!db) return null;
  const result = await db.select().from(backupConfig).limit(1);
  return result[0] ?? null;
}

export async function upsertBackupConfig(data: { frequenza: "giornaliero" | "settimanale" | "mensile"; attivo: boolean }) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  const existing = await getBackupConfig();
  if (existing) {
    await db.update(backupConfig).set({ frequenza: data.frequenza, attivo: data.attivo, ultimoBackup: new Date() }).where(eq(backupConfig.id, existing.id));
  } else {
    await db.insert(backupConfig).values({ frequenza: data.frequenza, attivo: data.attivo });
  }
}

export async function createBackupStorico(data: { storageKey: string; storageUrl: string; dimensioneBytes: number; stato: "completato" | "errore"; tipo: "manuale" | "automatico"; erroreMessaggio?: string }) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  await db.insert(backupStorico).values(data);
}

export async function getBackupStorico() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(backupStorico).orderBy(desc(backupStorico.createdAt)).limit(50);
}

// ─── LISTINO PERSONALIZZATO ──────────────────────────────────────────────────

export async function getListinoPersonalizzatoByInstallatore(installatoreId: number) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.select().from(listinoPersonalizzato)
    .where(and(eq(listinoPersonalizzato.installatoreId, installatoreId), eq(listinoPersonalizzato.attivo, true)))
    .limit(1);
  return result[0] ?? null;
}

export async function upsertListinoPersonalizzato(installatoreId: number, nomeListino: string, prezzi: Record<string, { prezzo: number; note?: string }>) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  const existing = await getListinoPersonalizzatoByInstallatore(installatoreId);
  const prezziJson = JSON.stringify(prezzi);
  if (existing) {
    await db.update(listinoPersonalizzato)
      .set({ nomeListino, prezzi: prezziJson })
      .where(eq(listinoPersonalizzato.id, existing.id));
    return existing.id;
  } else {
    const result = await db.insert(listinoPersonalizzato)
      .values({ installatoreId, nomeListino, prezzi: prezziJson, attivo: true });
    return (result as any)[0]?.insertId ?? 0;
  }
}

export async function deleteListinoPersonalizzato(installatoreId: number) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  await db.delete(listinoPersonalizzato).where(eq(listinoPersonalizzato.installatoreId, installatoreId));
}

// ─── ORDINI SINGOLI ──────────────────────────────────────────────────────────

export async function getOrdiniSingoliByInstallatore(installatoreId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(ordini)
    .where(and(eq(ordini.installatoreId, installatoreId), eq(ordini.packId, "singolo")))
    .orderBy(desc(ordini.createdAt));
}

export async function getPackAcquistatiByInstallatore(installatoreId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(ordini)
    .where(and(
      eq(ordini.installatoreId, installatoreId),
      inArray(ordini.packId, ["pack1", "pack2", "pack3", "custom"]),
      eq(ordini.stato, "pagato") // Filtra solo ordini pagati
    ))
    .orderBy(desc(ordini.createdAt));
}

// ─── PROSPECT INSTALLATORI ────────────────────────────────────────────────────
export async function getProspectInstallatori(filters?: {
  regione?: string;
  provincia?: string;
  settore?: string;
  fasciaFatturato?: string;
  statoContatto?: string;
  q?: string;
  cestino?: boolean; // true = mostra solo eliminati, false/undefined = solo attivi
}) {
  const db = await getDb();
  if (!db) return [];
  let query = db.select().from(prospectInstallatori).$dynamic();
  const conditions = [];
  // Soft delete: di default mostra solo i record attivi (eliminatoAt IS NULL)
  if (filters?.cestino) {
    conditions.push(isNotNull(prospectInstallatori.eliminatoAt));
  } else {
    conditions.push(isNull(prospectInstallatori.eliminatoAt));
  }
  if (filters?.regione) conditions.push(eq(prospectInstallatori.regione, filters.regione));
  if (filters?.provincia) conditions.push(eq(prospectInstallatori.provincia, filters.provincia));
  if (filters?.settore) conditions.push(eq(prospectInstallatori.settore, filters.settore));
  if (filters?.fasciaFatturato) conditions.push(eq(prospectInstallatori.fasciaFatturato, filters.fasciaFatturato as any));
  if (filters?.statoContatto) conditions.push(eq(prospectInstallatori.statoContatto, filters.statoContatto as any));
  if (filters?.q) conditions.push(like(prospectInstallatori.ragioneSociale, `%${filters.q}%`));
  if (conditions.length > 0) query = query.where(and(...conditions)) as any;
  return query.orderBy(desc(prospectInstallatori.createdAt));
}

export async function createProspectInstallatore(data: InsertProspectInstallatore) {
  const db = await getDb();
  if (!db) throw new Error("DB non disponibile");
  const result = await db.insert(prospectInstallatori).values(data);
  return result;
}

export async function updateProspectInstallatore(id: number, data: Partial<InsertProspectInstallatore>) {
  const db = await getDb();
  if (!db) throw new Error("DB non disponibile");
  return db.update(prospectInstallatori).set(data).where(eq(prospectInstallatori.id, id));
}

// Soft delete: sposta nel cestino
export async function deleteProspectInstallatore(id: number) {
  const db = await getDb();
  if (!db) throw new Error("DB non disponibile");
  return db.update(prospectInstallatori).set({ eliminatoAt: new Date() }).where(eq(prospectInstallatori.id, id));
}

// Ripristina dal cestino
export async function ripristinaProspectInstallatore(id: number) {
  const db = await getDb();
  if (!db) throw new Error("DB non disponibile");
  return db.update(prospectInstallatori).set({ eliminatoAt: null }).where(eq(prospectInstallatori.id, id));
}

// Eliminazione definitiva (solo per record già nel cestino)
export async function eliminaDefinitivamenteProspect(id: number) {
  const db = await getDb();
  if (!db) throw new Error("DB non disponibile");
  return db.delete(prospectInstallatori).where(and(
    eq(prospectInstallatori.id, id),
    isNotNull(prospectInstallatori.eliminatoAt)
  ));
}

// ─── IMMOBILI FOTOVOLTAICO ────────────────────────────────────────────────────
export async function getImmobiliFotovoltaico(filters?: {
  tipo?: string;
  regione?: string;
  provincia?: string;
  soloCapannoni?: boolean;
  soloTerreni?: boolean;
  attivitaEnergivora?: boolean;
  vicinanzaAutostrada?: boolean;
  vicinanzaAreaIndustriale?: boolean;
  superficieMinMq?: number;
  superficieMinEttari?: number;
  soloPublicati?: boolean;
}) {
  const db = await getDb();
  if (!db) return [];
  let query = db.select().from(immobiliFotovoltaico).$dynamic();
  const conditions = [];
  if (filters?.soloPublicati !== false) conditions.push(eq(immobiliFotovoltaico.pubblicato, true));
  if (filters?.tipo) conditions.push(eq(immobiliFotovoltaico.tipo, filters.tipo as any));
  if (filters?.regione) conditions.push(eq(immobiliFotovoltaico.regione, filters.regione));
  if (filters?.provincia) conditions.push(eq(immobiliFotovoltaico.provincia, filters.provincia));
  if (filters?.attivitaEnergivora === true) conditions.push(eq(immobiliFotovoltaico.attivitaEnergivora, true));
  if (filters?.vicinanzaAutostrada === true) conditions.push(eq(immobiliFotovoltaico.vicinanzaAutostrada, true));
  if (filters?.vicinanzaAreaIndustriale === true) conditions.push(eq(immobiliFotovoltaico.vicinanzaAreaIndustriale, true));
  if (conditions.length > 0) query = query.where(and(...conditions)) as any;
  return query.orderBy(desc(immobiliFotovoltaico.createdAt));
}

export async function createImmobileFotovoltaico(data: InsertImmobileFotovoltaico) {
  const db = await getDb();
  if (!db) throw new Error("DB non disponibile");
  return db.insert(immobiliFotovoltaico).values(data);
}

export async function updateImmobileFotovoltaico(id: number, data: Partial<InsertImmobileFotovoltaico>) {
  const db = await getDb();
  if (!db) throw new Error("DB non disponibile");
  return db.update(immobiliFotovoltaico).set(data).where(eq(immobiliFotovoltaico.id, id));
}

export async function deleteImmobileFotovoltaico(id: number) {
  const db = await getDb();
  if (!db) throw new Error("DB non disponibile");
  return db.delete(immobiliFotovoltaico).where(eq(immobiliFotovoltaico.id, id));
}

// ─── BULK IMPORT PROSPECT INSTALLATORI ──────────────────────────────────────
export async function bulkCreateProspectInstallatori(records: InsertProspectInstallatore[]) {
  const db = await getDb();
  if (!db) return { inserted: 0 };
  if (records.length === 0) return { inserted: 0 };
  // Insert in batches of 100
  let inserted = 0;
  for (let i = 0; i < records.length; i += 100) {
    const batch = records.slice(i, i + 100);
    await db.insert(prospectInstallatori).values(batch).onDuplicateKeyUpdate({ set: { updatedAt: new Date() } }).catch(() => {
      // ignore duplicate errors, insert individually
    });
    inserted += batch.length;
  }
  return { inserted };
}

// ─── EXPORT PROSPECT INSTALLATORI ────────────────────────────────────────────
export async function exportProspectInstallatori() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(prospectInstallatori).orderBy(prospectInstallatori.regione, prospectInstallatori.ragioneSociale);
}

// ─── MARKETING: aggiorna stato contatto e note ───────────────────────────────
export async function aggiornaStatoContatto(id: number, statoContatto: "da_contattare" | "contattato" | "interessato" | "cliente" | "non_interessato", note?: string) {
  const db = await getDb();
  if (!db) return;
  await db.update(prospectInstallatori).set({ statoContatto, ...(note !== undefined ? { note } : {}) }).where(eq(prospectInstallatori.id, id));
}

export async function updateTipoInterfaccia(id: number, tipoInterfaccia: "pack_e_singole" | "solo_singole") {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  await db.update(installatori).set({ tipoInterfaccia }).where(eq(installatori.id, id));
}

// ─── PEC ──────────────────────────────────────────────────────────────────────

export async function createPec(data: InsertPec) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  await db.insert(pec).values(data);
  const inserted = await db.select().from(pec).where(eq(pec.installatoreId, data.installatoreId)).orderBy(desc(pec.createdAt)).limit(1);
  return inserted[0];
}

export async function getPecByInstallatoreId(installatoreId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(pec).where(eq(pec.installatoreId, installatoreId)).orderBy(desc(pec.createdAt));
}

export async function updatePec(id: number, data: Partial<InsertPec>) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  await db.update(pec).set(data).where(eq(pec.id, id));
}

export async function deletePec(id: number) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  await db.delete(pec).where(eq(pec.id, id));
}

// Verifica se l'installatore ha un pack attivo (pagato)
export async function hasPackAttivo(installatoreId: number) {
  const db = await getDb();
  if (!db) return false;
  const result = await db
    .select()
    .from(ordini)
    .where(and(
      eq(ordini.installatoreId, installatoreId),
      eq(ordini.stato, "pagato"),
      ne(ordini.packId, "singolo")
    ))
    .limit(1);
  return result.length > 0;
}

// ─── PROSPECT INSTALLATORI ─────────────────────────────────────────────────

// ─── CONFIGURAZIONE DOCUMENTI ──────────────────────────────────────────────
// Ottieni configurazione documenti per un iter (personalizzata per installatore o globale)
export async function getConfigDocumentiByIter(tipoIter: string, installatoreId?: number) {
  const db = await getDb();
  if (!db) return [];
  // Prima cerca configurazione personalizzata per installatore
  if (installatoreId) {
    const personalizzata = await db
      .select()
      .from(configDocumenti)
      .where(and(
        eq(configDocumenti.tipoIter, tipoIter),
        eq(configDocumenti.installatoreId, installatoreId),
        eq(configDocumenti.visibile, true)
      ))
      .orderBy(configDocumenti.ordine);
    if (personalizzata.length > 0) return personalizzata;
  }
  // Altrimenti usa configurazione globale (installatoreId null)
  const globale = await db
    .select()
    .from(configDocumenti)
    .where(and(
      eq(configDocumenti.tipoIter, tipoIter),
      isNull(configDocumenti.installatoreId),
      eq(configDocumenti.visibile, true)
    ))
    .orderBy(configDocumenti.ordine);
  return globale;
}

export async function getAllConfigDocumenti() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(configDocumenti).orderBy(configDocumenti.tipoIter, configDocumenti.ordine);
}

export async function upsertConfigDocumento(data: InsertConfigDocumento & { nomeDocumentiOriginale?: string }) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  // Cerca esistente usando il nome originale se fornito (per rinominamento)
  const nomePerRicerca = data.nomeDocumentiOriginale || data.nomeDocumenti;
  const existing = await db
    .select()
    .from(configDocumenti)
    .where(and(
      eq(configDocumenti.tipoIter, data.tipoIter),
      eq(configDocumenti.nomeDocumenti, nomePerRicerca),
      data.installatoreId
        ? eq(configDocumenti.installatoreId, data.installatoreId)
        : isNull(configDocumenti.installatoreId)
    ))
    .limit(1);
  if (existing.length > 0) {
    // Filtra i campi per l'update (esclude createdAt)
    const updateData = {
      tipoIter: data.tipoIter,
      nomeDocumenti: data.nomeDocumenti,
      ordine: data.ordine,
      obbligatorio: data.obbligatorio,
      importanza: data.importanza,
      visibile: data.visibile,
      responsabileInserimento: data.responsabileInserimento,
      installatoreId: data.installatoreId,
      note: data.note,
    };
    await db.update(configDocumenti).set(updateData).where(eq(configDocumenti.id, existing[0].id));
    return existing[0].id;
  } else {
    // Assicura che tutti i campi siano presenti con i loro valori (inclusi i default)
    const insertData = {
      tipoIter: data.tipoIter,
      nomeDocumenti: data.nomeDocumenti,
      ordine: data.ordine ?? 0,
      obbligatorio: data.obbligatorio ?? false,
      importanza: data.importanza ?? "opzionale",
      visibile: data.visibile ?? true,
      responsabileInserimento: data.responsabileInserimento ?? "installatore",
      installatoreId: data.installatoreId ?? null,
      note: data.note,
    };
    await db.insert(configDocumenti).values(insertData);
    const result = await db.select().from(configDocumenti)
      .where(and(
        eq(configDocumenti.tipoIter, data.tipoIter),
        eq(configDocumenti.nomeDocumenti, data.nomeDocumenti)
      ))
      .orderBy(desc(configDocumenti.id))
      .limit(1);
    return result[0]?.id;
  }
}

export async function deleteConfigDocumento(id: number) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  await db.delete(configDocumenti).where(eq(configDocumenti.id, id));
}

export async function getConfigDocumento(tipoIter: string, nomeDocumenti: string, installatoreId?: number) {
  const db = await getDb();
  if (!db) return null;
  
  // Prima cerca configurazione personalizzata per installatore
  if (installatoreId) {
    const personalizzata = await db
      .select()
      .from(configDocumenti)
      .where(and(
        eq(configDocumenti.tipoIter, tipoIter),
        eq(configDocumenti.nomeDocumenti, nomeDocumenti),
        eq(configDocumenti.installatoreId, installatoreId),
        eq(configDocumenti.visibile, true)
      ))
      .limit(1);
    if (personalizzata.length > 0) return personalizzata[0];
  }
  
  // Altrimenti usa configurazione globale (installatoreId null)
  const globale = await db
    .select()
    .from(configDocumenti)
    .where(and(
      eq(configDocumenti.tipoIter, tipoIter),
      eq(configDocumenti.nomeDocumenti, nomeDocumenti),
      isNull(configDocumenti.installatoreId),
      eq(configDocumenti.visibile, true)
    ))
    .limit(1);
  
  return globale.length > 0 ? globale[0] : null;
}

export async function getAllPec() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(pec).orderBy(desc(pec.createdAt));
}

export async function getClientiInattivi(giorniSoglia: number = 30) {
  const db = await getDb();
  if (!db) return [];
  // Trova installatori con pack attivo (clienti attivi)
  const tuttiInstallatori = await getAllInstallatori();
  // getAllInstallatori restituisce { installatore: {...}, user: {...} } — usare .installatore per accedere ai campi
  const clientiAttivi = (tuttiInstallatori as any[]).filter(i => i.installatore?.stato === "approvato");
  if (!clientiAttivi.length) return [];
  // Trova la data dell'ultima pratica per ogni installatore
  const soglia = new Date();
  soglia.setDate(soglia.getDate() - giorniSoglia);
  const risultati: Array<{ installatore: any; ultimaPratica: Date | null; giorniInattivo: number }> = [];
  for (const row of clientiAttivi) {
    const inst = row.installatore; // oggetto installatore diretto
    const praticheDellInst = await getPraticheByInstallatoreId(inst.id);
    const haPackAttivo = await hasPackAttivo(inst.id);
    if (!haPackAttivo) continue; // Solo clienti con pack attivo
    const praticheSorted = (praticheDellInst as any[]).sort((a, b) =>
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
    const ultimaPratica = praticheSorted.length > 0 ? new Date(praticheSorted[0].createdAt) : null;
    if (!ultimaPratica || ultimaPratica < soglia) {
      const giorniInattivo = ultimaPratica
        ? Math.floor((Date.now() - ultimaPratica.getTime()) / (1000 * 60 * 60 * 24))
        : 999;
      risultati.push({ installatore: inst, ultimaPratica, giorniInattivo });
    }
  }
  return risultati.sort((a, b) => b.giorniInattivo - a.giorniInattivo);
}

// ─── PACK CONFIGURAZIONE ──────────────────────────────────────────────────────
export async function getPackConfigurazione(soloAttivi = false) {
  const db = await getDb();
  if (!db) return [];
  const query = db.select().from(packConfigurazione).orderBy(packConfigurazione.ordine);
  if (soloAttivi) {
    return db.select().from(packConfigurazione).where(eq(packConfigurazione.attivo, true)).orderBy(packConfigurazione.ordine);
  }
  return query;
}

export async function createPackConfigurazione(data: InsertPackConfigurazione) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  await db.insert(packConfigurazione).values(data);
  const result = await db.select().from(packConfigurazione).orderBy(desc(packConfigurazione.id)).limit(1);
  return result[0];
}

export async function updatePackConfigurazione(id: number, data: Partial<InsertPackConfigurazione>) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  await db.update(packConfigurazione).set(data).where(eq(packConfigurazione.id, id));
  const result = await db.select().from(packConfigurazione).where(eq(packConfigurazione.id, id));
  return result[0];
}

export async function deletePackConfigurazione(id: number) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  await db.delete(packConfigurazione).where(eq(packConfigurazione.id, id));
}

// ─── RICARICHE CONFIGURAZIONE ─────────────────────────────────────────────────
export async function getRicaricheConfigurazione(soloAttive = false) {
  const db = await getDb();
  if (!db) return [];
  if (soloAttive) {
    return db.select().from(ricaricheConfigurazione).where(eq(ricaricheConfigurazione.attivo, true)).orderBy(ricaricheConfigurazione.ordine);
  }
  return db.select().from(ricaricheConfigurazione).orderBy(ricaricheConfigurazione.ordine);
}

export async function createRicaricaConfigurazione(data: InsertRicaricaConfigurazione) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  await db.insert(ricaricheConfigurazione).values(data);
  const result = await db.select().from(ricaricheConfigurazione).orderBy(desc(ricaricheConfigurazione.id)).limit(1);
  return result[0];
}

export async function updateRicaricaConfigurazione(id: number, data: Partial<InsertRicaricaConfigurazione>) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  await db.update(ricaricheConfigurazione).set(data).where(eq(ricaricheConfigurazione.id, id));
  const result = await db.select().from(ricaricheConfigurazione).where(eq(ricaricheConfigurazione.id, id));
  return result[0];
}

export async function deleteRicaricaConfigurazione(id: number) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  await db.delete(ricaricheConfigurazione).where(eq(ricaricheConfigurazione.id, id));
}

// ─── PROMO INSTALLATORE ───────────────────────────────────────────────────────
export async function getPromoByInstallatore(installatoreId: number) {
  const db = await getDb();
  if (!db) return [];
  // Restituisce promo specifiche per l'installatore + promo globali (installatoreId=0)
  return db.select().from(promoInstallatore)
    .where(and(
      eq(promoInstallatore.attivo, true),
      sql`(${promoInstallatore.installatoreId} = ${installatoreId} OR ${promoInstallatore.installatoreId} = 0)`,
      sql`(${promoInstallatore.scadenza} IS NULL OR ${promoInstallatore.scadenza} > NOW())`
    ))
    .orderBy(promoInstallatore.ordine);
}

export async function getAllPromoAdmin() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(promoInstallatore).orderBy(desc(promoInstallatore.createdAt));
}

export async function createPromoInstallatore(data: InsertPromoInstallatore) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  await db.insert(promoInstallatore).values(data);
  const result = await db.select().from(promoInstallatore).orderBy(desc(promoInstallatore.id)).limit(1);
  return result[0];
}

export async function updatePromoInstallatore(id: number, data: Partial<InsertPromoInstallatore>) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  await db.update(promoInstallatore).set(data).where(eq(promoInstallatore.id, id));
  const result = await db.select().from(promoInstallatore).where(eq(promoInstallatore.id, id));
  return result[0];
}

export async function deletePromoInstallatore(id: number) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  await db.delete(promoInstallatore).where(eq(promoInstallatore.id, id));
}
