import { describe, expect, it, beforeAll, afterAll } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";
import { db } from "./db";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createAdminContext(): TrpcContext {
  const user: AuthenticatedUser = {
    id: 1,
    openId: "admin-user",
    email: "admin@example.com",
    name: "Admin User",
    loginMethod: "manus",
    role: "admin",
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  };

  return {
    user,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {} as TrpcContext["res"],
  };
}

describe("prospectInstallatori.ai procedures", () => {
  let prospectId: number;
  const ctx = createAdminContext();
  const caller = appRouter.createCaller(ctx);

  beforeAll(async () => {
    // Creare un prospect di test
    const result = await caller.prospectInstallatori.crea({
      ragioneSociale: "Test Company AI",
      nome: "Test User",
      email: "test-ai@example.com",
      telefono: "3331234567",
      settore: "Impianti Fotovoltaici",
      regione: "Lombardia",
      provincia: "MI",
      comune: "Milano",
      fonte: "manuale",
      statoContatto: "nuovo",
    });
    // La mutation crea restituisce { success: true }, non l'ID
    // Dobbiamo recuperare il prospect dalla lista
    const lista = await caller.prospectInstallatori.lista();
    const created = lista?.find((p: any) => p.ragioneSociale === "Test Company AI");
    if (!created) throw new Error("Prospect non creato");
    prospectId = created.id;
  });

  it("calcolaScore: calcola uno score AI tra 0 e 100", { timeout: 30000 }, async () => {
    // @ts-ignore - sub-router marketing.ai non inferito da TypeScript
    const result = await (caller as any).marketing.ai.calcolaScore({
      id: prospectId,
    });

    expect(result).toHaveProperty("score");
    expect(typeof result.score).toBe("number");
    expect(result.score).toBeGreaterThanOrEqual(0);
    expect(result.score).toBeLessThanOrEqual(100);
    expect(result).toHaveProperty("motivazione");
    expect(typeof result.motivazione).toBe("string");
  });

  it("generaProposta: genera una proposta commerciale AI", { timeout: 30000 }, async () => {
    // @ts-ignore - sub-router marketing.ai non inferito da TypeScript
    const result = await (caller as any).marketing.ai.generaProposta({
      id: prospectId,
    });

    expect(result).toHaveProperty("testo");
    expect(typeof result.testo).toBe("string");
    expect(result.testo.length).toBeGreaterThan(10); // Almeno qualche parola
  });

  it("creaLinkOfferta: crea un link offerta personalizzato", { timeout: 30000 }, async () => {
    // @ts-ignore - sub-router marketing.ai non inferito da TypeScript
    const result = await (caller as any).marketing.ai.creaLinkOfferta({
      id: prospectId,
    });

    expect(result).toHaveProperty("url");
    expect(typeof result.url).toBe("string");
    expect(result.url).toMatch(/^\/offerta\//);
    expect(result).toHaveProperty("token");
    expect(typeof result.token).toBe("string");
    expect(result).toHaveProperty("scadenza");
  });

  it("creaLinkOfferta: crea link con sconto e messaggio personalizzato", { timeout: 30000 }, async () => {
    // @ts-ignore - sub-router marketing.ai non inferito da TypeScript
    const result = await (caller as any).marketing.ai.creaLinkOfferta({
      id: prospectId,
      scontoPercent: 15,
      messaggioPersonale: "Offerta esclusiva per te!",
      packConsigliato: "pack1",
      scadenzaGiorni: 7,
    });

    expect(result).toHaveProperty("url");
    expect(result.url).toMatch(/^\/offerta\//);
    expect(result).toHaveProperty("token");
    expect(result).toHaveProperty("scadenza");
  });

  afterAll(async () => {
    // Pulire il prospect di test (soft delete)
    await caller.prospectInstallatori.elimina({ id: prospectId });
  });
});
