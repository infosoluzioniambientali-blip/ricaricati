import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";
import { readFileSync } from "fs";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createAuthContext(userId: number = 1, role: "user" | "admin" = "user"): TrpcContext {
  const user: AuthenticatedUser = {
    id: userId,
    openId: `user-${userId}`,
    email: `user${userId}@example.com`,
    name: `User ${userId}`,
    loginMethod: "manus",
    role,
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

describe("Installatori - Gestione Esclusiva", () => {
  describe("Campi estesi installatore", () => {
    it("creaAdmin accetta i nuovi campi (email, sito, regione, settore, specializzazioni)", async () => {
      const ctx = createAuthContext(1, "admin");
      const caller = appRouter.createCaller(ctx);

      const result = await caller.installatori.creaAdmin({
        ragioneSociale: "Test Installer",
        email: "test@installer.com",
        sito: "https://installer.com",
        indirizzo: "Via Test 123",
        regione: "Lombardia",
        settore: "Fotovoltaico",
        specializzazioni: "Impianti residenziali, Business",
        note: "Test notes",
        stato: "approvato",
      });

      expect(result).toBeDefined();
      expect(result.ragioneSociale).toBe("Test Installer");
      expect(result.email).toBe("test@installer.com");
      expect(result.regione).toBe("Lombardia");
      expect(result.settore).toBe("Fotovoltaico");
    });

    it("modificaAdmin può aggiornare i nuovi campi", async () => {
      const ctx = createAuthContext(1, "admin");
      const caller = appRouter.createCaller(ctx);

      const result = await caller.installatori.modificaAdmin({
        id: 1,
        email: "updated@installer.com",
        regione: "Piemonte",
        settore: "Eolico",
        tipoInterfaccia: "solo_singole",
      });

      expect(result.success).toBe(true);
    });
  });

  describe("Tipo Interfaccia", () => {
    it("aggiornaTipoInterfaccia cambia il tipo di interfaccia", async () => {
      const ctx = createAuthContext(1, "admin");
      const caller = appRouter.createCaller(ctx);

      const result = await caller.installatori.aggiornaTipoInterfaccia({
        id: 1,
        tipoInterfaccia: "solo_singole",
      });

      expect(result.success).toBe(true);
    });

    it("tipoInterfaccia può essere pack_e_singole o solo_singole", async () => {
      const ctx = createAuthContext(1, "admin");
      const caller = appRouter.createCaller(ctx);

      const result1 = await caller.installatori.aggiornaTipoInterfaccia({
        id: 1,
        tipoInterfaccia: "pack_e_singole",
      });
      expect(result1.success).toBe(true);

      const result2 = await caller.installatori.aggiornaTipoInterfaccia({
        id: 1,
        tipoInterfaccia: "solo_singole",
      });
      expect(result2.success).toBe(true);
    });
  });

  describe("Validazione acquisti pratiche", () => {
    it("la logica di validazione acquisti è presente nel router pratiche.crea", () => {
      // Test strutturale: verifica che il codice del router contenga la validazione degli ordini pagati
      const routerSource = readFileSync("./server/routers.ts", "utf-8");
      expect(routerSource).toContain("ordiniPagati");
      expect(routerSource).toContain("Devi acquistare un pack o una pratica singola");
      expect(routerSource).toContain("getOrdiniByUserId");
    });

    it("admin può sempre creare pratiche senza validazione acquisti", async () => {
      const ctx = createAuthContext(1, "admin");
      const caller = appRouter.createCaller(ctx);

      // Admin dovrebbe poter creare pratiche senza validazione
      const result = await caller.pratiche.creaAdmin({
        installatoreId: 1,
        tipologia: "residenziale",
        tipoIter: "connessione_ordinario",
        potenzaKw: "5.5",
        indirizzoImpianto: "Via Test 123",
        comuneImpianto: "Milano",
        provinciaImpianto: "MI",
      });

      expect(result).toBeDefined();
    });
  });
});
