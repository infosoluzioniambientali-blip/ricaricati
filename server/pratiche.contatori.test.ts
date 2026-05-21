import { describe, expect, it, beforeAll, afterAll } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";
import { getDb } from "./db";
import { ordini, installatori, users } from "../drizzle/schema";
import { eq } from "drizzle-orm";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createAuthContext(userId: number = 1): TrpcContext {
  const user: AuthenticatedUser = {
    id: userId,
    openId: `test-user-${userId}`,
    email: `test${userId}@example.com`,
    name: `Test User ${userId}`,
    loginMethod: "manus",
    role: "user",
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  };

  const ctx: TrpcContext = {
    user,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {
      clearCookie: () => {},
    } as TrpcContext["res"],
  };

  return ctx;
}

describe("pratiche.contatori", () => {
  let testUserId: number;
  let testInstallatoreId: number;
  let testOrdineId: number;

  beforeAll(async () => {
    // Creare un utente di test
    testUserId = Math.floor(Math.random() * 1000000);
    const db = await getDb();
    if (!db) throw new Error("DB not available");

    // Inserire utente
    await db.insert(users).values({
      openId: `test-user-${testUserId}`,
      email: `test${testUserId}@example.com`,
      name: `Test User ${testUserId}`,
      loginMethod: "manus",
      role: "user",
      createdAt: new Date(),
      updatedAt: new Date(),
      lastSignedIn: new Date(),
    });

    // Recuperare l'ID dell'utente appena creato
    const userResult = await db
      .select()
      .from(users)
      .where(eq(users.openId, `test-user-${testUserId}`))
      .limit(1);
    testUserId = userResult[0]?.id || testUserId;

    // Inserire installatore
    await db.insert(installatori).values({
      userId: testUserId,
      ragioneSociale: `Test Installatore ${testUserId}`,
      provincia: "NA",
      regione: "Campania",
      settore: "fotovoltaico",
      stato: "approvato",
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    // Recuperare l'ID dell'installatore
    const installatoreResult = await db
      .select()
      .from(installatori)
      .where(eq(installatori.userId, testUserId))
      .limit(1);
    testInstallatoreId = installatoreResult[0]?.id || 0;

    // Inserire un ordine Pack 1 pagato
    await db.insert(ordini).values({
      installatoreId: testInstallatoreId,
      userId: testUserId,
      packId: "pack_1",
      stato: "pagato",
      importo: "2000",
      nomeAcquirente: `Test Acquirente ${testUserId}`,
      emailAcquirente: `test${testUserId}@example.com`,
      pratiche_incluse: 10,
      pratiche_usate: 0,
      pratiche_incluse_residenziali: 6,
      pratiche_incluse_business: 4,
      pratiche_usate_residenziali: 0,
      pratiche_usate_business: 0,
      creditoTotale: "2000",
      creditoResiduo: "2000",
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    // Recuperare l'ID dell'ordine
    const ordineResult = await db
      .select()
      .from(ordini)
      .where(eq(ordini.installatoreId, testInstallatoreId))
      .limit(1);
    testOrdineId = ordineResult[0]?.id || 0;
  });

  it("should increment pratiche_usate_residenziali when creating a residenziale practice", async () => {
    const ctx = createAuthContext(testUserId);
    const caller = appRouter.createCaller(ctx);

    // Creare una pratica residenziale
    const pratica = await caller.pratiche.crea({
      tipologia: "residenziale",
      tipoIter: "connessione_ordinario",
      potenzaKw: 6,
      indirizzoImpianto: "Via Test 1",
      comuneImpianto: "Napoli",
      provinciaImpianto: "NA",
      nomeTitolare: "Test Titolare",
      note: "Test pratica residenziale",
    });

    expect(pratica).toBeDefined();
    expect(pratica.tipologia).toBe("residenziale");

    // Verificare che il contatore sia stato aggiornato nel DB
    const db = await getDb();
    if (!db) throw new Error("DB not available");

    const ordineUpdated = await db
      .select()
      .from(ordini)
      .where(eq(ordini.id, testOrdineId))
      .limit(1);

    expect(ordineUpdated[0]?.pratiche_usate_residenziali).toBe(1);
    expect(ordineUpdated[0]?.pratiche_usate_business).toBe(0);
    expect(ordineUpdated[0]?.pratiche_usate).toBe(1);
  });

  it("should increment pratiche_usate_business when creating a business practice", async () => {
    const ctx = createAuthContext(testUserId);
    const caller = appRouter.createCaller(ctx);

    // Creare una pratica business
    const pratica = await caller.pratiche.crea({
      tipologia: "business",
      tipoIter: "connessione_ordinario",
      potenzaKw: 50,
      indirizzoImpianto: "Via Test 2",
      comuneImpianto: "Napoli",
      provinciaImpianto: "NA",
      nomeTitolare: "Test Business",
      note: "Test pratica business",
    });

    expect(pratica).toBeDefined();
    expect(pratica.tipologia).toBe("business");

    // Verificare che il contatore sia stato aggiornato nel DB
    const db = await getDb();
    if (!db) throw new Error("DB not available");

    const ordineUpdated = await db
      .select()
      .from(ordini)
      .where(eq(ordini.id, testOrdineId))
      .limit(1);

    // Ora dovrebbe avere 1 residenziale (dal test precedente) + 1 business
    expect(ordineUpdated[0]?.pratiche_usate_residenziali).toBe(1);
    expect(ordineUpdated[0]?.pratiche_usate_business).toBe(1);
    expect(ordineUpdated[0]?.pratiche_usate).toBe(2);
  });

  it("should increment both residenziali and business counters when creating a mista practice", async () => {
    const ctx = createAuthContext(testUserId);
    const caller = appRouter.createCaller(ctx);

    // Creare una pratica mista
    const pratica = await caller.pratiche.crea({
      tipologia: "mista",
      tipoIter: "connessione_ordinario",
      potenzaKw: 30,
      indirizzoImpianto: "Via Test 3",
      comuneImpianto: "Napoli",
      provinciaImpianto: "NA",
      nomeTitolare: "Test Mista",
      note: "Test pratica mista",
    });

    expect(pratica).toBeDefined();
    expect(pratica.tipologia).toBe("mista");

    // Verificare che il contatore sia stato aggiornato nel DB
    const db = await getDb();
    if (!db) throw new Error("DB not available");

    const ordineUpdated = await db
      .select()
      .from(ordini)
      .where(eq(ordini.id, testOrdineId))
      .limit(1);

    // Ora dovrebbe avere 2 residenziali (1 dal primo test + 1 dalla mista) + 2 business (1 dal secondo test + 1 dalla mista)
    expect(ordineUpdated[0]?.pratiche_usate_residenziali).toBe(2);
    expect(ordineUpdated[0]?.pratiche_usate_business).toBe(2);
    expect(ordineUpdated[0]?.pratiche_usate).toBe(4);
  });

  afterAll(async () => {
    // Cleanup: eliminare i dati di test
    const db = await getDb();
    if (!db) return;

    // Eliminare pratiche
    const { pratiche } = await import("../drizzle/schema");
    await db.delete(pratiche).where(eq(pratiche.installatoreId, testInstallatoreId));

    // Eliminare ordini
    await db.delete(ordini).where(eq(ordini.id, testOrdineId));

    // Eliminare installatore
    await db.delete(installatori).where(eq(installatori.id, testInstallatoreId));

    // Eliminare utente
    await db.delete(users).where(eq(users.id, testUserId));
  });
});
