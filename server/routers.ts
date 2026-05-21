import { z } from "zod";
import { TRPCError } from "@trpc/server";
import PDFDocument from "pdfkit";
import { Buffer } from "buffer";
import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import { notifyOwner } from "./_core/notification";
import { makeRequest } from "./_core/map";
import { ITER_DEFINIZIONI, type TipoIter, isIterDaPack } from "@shared/iter";
import { PROVINCE_BY_REGIONE } from "@shared/const";
import {
  upsertUser,
  getUserByOpenId,
  getInstallatoreByUserId,
  getInstallatoreById,
  createInstallatore,
  createInstallatoreAdmin,
  updateInstallatore,
  updateInstallatoreStato,
  deleteInstallatore,
  getAllInstallatori,
  getClassificaInstallatori,
  getTotaleFatturato,
  getTotaleCorsa100K,
  getTotaleQuota600K,
  correggiTotaleFatturatoInstallatore,
  createOrdine,
  hasPackAttivo,
  createOrdineAdmin,
  getAllOrdini,
  getOrdiniByUserId,
  updateOrdineStato,
  updateOrdine,
  deleteOrdine,
  createPratica,
  createPraticaAdmin,
  getPraticheByInstallatoreId,
  getPraticheByInstallatoreIdAdmin,
  getAllPratiche,
  updatePraticaStato,
  updatePratica,
  deletePratica,
  createDocumento,
  getDocumentiByPraticaId,
  deleteDocumento,
  updateDocumentoRevisione,
  getConfigDocumento,
  getRicaricheByInstallatoreId,
  getStatisticheAdmin,
  getAllDocumenti,
  scalaPraticaDaOrdine,
  scalaCredito,
  getPackRiepilogo,
  getOrdiniConCredito,
  PRATICHE_PER_PACK,
  PRATICHE_RES_PER_PACK,
  PRATICHE_BUS_PER_PACK,
  PREZZO_RES_PER_PACK,
  PREZZO_BUS_PER_PACK,
  CREDITO_PER_PACK,
  getBackupConfig,
  upsertBackupConfig,
  createBackupStorico,
  getBackupStorico,
  getListinoPersonalizzatoByInstallatore,
  upsertListinoPersonalizzato,
  deleteListinoPersonalizzato,
  getOrdiniSingoliByInstallatore,
  getPackAcquistatiByInstallatore,
  getProspectInstallatori,
  createProspectInstallatore,
  updateProspectInstallatore,
  deleteProspectInstallatore,
  ripristinaProspectInstallatore,
  eliminaDefinitivamenteProspect,
  getImmobiliFotovoltaico,
  createImmobileFotovoltaico,
  updateImmobileFotovoltaico,
  deleteImmobileFotovoltaico,
  bulkCreateProspectInstallatori,
  exportProspectInstallatori,
  aggiornaStatoContatto,
  createPec,
  getPecByInstallatoreId,
  getAllPec,
  updatePec,
  deletePec,
  getConfigDocumentiByIter,
  getAllConfigDocumenti,
  upsertConfigDocumento,
  deleteConfigDocumento,
  getDb,
  getClientiInattivi,
  getPackConfigurazione,
  createPackConfigurazione,
  updatePackConfigurazione,
  deletePackConfigurazione,
  getRicaricheConfigurazione,
  createRicaricaConfigurazione,
  updateRicaricaConfigurazione,
  deleteRicaricaConfigurazione,
  getPromoByInstallatore,
  getAllPromoAdmin,
  createPromoInstallatore,
  updatePromoInstallatore,
  deletePromoInstallatore,
} from "./db";
import {
  prospectOrdiniProbabili,
  prospectCorsi,
  type InsertProspectOrdineProbabile,
  type InsertProspectCorso,
} from "../drizzle/schema";
import { prospectInstallatori, users, installatori, ordini, premiBollette, premiNominativi, premiCodici, adminDocuments, installatoreDocuments, storicoOrdini } from "../drizzle/schema";
import { pratiche } from "../drizzle/schema";
import { impostazioni } from "../drizzle/schema";
import { storagePut, storageGetSignedUrl } from "./storage";
import { eq, and, desc, isNull, isNotNull } from "drizzle-orm";
import { invokeLLM } from "./_core/llm";
import crypto from "crypto";
import { hashPassword, verifyPassword } from "./_core/auth";
import { sdk } from "./_core/sdk";

// Importa getPraticheByInstallatoreId se non è già importato
const getPraticheByInstallatoreIdFn = getPraticheByInstallatoreId;

// Admin guard middleware
const adminProcedure = protectedProcedure.use(({ ctx, next }) => {
  if (ctx.user.role !== "admin") {
    throw new TRPCError({ code: "FORBIDDEN", message: "Accesso riservato agli amministratori" });
  }
  return next({ ctx });
});

export const appRouter = router({
  system: systemRouter,

  auth: router({
    me: publicProcedure.query((opts) => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
    registrazione: publicProcedure
      .input(
        z.object({
          nome: z.string().min(2),
          email: z.string().email(),
          password: z.string().min(8),
          azienda: z.string().min(2),
          telefono: z.string().min(5),
        })
      )
      .mutation(async ({ input, ctx }) => {
        const db = await getDb();
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database non disponibile" });

        // Verifica se l'email esiste già
        const existingUser = await db.select().from(users).where(eq(users.email, input.email)).limit(1);
        if (existingUser.length > 0) {
          throw new TRPCError({ code: "CONFLICT", message: "Email già registrata" });
        }
        
        // Hash della password
        const hashedPassword = await hashPassword(input.password);

        // Genera un openId univoco per utenti registrati manualmente
        const openId = `local_${crypto.randomUUID()}`;
        
        // Crea l'utente
        await db.insert(users).values({
          openId,
          name: input.nome,
          email: input.email,
          password: hashedPassword,
          loginMethod: "local",
          role: "user",
          lastSignedIn: new Date(),
        });

        // Recupera l'utente appena creato
        const newUserResult = await db.select().from(users).where(eq(users.email, input.email)).limit(1);
        if (!newUserResult || newUserResult.length === 0) {
          throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Errore durante la creazione dell'account" });
        }
        const newUser = newUserResult[0];
        
        // Crea il profilo installatore
        await db.insert(installatori).values({
          userId: newUser.id,
          ragioneSociale: input.azienda,
          telefono: input.telefono,
          email: input.email,
          stato: "in_attesa",
          saldoPratiche: 0,
          saldoBusiness: 0,
          totaleFatturato: "0",
        });
        
        // Crea la sessione JWT con openId
        const ONE_YEAR_MS = 365 * 24 * 60 * 60 * 1000;
        const sessionToken = await sdk.createSessionToken(openId, { name: input.nome, expiresInMs: ONE_YEAR_MS });
        const cookieOptions = getSessionCookieOptions(ctx.req);
        ctx.res.cookie(COOKIE_NAME, sessionToken, { ...cookieOptions, maxAge: ONE_YEAR_MS });
        
        return { success: true, userId: newUser.id };
      }),

    login: publicProcedure
      .input(z.object({ email: z.string().email(), password: z.string().min(1) }))
      .mutation(async ({ input, ctx }) => {
        const db = await getDb();
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database non disponibile" });

        const userResult = await db.select().from(users).where(eq(users.email, input.email)).limit(1);
        if (!userResult || userResult.length === 0) {
          throw new TRPCError({ code: "UNAUTHORIZED", message: "Email o password non corretti" });
        }
        const user = userResult[0];
        if (!user.password) {
          throw new TRPCError({ code: "UNAUTHORIZED", message: "Questo account usa l'accesso tramite Manus. Usa il pulsante Login." });
        }
        const valid = await verifyPassword(input.password, user.password);
        if (!valid) {
          throw new TRPCError({ code: "UNAUTHORIZED", message: "Email o password non corretti" });
        }
        // Aggiorna lastSignedIn
        await db.update(users).set({ lastSignedIn: new Date() }).where(eq(users.id, user.id));
        // Crea la sessione JWT
        const ONE_YEAR_MS = 365 * 24 * 60 * 60 * 1000;
        const sessionToken = await sdk.createSessionToken(user.openId, { name: user.name ?? input.email, expiresInMs: ONE_YEAR_MS });
        const cookieOptions = getSessionCookieOptions(ctx.req);
        ctx.res.cookie(COOKIE_NAME, sessionToken, { ...cookieOptions, maxAge: ONE_YEAR_MS });
        return { success: true };
      }),
  }),

  // ─── INSTALLATORI ──────────────────────────────────────────────────────────
  installatori: router({
    mio: protectedProcedure.query(async ({ ctx }) => {
      const installatore = await getInstallatoreByUserId(ctx.user.id);
      return installatore || null;
    }),
    // Installatore: ottieni il proprio listino personalizzato (se esiste)
    mioListino: protectedProcedure.query(async ({ ctx }) => {
      const installatore = await getInstallatoreByUserId(ctx.user.id);
      if (!installatore) return null;
      return getListinoPersonalizzatoByInstallatore(installatore.id);
    }),

    registra: protectedProcedure
      .input(
        z.object({
          ragioneSociale: z.string().min(2),
          partitaIva: z.string().optional(),
          telefono: z.string().optional(),
          citta: z.string().optional(),
          provincia: z.string().optional(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const esistente = await getInstallatoreByUserId(ctx.user.id);
        if (esistente) {
          throw new TRPCError({ code: "CONFLICT", message: "Profilo installatore già esistente" });
        }
        const installatore = await createInstallatore({
          userId: ctx.user.id,
          ragioneSociale: input.ragioneSociale,
          partitaIva: input.partitaIva,
          telefono: input.telefono,
          citta: input.citta,
          provincia: input.provincia,
          stato: "in_attesa",
          saldoPratiche: 0,
          saldoBusiness: 0,
          totaleFatturato: "0",
        });
        await notifyOwner({
          title: "Nuova registrazione installatore",
          content: `Nuovo installatore registrato: ${input.ragioneSociale} (${ctx.user.email ?? ctx.user.name}). In attesa di approvazione.`,
        });
        // Aggiungi automaticamente al CRM come prospect (stato: interessato)
        try {
          await createProspectInstallatore({
            ragioneSociale: input.ragioneSociale,
            nome: ctx.user.name ?? undefined,
            email: ctx.user.email ?? undefined,
            telefono: input.telefono ?? undefined,
            provincia: input.provincia ?? undefined,
            comune: input.citta ?? undefined,
            statoContatto: "interessato",
            fonte: "manuale",
            note: `Registrato sul sito il ${new Date().toLocaleDateString("it-IT")}`,
          } as any);
        } catch {
          // Non bloccare la registrazione se il CRM fallisce
        }
        return installatore;
      }),

    classifica: publicProcedure.query(async () => {
      const [classifica, totaleFatturato, totaleCorsa100K, totaleQuota600K] = await Promise.all([
        getClassificaInstallatori(),
        getTotaleFatturato(),
        getTotaleCorsa100K(),
        getTotaleQuota600K(),
      ]);
      // totale = fatturato totale (pack + singoli), totaleCorsa = solo pack
      // totaleQuota600K = somma degli importi stimati degli ordini probabili accettati
      return { classifica, totale: totaleFatturato, totaleCorsa100K, totaleQuota600K };
    }),

    // Admin: correggi manualmente il fatturato di un installatore
    correggiTotaleFatturato: adminProcedure
      .input(z.object({ installatoreId: z.number(), valore: z.number().min(0) }))
      .mutation(async ({ input }) => {
        await correggiTotaleFatturatoInstallatore(input.installatoreId, input.valore);
        return { success: true };
      }),

    // Admin: genera codici promo per installatori esistenti che non ce l'hanno
    generaCodiciPromo: adminProcedure.mutation(async () => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB non disponibile" });
      const senzaCodice = await db.select({ id: installatori.id }).from(installatori).where(isNull(installatori.codicePromo));
      let aggiornati = 0;
      for (const inst of senzaCodice) {
        let codicePromo: string;
        let attempts = 0;
        do {
          const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
          let code = "";
          for (let i = 0; i < 6; i++) code += chars[Math.floor(Math.random() * chars.length)];
          codicePromo = `PROMO-${code}`;
          const existing = await db.select({ id: installatori.id }).from(installatori).where(eq(installatori.codicePromo, codicePromo)).limit(1);
          if (existing.length === 0) break;
          attempts++;
        } while (attempts < 10);
        await db.update(installatori).set({ codicePromo }).where(eq(installatori.id, inst.id));
        aggiornati++;
      }
      return { aggiornati };
    }),

    // Admin: lista tutti — restituisce { installatore, user } per compatibilità con il frontend
    lista: adminProcedure.query(async () => {
      return getAllInstallatori();
    }),

    // Admin: approva/rifiuta
    aggiornaStato: adminProcedure
      .input(z.object({ id: z.number(), stato: z.enum(["approvato", "rifiutato", "in_attesa"]) }))
      .mutation(async ({ input }) => {
        await updateInstallatoreStato(input.id, input.stato);
        return { success: true };
      }),

    // Admin: crea installatore manualmente
    creaAdmin: adminProcedure
      .input(
        z.object({
          userId: z.number().optional(),
          ragioneSociale: z.string().min(2),
          email: z.string().email().optional(),
          sito: z.string().optional(),
          indirizzo: z.string().optional(),
          partitaIva: z.string().optional(),
          telefono: z.string().optional(),
          citta: z.string().optional(),
          provincia: z.string().optional(),
          regione: z.string().optional(),
          settore: z.string().optional(),
          specializzazioni: z.string().optional(),
          note: z.string().optional(),
          stato: z.enum(["in_attesa", "approvato", "rifiutato"]).default("approvato"),
        })
      )
      .mutation(async ({ input }) => {
        return createInstallatoreAdmin({
          userId: input.userId ?? 0,
          ragioneSociale: input.ragioneSociale,
          email: input.email,
          sito: input.sito,
          indirizzo: input.indirizzo,
          partitaIva: input.partitaIva,
          telefono: input.telefono,
          citta: input.citta,
          provincia: input.provincia,
          regione: input.regione,
          settore: input.settore,
          specializzazioni: input.specializzazioni,
          note: input.note,
          stato: input.stato,
          saldoPratiche: 0,
          saldoBusiness: 0,
          totaleFatturato: "0",
        });
      }),

    // Admin: modifica installatore
    modificaAdmin: adminProcedure
      .input(
        z.object({
          id: z.number(),
          ragioneSociale: z.string().min(2).optional(),
          partitaIva: z.string().optional(),
          telefono: z.string().optional(),
          email: z.string().email().optional(),
          sito: z.string().optional(),
          indirizzo: z.string().optional(),
          citta: z.string().optional(),
          provincia: z.string().optional(),
          regione: z.string().optional(),
          settore: z.string().optional(),
          specializzazioni: z.string().optional(),
          note: z.string().optional(),
          stato: z.enum(["in_attesa", "approvato", "rifiutato"]).optional(),
          saldoPratiche: z.number().optional(),
          totaleFatturato: z.string().optional(),
          tipoInterfaccia: z.enum(["pack_e_singole", "solo_singole"]).optional(),
        })
      )
      .mutation(async ({ input }) => {
        const { id, ...data } = input;
        await updateInstallatore(id, data);
        return { success: true };
      }),

    // Admin: elimina installatore
    eliminaAdmin: adminProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        await deleteInstallatore(input.id);
        return { success: true };
      }),

    // Admin: pratiche di un installatore specifico
    praticheInstallatore: adminProcedure
      .input(z.object({ installatoreId: z.number() }))
      .query(async ({ input }) => {
        return getPraticheByInstallatoreIdAdmin(input.installatoreId);
      }),

    // Admin: aggiorna tipo interfaccia installatore
    aggiornaTipoInterfaccia: adminProcedure
      .input(z.object({ id: z.number(), tipoInterfaccia: z.enum(["pack_e_singole", "solo_singole"]) }))
      .mutation(async ({ input }) => {
        await updateInstallatore(input.id, { tipoInterfaccia: input.tipoInterfaccia });
        return { success: true };
      }),

    // Admin: pack acquistati da un installatore
    packAcquistati: adminProcedure
      .input(z.object({ installatoreId: z.number() }))
      .query(async ({ input }) => {
        return getPackAcquistatiByInstallatore(input.installatoreId);
      }),

    // Admin: pacchetti assegnati a un installatore
    packAssegnati: adminProcedure
      .input(z.object({ installatoreId: z.number() }))
      .query(async ({ input }) => {
        const db = await getDb();
        if (!db) return [];
        const { ordini: ordiniTable } = await import("../drizzle/schema");
        const { eq, and, desc } = await import("drizzle-orm");
        return db.select().from(ordiniTable)
          .where(and(
            eq(ordiniTable.installatoreId, input.installatoreId),
            eq(ordiniTable.tipoOrdine, "assegnazione_admin"),
            eq(ordiniTable.stato, "pagato")
          ))
          .orderBy(desc(ordiniTable.createdAt));
      }),

    // Admin: ordini singoli di un installatore
    ordiniSingoli: adminProcedure
      .input(z.object({ installatoreId: z.number() }))
      .query(async ({ input }) => {
        return getOrdiniSingoliByInstallatore(input.installatoreId);
      }),

    // Admin: upsert listino personalizzato
    upsertListino: adminProcedure
      .input(z.object({
        installatoreId: z.number(),
        nomeListino: z.string().min(1),
        prezzi: z.record(z.string(), z.object({ prezzo: z.number(), note: z.string().optional() })),
      }))
      .mutation(async ({ input }) => {
        const id = await upsertListinoPersonalizzato(input.installatoreId, input.nomeListino, input.prezzi as Record<string, { prezzo: number; note?: string }>);
        return { success: true, id };
      }),

    // Admin: ottieni listino personalizzato
    getListino: adminProcedure
      .input(z.object({ installatoreId: z.number() }))
      .query(async ({ input }) => {
        const lp = await getListinoPersonalizzatoByInstallatore(input.installatoreId);
        if (!lp) return null;
        return { ...lp, prezzi: JSON.parse(lp.prezzi || "{}") as Record<string, { prezzo: number; note?: string }> };
      }),

    // Admin: elimina listino personalizzato
    eliminaListino: adminProcedure
      .input(z.object({ installatoreId: z.number() }))
      .mutation(async ({ input }) => {
        await deleteListinoPersonalizzato(input.installatoreId);
        return { success: true };
      }),

    // Admin: crea PEC per installatore
    creaPec: adminProcedure
      .input(z.object({
        installatoreId: z.number(),
        email: z.string().email(),
      }))
      .mutation(async ({ input }) => {
        return createPec({
          installatoreId: input.installatoreId,
          email: input.email,
          verificato: false,
        });
      }),

    // Admin: ottieni PEC di un installatore
    getPec: adminProcedure
      .input(z.object({ installatoreId: z.number() }))
      .query(async ({ input }) => {
        return getPecByInstallatoreId(input.installatoreId);
      }),

    // Admin: ottieni tutte le PEC
    getAllPec: adminProcedure
      .query(async () => {
        return getAllPec();
      }),

    // Admin: aggiorna PEC
    aggiornaPec: adminProcedure
      .input(z.object({
        id: z.number(),
        email: z.string().email().optional(),
        verificato: z.boolean().optional(),
      }))
      .mutation(async ({ input }) => {
        const { id, ...data } = input;
        await updatePec(id, data);
        return { success: true };
      }),

    // Admin: elimina PEC
    eliminaPec: adminProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        await deletePec(input.id);
        return { success: true };
      }),
  }),

  // ─── ORDINI ────────────────────────────────────────────────────────────────
  ordini: router({
    crea: protectedProcedure
      .input(
        z.object({
          packId: z.enum(["pack1", "pack2", "pack3"]),
          metodoPagamento: z.enum(["paypal", "bonifico"]),
          nomeAcquirente: z.string().min(2),
          emailAcquirente: z.string().email(),
          telefonoAcquirente: z.string().optional(),
          ragioneSocialeAcquirente: z.string().optional(),
          note: z.string().optional(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const prezzi = { pack1: "2000.00", pack2: "3150.00", pack3: "5100.00" };
        const pratiche_incluse = PRATICHE_PER_PACK[input.packId] ?? 0;
        const pratiche_incluse_residenziali = PRATICHE_RES_PER_PACK[input.packId] ?? 0;
        const pratiche_incluse_business = PRATICHE_BUS_PER_PACK[input.packId] ?? 0;
        // Collega automaticamente l'installatore autenticato
        const installatore = await getInstallatoreByUserId(ctx.user.id);
        const ordine = await createOrdine({
          userId: ctx.user.id,
          installatoreId: installatore?.id,
          packId: input.packId,
          importo: prezzi[input.packId],
          metodoPagamento: input.metodoPagamento,
          nomeAcquirente: input.nomeAcquirente,
          emailAcquirente: input.emailAcquirente,
          telefonoAcquirente: input.telefonoAcquirente,
          ragioneSocialeAcquirente: input.ragioneSocialeAcquirente,
          note: input.note,
          stato: "in_attesa",
          pratiche_incluse,
          pratiche_incluse_residenziali,
          pratiche_incluse_business,
          pratiche_usate: 0,
        });
        // Genera il PDF esplicativo
        const { generatePackPDF } = await import("./generatePackPDF");
        const packData = {
          pack1: { nome: "Pack 1", residenziali: 16, prezzoRes: 125, business: 5, prezzoBus: 400, ricBollette: 10, ricPratiche: 100 },
          pack2: { nome: "Pack 2", residenziali: 30, prezzoRes: 105, business: 9, prezzoBus: 350, ricBollette: 15, ricPratiche: 150 },
          pack3: { nome: "Pack 3", residenziali: 60, prezzoRes: 85, business: 20, prezzoBus: 250, ricBollette: 20, ricPratiche: 200 },
        };
        const pData = packData[input.packId];
        const prezziFrontend = { pack1: "€ 2.000", pack2: "€ 3.150", pack3: "€ 5.100" };
        
        const pdfDoc = generatePackPDF({
          packNome: pData.nome,
          packPrezzo: prezziFrontend[input.packId],
          residenziali: pData.residenziali,
          prezzoRes: pData.prezzoRes,
          business: pData.business,
          prezzoBus: pData.prezzoBus,
          ricBollette: pData.ricBollette,
          ricPratiche: pData.ricPratiche,
          nomeAcquirente: input.nomeAcquirente,
          dataAcquisto: new Date().toLocaleDateString("it-IT"),
        });
        
        // Salva il PDF in memoria
        const pdfBuffer = await new Promise<Buffer>((resolve, reject) => {
          const chunks: Buffer[] = [];
          pdfDoc.on("data", (chunk) => chunks.push(chunk));
          pdfDoc.on("end", () => resolve(Buffer.concat(chunks)));
          pdfDoc.on("error", reject);
          pdfDoc.end();
        });
        
        // Salva il PDF in storage
        const { storagePut } = await import("./storage");
        const pdfKey = `ordini/${ordine.id}/pack-${input.packId}-${Date.now()}.pdf`;
        const { url: pdfUrl } = await storagePut(pdfKey, pdfBuffer, "application/pdf");
        
        // Aggiorna l'ordine con l'URL del PDF
        const db = await getDb();
        if (db) {
          const { ordini: ordiniTable } = await import("../drizzle/schema");
          const { eq } = await import("drizzle-orm");
          await db.update(ordiniTable).set({ pdfUrl }).where(eq(ordiniTable.id, ordine.id));
        }
        
        const nomiPack = { pack1: "Pack 1 — €2.000", pack2: "Pack 2 — €3.150", pack3: "Pack 3 — €5.100" };
        await notifyOwner({
          title: "Nuovo ordine ricevuto",
          content: `Nuovo ordine: ${nomiPack[input.packId]} da ${input.nomeAcquirente} (${input.emailAcquirente}). Metodo: ${input.metodoPagamento === "paypal" ? "PayPal" : "Bonifico bancario"}.`,
        });
        
        return { ...ordine, pdfUrl };
      }),

    miei: protectedProcedure.query(async ({ ctx }) => {
      const installatore = await getInstallatoreByUserId(ctx.user.id);
      if (installatore) {
        const creditoData = await getOrdiniConCredito(installatore.id);
        if (creditoData) {
          return [creditoData];
        }
        const db = await getDb();
        if (!db) return [];
        const { ordini: ordiniTable } = await import("../drizzle/schema");
        const { eq, and, desc } = await import("drizzle-orm");
        const tuttiOrdini = await db
          .select()
          .from(ordiniTable)
          .where(and(
            eq(ordiniTable.installatoreId, installatore.id),
            eq(ordiniTable.stato, "pagato")
          ))
          .orderBy(desc(ordiniTable.createdAt));
        return tuttiOrdini;
      }
      const ordiniByUser = await getOrdiniByUserId(ctx.user.id);
      return ordiniByUser.filter((o: any) => o.stato === "pagato");
    }),

    tutti: adminProcedure.query(async () => {
      return getAllOrdini();
    }),

    aggiornaStato: adminProcedure
      .input(z.object({ id: z.number(), stato: z.enum(["in_attesa", "pagato", "annullato"]) }))
      .mutation(async ({ input }) => {
        await updateOrdineStato(input.id, input.stato);
        return { success: true };
      }),

    // Admin: crea ordine manualmente
    creaAdmin: adminProcedure
      .input(
        z.object({
          installatoreId: z.number().optional(),
          packId: z.enum(["pack1", "pack2", "pack3", "custom"]),
          // Campi per pack custom
          nomePacchetto: z.string().optional(),
          importoCustom: z.number().optional(),
          praticheResCustom: z.number().optional(),
          prezzoResCustom: z.number().optional(),
          praticheBusCustom: z.number().optional(),
          prezzoBusCustom: z.number().optional(),
          metodoPagamento: z.enum(["paypal", "bonifico"]),
          nomeAcquirente: z.string().min(2),
          emailAcquirente: z.string().email(),
          telefonoAcquirente: z.string().optional(),
          ragioneSocialeAcquirente: z.string().optional(),
          note: z.string().optional(),
          stato: z.enum(["in_attesa", "pagato", "annullato"]).default("pagato"),
          pratiche_incluse: z.number().optional(),
        })
      )
      .mutation(async ({ input }) => {
        const prezziStandard: Record<string, string> = { pack1: "2000.00", pack2: "3150.00", pack3: "5100.00" };
        let pratiche_incluse_residenziali: number;
        let pratiche_incluse_business: number;
        let pratiche_incluse: number;
        let importo: string;
        let nomePacchetto: string | undefined;
        let prezzoResidenziale: string | undefined;
        let prezzoBusiness: string | undefined;

        if (input.packId === "custom") {
          // Pack personalizzato
          pratiche_incluse_residenziali = input.praticheResCustom ?? 0;
          pratiche_incluse_business = input.praticheBusCustom ?? 0;
          pratiche_incluse = pratiche_incluse_residenziali + pratiche_incluse_business;
          importo = String(input.importoCustom ?? 0);
          nomePacchetto = input.nomePacchetto ?? "Pack Personalizzato";
          prezzoResidenziale = input.prezzoResCustom ? String(input.prezzoResCustom) : undefined;
          prezzoBusiness = input.prezzoBusCustom ? String(input.prezzoBusCustom) : undefined;
        } else {
          pratiche_incluse = input.pratiche_incluse ?? PRATICHE_PER_PACK[input.packId] ?? 0;
          pratiche_incluse_residenziali = PRATICHE_RES_PER_PACK[input.packId] ?? 0;
          pratiche_incluse_business = PRATICHE_BUS_PER_PACK[input.packId] ?? 0;
          importo = prezziStandard[input.packId];
          nomePacchetto = undefined;
          prezzoResidenziale = String(PREZZO_RES_PER_PACK[input.packId] ?? 0);
          prezzoBusiness = String(PREZZO_BUS_PER_PACK[input.packId] ?? 0);
        }

        // creditoResiduo = importo del pacchetto (credito iniziale pieno)
        const creditoResiduoIniziale = input.stato === "pagato" ? importo : "0";

        return createOrdineAdmin({
          userId: 0,
          installatoreId: input.installatoreId,
          packId: input.packId,
          nomePacchetto,
          prezzoResidenziale,
          prezzoBusiness,
          importo,
          creditoResiduo: creditoResiduoIniziale,
          metodoPagamento: input.metodoPagamento,
          nomeAcquirente: input.nomeAcquirente,
          emailAcquirente: input.emailAcquirente,
          telefonoAcquirente: input.telefonoAcquirente,
          ragioneSocialeAcquirente: input.ragioneSocialeAcquirente,
          note: input.note,
          stato: input.stato,
          pratiche_incluse,
          pratiche_incluse_residenziali,
          pratiche_incluse_business,
          pratiche_usate: 0,
        });
      }),

    // Admin: modifica ordine
    modificaAdmin: adminProcedure
      .input(
        z.object({
          id: z.number(),
          stato: z.enum(["in_attesa", "pagato", "annullato"]).optional(),
          note: z.string().optional(),
          pratiche_incluse: z.number().optional(),
          pratiche_usate: z.number().optional(),
        })
      )
      .mutation(async ({ input }) => {
        const { id, ...data } = input;
        await updateOrdine(id, data);
        return { success: true };
      }),

    // Admin: elimina ordine
    eliminaAdmin: adminProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        await deleteOrdine(input.id);
        return { success: true };
      }),

    // Genera ricevuta PDF per ordine pack
    generaRicevuta: protectedProcedure
      .input(z.object({ ordineId: z.number() }))
      .query(async ({ ctx, input }) => {
        const db = await getDb();
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
        
        const { ordini: ordiniTable } = await import("../drizzle/schema");
        const { eq } = await import("drizzle-orm");
        const ordine = await db.select().from(ordiniTable).where(eq(ordiniTable.id, input.ordineId)).then(r => r[0]);
        
        if (!ordine) throw new TRPCError({ code: "NOT_FOUND", message: "Ordine non trovato" });
        if (ordine.userId !== ctx.user.id && ctx.user.role !== "admin") throw new TRPCError({ code: "FORBIDDEN" });
        
        // Se il PDF esiste già E il pack non era custom, restituisci l'URL
        // Per pack custom rigenera sempre così il nome è aggiornato
        if (ordine.pdfUrl && ordine.packId !== "custom") return { url: ordine.pdfUrl };
        
        // Genera il PDF
        const doc = new PDFDocument({ size: "A4", margin: 40 });
        const chunks: Buffer[] = [];
        doc.on("data", (chunk) => chunks.push(chunk));
        
        const nomiPack: Record<string, string> = { pack1: "Pack 1", pack2: "Pack 2", pack3: "Pack 3", singolo: "Pratiche Singole" };
        // Per pack custom usa il nome salvato sull'ordine
        const packNome = (ordine as any).nomePacchetto || nomiPack[ordine.packId] || "Pacchetto Personalizzato";
        
        doc.fontSize(20).font("Helvetica-Bold").text("RICEVUTA ORDINE", { align: "center" });
        doc.fontSize(10).font("Helvetica").text("Ricaricati di Connessioni", { align: "center" });
        doc.text("Soluzioni Ambientali", { align: "center" });
        doc.moveTo(50, doc.y + 5).lineTo(550, doc.y + 5).stroke();
        
        doc.moveDown();
        doc.fontSize(12).font("Helvetica-Bold").text(`Ordine #${ordine.id}`);
        doc.fontSize(10).font("Helvetica").text(`Data: ${new Date(ordine.createdAt).toLocaleDateString("it-IT")}`);
        doc.text(`Stato: ${ordine.stato === "pagato" ? "Pagato" : ordine.stato === "in_attesa" ? "In attesa" : "Annullato"}`);
        
        doc.moveDown();
        doc.fontSize(11).font("Helvetica-Bold").text("Dati Acquirente:");
        doc.fontSize(10).font("Helvetica");
        doc.text(`Nome: ${ordine.nomeAcquirente}`);
        doc.text(`Email: ${ordine.emailAcquirente}`);
        if (ordine.telefonoAcquirente) doc.text(`Telefono: ${ordine.telefonoAcquirente}`);
        if (ordine.ragioneSocialeAcquirente) doc.text(`Azienda: ${ordine.ragioneSocialeAcquirente}`);
        
        doc.moveDown();
        doc.fontSize(11).font("Helvetica-Bold").text("Dettagli Ordine:");
        doc.fontSize(10).font("Helvetica");
        doc.text(`Pacchetto: ${packNome}`);
        doc.text(`Importo: €${parseFloat(ordine.importo).toFixed(2)}`);
        doc.text(`Metodo Pagamento: ${ordine.metodoPagamento === "paypal" ? "PayPal" : "Bonifico Bancario"}`);
        // Non mostrare note interne admin nella ricevuta
        const noteVisibili = ordine.note && !ordine.note.startsWith("[ASSEGNAZIONE ADMIN]") && !ordine.note.startsWith("[ADMIN]");
        if (noteVisibili) doc.text(`Note: ${ordine.note}`);
        
        doc.moveDown();
        doc.fontSize(9).font("Helvetica").text("Questa ricevuta è stata generata automaticamente. Per informazioni contattare info@soluzioniambientali.info", { align: "center" });
        
        doc.end();
        const pdfBuffer = await new Promise<Buffer>((resolve, reject) => {
          doc.on("end", () => resolve(Buffer.concat(chunks)));
          doc.on("error", reject);
        });
        
        // Salva su S3
        const { storagePut } = await import("./storage");
        const pdfKey = `ordini/${ordine.id}/ricevuta-${Date.now()}.pdf`;
        const { url: pdfUrl } = await storagePut(pdfKey, pdfBuffer, "application/pdf");
        
        // Aggiorna l'ordine
        await db.update(ordiniTable).set({ pdfUrl }).where(eq(ordiniTable.id, ordine.id));
        
        return { url: pdfUrl };
      }),

    // Genera preventivo PDF per pratiche singole
    generaPreventivoSingola: publicProcedure
      .input(z.object({ ordineId: z.number() }))
      .query(async ({ ctx, input }) => {
        const db = await getDb();
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
        
        const { ordini: ordiniTable } = await import("../drizzle/schema");
        const { eq } = await import("drizzle-orm");
        const ordine = await db.select().from(ordiniTable).where(eq(ordiniTable.id, input.ordineId)).then(r => r[0]);
        
        if (!ordine) throw new TRPCError({ code: "NOT_FOUND", message: "Ordine non trovato" });
        if (ordine.userId !== ctx.user?.id && ctx.user?.role !== "admin") throw new TRPCError({ code: "FORBIDDEN" });
        
        // Se il PDF esiste già, restituisci l'URL
        if (ordine.pdfUrl) return { url: ordine.pdfUrl };
        
        // Genera il PDF
        const doc = new PDFDocument({ size: "A4", margin: 40 });
        const chunks: Buffer[] = [];
        doc.on("data", (chunk) => chunks.push(chunk));
        
        doc.fontSize(20).font("Helvetica-Bold").text("PREVENTIVO", { align: "center" });
        doc.fontSize(10).font("Helvetica").text("Ricaricati di Connessioni", { align: "center" });
        doc.text("Soluzioni Ambientali", { align: "center" });
        doc.moveTo(50, doc.y + 5).lineTo(550, doc.y + 5).stroke();
        
        doc.moveDown();
        doc.fontSize(12).font("Helvetica-Bold").text(`Preventivo #${ordine.id}`);
        doc.fontSize(10).font("Helvetica").text(`Data: ${new Date(ordine.createdAt).toLocaleDateString("it-IT")}`);
        doc.text(`Validità: 30 giorni`);
        
        doc.moveDown();
        doc.fontSize(11).font("Helvetica-Bold").text("Dati Richiedente:");
        doc.fontSize(10).font("Helvetica");
        doc.text(`Nome: ${ordine.nomeAcquirente}`);
        doc.text(`Email: ${ordine.emailAcquirente}`);
        if (ordine.telefonoAcquirente) doc.text(`Telefono: ${ordine.telefonoAcquirente}`);
        if (ordine.ragioneSocialeAcquirente) doc.text(`Azienda: ${ordine.ragioneSocialeAcquirente}`);
        
        doc.moveDown();
        doc.fontSize(11).font("Helvetica-Bold").text("Descrizione Pratica:");
        doc.fontSize(10).font("Helvetica");
        if (ordine.note) {
          const noteClean = ordine.note.replace(/\[PRATICHE SINGOLE - Fascia: [^\]]+\]\n/i, "");
          doc.text(noteClean, { width: 480, align: "left" });
        }
        
        doc.moveDown();
        doc.fontSize(11).font("Helvetica-Bold").text("Importo Totale:");
        doc.fontSize(14).font("Helvetica-Bold").text(`€${parseFloat(ordine.importo).toFixed(2)}`, { color: "#f5c518" });
        
        doc.moveDown(2);
        doc.fontSize(9).font("Helvetica").text("Per procedere con l'acquisto, contatta il nostro team o accedi al portale.", { align: "center" });
        doc.fontSize(9).font("Helvetica").text("Questo preventivo è stato generato automaticamente.", { align: "center" });
        
        doc.end();
        const pdfBuffer = await new Promise<Buffer>((resolve, reject) => {
          doc.on("end", () => resolve(Buffer.concat(chunks)));
          doc.on("error", reject);
        });
        
        // Salva su S3
        const { storagePut } = await import("./storage");
        const pdfKey = `ordini/${ordine.id}/preventivo-${Date.now()}.pdf`;
        const { url: pdfUrl } = await storagePut(pdfKey, pdfBuffer, "application/pdf");
        
        // Aggiorna l'ordine
        await db.update(ordiniTable).set({ pdfUrl }).where(eq(ordiniTable.id, ordine.id));
        
        return { url: pdfUrl };
      }),

    // Richiesta pratiche singole (senza pack)
    creaOrdineSingolo: publicProcedure
      .input(z.object({
        descrizione: z.string().min(5),
        fascia: z.enum(["prezzoStandard", "prezzoForniture", "prezzoPremium"]),
        importoTotale: z.number().min(0).default(0),
      }))
      .mutation(async ({ ctx, input }) => {
        const nomeAcquirente = ctx.user?.name ?? ctx.user?.email ?? "Anonimo";
        const emailAcquirente = ctx.user?.email ?? "noreply@ricaricati.it";
        const ordine = await createOrdine({
          userId: ctx.user?.id ?? 0,
          installatoreId: ctx.user ? (await getInstallatoreByUserId(ctx.user.id))?.id : undefined,
          packId: "singolo",
          importo: input.importoTotale.toFixed(2),
          metodoPagamento: "bonifico",
          nomeAcquirente,
          emailAcquirente,
          note: `[PRATICHE SINGOLE - Fascia: ${input.fascia}]\n${input.descrizione}`,
          stato: "in_attesa",
          pratiche_incluse: 0,
          pratiche_usate: 0,
        });
        await notifyOwner({
          title: "Nuova richiesta pratiche singole",
          content: `Richiesta da ${nomeAcquirente} (${emailAcquirente})\nFascia: ${input.fascia} — Totale: €${input.importoTotale.toFixed(2)}\n\n${input.descrizione}`,
        });
        return ordine;
      }),
    // Admin: assegna pacchetto a un installatore come ordine pagato
    assegnaPackaggio: adminProcedure
      .input(
        z.object({
          installatoreId: z.number(),
          packId: z.enum(["pack1", "pack2", "pack3", "custom"]),
          nomePacchetto: z.string().optional(),
          prezzoResidenziale: z.number().optional(),
          prezzoBusiness: z.number().optional(),
          importo: z.number(),
          pratiche_incluse_residenziali: z.number().optional(),
          pratiche_incluse_business: z.number().optional(),
          note: z.string().optional(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const db = await getDb();
        if (!db) throw new Error("Database non disponibile");
        
        // Recupera l'installatore
        const { installatori: installatoriTable } = await import("../drizzle/schema");
        const installatore = await db.select().from(installatoriTable).where(eq(installatoriTable.id, input.installatoreId)).then(r => r[0]);
        if (!installatore) throw new Error("Installatore non trovato");
        
        // Crea l'ordine come assegnazione admin (già pagato)
        const { ordini: ordiniTable } = await import("../drizzle/schema");
        
        const pratiche_incluse_res = input.pratiche_incluse_residenziali ?? 0;
        const pratiche_incluse_bus = input.pratiche_incluse_business ?? 0;
        
        const result = await db.insert(ordiniTable).values({
          userId: ctx.user.id,
          installatoreId: input.installatoreId,
          packId: input.packId,
          nomePacchetto: input.nomePacchetto,
          prezzoResidenziale: input.prezzoResidenziale ? String(input.prezzoResidenziale) : undefined,
          prezzoBusiness: input.prezzoBusiness ? String(input.prezzoBusiness) : undefined,
          importo: String(input.importo),
          tipoOrdine: "assegnazione_admin",
          metodoPagamento: "bonifico",
          stato: "pagato",
          nomeAcquirente: installatore.ragioneSociale,
          emailAcquirente: installatore.email ?? "noemail@example.com",
          ragioneSocialeAcquirente: installatore.ragioneSociale,
          note: `[ASSEGNAZIONE ADMIN] ${input.note ?? ""}`,
          pratiche_incluse: pratiche_incluse_res + pratiche_incluse_bus,
          pratiche_incluse_residenziali: pratiche_incluse_res,
          pratiche_incluse_business: pratiche_incluse_bus,
          pratiche_usate: 0,
          pratiche_usate_residenziali: 0,
          pratiche_usate_business: 0,
          creditoTotale: String(input.importo),
          creditoResiduo: String(input.importo),
          createdAt: new Date(),
        });
        
        // Recupera l'ordine appena creato
        const ordineCreato = await db.select().from(ordiniTable).where(eq(ordiniTable.id, result.insertId)).then(r => r[0]);
        
        // Notifica l'admin
        await notifyOwner({
          title: "Pacchetto assegnato",
          content: `Pacchetto ${input.packId} assegnato a ${installatore.ragioneSociale} (€${input.importo}). Pratiche: ${pratiche_incluse_res} residenziali + ${pratiche_incluse_bus} business.`,
        });
        
        // Invia email all'installatore
        if (installatore.email) {
          try {
            const nomePackDisplay = input.nomePacchetto || `${input.packId.toUpperCase()}`;
            const emailBody = `
              <h2>Pacchetto Assegnato</h2>
              <p>Ciao ${installatore.ragioneSociale},</p>
              <p>Un pacchetto è stato assegnato al tuo account da parte dell'amministratore.</p>
              <div style="background-color: #f5f5f5; padding: 15px; border-radius: 8px; margin: 20px 0;">
                <p><strong>Pacchetto:</strong> ${nomePackDisplay}</p>
                <p><strong>Importo:</strong> €${input.importo.toFixed(2)}</p>
                ${pratiche_incluse_res > 0 ? `<p><strong>Pratiche Residenziali:</strong> ${pratiche_incluse_res}</p>` : ''}
                ${pratiche_incluse_bus > 0 ? `<p><strong>Pratiche Business:</strong> ${pratiche_incluse_bus}</p>` : ''}
                ${input.note ? `<p><strong>Note:</strong> ${input.note}</p>` : ''}
              </div>
              <p>Puoi visualizzare i dettagli accedendo al tuo portale.</p>
              <p>Grazie,<br/>Team Ricaricati</p>
            `;
            await fetch(process.env.BUILT_IN_FORGE_API_URL + '/email/send', {
              method: 'POST',
              headers: { 
                "Authorization": `Bearer ${process.env.BUILT_IN_FORGE_API_KEY}`, 
                "Content-Type": "application/json" 
              },
              body: JSON.stringify({
                to: installatore.email,
                subject: `Pacchetto Assegnato: ${input.nomePacchetto || input.packId}`,
                html: emailBody
              })
            });
          } catch (error) {
            console.error("Errore invio email assegnazione pacchetto:", error);
            // Non bloccare l'assegnazione se l'email fallisce
          }
        }
        
        return ordineCreato || { id: result.insertId, ...input, stato: "pagato", tipoOrdine: "assegnazione_admin" };
      }),

    // ─── CANCELLAZIONE PROTETTA ──────────────────────────────────────────────────
    deleteProtected: adminProcedure
      .input(z.object({
        ordineId: z.number(),
        password: z.string(),
      }))
      .mutation(async ({ input }) => {
        const db = await getDb();
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB non disponibile" });
        
        // Recupera la password dal database
        const { impostazioni } = await import("../drizzle/schema");
        const { eq } = await import("drizzle-orm");
        const configResult = await db.select().from(impostazioni).where(eq(impostazioni.chiave, "deletePassword")).limit(1);
        const config = configResult[0];
        
        if (!config || config.valore !== input.password) {
          throw new TRPCError({ code: "FORBIDDEN", message: "Password non corretta" });
        }
        
        // Cancella l'ordine
        const { ordini: ordiniTable } = await import("../drizzle/schema");
        await db.delete(ordiniTable).where(eq(ordiniTable.id, input.ordineId));
        
        return { success: true, message: "Ordine eliminato" };
      }),
  }),

  // ─── PRATICHE ──────────────────────────────────────────────────────────────
  pratiche: router({
    crea: protectedProcedure
      .input(
        z.object({
          tipologia: z.enum(["residenziale", "business"]),
          tipoIter: z.enum([
            "connessione_ordinario",
            "connessione_semplificato",
            "gse",
            "terna_gaudi",
            "enea_conto_termico",
            "dogane_officina_elettrica",
            "dogane_dichiarazione_consumo",
            "arera",
            "distribuzione",
            "progettazione",
          ]).default("connessione_semplificato"),
          potenzaKw: z.string().optional(),
          indirizzoImpianto: z.string().optional(),
          comuneImpianto: z.string().optional(),
          provinciaImpianto: z.string().optional(),
          nomeTitolare: z.string().optional(),
          note: z.string().optional(),
          // ordineId esplicito: se presente usa quell'ordine specifico (pack o singolo)
          ordineId: z.number().optional(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const installatore = await getInstallatoreByUserId(ctx.user.id);
        if (!installatore) {
          throw new TRPCError({ code: "FORBIDDEN", message: "Devi registrarti come installatore" });
        }
        if (installatore.stato !== "approvato") {
          throw new TRPCError({ code: "FORBIDDEN", message: "Il tuo account è in attesa di approvazione" });
        }
        // Validazione: l'installatore deve avere acquistato un pack o una pratica singola
        const ordini = await getOrdiniByUserId(ctx.user.id);
        const ordiniPagati = ordini.filter((o: any) => o.stato === "pagato");
        if (ordiniPagati.length === 0) {
          throw new TRPCError({ code: "FORBIDDEN", message: "Devi acquistare un pack o una pratica singola prima di creare una pratica" });
        }
        // Determina quale ordine usare per questa pratica.
        // Regola fondamentale:
        //   - connessione_ordinario e connessione_semplificato → devono usare un ordine PACK
        //   - tutti gli altri iter (GSE, Terna, ENEA, Dogane, ecc.) → devono usare un ordine SINGOLO
        const iterDaPack = isIterDaPack(input.tipoIter);
        let ordineDaScalare: any = null;

        if (input.ordineId) {
          ordineDaScalare = ordiniPagati.find((o: any) => o.id === input.ordineId);
          if (!ordineDaScalare) {
            throw new TRPCError({ code: "FORBIDDEN", message: "Ordine non trovato o non pagato" });
          }
          // Validazione coerenza iter ↔ tipo ordine
          const ordineEPack = ordineDaScalare.packId !== "singolo";
          if (iterDaPack && !ordineEPack) {
            throw new TRPCError({ code: "BAD_REQUEST", message: "Le pratiche di connessione devono essere create da un pack, non da una pratica singola" });
          }
          if (!iterDaPack && ordineEPack) {
            throw new TRPCError({ code: "BAD_REQUEST", message: "Questo tipo di pratica (GSE/Terna/ENEA/Dogane/ecc.) non può scalare il credito del pack. Acquista una pratica singola." });
          }
        } else {
          // Nessun ordineId specificato: errore — l'utente deve sempre selezionare un ordine specifico
          throw new TRPCError({ code: "BAD_REQUEST", message: "Seleziona un pack o una pratica singola per creare la pratica" });
        }
        const pratica = await createPratica({
          installatoreId: installatore.id,
          userId: ctx.user.id,
          tipologia: input.tipologia,
          tipoIter: input.tipoIter,
          statoIter: "documenti_raccolti",
          potenzaKw: input.potenzaKw,
          indirizzoImpianto: input.indirizzoImpianto,
          comuneImpianto: input.comuneImpianto,
          provinciaImpianto: input.provinciaImpianto,
          nomeTitolare: input.nomeTitolare,
          note: input.note,
          stato: "bozza",
          ordineId: ordineDaScalare.id,
        });
        // Scala il credito in euro dal pacchetto/singola specifico
        await scalaCredito(ordineDaScalare.id, input.tipologia);
        // Aggiorna anche il contatore legacy per compatibilità
        if (ordineDaScalare.packId !== "singolo") {
          await scalaPraticaDaOrdine(installatore.id, input.tipologia);
        }
        return pratica;
      }),
    mie: protectedProcedure.query(async ({ ctx }) => {
      const installatore = await getInstallatoreByUserId(ctx.user.id);
      if (!installatore) return [];
      return getPraticheByInstallatoreId(installatore.id);
    }),

    documenti: protectedProcedure
      .input(z.object({ praticaId: z.number() }))
      .query(async ({ input }) => {
        return getDocumentiByPraticaId(input.praticaId);
      }),
    getDocumentoDownloadUrl: protectedProcedure
      .input(z.object({ documentoId: z.number() }))
      .query(async ({ ctx, input }) => {
        const installatore = await getInstallatoreByUserId(ctx.user.id);
        if (!installatore) throw new TRPCError({ code: "FORBIDDEN" });
        const db = await (await import("./db")).getDb();
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
        const { documenti: documentiTable } = await import("../drizzle/schema");
        const doc = await db.select().from(documentiTable).where(eq(documentiTable.id, input.documentoId)).limit(1);
        if (!doc.length) throw new TRPCError({ code: "NOT_FOUND" });
        if (doc[0].installatoreId !== installatore.id) throw new TRPCError({ code: "FORBIDDEN" });
        const signedUrl = await storageGetSignedUrl(doc[0].storageKey);
        return { url: signedUrl };
      }),
    uploadDocumento: protectedProcedure
      .input(
        z.object({
          praticaId: z.number(),
          nomeFile: z.string(),
          tipoFile: z.string().optional(),
          categoriaDocumento: z.string().optional(),
          slotNome: z.string().optional(),
          fileBase64: z.string(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const installatore = await getInstallatoreByUserId(ctx.user.id);
        if (!installatore) throw new TRPCError({ code: "FORBIDDEN" });
        
        // Validazione: impedire agli installatori di caricare documenti del sistema
        if (input.slotNome) {
          const db = await getDb();
          if (db) {
            const pratica = await db.select().from(pratiche).where(eq(pratiche.id, input.praticaId)).limit(1);
            if (pratica.length > 0) {
              const tipoIter = pratica[0].tipoIter || "";
              const configDoc = await getConfigDocumento(tipoIter, input.slotNome || "", installatore.id);
              if (configDoc?.responsabileInserimento === "sistema") {
                throw new TRPCError({ code: "FORBIDDEN", message: "Non puoi caricare questo documento. Deve essere inserito dal sistema." });
              }
            }
          }
        }
        
        const buffer = Buffer.from(input.fileBase64, "base64");
        const key = `pratiche/${installatore.id}/${input.praticaId}/${Date.now()}_${input.nomeFile}`;
        const { url } = await storagePut(key, buffer, input.tipoFile ?? "application/octet-stream");
        await createDocumento({
          praticaId: input.praticaId,
          installatoreId: installatore.id,
          nomeFile: input.nomeFile,
          tipoFile: input.tipoFile,
          categoriaDocumento: input.categoriaDocumento,
          slotNome: input.slotNome,
          storageKey: key,
          storageUrl: url,
        });
        // ─── NOTIFICA ADMIN: controlla se tutti i documenti obbligatori sono caricati ───
        try {
          const db2 = await getDb();
          if (db2) {
            const praticaRows = await db2.select().from(pratiche).where(eq(pratiche.id, input.praticaId)).limit(1);
            if (praticaRows.length > 0) {
              const pratica = praticaRows[0];
              const tipoIter = pratica.tipoIter || "";
              const configDocs = await getConfigDocumentiByIter(tipoIter, installatore.id);
              const obbligatori = configDocs.filter((c: any) => c.importanza === "obbligatorio" || c.obbligatorio === true);
              if (obbligatori.length > 0) {
                const docCaricati = await getDocumentiByPraticaId(input.praticaId);
                const slotCaricati = new Set(docCaricati.map((d: any) => d.slotNome).filter(Boolean));
                const tuttiCaricati = obbligatori.every((c: any) => slotCaricati.has(c.nomeDocumenti));
                if (tuttiCaricati) {
                  await notifyOwner({
                    title: `✅ Documenti completi — Pratica #${input.praticaId}`,
                    content: `Tutti i documenti obbligatori della pratica #${input.praticaId} (${pratica.nomeTitolare || "N/A"}, ${pratica.tipoIter || ""}) sono stati caricati dall'installatore ${installatore.ragioneSociale}. La pratica è pronta per la revisione.`,
                  });
                }
              }
            }
          }
        } catch (_notifyErr) {
          // Non bloccare il caricamento se la notifica fallisce
        }
        return { success: true, url };
      }),

    invia: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ ctx, input }) => {
        // Verifica che l'installatore abbia un pack attivo
        const installatore = await getInstallatoreByUserId(ctx.user.id);
        if (!installatore) {
          throw new TRPCError({ code: "FORBIDDEN", message: "Devi registrarti come installatore" });
        }
        const hasPack = await hasPackAttivo(installatore.id);
        if (!hasPack) {
          throw new TRPCError({ code: "FORBIDDEN", message: "Devi acquistare un pack per inviare pratiche" });
        }
        await updatePraticaStato(input.id, "inviata");
        return { success: true };
      }),

    tutte: adminProcedure.query(async () => {
      return getAllPratiche();
    }),

    aggiornaStato: adminProcedure
      .input(
        z.object({
          id: z.number(),
          stato: z.enum(["bozza", "inviata", "in_lavorazione", "completata", "rifiutata"]),
          noteAdmin: z.string().optional(),
          statoIter: z.string().optional(),
        })
      )
      .mutation(async ({ input }) => {
        await updatePraticaStato(input.id, input.stato, input.noteAdmin, input.statoIter);
        return { success: true };
      }),

    // Admin: crea pratica manualmente
    creaAdmin: adminProcedure
      .input(
        z.object({
          installatoreId: z.number(),
          ordineid: z.number().optional(),
          tipologia: z.enum(["residenziale", "business"]),
          tipoIter: z.enum([
            "connessione_ordinario",
            "connessione_semplificato",
            "gse",
            "terna_gaudi",
            "enea_conto_termico",
            "dogane_officina_elettrica",
            "dogane_dichiarazione_consumo",
            "arera",
            "distribuzione",
            "progettazione",
          ]).default("connessione_semplificato"),
          statoIter: z.string().optional(),
          potenzaKw: z.string().optional(),
          indirizzoImpianto: z.string().optional(),
          comuneImpianto: z.string().optional(),
          provinciaImpianto: z.string().optional(),
          nomeTitolare: z.string().optional(),
          note: z.string().optional(),
          stato: z.enum(["bozza", "inviata", "in_lavorazione", "completata", "rifiutata"]).default("inviata"),
          scalaPack: z.boolean().default(true),
        })
      )
      .mutation(async ({ input }) => {
        const { scalaPack, ordineid, ...praticaData } = input;
        const pratica = await createPraticaAdmin({
          ...praticaData,
          ordineId: ordineid,
          userId: 0,
          statoIter: praticaData.statoIter ?? "documenti_raccolti",
        });
        if (scalaPack) {
          await scalaPraticaDaOrdine(input.installatoreId, input.tipologia);
        }
        return pratica;
      }),

    // Admin: modifica pratica
    modificaAdmin: adminProcedure
      .input(
        z.object({
          id: z.number(),
          tipologia: z.enum(["residenziale", "business"]).optional(),
          tipoIter: z.enum([
            "connessione_ordinario",
            "connessione_semplificato",
            "gse",
            "terna_gaudi",
            "enea_conto_termico",
            "dogane_officina_elettrica",
            "dogane_dichiarazione_consumo",
            "arera",
            "distribuzione",
            "progettazione",
          ]).optional(),
          statoIter: z.string().optional(),
          potenzaKw: z.string().optional(),
          indirizzoImpianto: z.string().optional(),
          comuneImpianto: z.string().optional(),
          provinciaImpianto: z.string().optional(),
          nomeTitolare: z.string().optional(),
          note: z.string().optional(),
          noteAdmin: z.string().optional(),
          stato: z.enum(["bozza", "inviata", "in_lavorazione", "completata", "rifiutata"]).optional(),
        })
      )
      .mutation(async ({ input }) => {
        const { id, ...data } = input;
        await updatePratica(id, data);
        return { success: true };
      }),

    // Admin: elimina pratica
    eliminaAdmin: adminProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        await deletePratica(input.id);
        return { success: true };
      }),
    // Installatore: aggiorna statoIter della pratica (passa allo step successivo)
    aggiornaStatoIter: protectedProcedure
      .input(
        z.object({
          praticaId: z.number(),
          nuovoStatoIter: z.string(),
        })
      )
      .mutation(async ({ input, ctx }) => {
        const pratiche = await getPraticheByInstallatoreId(ctx.user.id);
        const pratica = pratiche.find(p => p.id === input.praticaId);
        if (!pratica) throw new TRPCError({ code: "NOT_FOUND", message: "Pratica non trovata" });
        if (pratica.tipoIter && ITER_DEFINIZIONI[pratica.tipoIter as TipoIter]) {
          const def = ITER_DEFINIZIONI[pratica.tipoIter as TipoIter];
          const stepCorrente = def.steps.find(s => s.id === pratica.statoIter);
          const prossimo = def.steps.find(s => s.id === input.nuovoStatoIter);
          if (!stepCorrente || !prossimo) throw new TRPCError({ code: "BAD_REQUEST", message: "Step non valido" });
          // Verifica documenti obbligatori dello step corrente
          if (stepCorrente.documentiConPriorita) {
            const obbligatori = stepCorrente.documentiConPriorita.filter((d: any) => d.priorita === "obbligatorio");
            // TODO: Implementare query per verificare documenti caricati
            const documentiCaricati: string[] = [];
            const mancanti = obbligatori.filter((d: any) => !documentiCaricati.includes(d.nome));
            if (mancanti.length > 0) {
              throw new TRPCError({ code: "BAD_REQUEST", message: `Documenti obbligatori mancanti: ${mancanti.map((d: any) => d.nome).join(", ")}` });
            }
          }
        }
        await updatePraticaStato(input.praticaId, pratica.stato, undefined, input.nuovoStatoIter);
        return { success: true };
      }),

    // ─── CANCELLAZIONE PROTETTA ──────────────────────────────────────────────────
    deleteProtected: adminProcedure
      .input(z.object({
        praticaId: z.number(),
        password: z.string(),
      }))
      .mutation(async ({ input }) => {
        const db = await getDb();
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB non disponibile" });
        
        // Recupera la password dal database
        const { impostazioni } = await import("../drizzle/schema");
        const { eq } = await import("drizzle-orm");
        const configResult = await db.select().from(impostazioni).where(eq(impostazioni.chiave, "deletePassword")).limit(1);
        const config = configResult[0];
        
        if (!config || config.valore !== input.password) {
          throw new TRPCError({ code: "FORBIDDEN", message: "Password non corretta" });
        }
        
        // Cancella la pratica
        const { pratiche: practicheTable } = await import("../drizzle/schema");
        await db.delete(practicheTable).where(eq(practicheTable.id, input.praticaId));
        
        return { success: true, message: "Pratica eliminata" };
      }),
  }),

  // ─── DOCUMENTI ─────────────────────────────────────────────────────────────
  documenti: router({
    eliminaAdmin: adminProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        await deleteDocumento(input.id);
        return { success: true };
      }),
    // Ottieni configurazione documenti per un iter (per installatori)
    configPerIter: protectedProcedure
      .input(z.object({ tipoIter: z.string() }))
      .query(async ({ ctx, input }) => {
        const installatore = await getInstallatoreByUserId(ctx.user.id);
        return getConfigDocumentiByIter(input.tipoIter, installatore?.id);
      }),
    // Admin: revisiona un documento (approva/rifiuta con nota)
    revisionaDocumento: adminProcedure
      .input(z.object({
        id: z.number(),
        statoRevisione: z.enum(["in_attesa", "approvato", "rifiutato"]),
        notaRevisione: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        await updateDocumentoRevisione(input.id, input.statoRevisione, input.notaRevisione ?? null);
        // Notifica all'installatore
        try {
          const db = await getDb();
          if (db) {
            const { documenti: documentiTable, pratiche: praticheTable, installatori: installatoriTable } = await import("../drizzle/schema");
            const { eq } = await import("drizzle-orm");
            const [doc] = await db.select().from(documentiTable).where(eq(documentiTable.id, input.id));
            if (doc) {
              const [pratica] = await db.select().from(praticheTable).where(eq(praticheTable.id, doc.praticaId));
              const [installatore] = await db.select().from(installatoriTable).where(eq(installatoriTable.id, doc.installatoreId));
              const statoLabel = input.statoRevisione === 'approvato' ? '✓ Approvato' : '✗ Rifiutato';
              const notaStr = input.notaRevisione ? ` — Nota: ${input.notaRevisione}` : '';
              // Notifica owner con dettagli
              await notifyOwner({
                title: `Documento revisionato: ${statoLabel}`,
                content: `Documento "${doc.slotNome || doc.nomeFile}" per Pratica #${doc.praticaId} (${pratica?.nomeTitolare || 'N/A'}) — Installatore: ${installatore?.ragioneSociale || 'N/A'}${notaStr}`,
              });
            }
          }
        } catch (e) { /* non bloccare la revisione */ }
        return { success: true };
      }),
    creaAdmin: adminProcedure
      .input(z.object({ nome: z.string().min(3), descrizione: z.string().optional(), stato: z.enum(["obbligatorio", "opzionale", "consigliato"]), ordine: z.number().default(0) }))
      .mutation(async ({ input }) => {
        const db = await getDb();
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB non disponibile" });
        const result = await db.insert(adminDocuments).values({ nome: input.nome, descrizione: input.descrizione, stato: input.stato, ordine: input.ordine, attivo: true });
        const allInstallatori = await getAllInstallatori();
        for (const inst of allInstallatori) {
          await db.insert(installatoreDocuments).values({ installatoreId: inst.id, adminDocumentId: Number(result.insertId), statoCompilazione: "da_compilare" });
        }
        return { success: true, id: result.insertId };
      }),
    listaAdmin: adminProcedure.query(async () => { const db = await getDb(); if (!db) return []; return db.select().from(adminDocuments).orderBy(adminDocuments.ordine); }),
    miei: protectedProcedure.query(async ({ ctx }) => { const db = await getDb(); if (!db) return { daCompilare: [], ricevuti: [] }; const installatore = await getInstallatoreByUserId(ctx.user.id); if (!installatore) return { daCompilare: [], ricevuti: [] }; const docs = await db.select({ id: installatoreDocuments.id, nome: adminDocuments.nome, descrizione: adminDocuments.descrizione, stato: adminDocuments.stato, fileUrl: installatoreDocuments.fileUrl, statoCompilazione: installatoreDocuments.statoCompilazione }).from(installatoreDocuments).innerJoin(adminDocuments, eq(installatoreDocuments.adminDocumentId, adminDocuments.id)).where(eq(installatoreDocuments.installatoreId, installatore.id)).orderBy(adminDocuments.ordine); return { daCompilare: docs.filter(d => d.statoCompilazione === "da_compilare"), ricevuti: docs.filter(d => d.statoCompilazione === "compilato") }; })
  }),

  // ─── PACK / CONTATORE ──────────────────────────────────────────────────────
  pack: router({
    mioRiepilogo: protectedProcedure.query(async ({ ctx }) => {
      const installatore = await getInstallatoreByUserId(ctx.user.id);
      if (!installatore) return null;
      return getPackRiepilogo(installatore.id);
    }),

    // Restituisce tutti gli ordini pagati con credito residuo (per slot separati nel Dashboard)
    mioiOrdiniConCredito: protectedProcedure.query(async ({ ctx }) => {
      const installatore = await getInstallatoreByUserId(ctx.user.id);
      if (!installatore) return [];
      const db = await import("./db").then(m => m.getDb());
      if (!db) return [];
      const { ordini: ordiniTable } = await import("../drizzle/schema");
      const { eq, and, ne, desc } = await import("drizzle-orm");
      const tuttiOrdini = await db
        .select()
        .from(ordiniTable)
        .where(and(
          eq(ordiniTable.installatoreId, installatore.id),
          eq(ordiniTable.stato, "pagato")
        ))
        .orderBy(desc(ordiniTable.createdAt));
      return tuttiOrdini.map((o: any) => ({
        id: o.id,
        packId: o.packId,
        importo: o.importo,
        creditoTotale: (parseFloat(o.creditoTotale) > 0) ? parseFloat(o.creditoTotale) : (CREDITO_PER_PACK[o.packId] || parseFloat(o.importo) || 0),
        creditoResiduo: (parseFloat(o.creditoResiduo) > 0 || o.creditoResiduo === '0.00') ? parseFloat(o.creditoResiduo) : null,
        pratiche_usate: o.pratiche_usate || 0,
        pratiche_usate_residenziali: o.pratiche_usate_residenziali || 0,
        pratiche_usate_business: o.pratiche_usate_business || 0,
        nomeAcquirente: o.nomeAcquirente,
        createdAt: o.createdAt,
        isSingolo: o.packId === "singolo",
        prezzoResidenziale: o.packId !== "singolo"
          ? (o.prezzoResidenziale ? parseFloat(o.prezzoResidenziale) : (PREZZO_RES_PER_PACK[o.packId] || 0))
          : parseFloat(o.importo) || 0,
        prezzoBusiness: o.packId !== "singolo"
          ? (o.prezzoBusiness ? parseFloat(o.prezzoBusiness) : (PREZZO_BUS_PER_PACK[o.packId] || 0))
          : parseFloat(o.importo) || 0,
        nomePacchetto: o.nomePacchetto || null,
      }));
    }),

    riepilogoInstallatore: adminProcedure
      .input(z.object({ installatoreId: z.number() }))
      .query(async ({ input }) => {
        return getPackRiepilogo(input.installatoreId);
      }),

    // Installatore: applica credito promo a un pacchetto acquistato
    applicaCreditoAOrdine: protectedProcedure
      .input(z.object({
        ordineId: z.number(),
        importo: z.number().min(1),
      }))
      .mutation(async ({ ctx, input }) => {
        const installatore = await getInstallatoreByUserId(ctx.user.id);
        if (!installatore) throw new TRPCError({ code: "NOT_FOUND", message: "Profilo installatore non trovato" });
        const db = await getDb();
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB non disponibile" });
        const { ordini: ordiniTable, installatori: installatoriTable } = await import("../drizzle/schema");
        const { eq, and, sql } = await import("drizzle-orm");
        // Verifica che l'ordine appartenga all'installatore
        const ordineResult = await db.select().from(ordiniTable).where(and(
          eq(ordiniTable.id, input.ordineId),
          eq(ordiniTable.installatoreId, installatore.id)
        )).limit(1);
        if (!ordineResult.length) throw new TRPCError({ code: "NOT_FOUND", message: "Ordine non trovato" });
        const ordine = ordineResult[0];
        if (ordine.stato !== "pagato") throw new TRPCError({ code: "BAD_REQUEST", message: "L'ordine deve essere pagato" });
        // Verifica che il credito promo sia sufficiente
        const creditoDisponibile = parseFloat(installatore.creditoResiduo as string) || 0;
        if (creditoDisponibile < input.importo) throw new TRPCError({ code: "BAD_REQUEST", message: `Credito promo insufficiente. Disponibile: €${creditoDisponibile.toFixed(2)}` });
        // Scala il credito promo dall'installatore
        await db.update(installatoriTable)
          .set({ creditoResiduo: sql`${installatoriTable.creditoResiduo} - ${input.importo}` })
          .where(eq(installatoriTable.id, installatore.id));
        // Aggiunge il credito al creditoResiduo dell'ordine
        const creditoOrdineAttuale = parseFloat(ordine.creditoResiduo as string) || 0;
        const creditoTotaleOrdineAttuale = parseFloat(ordine.creditoTotale as string) || 0;
        const nuovoCreditoResiduo = creditoOrdineAttuale + input.importo;
        const nuovoCreditoTotale = creditoTotaleOrdineAttuale + input.importo;
        await db.update(ordiniTable)
          .set({
            creditoResiduo: String(nuovoCreditoResiduo),
            creditoTotale: String(nuovoCreditoTotale),
          })
          .where(eq(ordiniTable.id, input.ordineId));
        return {
          success: true,
          creditoPromoRimanente: creditoDisponibile - input.importo,
          nuovoCreditoOrdine: nuovoCreditoResiduo,
        };
      }),
  }),

  // ─── RICARICHE ─────────────────────────────────────────────────────────────
  ricariche: router({
    mie: protectedProcedure.query(async ({ ctx }) => {
      const installatore = await getInstallatoreByUserId(ctx.user.id);
      if (!installatore) return [];
      return getRicaricheByInstallatoreId(installatore.id);
    }),
  }),

  // ─── STATISTICHE ADMIN ─────────────────────────────────────────────────────
  admin: router({
    statistiche: adminProcedure.query(async () => {
      return getStatisticheAdmin();
    }),

    clientiInattivi: adminProcedure
      .input(z.object({ giorniSoglia: z.number().optional() }).optional())
      .query(async ({ input }) => {
        return getClientiInattivi(input?.giorniSoglia ?? 30);
      }),

    inviaAlertClientiInattivi: adminProcedure
      .input(z.object({ giorniSoglia: z.number().optional() }).optional())
      .mutation(async ({ input }) => {
        const inattivi = await getClientiInattivi(input?.giorniSoglia ?? 30);
        if (!inattivi.length) return { inviato: false, count: 0 };
        const lista = inattivi.map(i =>
          `• ${i.installatore.ragioneSociale} — inattivo da ${i.giorniInattivo} giorni (ultima pratica: ${i.ultimaPratica ? new Date(i.ultimaPratica).toLocaleDateString("it-IT") : "mai"})`
        ).join("\n");
        await notifyOwner({
          title: `⚠️ ${inattivi.length} clienti inattivi da 30+ giorni`,
          content: `I seguenti clienti attivi non hanno creato pratiche negli ultimi ${input?.giorniSoglia ?? 30} giorni:\n\n${lista}`,
        });
        return { inviato: true, count: inattivi.length };
      }),
    documenti: adminProcedure.query(async () => {
      return getAllDocumenti();
    }),

    // DEBUG: Vedi tutte le bollette con installatoreId
    tutteLeBottette: adminProcedure.query(async () => {
      const db = await getDb();
      if (!db) return [];
      return db.select().from(premiBollette).orderBy(desc(premiBollette.createdAt));
    }),

    packAcquistati: adminProcedure
      .input(z.object({ installatoreId: z.number() }))
      .query(async ({ input }) => {
        return getPackAcquistatiByInstallatore(input.installatoreId);
      }),

    ricaricaCredito: adminProcedure
      .input(z.object({
        installatoreId: z.number(),
        importo: z.number().positive(),
        motivo: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        const inst = await getInstallatoreById(input.installatoreId);
        if (!inst) throw new TRPCError({ code: "NOT_FOUND", message: "Installatore non trovato" });
        const nuovoCreditoResiduo = parseFloat(inst.creditoResiduo) + input.importo;
        const nuovoCreditoTotale = parseFloat(inst.creditoTotale) + input.importo;
        await updateInstallatore(input.installatoreId, {
          creditoResiduo: nuovoCreditoResiduo.toString(),
          creditoTotale: nuovoCreditoTotale.toString(),
        });
        await notifyOwner({
          title: `💰 Credito ricaricato per ${inst.ragioneSociale}`,
          content: `Importo: €${input.importo}\nMotivo: ${input.motivo || "Non specificato"}\nNuovo saldo: €${nuovoCreditoResiduo}`,
        });
        return { success: true, nuovoCreditoResiduo, nuovoCreditoTotale };
      }),

    // ─── SOGLIA PACK OMAGGIO ─────────────────────────────────────────────────
    setSogliaPackOmaggio: adminProcedure
      .input(z.object({
        installatoreId: z.number(),
        soglia: z.number().positive(),
      }))
      .mutation(async ({ input }) => {
        const inst = await getInstallatoreById(input.installatoreId);
        if (!inst) throw new TRPCError({ code: "NOT_FOUND", message: "Installatore non trovato" });
        await updateInstallatore(input.installatoreId, {
          sogliaPackOmaggio: input.soglia.toString(),
          packOmaggioNotificato: false, // reset notifica se si cambia soglia
        });
        return { success: true };
      }),

    // ─── BACKUP COMPLETO ────────────────────────────────────────────────────
    esportaBackup: adminProcedure.query(async () => {
      const db = await getDb();
      const [installatori, ordini, pratiche, documenti] = await Promise.all([
        getAllInstallatori(),
        getAllOrdini(),
        getAllPratiche(),
        getAllDocumenti(),
      ]);
      // Esporta anche tabelle di configurazione per un backup completo
      let users: any[] = [];
      let configDocumenti: any[] = [];
      let packConfigurazione: any[] = [];
      let promoInstallatore: any[] = [];
      let impostazioni: any[] = [];
      let configStepIter: any[] = [];
      if (db) {
        try {
          const schema = await import("../drizzle/schema");
          [users, configDocumenti, packConfigurazione, promoInstallatore, impostazioni] = await Promise.all([
            db.select().from(schema.users),
            db.select().from(schema.configDocumenti),
            db.select().from(schema.packConfigurazione),
            schema.promoInstallatore ? db.select().from(schema.promoInstallatore) : Promise.resolve([]),
            schema.impostazioni ? db.select().from(schema.impostazioni) : Promise.resolve([]),
          ]);
          // Config step iter (usa config_documenti con prefisso _STEP_)
          const { like } = await import("drizzle-orm");
          configStepIter = await db.select().from(schema.configDocumenti).where(like(schema.configDocumenti.nomeDocumenti, "_STEP_%"));
        } catch (_) {}
      }
      return {
        versione: "2.0",
        dataEsportazione: new Date().toISOString(),
        sito: "Ricaricati di Connessioni",
        note: "Backup completo: dati + configurazioni. I file caricati (PDF, immagini) sono sullo storage Manus e NON sono inclusi qui.",
        // Dati principali
        installatori,
        ordini,
        pratiche,
        documenti,
        // Configurazioni
        users,
        configDocumenti,
        packConfigurazione,
        promoInstallatore,
        impostazioni,
      };
    }),

    // ─── BACKUP CONFIG ──────────────────────────────────────────────────────
    getBackupConfig: adminProcedure.query(async () => {
      return getBackupConfig();
    }),

    aggiornaBackupConfig: adminProcedure
      .input(z.object({
        frequenza: z.enum(["giornaliero", "settimanale", "mensile"]),
        attivo: z.boolean(),
      }))
      .mutation(async ({ input }) => {
        await upsertBackupConfig(input);
        return { success: true };
      }),

    // ─── STORICO BACKUP ─────────────────────────────────────────────────────
    storicoBackup: adminProcedure.query(async () => {
      return getBackupStorico();
    }),

    // ─── SALVA BACKUP SU STORAGE ────────────────────────────────────────────
    salvaBackupStorage: adminProcedure
      .input(z.object({ tipo: z.enum(["manuale", "automatico"]).default("manuale") }))
      .mutation(async ({ input }) => {
        const db2 = await getDb();
        const [installatori, ordini, pratiche, documenti] = await Promise.all([
          getAllInstallatori(),
          getAllOrdini(),
          getAllPratiche(),
          getAllDocumenti(),
        ]);
        let users: any[] = [], configDocumenti2: any[] = [], packConf: any[] = [], promo: any[] = [], impost: any[] = [];
        if (db2) {
          try {
            const schema2 = await import("../drizzle/schema");
            [users, configDocumenti2, packConf, promo, impost] = await Promise.all([
              db2.select().from(schema2.users),
              db2.select().from(schema2.configDocumenti),
              db2.select().from(schema2.packConfigurazione),
              schema2.promoInstallatore ? db2.select().from(schema2.promoInstallatore) : Promise.resolve([]),
              schema2.impostazioni ? db2.select().from(schema2.impostazioni) : Promise.resolve([]),
            ]);
          } catch (_) {}
        }
        const backupData = {
          versione: "2.0",
          dataEsportazione: new Date().toISOString(),
          sito: "Ricaricati di Connessioni",
          note: "Backup completo: dati + configurazioni. I file caricati (PDF, immagini) sono sullo storage Manus.",
          installatori,
          ordini,
          pratiche,
          documenti,
          users,
          configDocumenti: configDocumenti2,
          packConfigurazione: packConf,
          promoInstallatore: promo,
          impostazioni: impost,
        };
        const json = JSON.stringify(backupData, null, 2);
        const bytes = Buffer.from(json, "utf-8");
        const key = `backups/ricaricati-backup-${new Date().toISOString().slice(0, 19).replace(/:/g, "-")}-${input.tipo}.json`;
        const { url } = await storagePut(key, bytes, "application/json");
        await createBackupStorico({
          storageKey: key,
          storageUrl: url,
          dimensioneBytes: bytes.length,
          stato: "completato",
          tipo: input.tipo,
        });
        // Aggiorna ultimo backup nella config
        const config = await getBackupConfig();
        if (config) {
          await upsertBackupConfig({ frequenza: config.frequenza, attivo: config.attivo });
        }
        return { success: true, url, dimensioneBytes: bytes.length };
      }),

    // ─── GESTIONE PACK (ADMIN) ────────────────────────────────────────────────
    listaPack: adminProcedure.query(async () => {
      // Restituisce i 3 pack fissi con statistiche ordini
      const ordini = await getAllOrdini();
      const pack1Ordini = ordini.filter((o: any) => o.packId === "pack1");
      const pack2Ordini = ordini.filter((o: any) => o.packId === "pack2");
      const pack3Ordini = ordini.filter((o: any) => o.packId === "pack3");
      return [
        { id: "pack1", nome: "Pack 1", prezzo: 2000, pratiche_incluse: PRATICHE_PER_PACK.pack1, pratiche_res: PRATICHE_RES_PER_PACK.pack1, pratiche_bus: PRATICHE_BUS_PER_PACK.pack1, ordini_totali: pack1Ordini.length, ordini_confermati: pack1Ordini.filter((o: any) => o.stato === "pagato").length },
        { id: "pack2", nome: "Pack 2", prezzo: 3150, pratiche_incluse: PRATICHE_PER_PACK.pack2, pratiche_res: PRATICHE_RES_PER_PACK.pack2, pratiche_bus: PRATICHE_BUS_PER_PACK.pack2, ordini_totali: pack2Ordini.length, ordini_confermati: pack2Ordini.filter((o: any) => o.stato === "pagato").length },
        { id: "pack3", nome: "Pack 3", prezzo: 5100, pratiche_incluse: PRATICHE_PER_PACK.pack3, pratiche_res: PRATICHE_RES_PER_PACK.pack3, pratiche_bus: PRATICHE_BUS_PER_PACK.pack3, ordini_totali: pack3Ordini.length, ordini_confermati: pack3Ordini.filter((o: any) => o.stato === "pagato").length },
      ];
    }),

    ripristinaBackup: adminProcedure
      .input(z.object({
        backupJson: z.string().min(10),
      }))
      .mutation(async ({ input }) => {
        let data: any;
        try {
          data = JSON.parse(input.backupJson);
        } catch {
          throw new TRPCError({ code: "BAD_REQUEST", message: "File JSON non valido" });
        }
        if (!data.versione || !data.installatori) {
          throw new TRPCError({ code: "BAD_REQUEST", message: "Formato backup non riconosciuto" });
        }
        const db = await (await import("./db")).getDb();
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database non disponibile" });
        const { installatori: instSchema, ordini: ordiniSchema, pratiche: praticheSchema, documenti: documentiSchema } = await import("../drizzle/schema");
        let errori: string[] = [];
        let contatori = { installatori: 0, ordini: 0, pratiche: 0, documenti: 0 };
        // Ripristina installatori
        for (const inst of (data.installatori ?? [])) {
          const { id, createdAt, updatedAt, ...rest } = inst;
          try {
            await db.insert(instSchema).values({ ...rest, createdAt: new Date(createdAt), updatedAt: new Date(updatedAt) }).onDuplicateKeyUpdate({ set: rest });
            contatori.installatori++;
          } catch (e: any) { errori.push(`Installatore ${rest.ragioneSociale}: ${e?.message ?? e}`); }
        }
        // Ripristina ordini
        for (const ord of (data.ordini ?? [])) {
          const { id, createdAt, updatedAt, ...rest } = ord;
          try {
            await db.insert(ordiniSchema).values({ ...rest, createdAt: new Date(createdAt), updatedAt: new Date(updatedAt) }).onDuplicateKeyUpdate({ set: rest });
            contatori.ordini++;
          } catch (e: any) { errori.push(`Ordine: ${e?.message ?? e}`); }
        }
        // Ripristina pratiche
        for (const prat of (data.pratiche ?? [])) {
          const { id, createdAt, updatedAt, ...rest } = prat;
          try {
            await db.insert(praticheSchema).values({ ...rest, createdAt: new Date(createdAt), updatedAt: new Date(updatedAt) }).onDuplicateKeyUpdate({ set: rest });
            contatori.pratiche++;
          } catch (e: any) { errori.push(`Pratica: ${e?.message ?? e}`); }
        }
        // Ripristina documenti (solo metadati DB, i file S3 sono già in storage)
        for (const doc of (data.documenti ?? [])) {
          const { id, createdAt, ...rest } = doc;
          try {
            await db.insert(documentiSchema).values({ ...rest, createdAt: new Date(createdAt) }).onDuplicateKeyUpdate({ set: rest });
            contatori.documenti++;
          } catch (e: any) { errori.push(`Documento ${rest.nomeFile}: ${e?.message ?? e}`); }
        }
        // Ripristina configurazioni se presenti (versione 2.0+)
        let contatoreConfig = 0;
        if (data.configDocumenti?.length) {
          const { configDocumenti: cfgDoc } = await import("../drizzle/schema");
          for (const cfg of data.configDocumenti) {
            const { id, createdAt, updatedAt, ...rest } = cfg;
            try {
              await db.insert(cfgDoc).values({ ...rest, createdAt: new Date(createdAt), updatedAt: new Date(updatedAt) }).onDuplicateKeyUpdate({ set: rest });
              contatoreConfig++;
            } catch (_) {}
          }
        }
        if (data.packConfigurazione?.length) {
          const { packConfigurazione: pkCfg } = await import("../drizzle/schema");
          for (const pk of data.packConfigurazione) {
            const { id, createdAt, updatedAt, ...rest } = pk;
            try {
              await db.insert(pkCfg).values({ ...rest, createdAt: new Date(createdAt), updatedAt: new Date(updatedAt) }).onDuplicateKeyUpdate({ set: rest });
              contatoreConfig++;
            } catch (_) {}
          }
        }
        if (data.users?.length) {
          const { users: usersSchema } = await import("../drizzle/schema");
          for (const u of data.users) {
            const { id, createdAt, updatedAt, ...rest } = u;
            try {
              await db.insert(usersSchema).values({ ...rest, createdAt: new Date(createdAt), updatedAt: new Date(updatedAt) }).onDuplicateKeyUpdate({ set: rest });
            } catch (_) {}
          }
        }
        const messaggio = `Ripristino completato: ${contatori.installatori} installatori, ${contatori.ordini} ordini, ${contatori.pratiche} pratiche, ${contatori.documenti} documenti${contatoreConfig > 0 ? `, ${contatoreConfig} configurazioni` : ""}.${errori.length > 0 ? ` (${errori.length} errori: ${errori.slice(0,3).join("; ")})` : ""}`;
        return { success: true, messaggio, errori };
      }),
    // Configurazione ordine documenti per iter
    // Associa userId alle pratiche senza user ID (collega automaticamente)
    associaUserIdAPratica: adminProcedure
      .mutation(async () => {
        const db = await getDb();
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
        const { ordini: ordiniTable, pratiche: praticheTable } = await import("../drizzle/schema");
        const { isNull, eq } = await import("drizzle-orm");
        
        // Trova tutte le pratiche senza installatoreId
        const praticheOrfane = await db.select().from(praticheTable).where(isNull(praticheTable.installatoreId));
        
        let aggiornati = 0;
        for (const pratica of praticheOrfane) {
          // Trova l'ordine correlato
          const ordineResult = await db.select().from(ordiniTable).where(eq(ordiniTable.id, pratica.ordineId)).limit(1);
          const ordine = ordineResult[0];
          if (ordine && ordine.installatoreId) {
            // Aggiorna la pratica con l'installatoreId dell'ordine
            await db.update(praticheTable)
              .set({ installatoreId: ordine.installatoreId })
              .where(eq(praticheTable.id, pratica.id));
            aggiornati++;
          }
        }
        
        return { success: true, message: `${aggiornati} pratiche aggiornate` };
      }),
    getConfigDocumenti: adminProcedure
      .input(z.object({ tipoIter: z.string() }))
      .query(async ({ input }) => {
        return getConfigDocumentiByIter(input.tipoIter);
      }),
    upsertConfigDocumento: adminProcedure
      .input(z.object({
        tipoIter: z.string(),
        nomeDocumenti: z.string(),
        nomeDocumentiOriginale: z.string().optional(),
        ordine: z.number().nullable().optional(),
        obbligatorio: z.boolean().optional(),
        importanza: z.enum(["obbligatorio", "consigliato", "opzionale"]).optional(),
        responsabileInserimento: z.enum(["sistema", "installatore"]).optional(),
        note: z.string().nullable().optional(),
      }))
      .mutation(async ({ input }) => {
        // Sincronizza obbligatorio con importanza
        const importanza = input.importanza ?? (input.obbligatorio ? "obbligatorio" : "opzionale");
        const obbligatorio = importanza === "obbligatorio";
        return upsertConfigDocumento({
          tipoIter: input.tipoIter,
          nomeDocumenti: input.nomeDocumenti,
          nomeDocumentiOriginale: input.nomeDocumentiOriginale,
          ordine: input.ordine ?? 0,
          obbligatorio,
          importanza,
          responsabileInserimento: (input.responsabileInserimento ?? "installatore") as "sistema" | "installatore",
          note: input.note ?? null,
        });
      }),
    deleteConfigDocumento: adminProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        return deleteConfigDocumento(input.id);
      }),
    createConfigDocumento: adminProcedure
      .input(z.object({
        tipoIter: z.string(),
        nomeDocumenti: z.string(),
        ordine: z.number().nullable().optional(),
        importanza: z.enum(["obbligatorio", "consigliato", "opzionale"]).optional(),
        responsabileInserimento: z.enum(["sistema", "installatore"]).optional(),
        note: z.string().nullable().optional(),
      }))
      .mutation(async ({ input }) => {
        const importanza = input.importanza ?? "consigliato";
        return upsertConfigDocumento({
          tipoIter: input.tipoIter,
          nomeDocumenti: input.nomeDocumenti,
          ordine: input.ordine ?? 0,
          obbligatorio: importanza === "obbligatorio",
          importanza,
          responsabileInserimento: (input.responsabileInserimento ?? "installatore") as "sistema" | "installatore",
          note: input.note ?? null,
        });
      }),
  }),
  // ─── IMPOSTAZIONI GLOBALI ──────────────────────────────────────────────────────────────────────────────
  impostazioni: router({
    get: publicProcedure
      .input(z.object({ chiave: z.string() }))
      .query(async ({ input }) => {
        const dbConn = await getDb();
        if (!dbConn) return null;
        const row = await dbConn.select().from(impostazioni).where(eq(impostazioni.chiave, input.chiave)).limit(1);
        return row[0]?.valore ?? null;
      }),
    set: adminProcedure
      .input(z.object({ chiave: z.string(), valore: z.string(), descrizione: z.string().optional() }))
      .mutation(async ({ input }) => {
        const dbConn = await getDb();
        if (!dbConn) throw new Error("DB non disponibile");
        await dbConn.insert(impostazioni)
          .values({ chiave: input.chiave, valore: input.valore, descrizione: input.descrizione ?? null })
          .onDuplicateKeyUpdate({ set: { valore: input.valore } });
        return { ok: true };
      }),
  }),
  // ─── PROSPECT INSTALLATORII ──────────────────────────────────────────────────────────────────────────────
  prospectInstallatori: router({
    lista: adminProcedure
      .input(z.object({
        regione: z.string().optional(),
        provincia: z.string().optional(),
        settore: z.string().optional(),
        fasciaFatturato: z.string().optional(),
        statoContatto: z.string().optional(),
        q: z.string().optional(),
      }).optional())
      .query(async ({ input }) => {
        return getProspectInstallatori(input ?? {});
      }),
    crea: adminProcedure
      .input(z.object({
        nome: z.string().optional(),
        ragioneSociale: z.string().min(1),
        settore: z.string().optional(),
        regione: z.string().optional(),
        provincia: z.string().optional(),
        comune: z.string().optional(),
        indirizzo: z.string().optional(),
        telefono: z.string().optional(),
        email: z.string().optional(),
        sito: z.string().optional(),
        fasciaFatturato: z.enum(["sotto_100k", "100k_500k", "500k_1m", "1m_5m", "sopra_5m"]).optional(),
        dipendenti: z.number().optional(),
        statoContatto: z.enum(["nuovo", "da_contattare", "contattato", "trattativa", "interessato", "accordo", "cliente_attivo", "cliente", "non_interessato"]).optional(),
        note: z.string().optional(),
        fonte: z.enum(["webinar", "excel", "google_maps", "manuale", "cciaa", "linkedin", "altro"]).optional(),
        referente: z.string().optional(),
        sconto: z.number().optional(),
        noteAccordo: z.string().optional(),
        dataAccordo: z.string().optional(),
        dataUltimoContatto: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        await createProspectInstallatore(input as any);
        // Feature 5: Auto-creare un ordine probabile bozza per il nuovo prospect
        try {
          const db = await getDb();
          if (db) {
            // Recupera l'ID del prospect appena creato
            const prospects = await db.select().from(prospectInstallatori).orderBy(prospectInstallatori.id);
            const nuovoProspect = prospects[prospects.length - 1];
            if (nuovoProspect) {
              const ordineData: InsertProspectOrdineProbabile = {
                prospectId: nuovoProspect.id,
                prodotto: "Pack da definire",
                importoStimato: "0",
                probabilita: 30,
                stato: "bozza",
                note: `Auto-creato alla registrazione del prospect`,
              };
              await db.insert(prospectOrdiniProbabili).values(ordineData);
            }
          }
        } catch (e) {
          // Non bloccare la creazione del prospect se fallisce la sincronizzazione
          console.error("Sync ordine probabile fallita:", e);
        }
        return { success: true };
      }),
    aggiorna: adminProcedure
      .input(z.object({
        id: z.number(),
        nome: z.string().optional(),
        ragioneSociale: z.string().optional(),
        settore: z.string().optional(),
        regione: z.string().optional(),
        provincia: z.string().optional(),
        comune: z.string().optional(),
        indirizzo: z.string().optional(),
        telefono: z.string().optional(),
        email: z.string().optional(),
        sito: z.string().optional(),
        fasciaFatturato: z.enum(["sotto_100k", "100k_500k", "500k_1m", "1m_5m", "sopra_5m"]).optional(),
        dipendenti: z.number().optional(),
        statoContatto: z.enum(["nuovo", "da_contattare", "contattato", "trattativa", "interessato", "accordo", "cliente_attivo", "cliente", "non_interessato"]).optional(),
        note: z.string().optional(),
        fonte: z.enum(["webinar", "excel", "google_maps", "manuale", "cciaa", "linkedin", "altro"]).optional(),
        referente: z.string().optional(),
        sconto: z.number().optional(),
        noteAccordo: z.string().optional(),
        dataAccordo: z.string().optional(),
        dataUltimoContatto: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        const { id, ...data } = input;
        await updateProspectInstallatore(id, data as any);
        return { success: true };
      }),
    elimina: adminProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        await deleteProspectInstallatore(input.id);
        return { success: true };
      }),
    // Cestino: lista record eliminati
    cestino: adminProcedure
      .input(z.object({ q: z.string().optional() }).optional())
      .query(async ({ input }) => {
        return getProspectInstallatori({ cestino: true, q: input?.q });
      }),
    // Ripristina dal cestino
    ripristina: adminProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        await ripristinaProspectInstallatore(input.id);
        return { success: true };
      }),
    // Eliminazione definitiva (solo per record nel cestino)
    eliminaDefinitivo: adminProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        await eliminaDefinitivamenteProspect(input.id);
        return { success: true };
      }),
    importaBulk: adminProcedure
      .input(z.object({
        records: z.array(z.object({
          nome: z.string().optional(),
          ragioneSociale: z.string().min(1),
          email: z.string().optional(),
          telefono: z.string().optional(),
          settore: z.string().optional(),
          regione: z.string().optional(),
          provincia: z.string().optional(),
          comune: z.string().optional(),
          note: z.string().optional(),
          fonte: z.enum(["webinar", "excel", "google_maps", "manuale", "cciaa", "linkedin", "altro"]).optional(),
          referente: z.string().optional(),
          statoContatto: z.enum(["nuovo", "da_contattare", "contattato", "trattativa", "interessato", "accordo", "cliente_attivo", "cliente", "non_interessato"]).optional(),
        }))
      }))
      .mutation(async ({ input }) => {
        let importati = 0;
        let saltati = 0;
        for (const rec of input.records) {
          try {
            await createProspectInstallatore({
              ...rec,
              statoContatto: rec.statoContatto ?? "nuovo",
              fonte: rec.fonte ?? "excel",
            } as any);
            importati++;
          } catch {
            saltati++;
          }
        }
        return { importati, saltati };
      }),
    cercaGoogleMaps: adminProcedure
      .input(z.object({
        query: z.string().min(2),
        regione: z.string().optional(),
        provincia: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        // Ricerca installatori fotovoltaico tramite Google Maps Places API
        // Usa query multiple per coprire tutta la regione (province + varianti query)
        const { makeRequest } = await import("./_core/map.js");

        // Mappa regioni → province principali per query multiple
        const PROVINCE_PER_REGIONE: Record<string, string[]> = {
          "Puglia": ["Bari", "Lecce", "Taranto", "Foggia", "Brindisi", "BAT"],
          "Sicilia": ["Palermo", "Catania", "Messina", "Agrigento", "Trapani", "Ragusa", "Siracusa", "Caltanissetta", "Enna"],
          "Campania": ["Napoli", "Salerno", "Caserta", "Avellino", "Benevento"],
          "Lazio": ["Roma", "Latina", "Frosinone", "Viterbo", "Rieti"],
          "Lombardia": ["Milano", "Brescia", "Bergamo", "Monza", "Varese", "Como", "Cremona", "Mantova"],
          "Veneto": ["Venezia", "Verona", "Padova", "Vicenza", "Treviso", "Rovigo", "Belluno"],
          "Emilia-Romagna": ["Bologna", "Modena", "Reggio Emilia", "Parma", "Ferrara", "Forl\u00ec", "Ravenna", "Rimini"],
          "Toscana": ["Firenze", "Pisa", "Livorno", "Siena", "Arezzo", "Grosseto", "Lucca"],
          "Calabria": ["Reggio Calabria", "Catanzaro", "Cosenza", "Crotone", "Vibo Valentia"],
          "Sardegna": ["Cagliari", "Sassari", "Nuoro", "Oristano", "Sud Sardegna"],
          "Piemonte": ["Torino", "Cuneo", "Alessandria", "Asti", "Novara", "Vercelli"],
          "Abruzzo": ["L'Aquila", "Pescara", "Chieti", "Teramo"],
          "Marche": ["Ancona", "Pesaro", "Macerata", "Ascoli Piceno", "Fermo"],
          "Basilicata": ["Potenza", "Matera"],
          "Molise": ["Campobasso", "Isernia"],
          "Umbria": ["Perugia", "Terni"],
          "Liguria": ["Genova", "Savona", "La Spezia", "Imperia"],
          "Friuli-Venezia Giulia": ["Trieste", "Udine", "Pordenone", "Gorizia"],
          "Trentino-Alto Adige": ["Trento", "Bolzano"],
          "Valle d'Aosta": ["Aosta"],
        };

        // Varianti della query per trovare pi\u00f9 tipi di installatori
        const VARIANTI_QUERY = [
          input.query,
          "impianti fotovoltaici",
          "energia solare",
          "installatori FV",
        ];

        // Costruisci lista di query da eseguire
        const queriesDaEseguire: string[] = [];
        const province = input.provincia
          ? [input.provincia]
          : input.regione
            ? (PROVINCE_PER_REGIONE[input.regione] ?? [input.regione])
            : [];

        if (province.length > 0) {
          // Per ogni provincia, usa le prime 2 varianti query
          for (const prov of province.slice(0, 6)) {
            queriesDaEseguire.push(`${VARIANTI_QUERY[0]} ${prov}`);
            queriesDaEseguire.push(`${VARIANTI_QUERY[1]} ${prov}`);
          }
        } else {
          // Nessuna zona specificata: usa tutte le varianti con query base
          for (const v of VARIANTI_QUERY) {
            queriesDaEseguire.push(`${v} Italia`);
          }
        }

        const allPlaces: any[] = [];
        const seenPlaceIds = new Set<string>();

        for (const searchQuery of queriesDaEseguire) {
          let pageToken: string | undefined = undefined;
          let pageCount = 0;
          const MAX_PAGES = 3;
          do {
            const params: Record<string, string> = { query: searchQuery, language: "it", region: "it" };
            if (pageToken) {
              params.pagetoken = pageToken;
              await new Promise(r => setTimeout(r, 2000));
            }
            const res = await makeRequest<{ results?: any[]; next_page_token?: string }>("/maps/api/place/textsearch/json", params);
            for (const p of (res.results ?? [])) {
              if (!seenPlaceIds.has(p.place_id)) {
                seenPlaceIds.add(p.place_id);
                allPlaces.push(p);
              }
            }
            pageToken = res.next_page_token;
            pageCount++;
          } while (pageToken && pageCount < MAX_PAGES);
        }

        // Mappa sigle province → regione per estrarre la regione dall'indirizzo
        const SIGLA_A_REGIONE: Record<string, string> = {
          "BA":"Puglia","LE":"Puglia","TA":"Puglia","FG":"Puglia","BR":"Puglia","BT":"Puglia",
          "PA":"Sicilia","CT":"Sicilia","ME":"Sicilia","AG":"Sicilia","TP":"Sicilia","RG":"Sicilia","SR":"Sicilia","CL":"Sicilia","EN":"Sicilia",
          "NA":"Campania","SA":"Campania","CE":"Campania","AV":"Campania","BN":"Campania",
          "RM":"Lazio","LT":"Lazio","FR":"Lazio","VT":"Lazio","RI":"Lazio",
          "MI":"Lombardia","BS":"Lombardia","BG":"Lombardia","MB":"Lombardia","VA":"Lombardia","CO":"Lombardia","CR":"Lombardia","MN":"Lombardia","LO":"Lombardia","LC":"Lombardia","SO":"Lombardia","PV":"Lombardia",
          "VE":"Veneto","VR":"Veneto","PD":"Veneto","VI":"Veneto","TV":"Veneto","RO":"Veneto","BL":"Veneto",
          "BO":"Emilia-Romagna","MO":"Emilia-Romagna","RE":"Emilia-Romagna","PR":"Emilia-Romagna","FE":"Emilia-Romagna","FC":"Emilia-Romagna","RA":"Emilia-Romagna","RN":"Emilia-Romagna","PC":"Emilia-Romagna",
          "FI":"Toscana","PI":"Toscana","LI":"Toscana","SI":"Toscana","AR":"Toscana","GR":"Toscana","LU":"Toscana","PT":"Toscana","PO":"Toscana","MS":"Toscana",
          "RC":"Calabria","CZ":"Calabria","CS":"Calabria","KR":"Calabria","VV":"Calabria",
          "CA":"Sardegna","SS":"Sardegna","NU":"Sardegna","OR":"Sardegna","SU":"Sardegna","OT":"Sardegna","OG":"Sardegna",
          "TO":"Piemonte","CN":"Piemonte","AL":"Piemonte","AT":"Piemonte","NO":"Piemonte","VC":"Piemonte","BI":"Piemonte","VB":"Piemonte",
          "AQ":"Abruzzo","PE":"Abruzzo","CH":"Abruzzo","TE":"Abruzzo",
          "AN":"Marche","PU":"Marche","MC":"Marche","AP":"Marche","FM":"Marche",
          "PZ":"Basilicata","MT":"Basilicata",
          "CB":"Molise","IS":"Molise",
          "PG":"Umbria","TR":"Umbria",
          "GE":"Liguria","SV":"Liguria","SP":"Liguria","IM":"Liguria",
          "TS":"Friuli-Venezia Giulia","UD":"Friuli-Venezia Giulia","PN":"Friuli-Venezia Giulia","GO":"Friuli-Venezia Giulia",
          "TN":"Trentino-Alto Adige","BZ":"Trentino-Alto Adige",
          "AO":"Valle d'Aosta",
        };
        // Mappa nomi città → provincia per estrarre la provincia dall'indirizzo
        const CITTA_A_PROVINCIA: Record<string, string> = {
          "Bari":"BA","Lecce":"LE","Taranto":"TA","Foggia":"FG","Brindisi":"BR","Andria":"BT","Barletta":"BT","Trani":"BT",
          "Palermo":"PA","Catania":"CT","Messina":"ME","Agrigento":"AG","Trapani":"TP","Ragusa":"RG","Siracusa":"SR","Caltanissetta":"CL","Enna":"EN",
          "Napoli":"NA","Salerno":"SA","Caserta":"CE","Avellino":"AV","Benevento":"BN",
          "Roma":"RM","Latina":"LT","Frosinone":"FR","Viterbo":"VT","Rieti":"RI",
          "Milano":"MI","Brescia":"BS","Bergamo":"BG","Monza":"MB","Varese":"VA","Como":"CO","Cremona":"CR","Mantova":"MN",
          "Venezia":"VE","Verona":"VR","Padova":"PD","Vicenza":"VI","Treviso":"TV","Rovigo":"RO","Belluno":"BL",
          "Bologna":"BO","Modena":"MO","Reggio Emilia":"RE","Parma":"PR","Ferrara":"FE","Forlì":"FC","Ravenna":"RA","Rimini":"RN",
          "Firenze":"FI","Pisa":"PI","Livorno":"LI","Siena":"SI","Arezzo":"AR","Grosseto":"GR","Lucca":"LU",
          "Reggio Calabria":"RC","Catanzaro":"CZ","Cosenza":"CS","Crotone":"KR","Vibo Valentia":"VV",
          "Cagliari":"CA","Sassari":"SS","Nuoro":"NU","Oristano":"OR",
          "Torino":"TO","Cuneo":"CN","Alessandria":"AL","Asti":"AT","Novara":"NO","Vercelli":"VC",
          "L'Aquila":"AQ","Pescara":"PE","Chieti":"CH","Teramo":"TE",
          "Ancona":"AN","Pesaro":"PU","Macerata":"MC","Ascoli Piceno":"AP","Fermo":"FM",
          "Potenza":"PZ","Matera":"MT",
          "Campobasso":"CB","Isernia":"IS",
          "Perugia":"PG","Terni":"TR",
          "Genova":"GE","Savona":"SV","La Spezia":"SP","Imperia":"IM",
          "Trieste":"TS","Udine":"UD","Pordenone":"PN","Gorizia":"GO",
          "Trento":"TN","Bolzano":"BZ",
          "Aosta":"AO",
        };
        // Funzione per estrarre regione/provincia/comune dall'indirizzo Google Maps
        // L'indirizzo ha formato: "Via X, CAP Città SG, Italia" dove SG è la sigla provincia
        function estraiGeo(address: string, regioneRicerca?: string, provinciaRicerca?: string): { regione?: string; provincia?: string; comune?: string } {
          if (!address) return {};
          // Cerca sigla provincia nel formato "CAP Città SG, Italia" o "Città SG, Italia"
          const matchSigla = address.match(/\b([A-Z]{2})\s*,\s*Italia/i);
          let provincia: string | undefined;
          let regione: string | undefined;
          let comune: string | undefined;
          if (matchSigla) {
            const sigla = matchSigla[1].toUpperCase();
            provincia = sigla;
            regione = SIGLA_A_REGIONE[sigla];
            // Estrai comune: la parte prima della sigla nel formato "CAP Comune SG"
            const matchComune = address.match(/\d{5}\s+([^,]+?)\s+[A-Z]{2}\s*,/);
            if (matchComune) comune = matchComune[1].trim();
          }
          // Se non trovato dalla sigla, usa la regione/provincia della ricerca
          if (!regione && regioneRicerca) regione = regioneRicerca;
          if (!provincia && provinciaRicerca) {
            // Converti nome provincia in sigla
            provincia = CITTA_A_PROVINCIA[provinciaRicerca] ?? provinciaRicerca.slice(0, 2).toUpperCase();
            if (!regione) regione = SIGLA_A_REGIONE[provincia] ?? regioneRicerca;
          }
          return { regione, provincia, comune };
        }
        const results = allPlaces.map((p: any) => {
          const geo = estraiGeo(p.formatted_address ?? "", input.regione, input.provincia);
          return {
            ragioneSociale: p.name ?? "",
            indirizzo: p.formatted_address ?? "",
            telefono: p.formatted_phone_number ?? "",
            sito: p.website ?? "",
            fonte: "google_maps" as const,
            statoContatto: "nuovo" as const,
            placeId: p.place_id,
            regione: geo.regione,
            provincia: geo.provincia,
            comune: geo.comune,
          };
        });
        return { results, totale: results.length };
      }),

    unificaDuplicati: adminProcedure
      .mutation(async () => {
        // Trova e unifica i duplicati per email o ragione sociale simile
        const tutti = await getProspectInstallatori();
        const lista = tutti as any[];
        const unificati: number[] = [];
        const eliminati: number[] = [];

        // Raggruppa per email (duplicati esatti)
        const perEmail = new Map<string, any[]>();
        for (const p of lista) {
          if (p.email) {
            const key = p.email.toLowerCase().trim();
            if (!perEmail.has(key)) perEmail.set(key, []);
            perEmail.get(key)!.push(p);
          }
        }

        // Raggruppa per ragione sociale (primi 15 caratteri normalizzati)
        const perRagione = new Map<string, any[]>();
        for (const p of lista) {
          if (p.ragioneSociale && p.ragioneSociale.length >= 5) {
            const key = p.ragioneSociale.toLowerCase().trim().replace(/[^a-z0-9]/g, "").slice(0, 15);
            if (!perRagione.has(key)) perRagione.set(key, []);
            perRagione.get(key)!.push(p);
          }
        }

        const daEliminare = new Set<number>();

        // Per ogni gruppo di duplicati, tieni il pi\u00f9 completo (quello con pi\u00f9 campi compilati)
        const processaGruppo = (gruppo: any[]) => {
          if (gruppo.length <= 1) return;
          // Ordina per completezza (pi\u00f9 campi non-null = pi\u00f9 completo)
          const ordinato = [...gruppo].sort((a, b) => {
            const scoreA = Object.values(a).filter(v => v != null && v !== "").length;
            const scoreB = Object.values(b).filter(v => v != null && v !== "").length;
            return scoreB - scoreA;
          });
          const principale = ordinato[0];
          for (let i = 1; i < ordinato.length; i++) {
            if (!daEliminare.has(ordinato[i].id)) {
              daEliminare.add(ordinato[i].id);
              eliminati.push(ordinato[i].id);
            }
          }
          unificati.push(principale.id);
        };

        Array.from(perEmail.values()).forEach(g => processaGruppo(g));
        Array.from(perRagione.values()).forEach(g => processaGruppo(g));

        // Soft-delete i duplicati (sposta nel cestino)
        const idsEliminati = Array.from(daEliminare);
        for (const id of idsEliminati) {
          await updateProspectInstallatore(id, { eliminatoAt: new Date() });
        }

        return { unificati: unificati.length, eliminati: eliminati.length, idEliminati: idsEliminati };
      }),

    // Diagnostica: trova installatori senza userId associato
    diagnosticaInstallatoriSenzaUserId: adminProcedure
      .query(async () => {
        const db = await getDb();
        if (!db) return { installatori: [], totale: 0 };
        const { installatori: installatoriTable } = await import("../drizzle/schema");
        const { isNull } = await import("drizzle-orm");
        const result = await db.select().from(installatoriTable).where(isNull(installatoriTable.userId));
        return { installatori: result, totale: result.length };
      }),

    // Ripristina: associa un userId a un installatore
    associaUserIdAInstallatore: adminProcedure
      .input(z.object({ installatoreId: z.number(), userId: z.number() }))
      .mutation(async ({ input }) => {
        const db = await getDb();
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
        const { installatori: installatoriTable } = await import("../drizzle/schema");
        const { eq } = await import("drizzle-orm");
        await db.update(installatoriTable).set({ userId: input.userId }).where(eq(installatoriTable.id, input.installatoreId));
        return { success: true, message: `UserId ${input.userId} associato all'installatore ${input.installatoreId}` };
      }),

    // Aggiorna pacchetti assegnati con dati residenziali/business corretti
    aggiornaPackaggiAssegnati: adminProcedure
      .mutation(async () => {
        const db = await getDb();
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
        const { ordini: ordiniTable } = await import("../drizzle/schema");
        const { eq, and } = await import("drizzle-orm");
        const packData: Record<string, { res: number; bus: number }> = {
          pack1: { res: 16, bus: 5 },
          pack2: { res: 30, bus: 9 },
          pack3: { res: 60, bus: 20 },
        };
        let aggiornati = 0;
        for (const [packId, { res, bus }] of Object.entries(packData)) {
          const result = await db.update(ordiniTable)
            .set({
              pratiche_incluse_residenziali: res,
              pratiche_incluse_business: bus,
              pratiche_incluse: res + bus,
            })
            .where(
              and(
                eq(ordiniTable.packId, packId),
                eq(ordiniTable.tipoOrdine, "assegnazione_admin"),
                eq(ordiniTable.stato, "pagato"),
                eq(ordiniTable.pratiche_incluse_residenziali, 0)
              )
            );
          aggiornati += (result as any).rowsAffected || 0;
        }
        return { success: true, message: `${aggiornati} pacchetti assegnati aggiornati` };
      }),

    fixRegioni: adminProcedure
      .mutation(async () => {
        // Aggiorna la regione dei prospect già importati senza regione, usando l'indirizzo
        const SIGLA_A_REGIONE: Record<string, string> = {
          "BA":"Puglia","LE":"Puglia","TA":"Puglia","FG":"Puglia","BR":"Puglia","BT":"Puglia",
          "PA":"Sicilia","CT":"Sicilia","ME":"Sicilia","AG":"Sicilia","TP":"Sicilia","RG":"Sicilia","SR":"Sicilia","CL":"Sicilia","EN":"Sicilia",
          "NA":"Campania","SA":"Campania","CE":"Campania","AV":"Campania","BN":"Campania",
          "RM":"Lazio","LT":"Lazio","FR":"Lazio","VT":"Lazio","RI":"Lazio",
          "MI":"Lombardia","BS":"Lombardia","BG":"Lombardia","MB":"Lombardia","VA":"Lombardia","CO":"Lombardia","CR":"Lombardia","MN":"Lombardia","LO":"Lombardia","LC":"Lombardia","SO":"Lombardia","PV":"Lombardia",
          "VE":"Veneto","VR":"Veneto","PD":"Veneto","VI":"Veneto","TV":"Veneto","RO":"Veneto","BL":"Veneto",
          "BO":"Emilia-Romagna","MO":"Emilia-Romagna","RE":"Emilia-Romagna","PR":"Emilia-Romagna","FE":"Emilia-Romagna","FC":"Emilia-Romagna","RA":"Emilia-Romagna","RN":"Emilia-Romagna","PC":"Emilia-Romagna",
          "FI":"Toscana","PI":"Toscana","LI":"Toscana","SI":"Toscana","AR":"Toscana","GR":"Toscana","LU":"Toscana","PT":"Toscana","PO":"Toscana","MS":"Toscana",
          "RC":"Calabria","CZ":"Calabria","CS":"Calabria","KR":"Calabria","VV":"Calabria",
          "CA":"Sardegna","SS":"Sardegna","NU":"Sardegna","OR":"Sardegna","SU":"Sardegna","OT":"Sardegna","OG":"Sardegna",
          "TO":"Piemonte","CN":"Piemonte","AL":"Piemonte","AT":"Piemonte","NO":"Piemonte","VC":"Piemonte","BI":"Piemonte","VB":"Piemonte",
          "AQ":"Abruzzo","PE":"Abruzzo","CH":"Abruzzo","TE":"Abruzzo",
          "AN":"Marche","PU":"Marche","MC":"Marche","AP":"Marche","FM":"Marche",
          "PZ":"Basilicata","MT":"Basilicata",
          "CB":"Molise","IS":"Molise",
          "PG":"Umbria","TR":"Umbria",
          "GE":"Liguria","SV":"Liguria","SP":"Liguria","IM":"Liguria",
          "TS":"Friuli-Venezia Giulia","UD":"Friuli-Venezia Giulia","PN":"Friuli-Venezia Giulia","GO":"Friuli-Venezia Giulia",
          "TN":"Trentino-Alto Adige","BZ":"Trentino-Alto Adige",
          "AO":"Valle d'Aosta",
        };
        const tutti = await getProspectInstallatori();
        let aggiornati = 0;
        for (const p of tutti as any[]) {
          if (p.regione || !p.indirizzo) continue;
          const matchSigla = (p.indirizzo as string).match(/\b([A-Z]{2})\s*,\s*Italia/i);
          if (!matchSigla) continue;
          const sigla = matchSigla[1].toUpperCase();
          const regione = SIGLA_A_REGIONE[sigla];
          if (!regione) continue;
          const matchComune = (p.indirizzo as string).match(/\d{5}\s+([^,]+?)\s+[A-Z]{2}\s*,/);
          const comune = matchComune ? matchComune[1].trim() : undefined;
          await updateProspectInstallatore(p.id, { regione, provincia: sigla, ...(comune ? { comune } : {}) });
          aggiornati++;
        }
        return { aggiornati };
      }),

      // ─── ORDINI PROBABILI ───────────────────────────────────────────────
      getOrdiniProbabili: adminProcedure
        .input(z.object({ prospectId: z.number().optional() }))
        .query(async ({ input }) => {
          const db = await getDb();
          if (!db) return [];
          if (input.prospectId) {
            return db.select().from(prospectOrdiniProbabili).where(eq(prospectOrdiniProbabili.prospectId, input.prospectId));
          }
          return db.select().from(prospectOrdiniProbabili);
        }),

      getPackettiPerOrdiniProbabili: publicProcedure
        .input(z.object({ installatoreId: z.number().optional() }))
        .query(async ({ input }) => {
          try {
            const db = await getDb();
            if (!db) {
              console.error("[getPackettiPerOrdiniProbabili] Database non disponibile");
              return { standard: [], personalizzati: [], promo: [] };
            }
            
            // Pack standard dal DB (Pack 1, 2, 3 sono in pack_configurazione)
            const standard = await db.select().from(packConfigurazione).where(
              and(
                eq(packConfigurazione.attivo, true),
                inArray(packConfigurazione.nome, ["Pack 1", "Pack 2", "Pack 3"])
              )
            );
            
            // Pacchetti personalizzati dal DB (escludiamo Pack 1, 2, 3)
            const personalizzati = await db.select().from(packConfigurazione).where(
              and(
                eq(packConfigurazione.attivo, true),
                notInArray(packConfigurazione.nome, ["Pack 1", "Pack 2", "Pack 3"])
              )
            );
            
            // Promo attive dal DB — mostra TUTTE le promo attive
            // (sia globali che per installatori specifici, utili per gli ordini probabili)
            let promo: any[] = [];
            if (input.installatoreId) {
              promo = await db.select().from(promoInstallatore).where(
                or(
                  isNull(promoInstallatore.installatoreId),
                  eq(promoInstallatore.installatoreId, input.installatoreId)
                )
              );
            } else {
              // Senza installatore: mostra tutte le promo attive (globali + specifiche)
              promo = await db.select().from(promoInstallatore);
            }
            promo = promo.filter((p: any) => p.attivo);
            
            return {
              standard: standard.map((p: any) => ({ id: p.slug, nome: p.nome, prezzo: p.prezzo })),
              personalizzati: personalizzati.map((p: any) => ({ id: p.slug, nome: p.nome, prezzo: p.prezzo })),
              promo: promo.map((p: any) => ({ id: `promo_${p.id}`, nome: p.titolo, prezzo: p.prezzo })),
            };
          } catch (err) {
            console.error("[getPackettiPerOrdiniProbabili] Errore:", err);
            throw err;
          }
        }),

      creaOrdineProbabile: adminProcedure
        .input(z.object({
          prospectId: z.number(),
          prodotto: z.string().min(1),
          importoStimato: z.number().optional(),
          probabilita: z.number().min(0).max(100).default(50),
          stato: z.enum(["bozza","proposta","trattativa","accettato","rifiutato"]).default("bozza"),
          scadenza: z.string().optional(),
          note: z.string().optional(),
        }))
        .mutation(async ({ input }) => {
          const db = await getDb();
          if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
          const data: InsertProspectOrdineProbabile = {
            prospectId: input.prospectId,
            prodotto: input.prodotto,
            importoStimato: input.importoStimato !== undefined ? String(input.importoStimato) : "0",
            probabilita: input.probabilita,
            stato: input.stato,
            scadenza: input.scadenza ? new Date(input.scadenza) : undefined,
            note: input.note,
          };
          await db.insert(prospectOrdiniProbabili).values(data);
          // SINCRONIZZAZIONE: Ogni ordine probabile aumenta il contatore della Corsa €100K
          // Creiamo un corso nella Corsa €100K per ogni ordine probabile (non solo quelli accettati)
          const corsoData: InsertProspectCorso = {
            prospectId: input.prospectId,
            potenzaKw: "100",
            tipo: "industriale",
            stato: input.stato === "accettato" ? "approvato" : "valutazione",
            valoreStimato: input.importoStimato !== undefined ? String(input.importoStimato) : undefined,
            note: `Ordine probabile: ${input.prodotto} (${input.stato})`,
          };
          await db.insert(prospectCorsi).values(corsoData);
          const rows = await db.select().from(prospectOrdiniProbabili).where(eq(prospectOrdiniProbabili.prospectId, input.prospectId));
          return rows[rows.length - 1];
        }),

      modificaOrdineProbabile: adminProcedure
        .input(z.object({
          id: z.number(),
          prodotto: z.string().optional(),
          importoStimato: z.number().nullable().optional(),
          probabilita: z.number().min(0).max(100).optional(),
          stato: z.enum(["bozza","proposta","trattativa","accettato","rifiutato"]).optional(),
          scadenza: z.string().nullable().optional(),
          note: z.string().nullable().optional(),
        }))
        .mutation(async ({ input }) => {
          const db = await getDb();
          if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
          const { id, importoStimato, scadenza, ...rest } = input;
          const data: any = { ...rest };
          if (importoStimato !== undefined) data.importoStimato = importoStimato !== null ? String(importoStimato) : "0";
          if (scadenza !== undefined) data.scadenza = scadenza ? new Date(scadenza) : null;
          await db.update(prospectOrdiniProbabili).set(data).where(eq(prospectOrdiniProbabili.id, id));
          // SINCRONIZZAZIONE QUOTA €600K: Se stato cambia a 'accettato', aumenta la Quota
          if (input.stato === "accettato") {
            const ordineRows = await db.select().from(prospectOrdiniProbabili).where(eq(prospectOrdiniProbabili.id, id));
            const ordine = ordineRows[0];
            if (ordine) {
              // Verifica se esiste già un corso per questo ordine (evita duplicati)
              const corsiEsistenti = await db.select().from(prospectCorsi).where(eq(prospectCorsi.prospectId, ordine.prospectId));
              const corsoEsistente = corsiEsistenti.find((c: any) => c.note && c.note.includes(ordine.prodotto || ""));
              if (!corsoEsistente) {
                const corsoData: InsertProspectCorso = {
                  prospectId: ordine.prospectId,
                  potenzaKw: "100",
                  tipo: "industriale",
                  stato: "approvato",
                  valoreStimato: ordine.importoStimato || undefined,
                  note: `Auto-creato da ordine probabile: ${ordine.prodotto}`,
                };
                await db.insert(prospectCorsi).values(corsoData);
              }
            }
          }
          const rows = await db.select().from(prospectOrdiniProbabili).where(eq(prospectOrdiniProbabili.id, id));
          return rows[0];
        }),

      eliminaOrdineProbabile: adminProcedure
        .input(z.object({ id: z.number() }))
        .mutation(async ({ input }) => {
          const db = await getDb();
          if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
          await db.delete(prospectOrdiniProbabili).where(eq(prospectOrdiniProbabili.id, input.id));
          return { success: true };
        }),

      // ─── CORSI / IMPIANTI 100KW+ ────────────────────────────────────────────
      getCorsi: adminProcedure
        .input(z.object({ prospectId: z.number().optional() }))
        .query(async ({ input }) => {
          const db = await getDb();
          if (!db) return [];
          if (input.prospectId) {
            return db.select().from(prospectCorsi).where(eq(prospectCorsi.prospectId, input.prospectId));
          }
          return db.select().from(prospectCorsi);
        }),

      creaCorso: adminProcedure
        .input(z.object({
          prospectId: z.number(),
          potenzaKw: z.number().default(100),
          tipo: z.enum(["industriale","agrivoltaico","commerciale","residenziale_grande","altro"]).default("industriale"),
          comune: z.string().optional(),
          dataPrevista: z.string().optional(),
          stato: z.enum(["valutazione","progettazione","approvato","in_corso","completato","annullato"]).default("valutazione"),
          valoreStimato: z.number().optional(),
          praticheStimate: z.number().default(1),
          note: z.string().optional(),
        }))
        .mutation(async ({ input }) => {
          const db = await getDb();
          if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
          const data: InsertProspectCorso = {
            prospectId: input.prospectId,
            potenzaKw: String(input.potenzaKw),
            tipo: input.tipo,
            comune: input.comune,
            dataPrevista: input.dataPrevista ? new Date(input.dataPrevista) : undefined,
            stato: input.stato,
            valoreStimato: input.valoreStimato !== undefined ? String(input.valoreStimato) : undefined,
            praticheStimate: input.praticheStimate,
            note: input.note,
          };
          await db.insert(prospectCorsi).values(data);
          const rows = await db.select().from(prospectCorsi).where(eq(prospectCorsi.prospectId, input.prospectId));
          return rows[rows.length - 1];
        }),

      modificaCorso: adminProcedure
        .input(z.object({
          id: z.number(),
          potenzaKw: z.number().optional(),
          tipo: z.enum(["industriale","agrivoltaico","commerciale","residenziale_grande","altro"]).optional(),
          comune: z.string().nullable().optional(),
          dataPrevista: z.string().nullable().optional(),
          stato: z.enum(["valutazione","progettazione","approvato","in_corso","completato","annullato"]).optional(),
          valoreStimato: z.number().nullable().optional(),
          praticheStimate: z.number().optional(),
          note: z.string().nullable().optional(),
        }))
        .mutation(async ({ input }) => {
          const db = await getDb();
          if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
          const { id, potenzaKw, valoreStimato, dataPrevista, ...rest } = input;
          const data: any = { ...rest };
          if (potenzaKw !== undefined) data.potenzaKw = String(potenzaKw);
          if (valoreStimato !== undefined) data.valoreStimato = valoreStimato !== null ? String(valoreStimato) : null;
          if (dataPrevista !== undefined) data.dataPrevista = dataPrevista ? new Date(dataPrevista) : null;
          await db.update(prospectCorsi).set(data).where(eq(prospectCorsi.id, id));
          const rows = await db.select().from(prospectCorsi).where(eq(prospectCorsi.id, id));
          return rows[0];
        }),

      eliminaCorso: adminProcedure
        .input(z.object({ id: z.number() }))
        .mutation(async ({ input }) => {
          const db = await getDb();
          if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
          await db.delete(prospectCorsi).where(eq(prospectCorsi.id, input.id));
          return { success: true };
        }),

    // ─── LEAD PUBBLICO DA LANDING /INGROSSO ─────────────────────────────────
    leadIngrosso: publicProcedure
      .input(z.object({
        ragioneSociale: z.string().min(1),
        telefono: z.string().min(1),
        settore: z.string().optional(),
        note: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        await createProspectInstallatore({
          ragioneSociale: input.ragioneSociale,
          telefono: input.telefono,
          settore: input.settore || "installatore",
          note: input.note || `Lead da landing /ingrosso`,
          fonte: "altro" as const,
          statoContatto: "interessato" as const,
        });
        // Notifica owner
        await notifyOwner({
          title: `🏭 Nuovo lead ingrosso: ${input.ragioneSociale}`,
          content: `Categoria: ${input.settore || "non specificata"}\nTelefono: ${input.telefono}\nNote: ${input.note || "-"}\n\nContattalo su WhatsApp: https://wa.me/${input.telefono.replace(/\D/g, "")}`,
        });
        return { success: true };
      }),

  }),
  // ─── IMMOBILI FOTOVOLTAICOO ───────────────────────────────────────────────────
  immobiliFotovoltaico: router({
    lista: publicProcedure
      .input(z.object({
        tipo: z.enum(["capannone", "terreno"]).optional(),
        regione: z.string().optional(),
        provincia: z.string().optional(),
        attivitaEnergivora: z.boolean().optional(),
        vicinanzaAutostrada: z.boolean().optional(),
        vicinanzaAreaIndustriale: z.boolean().optional(),
      }).optional())
      .query(async ({ input }) => {
        return getImmobiliFotovoltaico({ ...(input ?? {}), soloPublicati: true });
      }),
    listaAdmin: adminProcedure
      .input(z.object({
        tipo: z.enum(["capannone", "terreno"]).optional(),
        regione: z.string().optional(),
      }).optional())
      .query(async ({ input }) => {
        return getImmobiliFotovoltaico({ ...(input ?? {}), soloPublicati: false });
      }),
    crea: adminProcedure
      .input(z.object({
        tipo: z.enum(["capannone", "terreno"]),
        titolo: z.string().min(3),
        regione: z.string().optional(),
        provincia: z.string().optional(),
        comune: z.string().optional(),
        indirizzo: z.string().optional(),
        superficieMq: z.number().optional(),
        superficieEttari: z.string().optional(),
        attivitaEnergivora: z.boolean().optional(),
        tipoAttivita: z.string().optional(),
        vicinanzaAutostrada: z.boolean().optional(),
        vicinanzaAreaIndustriale: z.boolean().optional(),
        distanzaAutostradaKm: z.string().optional(),
        distanzaAreaIndustrialeKm: z.string().optional(),
        potenzaStimataKwp: z.string().optional(),
        disponibilita: z.enum(["vendita", "affitto", "disponibile", "trattativa"]).optional(),
        prezzoEuro: z.string().optional(),
        nomeContatto: z.string().optional(),
        telefonoContatto: z.string().optional(),
        emailContatto: z.string().optional(),
        note: z.string().optional(),
        pubblicato: z.boolean().optional(),
      }))
      .mutation(async ({ input }) => {
        await createImmobileFotovoltaico(input as any);
        return { success: true };
      }),
    aggiorna: adminProcedure
      .input(z.object({
        id: z.number(),
        titolo: z.string().optional(),
        regione: z.string().optional(),
        provincia: z.string().optional(),
        comune: z.string().optional(),
        superficieMq: z.number().optional(),
        superficieEttari: z.string().optional(),
        attivitaEnergivora: z.boolean().optional(),
        tipoAttivita: z.string().optional(),
        vicinanzaAutostrada: z.boolean().optional(),
        vicinanzaAreaIndustriale: z.boolean().optional(),
        potenzaStimataKwp: z.string().optional(),
        disponibilita: z.enum(["vendita", "affitto", "disponibile", "trattativa"]).optional(),
        prezzoEuro: z.string().optional(),
        nomeContatto: z.string().optional(),
        telefonoContatto: z.string().optional(),
        emailContatto: z.string().optional(),
        note: z.string().optional(),
        pubblicato: z.boolean().optional(),
      }))
      .mutation(async ({ input }) => {
        const { id, ...data } = input;
        await updateImmobileFotovoltaico(id, data as any);
        return { success: true };
      }),
    elimina: adminProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        await deleteImmobileFotovoltaico(input.id);
        return { success: true };
      }),
  }),

  marketing: router({
    cercaInstallatori: adminProcedure
      .input(z.object({
        regione: z.string().optional(),
        settore: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        const settore = input.settore || "installatori fotovoltaico";
        const regione = input.regione || "Italia";
        
        // Se è selezionata una regione, cerca per ogni provincia
        const province = regione && PROVINCE_BY_REGIONE[regione] ? PROVINCE_BY_REGIONE[regione] : [regione];
        
        const gmResults: any[] = [];
        const seenNames = new Set<string>();
        
        try {
          // Esegui ricerca per ogni provincia
          for (const provincia of province) {
            const query = `${settore} ${provincia}`;
            try {
              const result = await makeRequest<any>("/maps/api/place/textsearch/json", {
                query,
                region: "it",
                language: "it",
              });
              
              // Aggiungi risultati evitando duplicati
              (result.results || []).forEach((r: any) => {
                const name = r.name.toLowerCase();
                if (!seenNames.has(name)) {
                  seenNames.add(name);
                  gmResults.push({
                    ragioneSociale: r.name,
                    indirizzo: r.formatted_address || "",
                    regione: input.regione || "",
                    provincia: provincia,
                    comune: (r.formatted_address || "").split(",")[1]?.trim() || "",
                    telefono: r.formatted_phone_number || "",
                    email: "",
                    sito: r.website || "",
                    settore: settore,
                    rating: r.rating,
                    fonte: "google_maps",
                  });
                }
              });
            } catch (_e) {
              // Continua con la prossima provincia se una ricerca fallisce
              console.error(`Errore ricerca ${provincia}:`, _e);
            }
          }
          // Cerca anche su Pagine Gialle
          const pgCat = (input.settore || "impianti-fotovoltaici").toLowerCase().replace(/ /g, "-");
          const pgDove = (input.regione || "italia").toLowerCase();
          let pgResults: any[] = [];
          try {
            const pgUrl = `https://www.paginegialle.it/${encodeURIComponent(pgCat)}/${encodeURIComponent(pgDove)}/1.html`;
            const pgResp = await fetch(pgUrl, {
              headers: { "User-Agent": "Mozilla/5.0 (compatible; Googlebot/2.1)" },
            });
            const html = await pgResp.text();
            // Estrai nomi aziende
            const nameMatches = html.matchAll(/class="[^"]*ql-item-name[^"]*"[^>]*>\s*<[^>]+>([^<]+)</g);
            const phoneMatches = html.matchAll(/href="tel:([^"]+)"/g);
            const names2 = Array.from(nameMatches).map((m: any) => m[1].trim());
            const phones2 = Array.from(phoneMatches).map((m: any) => m[1].trim());
            pgResults = names2.map((name: string, i: number) => ({
              ragioneSociale: name,
              telefono: phones2[i] || "",
              regione: input.regione || "",
              settore: settore,
              fonte: "pagine_gialle",
            }));
          } catch (_e) { /* ignora errori PG */ }
          // Unisci risultati (evita duplicati per nome)
          const allNames = new Set(gmResults.map((r: any) => r.ragioneSociale.toLowerCase()));
          const uniquePg = pgResults.filter((r: any) => !allNames.has(r.ragioneSociale.toLowerCase()));
          const results = [...gmResults, ...uniquePg];
          return { results, totale: results.length, gmCount: gmResults.length, pgCount: uniquePg.length };
        } catch (e: any) {
          throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: e.message });
        }
      }),

    importaRisultati: adminProcedure
      .input(z.object({
        records: z.array(z.object({
          ragioneSociale: z.string(),
          regione: z.string().optional(),
          provincia: z.string().optional(),
          comune: z.string().optional(),
          telefono: z.string().optional(),
          email: z.string().optional(),
          sito: z.string().optional(),
          settore: z.string().optional(),
          indirizzo: z.string().optional(),
          fonte: z.string().optional(),
        }))
      }))
      .mutation(async ({ input }) => {
        const toInsert = input.records.map(r => ({
          ragioneSociale: r.ragioneSociale,
          settore: r.settore || "Impianti Fotovoltaici",
          regione: r.regione || "",
          provincia: r.provincia || "",
          comune: r.comune || "",
          telefono: r.telefono || "",
          email: r.email || "",
          sito: r.sito || "",
          statoContatto: "da_contattare" as const,
          fonte: (r.fonte || "manuale") as "manuale" | "webinar" | "excel" | "google_maps" | "cciaa" | "linkedin" | "altro",
          note: r.indirizzo ? `Indirizzo: ${r.indirizzo}` : "",
        }));
        const inserted = await bulkCreateProspectInstallatori(toInsert);
        return { inserted };
      }),

    exportCsv: adminProcedure.query(async () => {
      const installatori = await exportProspectInstallatori();
      const headers = ["ragioneSociale","settore","regione","provincia","comune","telefono","email","sito","statoContatto","fonte","note"];
      const rows = (installatori as any[]).map(i =>
        headers.map(h => `"${(i[h] || "").toString().replace(/"/g, '""')}"`).join(",")
      );
      const csv = [headers.join(","), ...rows].join("\n");
      return { csv, count: installatori.length };
    }),

    aggiornaStato: adminProcedure
      .input(z.object({
        id: z.number(),
        statoContatto: z.enum(["da_contattare","contattato","interessato","cliente","non_interessato"]),
        note: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        await aggiornaStatoContatto(input.id, input.statoContatto, input.note);
        return { success: true };
      }),

    preparaMessaggi: adminProcedure
      .input(z.object({
        ids: z.array(z.number()),
        canale: z.enum(["whatsapp", "email"]),
        messaggio: z.string(),
        oggetto: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        const installatori = await getProspectInstallatori();
        const selezionati = (installatori as any[]).filter(i => input.ids.includes(i.id));
        const links = selezionati.map(inst => {
          const testo = input.messaggio.replace(/\{nome\}/g, inst.ragioneSociale);
          let link = "";
          if (input.canale === "whatsapp") {
            const tel = (inst.telefono || "").replace(/[^0-9+]/g, "");
            const telF = tel.startsWith("+") ? tel : tel ? `+39${tel}` : "";
            link = telF
              ? `https://wa.me/${telF.replace("+","")}?text=${encodeURIComponent(testo)}`
              : `https://wa.me/?text=${encodeURIComponent(testo)}`;
          } else {
            link = inst.email
              ? `mailto:${inst.email}?subject=${encodeURIComponent(input.oggetto || "Proposta")}&body=${encodeURIComponent(testo)}`
              : "";
          }
          return { nome: inst.ragioneSociale, link, canale: input.canale };
        }).filter(l => l.link);
          return { links, totale: links.length };
      }),

    // ─── SCORE AI & AUTOMAZIONI CRM ──────────────────────────────────────────
    ai: router({
      calcolaScore: adminProcedure
        .input(z.object({ id: z.number() }))
        .mutation(async ({ input }) => {
          const tutti = await getProspectInstallatori();
          const prospect = (tutti as any[]).find(p => p.id === input.id);
          if (!prospect) throw new TRPCError({ code: "NOT_FOUND" });
          const resp = await invokeLLM({
            messages: [
              { role: "system", content: `Sei un esperto di vendita B2B nel settore fotovoltaico italiano. Analizza il prospect e restituisci un JSON con: score (0-100), motivazione (stringa breve max 80 caratteri), strategia (array di 3 stringhe con consigli pratici), canaleConsigliato ("whatsapp" o "email" o "telefono"), momentoConsigliato (stringa breve), messaggioApertura (testo breve personalizzato per primo contatto).` },
              { role: "user", content: `Prospect: ${JSON.stringify({ nome: prospect.ragioneSociale, settore: prospect.settore, regione: prospect.regione, stato: prospect.statoContatto, fonte: prospect.fonte, note: prospect.note, hasEmail: !!prospect.email, hasTelefono: !!prospect.telefono })}` },
            ],
            response_format: {
              type: "json_schema",
              json_schema: {
                name: "prospect_score",
                strict: true,
                schema: {
                  type: "object",
                  properties: {
                    score: { type: "number" },
                    motivazione: { type: "string" },
                    strategia: { type: "array", items: { type: "string" } },
                    canaleConsigliato: { type: "string" },
                    momentoConsigliato: { type: "string" },
                    messaggioApertura: { type: "string" },
                  },
                  required: ["score","motivazione","strategia","canaleConsigliato","momentoConsigliato","messaggioApertura"],
                  additionalProperties: false,
                },
              },
            },
          });
          const content = resp.choices?.[0]?.message?.content ?? "{}";
          const parsed = typeof content === "string" ? JSON.parse(content) : content;
          await updateProspectInstallatore(input.id, { scoreAI: Math.round(parsed.score) });
          return parsed;
        }),

      generaProposta: adminProcedure
        .input(z.object({ id: z.number() }))
        .mutation(async ({ input }) => {
          const tutti = await getProspectInstallatori();
          const prospect = (tutti as any[]).find(p => p.id === input.id);
          if (!prospect) throw new TRPCError({ code: "NOT_FOUND" });
          const resp = await invokeLLM({
            messages: [
              { role: "system", content: `Sei un consulente commerciale esperto di pratiche burocratiche per impianti fotovoltaici in Italia. Genera una proposta commerciale personalizzata e convincente per un installatore fotovoltaico. La proposta deve essere professionale, concisa (max 300 parole), in italiano, e deve menzionare i vantaggi specifici dei pacchetti Ricaricati di Connessioni: Pack 1 (2.000 euro, 16 pratiche residenziali o 5 business), Pack 2 (3.150 euro, 30 pratiche res o 9 bus), Pack 3 (5.100 euro, 60 pratiche res o 20 bus). Includi una call-to-action chiara.` },
              { role: "user", content: `Genera proposta per: ${prospect.ragioneSociale}, settore: ${prospect.settore || "Fotovoltaico"}, regione: ${prospect.regione || "Italia"}, stato: ${prospect.statoContatto}, note: ${prospect.note || "nessuna"}` },
            ],
          });
          const testo = resp.choices?.[0]?.message?.content ?? "";
          
          // Genera PDF con la proposta
          const doc = new PDFDocument({ size: "A4", margin: 50 });
          const chunks: Buffer[] = [];
          
          doc.on("data", (chunk: Buffer) => chunks.push(chunk));
          
          // Header
          doc.fontSize(24).font("Helvetica-Bold").text("RICARICATI DI CONNESSIONI", { align: "center" });
          doc.fontSize(12).font("Helvetica").text("Proposta Commerciale Personalizzata", { align: "center" });
          doc.moveDown();
          
          // Data
          doc.fontSize(10).text(`Data: ${new Date().toLocaleDateString("it-IT")}`, { align: "right" });
          doc.moveDown();
          
          // Destinatario
          doc.fontSize(12).font("Helvetica-Bold").text("Egregio/a,");
          doc.fontSize(11).font("Helvetica").text(prospect.ragioneSociale as string);
          if (prospect.nome) doc.text(prospect.nome as string);
          if (prospect.regione) doc.text(prospect.regione as string);
          doc.moveDown();
          
          // Contenuto proposta
          doc.fontSize(11).font("Helvetica").text(testo as string, { align: "justify" });
          doc.moveDown(2);
          
          // Footer
          doc.fontSize(10).text("Ricaricati di Connessioni", { align: "center" });
          doc.text("www.soluzionipratiche.info", { align: "center" });
          
          doc.end();
          
          // Aspetta che il PDF sia completato
          return new Promise((resolve) => {
            doc.on("end", () => {
              const pdfBuffer = Buffer.concat(chunks);
              const base64 = pdfBuffer.toString("base64");
              resolve({ testo, pdfBase64: base64, fileName: `Proposta_${prospect.ragioneSociale.replace(/\s+/g, "_")}_${Date.now()}.pdf` });
            });
          });
        }) as any,

      creaLinkOfferta: adminProcedure
        .input(z.object({
          id: z.number(),
          packConsigliato: z.enum(["pack1","pack2","pack3"]).optional(),
          scontoPercent: z.number().min(0).max(50).optional(),
          messaggioPersonale: z.string().optional(),
          scadenzaGiorni: z.number().min(1).max(90).default(30),
        }))
        .mutation(async ({ input }) => {
          const token = crypto.randomBytes(16).toString("hex");
          const scadenza = Date.now() + input.scadenzaGiorni * 24 * 60 * 60 * 1000;
          await updateProspectInstallatore(input.id, {
            tokenOfferta: token,
            tokenOffertaScadenza: new Date(scadenza),
            tokenOffertaPackId: input.packConsigliato ?? null,
            tokenOffertaSconto: input.scontoPercent ?? null,
            tokenOffertaMessaggio: input.messaggioPersonale ?? null,
          });
          return { token, url: `/offerta/${token}`, scadenza };
        }),

      getProspectByToken: publicProcedure
        .input(z.object({ token: z.string() }))
        .query(async ({ input }) => {
          const tutti = await getProspectInstallatori();
          const prospect = (tutti as any[]).find(p => p.tokenOfferta === input.token);
          if (!prospect) throw new TRPCError({ code: "NOT_FOUND", message: "Offerta non trovata o scaduta" });
          if (prospect.tokenOffertaScadenza && Date.now() > new Date(prospect.tokenOffertaScadenza).getTime()) {
            throw new TRPCError({ code: "NOT_FOUND", message: "Offerta scaduta" });
          }
          return {
            nome: prospect.ragioneSociale,
            pack: prospect.tokenOffertaPackId,
            sconto: prospect.tokenOffertaSconto,
            messaggio: prospect.tokenOffertaMessaggio,
            scadenza: prospect.tokenOffertaScadenza,
          };
        }),

      consiglioContatto: adminProcedure
        .input(z.object({ id: z.number() }))
        .mutation(async ({ input }) => {
          const tutti = await getProspectInstallatori();
          const prospect = (tutti as any[]).find(p => p.id === input.id);
          if (!prospect) throw new TRPCError({ code: "NOT_FOUND" });
          const resp = await invokeLLM({
            messages: [
              { role: "system", content: `Sei un esperto di vendita B2B nel settore fotovoltaico italiano. Analizza il prospect e suggerisci la strategia di contatto ottimale. Rispondi in JSON con: canale ("whatsapp"|"email"|"telefono"|"linkedin"), tono ("formale"|"informale"|"tecnico"), timing (stringa breve, es. "martedì mattina"), script (testo del messaggio di apertura, max 150 parole), motivazione (spiegazione breve max 80 caratteri).` },
              { role: "user", content: `Prospect: ${JSON.stringify({ nome: prospect.ragioneSociale, settore: prospect.settore, regione: prospect.regione, stato: prospect.statoContatto, fonte: prospect.fonte, note: prospect.note, hasEmail: !!prospect.email, hasTelefono: !!prospect.telefono, scoreAI: prospect.scoreAI })}` },
            ],
            response_format: {
              type: "json_schema",
              json_schema: {
                name: "consiglio_contatto",
                strict: true,
                schema: {
                  type: "object",
                  properties: {
                    canale: { type: "string" },
                    tono: { type: "string" },
                    timing: { type: "string" },
                    script: { type: "string" },
                    motivazione: { type: "string" },
                  },
                  required: ["canale","tono","timing","script","motivazione"],
                  additionalProperties: false,
                },
              },
            },
          });
          const content = resp.choices?.[0]?.message?.content ?? "{}";
          return typeof content === "string" ? JSON.parse(content) : content;
        }),

      messaggioWhatsapp: adminProcedure
        .input(z.object({ id: z.number() }))
        .mutation(async ({ input }) => {
          const tutti = await getProspectInstallatori();
          const prospect = (tutti as any[]).find(p => p.id === input.id);
          if (!prospect) throw new TRPCError({ code: "NOT_FOUND" });
          const resp = await invokeLLM({
            messages: [
              { role: "system", content: `Sei un esperto di vendita B2B nel settore fotovoltaico italiano. Genera un messaggio WhatsApp professionale ma cordiale per contattare un installatore fotovoltaico. Il messaggio deve essere breve (max 100 parole), personalizzato, e invitare a una chiamata o a visitare il sito per scoprire i pacchetti pratiche Ricaricati di Connessioni. Usa un tono diretto ma non aggressivo.` },
              { role: "user", content: `Genera messaggio WhatsApp per: ${prospect.ragioneSociale}, settore: ${prospect.settore || "Fotovoltaico"}, regione: ${prospect.regione || "Italia"}, stato: ${prospect.statoContatto}` },
            ],
          });
          const testo = resp.choices?.[0]?.message?.content ?? "";
          return { testo: typeof testo === "string" ? testo : JSON.stringify(testo) };
        }),

      messaggioEmail: adminProcedure
        .input(z.object({ id: z.number() }))
        .mutation(async ({ input }) => {
          const tutti = await getProspectInstallatori();
          const prospect = (tutti as any[]).find(p => p.id === input.id);
          if (!prospect) throw new TRPCError({ code: "NOT_FOUND" });
          const resp = await invokeLLM({
            messages: [
              { role: "system", content: `Sei un esperto di vendita B2B nel settore fotovoltaico italiano. Genera un'email commerciale professionale per contattare un installatore fotovoltaico. Rispondi in JSON con: oggetto (stringa, oggetto dell'email, max 60 caratteri), corpo (stringa, corpo dell'email in HTML semplice, max 300 parole, includi i dettagli dei pacchetti Pack 1 €2.000, Pack 2 €3.150, Pack 3 €5.100).` },
              { role: "user", content: `Genera email per: ${prospect.ragioneSociale}, settore: ${prospect.settore || "Fotovoltaico"}, regione: ${prospect.regione || "Italia"}, stato: ${prospect.statoContatto}, email: ${prospect.email || "non disponibile"}` },
            ],
            response_format: {
              type: "json_schema",
              json_schema: {
                name: "email_commerciale",
                strict: true,
                schema: {
                  type: "object",
                  properties: {
                    oggetto: { type: "string" },
                    corpo: { type: "string" },
                  },
                  required: ["oggetto","corpo"],
                  additionalProperties: false,
                },
              },
            },
          });
          const content = resp.choices?.[0]?.message?.content ?? "{}";
          return typeof content === "string" ? JSON.parse(content) : content;
        }),

      getPackInstallatore: adminProcedure
        .input(z.object({ prospectId: z.number() }))
        .query(async ({ input }) => {
          const tutti = await getProspectInstallatori();
          const prospect = (tutti as any[]).find(p => p.id === input.prospectId);
          if (!prospect) return { pack: [], installatore: null };
          const installatori = await getAllInstallatori();
          // getAllInstallatori restituisce { installatore: {...}, user: {...} } — usare .installatore per accedere ai campi
          const row = (installatori as any[]).find(r =>
            (prospect.email && r.installatore?.email && r.installatore.email.toLowerCase() === prospect.email.toLowerCase()) ||
            (r.installatore?.ragioneSociale && prospect.ragioneSociale && r.installatore.ragioneSociale.toLowerCase().includes(prospect.ragioneSociale.toLowerCase().slice(0, 10)))
          );
          if (!row) return { pack: [], installatore: null };
          const inst = row.installatore;
          const pack = await getPackAcquistatiByInstallatore(inst.id);
          return { pack, installatore: { id: inst.id, ragioneSociale: inst.ragioneSociale, stato: inst.stato } };
        }),
  // ─── CONFIGURAZIONE DOCUMENTI ──────────────────────────────────────────
    getConfigDocumenti: protectedProcedure
      .input(z.object({ tipoIter: z.string().optional() }).optional())
      .query(async ({ ctx, input }) => {
        if (ctx.user.role !== "admin") throw new TRPCError({ code: "FORBIDDEN" });
        return getAllConfigDocumenti();
      }),

    upsertConfigDocumento: protectedProcedure
      .input(z.object({
        tipoIter: z.string(),
        nomeDocumenti: z.string(),
        ordine: z.number().default(0),
        obbligatorio: z.boolean().default(false),
        importanza: z.enum(["obbligatorio", "consigliato", "opzionale"]).optional(),
        visibile: z.boolean().default(true),
        installatoreId: z.number().optional(),
        responsabileInserimento: z.enum(["sistema", "installatore"]).optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        if (ctx.user.role !== "admin") throw new TRPCError({ code: "FORBIDDEN" });
        const importanza = input.importanza ?? (input.obbligatorio ? "obbligatorio" : "opzionale");
        return upsertConfigDocumento({
          tipoIter: input.tipoIter,
          nomeDocumenti: input.nomeDocumenti,
          ordine: input.ordine,
          obbligatorio: importanza === "obbligatorio",
          importanza,
          visibile: input.visibile,
          responsabileInserimento: (input.responsabileInserimento ?? "installatore") as "sistema" | "installatore",
          installatoreId: input.installatoreId ?? null,
        });
      }),

     deleteConfigDocumento: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ ctx, input }) => {
        if (ctx.user.role !== "admin") throw new TRPCError({ code: "FORBIDDEN" });
        return deleteConfigDocumento(input.id);
      }),
    }),
  }),

  // ─── PACK CONFIGURAZIONE ─────────────────────────────────────────────────
  // ─── CONFIG STEP ITER ────────────────────────────────────────────────────────
  // Usa la tabella config_documenti esistente con prefisso _STEP_ per evitare nuove tabelle
  configStepIter: router({
    // Admin: leggi personalizzazioni step per un iter
    lista: adminProcedure
      .input(z.object({ tipoIter: z.string() }))
      .query(async ({ input }) => {
        const db = await getDb();
        if (!db) return [];
        const { eq, and, like } = await import("drizzle-orm");
        const rows = await db.select().from(configDocumenti)
          .where(and(
            eq(configDocumenti.tipoIter, input.tipoIter),
            like(configDocumenti.nomeDocumenti, "_STEP_%")
          ));
        return rows.map((r: any) => {
          const stepId = r.nomeDocumenti.replace("_STEP_", "");
          let parsed: any = {};
          try { parsed = JSON.parse(r.note || "{}"); } catch {}
          return { stepId, labelCustom: parsed.label, descrizioneCustom: parsed.descrizione };
        });
      }),

    // Admin: salva personalizzazione di uno step
    salva: adminProcedure
      .input(z.object({
        tipoIter: z.string(),
        stepId: z.string(),
        labelCustom: z.string().optional(),
        descrizioneCustom: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        const db = await getDb();
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
        const { eq, and, like } = await import("drizzle-orm");
        const nomeDoc = "_STEP_" + input.stepId;
        const noteJson = JSON.stringify({ label: input.labelCustom, descrizione: input.descrizioneCustom });
        const existing = await db.select().from(configDocumenti)
          .where(and(eq(configDocumenti.tipoIter, input.tipoIter), eq(configDocumenti.nomeDocumenti, nomeDoc)))
          .limit(1);
        if (existing.length > 0) {
          await db.update(configDocumenti).set({ note: noteJson }).where(eq(configDocumenti.id, existing[0].id));
        } else {
          await db.insert(configDocumenti).values({
            tipoIter: input.tipoIter,
            nomeDocumenti: nomeDoc,
            ordine: 0,
            importanza: "opzionale",
            visibile: false,
            responsabileInserimento: "sistema",
            note: noteJson,
          });
        }
        return { success: true };
      }),

    // Admin: ripristina step al valore originale
    ripristina: adminProcedure
      .input(z.object({ tipoIter: z.string(), stepId: z.string() }))
      .mutation(async ({ input }) => {
        const db = await getDb();
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
        const { eq, and } = await import("drizzle-orm");
        const nomeDoc = "_STEP_" + input.stepId;
        await db.delete(configDocumenti).where(and(eq(configDocumenti.tipoIter, input.tipoIter), eq(configDocumenti.nomeDocumenti, nomeDoc)));
        return { success: true };
      }),

    // Pubblica: leggi tutte le personalizzazioni
    tuttiGliStep: publicProcedure.query(async () => {
      const db = await getDb();
      if (!db) return [];
      const { like } = await import("drizzle-orm");
      const rows = await db.select().from(configDocumenti)
        .where(like(configDocumenti.nomeDocumenti, "_STEP_%"));
      return rows.map((r: any) => {
        const stepId = r.nomeDocumenti.replace("_STEP_", "");
        let parsed: any = {};
        try { parsed = JSON.parse(r.note || "{}"); } catch {}
        return { tipoIter: r.tipoIter, stepId, labelCustom: parsed.label, descrizioneCustom: parsed.descrizione };
      });
    }),
  }),

  packConfig: router({
    // Pubblica: lista pack attivi per home/acquista
    lista: publicProcedure.query(async () => {
      return getPackConfigurazione(true);
    }),
    // Admin: lista tutti i pack
    listaAdmin: adminProcedure.query(async () => {
      return getPackConfigurazione(false);
    }),
    // Admin: crea pack
    crea: adminProcedure
      .input(z.object({
        slug: z.string().min(2).max(50),
        nome: z.string().min(2),
        prezzo: z.number().min(0),
        praticheRes: z.number().min(0).default(0),
        prezzoRes: z.number().min(0).default(0),
        praticheBus: z.number().min(0).default(0),
        prezzoBus: z.number().min(0).default(0),
        descrizione: z.string().optional(),
        badge: z.string().optional(),
        colore: z.string().default("green"),
        attivo: z.boolean().default(true),
        ordine: z.number().default(0),
      }))
      .mutation(async ({ input }) => {
        return createPackConfigurazione({
          ...input,
          prezzo: String(input.prezzo),
          prezzoRes: String(input.prezzoRes),
          prezzoBus: String(input.prezzoBus),
        } as any);
      }),
    // Admin: modifica pack
    modifica: adminProcedure
      .input(z.object({
        id: z.number(),
        nome: z.string().min(2).optional(),
        prezzo: z.number().min(0).optional(),
        praticheRes: z.number().min(0).optional(),
        prezzoRes: z.number().min(0).optional(),
        praticheBus: z.number().min(0).optional(),
        prezzoBus: z.number().min(0).optional(),
        descrizione: z.string().optional(),
        badge: z.string().nullable().optional(),
        colore: z.string().optional(),
        attivo: z.boolean().optional(),
        ordine: z.number().optional(),
      }))
      .mutation(async ({ input }) => {
        const { id, prezzo, prezzoRes, prezzoBus, ...rest } = input;
        const data: any = { ...rest };
        if (prezzo !== undefined) data.prezzo = String(prezzo);
        if (prezzoRes !== undefined) data.prezzoRes = String(prezzoRes);
        if (prezzoBus !== undefined) data.prezzoBus = String(prezzoBus);
        return updatePackConfigurazione(id, data);
      }),
    // Admin: elimina pack
    elimina: adminProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        await deletePackConfigurazione(input.id);
        return { success: true };
      }),
  }),

  // ─── RICARICHE CONFIGURAZIONE ─────────────────────────────────────────────
  ricaricheConfig: router({
    // Pubblica: lista ricariche attive
    lista: publicProcedure.query(async () => {
      return getRicaricheConfigurazione(true);
    }),
    // Admin: lista tutte le ricariche
    listaAdmin: adminProcedure.query(async () => {
      return getRicaricheConfigurazione(false);
    }),
    // Admin: crea ricarica
    crea: adminProcedure
      .input(z.object({
        slug: z.string().min(2).max(50),
        nome: z.string().min(2),
        prezzo: z.number().min(0),
        descrizione: z.string().optional(),
        badge: z.string().optional(),
        icona: z.string().default("zap"),
        attivo: z.boolean().default(true),
        ordine: z.number().default(0),
      }))
      .mutation(async ({ input }) => {
        return createRicaricaConfigurazione({ ...input, prezzo: String(input.prezzo) } as any);
      }),
    // Admin: modifica ricarica
    modifica: adminProcedure
      .input(z.object({
        id: z.number(),
        nome: z.string().min(2).optional(),
        prezzo: z.number().min(0).optional(),
        descrizione: z.string().optional(),
        badge: z.string().nullable().optional(),
        icona: z.string().optional(),
        attivo: z.boolean().optional(),
        ordine: z.number().optional(),
      }))
      .mutation(async ({ input }) => {
        const { id, prezzo, ...rest } = input;
        const data: any = { ...rest };
        if (prezzo !== undefined) data.prezzo = String(prezzo);
        return updateRicaricaConfigurazione(id, data);
      }),
    // Admin: elimina ricarica
    elimina: adminProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        await deleteRicaricaConfigurazione(input.id);
        return { success: true };
      }),
  }),

  // ─── PROMO INSTALLATORE ───────────────────────────────────────────────────
  promo: router({
    // Pubblica: promo per la home page (visibilita = 'home', attive)
    getPromoHome: publicProcedure.query(async () => {
      const all = await getAllPromoAdmin();
      const now = new Date();
      return all.filter((p: any) => {
        if (!p.attivo) return false;
        if (p.scadenza && new Date(p.scadenza) < now) return false;
        // 'home' = solo home pubblica, 'tutti' = tutti gli installatori + home pubblica
        if (p.visibilita === 'home' || p.visibilita === 'tutti') return true;
        // Retrocompatibilità: promo globali senza visibilita
        if (!p.visibilita && (!p.installatoreId || p.installatoreId === 0)) return true;
        return false;
      });
    }),
    // Installatore: le mie promo (visibilita = 'home' o 'tutti' o 'singolo' con il suo ID)
    mie: protectedProcedure.query(async ({ ctx }) => {
      const inst = await getInstallatoreByUserId(ctx.user.id);
      if (!inst) return [];
      const all = await getAllPromoAdmin();
      return all.filter((p: any) => {
        if (!p.attivo) return false;
        if (p.scadenza && new Date(p.scadenza) < new Date()) return false;
        if (p.visibilita === 'home' || p.visibilita === 'tutti') return true;
        if (p.visibilita === 'singolo' && p.installatoreId === inst.id) return true;
        // Retrocompatibilità: vecchie promo senza visibilita
        if (!p.visibilita && (!p.installatoreId || p.installatoreId === 0)) return true;
        if (!p.visibilita && p.installatoreId === inst.id) return true;
        return false;
      });
    }),
    // Admin: lista tutte le promo
    listaAdmin: adminProcedure.query(async () => {
      return getAllPromoAdmin();
    }),
    // Admin: crea promo
    crea: adminProcedure
      .input(z.object({
        installatoreId: z.number().default(0), // 0 = globale
        titolo: z.string().min(2),
        descrizione: z.string().optional(),
        prezzo: z.number().optional(),
        prezzoOriginale: z.number().optional(),
        cta: z.string().default("Scopri di più"),
        ctaUrl: z.string().optional(),
        scadenza: z.string().optional(), // ISO date string
        attivo: z.boolean().default(true),
        colore: z.string().default("yellow"),
        ordine: z.number().default(0),
        visibilita: z.enum(["singolo", "tutti", "home"]).default("home"),
      }))
      .mutation(async ({ input }) => {
        const data: any = {
          ...input,
          prezzo: input.prezzo !== undefined ? String(input.prezzo) : null,
          prezzoOriginale: input.prezzoOriginale !== undefined ? String(input.prezzoOriginale) : null,
          scadenza: input.scadenza ? new Date(input.scadenza) : null,
        };
        return createPromoInstallatore(data);
      }),
    // Admin: modifica promo
    modifica: adminProcedure
      .input(z.object({
        id: z.number(),
        installatoreId: z.number().optional(),
        titolo: z.string().min(2).optional(),
        descrizione: z.string().optional(),
        prezzo: z.number().nullable().optional(),
        prezzoOriginale: z.number().nullable().optional(),
        cta: z.string().optional(),
        ctaUrl: z.string().nullable().optional(),
        scadenza: z.string().nullable().optional(),
        attivo: z.boolean().optional(),
        colore: z.string().optional(),
        ordine: z.number().optional(),
        visibilita: z.enum(["singolo", "tutti", "home"]).optional(),
      }))
      .mutation(async ({ input }) => {
        const { id, prezzo, prezzoOriginale, scadenza, ...rest } = input;
        const data: any = { ...rest };
        if (prezzo !== undefined) data.prezzo = prezzo !== null ? String(prezzo) : null;
        if (prezzoOriginale !== undefined) data.prezzoOriginale = prezzoOriginale !== null ? String(prezzoOriginale) : null;
        if (scadenza !== undefined) data.scadenza = scadenza ? new Date(scadenza) : null;
        return updatePromoInstallatore(id, data);
      }),
    // Admin: elimina promo
    elimina: adminProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        await deletePromoInstallatore(input.id);
        return { success: true };
      }),
  }),

  // ─── PREMI ─────────────────────────────────────────────────────────────────
  premi: router({
    // ─── BOLLETTE ────────────────────────────────────────────────────────────
    // Installatore: invia una bolletta per ottenere credito
    inviaBolletta: protectedProcedure
      .input(z.object({
        nomeCliente: z.string().min(1),
        telefonoCliente: z.string().optional(),
        emailCliente: z.string().email().optional(),
        fileUrl: z.string().optional(),
        fileKey: z.string().optional(),
        nomeFile: z.string().optional(),
        note: z.string().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        const db = await getDb();
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB non disponibile" });
        const installatore = await getInstallatoreByUserId(ctx.user.id);
        if (!installatore) throw new TRPCError({ code: "NOT_FOUND", message: "Profilo installatore non trovato" });
        await db.insert(premiBollette).values({
          installatoreId: installatore.id,
          nomeCliente: input.nomeCliente,
          telefonoCliente: input.telefonoCliente,
          emailCliente: input.emailCliente,
          fileUrl: input.fileUrl,
          fileKey: input.fileKey,
          nomeFile: input.nomeFile,
          note: input.note,
          stato: "in_attesa",
        });
        await notifyOwner({ title: "Nuova bolletta inviata", content: `${installatore.ragioneSociale} ha inviato una bolletta per ${input.nomeCliente}. In attesa di revisione.` });
        return { success: true };
      }),

    // Installatore: lista delle proprie bollette inviate
    mieBollette: protectedProcedure.query(async ({ ctx }) => {
      const db = await getDb();
      if (!db) return [];
      const installatore = await getInstallatoreByUserId(ctx.user.id);
      if (!installatore) return [];
      return db.select().from(premiBollette).where(eq(premiBollette.installatoreId, installatore.id)).orderBy(desc(premiBollette.createdAt));
    }),

    // ─── NOMINATIVI ──────────────────────────────────────────────────────────
    // Installatore: segnala un nominativo installatore
    segnalaNominativo: protectedProcedure
      .input(z.object({
        nomeInstallatore: z.string().min(1),
        azienda: z.string().optional(),
        telefono: z.string().optional(),
        email: z.string().email().optional(),
        citta: z.string().optional(),
        note: z.string().optional(),
        pacchettoDiInteresse: z.string().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        const db = await getDb();
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB non disponibile" });
        const installatore = await getInstallatoreByUserId(ctx.user.id);
        if (!installatore) throw new TRPCError({ code: "NOT_FOUND", message: "Profilo installatore non trovato" });
        await db.insert(premiNominativi).values({
          installatoreId: installatore.id,
          nomeInstallatore: input.nomeInstallatore,
          azienda: input.azienda,
          telefono: input.telefono,
          email: input.email,
          citta: input.citta,
          note: input.note,
          pacchettoDiInteresse: input.pacchettoDiInteresse,
          stato: "in_attesa",
        });
        await notifyOwner({ title: "Nuovo nominativo segnalato", content: `${installatore.ragioneSociale} ha segnalato: ${input.nomeInstallatore}${input.azienda ? ` (${input.azienda})` : ""}.` });
        return { success: true };
      }),

    // Installatore: lista dei propri nominativi segnalati
    mieiNominativi: protectedProcedure.query(async ({ ctx }) => {
      const db = await getDb();
      if (!db) return [];
      const installatore = await getInstallatoreByUserId(ctx.user.id);
      if (!installatore) return [];
      return db.select().from(premiNominativi).where(eq(premiNominativi.installatoreId, installatore.id)).orderBy(desc(premiNominativi.createdAt));
    }),

    // ─── CODICI REFERRAL ─────────────────────────────────────────────────────
    // Installatore: riscatta un codice referral
    riscattaCodice: protectedProcedure
      .input(z.object({ codice: z.string().min(1) }))
      .mutation(async ({ input, ctx }) => {
        const db = await getDb();
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB non disponibile" });
        const installatore = await getInstallatoreByUserId(ctx.user.id);
        if (!installatore) throw new TRPCError({ code: "NOT_FOUND", message: "Profilo installatore non trovato" });
        const codiceResult = await db.select().from(premiCodici).where(eq(premiCodici.codice, input.codice.toUpperCase())).limit(1);
        if (!codiceResult || codiceResult.length === 0) throw new TRPCError({ code: "NOT_FOUND", message: "Codice non trovato" });
        const codice = codiceResult[0];
        if (!codice.attivo) throw new TRPCError({ code: "BAD_REQUEST", message: "Questo codice non è più attivo" });
        // Nota: i codici promo possono essere riscattati più volte (nessun vincolo usa-solo-una-volta)
        if (codice.installatoreIdAssegnato && codice.installatoreIdAssegnato !== installatore.id) throw new TRPCError({ code: "FORBIDDEN", message: "Questo codice non è assegnato al tuo account" });
        // Riscatta il codice
        await db.update(premiCodici).set({ installatoreIdRiscattato: installatore.id, riscattatoAt: new Date() }).where(eq(premiCodici.id, codice.id));
        // Ricarica il credito dell'installatore
        const valoreCredito = parseFloat(codice.valoreCreditoEur as string || "0");
        if (valoreCredito > 0) {
          const creditoAttuale = parseFloat(installatore.creditoResiduo as string || "0");
          const creditoTotaleAttuale = parseFloat(installatore.creditoTotale as string || "0");
          await db.update(installatori).set({
            creditoResiduo: String(creditoAttuale + valoreCredito),
            creditoTotale: String(creditoTotaleAttuale + valoreCredito),
          }).where(eq(installatori.id, installatore.id));
        }
        await notifyOwner({ title: "Codice promo riscattato", content: `${installatore.ragioneSociale} ha riscattato il codice promo ${codice.codice} (€${codice.valoreCreditoEur}).` });
        return { success: true, credito: parseFloat(codice.valoreCreditoEur as string || "0") };
      }),

    // ─── ADMIN: GESTIONE BOLLETTE ─────────────────────────────────────────────
    // Admin: ottieni signed URL per visualizzare la bolletta
    getBollettaUrl: adminProcedure
      .input(z.object({ bolletaId: z.number() }))
      .query(async ({ input }) => {
        const db = await getDb();
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
        const rows = await db.select().from(premiBollette).where(eq(premiBollette.id, input.bolletaId)).limit(1);
        if (!rows.length) throw new TRPCError({ code: "NOT_FOUND" });
        const b = rows[0];
        // Se c'è un fileKey (storage Manus), genera signed URL
        if ((b as any).fileKey) {
          const url = await storageGetSignedUrl((b as any).fileKey);
          return { url, nomeFile: (b as any).nomeFile };
        }
        // Fallback: usa fileUrl diretto
        return { url: b.fileUrl, nomeFile: (b as any).nomeFile };
      }),

    adminBollette: adminProcedure.query(async () => {
      const db = await getDb();
      if (!db) return [];
      const rows = await db.select({ bolletta: premiBollette, installatore: installatori }).from(premiBollette).leftJoin(installatori, eq(premiBollette.installatoreId, installatori.id)).orderBy(desc(premiBollette.createdAt));
      return rows;
    }),

    adminApprovaBolletta: adminProcedure
      .input(z.object({ id: z.number(), creditoAssegnato: z.number().min(0), noteAdmin: z.string().optional() }))
      .mutation(async ({ input }) => {
        const db = await getDb();
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB non disponibile" });
        const bolletteResult = await db.select().from(premiBollette).where(eq(premiBollette.id, input.id)).limit(1);
        if (!bolletteResult || bolletteResult.length === 0) throw new TRPCError({ code: "NOT_FOUND", message: "Bolletta non trovata" });
        const bolletta = bolletteResult[0];
        await db.update(premiBollette).set({ stato: "approvato", creditoAssegnato: String(input.creditoAssegnato), noteAdmin: input.noteAdmin }).where(eq(premiBollette.id, input.id));
        // Ricarica il credito dell'installatore
        if (input.creditoAssegnato > 0) {
          const instResult = await db.select().from(installatori).where(eq(installatori.id, bolletta.installatoreId)).limit(1);
          if (instResult && instResult.length > 0) {
            const inst = instResult[0];
            const creditoAttuale = parseFloat(inst.creditoResiduo as string || "0");
            const creditoTotaleAttuale = parseFloat(inst.creditoTotale as string || "0");
            await db.update(installatori).set({
              creditoResiduo: String(creditoAttuale + input.creditoAssegnato),
              creditoTotale: String(creditoTotaleAttuale + input.creditoAssegnato),
            }).where(eq(installatori.id, bolletta.installatoreId));
          }
        }
        return { success: true };
      }),

    adminRifiutaBolletta: adminProcedure
      .input(z.object({ id: z.number(), noteAdmin: z.string().optional() }))
      .mutation(async ({ input }) => {
        const db = await getDb();
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB non disponibile" });
        await db.update(premiBollette).set({ stato: "rifiutato", noteAdmin: input.noteAdmin }).where(eq(premiBollette.id, input.id));
        return { success: true };
      }),

    // ─── ADMIN: GESTIONE NOMINATIVI ───────────────────────────────────────────
    adminNominativi: adminProcedure.query(async () => {
      const db = await getDb();
      if (!db) return [];
      const rows = await db.select({ nominativo: premiNominativi, installatore: installatori }).from(premiNominativi).leftJoin(installatori, eq(premiNominativi.installatoreId, installatori.id)).orderBy(desc(premiNominativi.createdAt));
      return rows;
    }),

    adminAggiornaStatoNominativo: adminProcedure
      .input(z.object({ id: z.number(), stato: z.enum(["in_attesa", "contattato", "convertito", "non_interessato"]), creditoAssegnato: z.number().min(0).optional(), noteAdmin: z.string().optional() }))
      .mutation(async ({ input }) => {
        const db = await getDb();
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB non disponibile" });
        await db.update(premiNominativi).set({ stato: input.stato, creditoAssegnato: input.creditoAssegnato !== undefined ? String(input.creditoAssegnato) : undefined, noteAdmin: input.noteAdmin }).where(eq(premiNominativi.id, input.id));
        // Se convertito e credito > 0, ricarica il credito dell'installatore
        if (input.stato === "convertito" && input.creditoAssegnato && input.creditoAssegnato > 0) {
          const nomResult = await db.select().from(premiNominativi).where(eq(premiNominativi.id, input.id)).limit(1);
          if (nomResult && nomResult.length > 0) {
            const nom = nomResult[0];
            const instResult = await db.select().from(installatori).where(eq(installatori.id, nom.installatoreId)).limit(1);
            if (instResult && instResult.length > 0) {
              const inst = instResult[0];
              const creditoAttuale = parseFloat(inst.creditoResiduo as string || "0");
              const creditoTotaleAttuale = parseFloat(inst.creditoTotale as string || "0");
              await db.update(installatori).set({
                creditoResiduo: String(creditoAttuale + input.creditoAssegnato),
                creditoTotale: String(creditoTotaleAttuale + input.creditoAssegnato),
              }).where(eq(installatori.id, nom.installatoreId));
            }
          }
        }
        return { success: true };
      }),

    // ─── ADMIN: GESTIONE CODICI REFERRAL ─────────────────────────────────────
    adminCodici: adminProcedure.query(async () => {
      const db = await getDb();
      if (!db) return [];
      return db.select().from(premiCodici).orderBy(desc(premiCodici.createdAt));
    }),

    adminCreaCodice: adminProcedure
      .input(z.object({
        codice: z.string().min(3).max(50).optional(), // se non specificato, genera automaticamente
        descrizione: z.string().optional(),
        valoreCreditoEur: z.number().min(0.01),
        installatoreIdAssegnato: z.number().optional(),
        usatoUnaVolta: z.boolean().default(true),
      }))
      .mutation(async ({ input }) => {
        const db = await getDb();
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB non disponibile" });
        const codice = input.codice?.toUpperCase() || `REF${Date.now().toString(36).toUpperCase()}`;
        // Verifica unicità
        const existing = await db.select().from(premiCodici).where(eq(premiCodici.codice, codice)).limit(1);
        if (existing && existing.length > 0) throw new TRPCError({ code: "CONFLICT", message: "Codice già esistente" });
        await db.insert(premiCodici).values({
          codice,
          descrizione: input.descrizione,
          valoreCreditoEur: String(input.valoreCreditoEur),
          installatoreIdAssegnato: input.installatoreIdAssegnato,
          attivo: true,
          usatoUnaVolta: input.usatoUnaVolta,
        });
        return { success: true, codice };
      }),

    adminDisattivaCodice: adminProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        const db = await getDb();
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB non disponibile" });
        await db.update(premiCodici).set({ attivo: false }).where(eq(premiCodici.id, input.id));
        return { success: true };
      }),

    // Lista premi per l'installatore loggato (compatibilità)
    lista: protectedProcedure.query(async ({ ctx }) => {
      const installatore = await getInstallatoreByUserId(ctx.user.id);
      if (!installatore) return [];
      return [] as Array<{ id: number; nome: string; valore: string; descrizione: string }>;
    }),

    // ─── WHATSAPP MESSAGING ─────────────────────────────────────────────────
    sendWhatsApp: adminProcedure
      .input(z.object({
        installatoreId: z.number(),
        messaggio: z.string().min(1).max(1000),
      }))
      .mutation(async ({ input }) => {
        const db = await getDb();
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB non disponibile" });
        
        // Verifica che l'installatore abbia dato il consenso GDPR
        const instResult = await db.select().from(installatori).where(eq(installatori.id, input.installatoreId)).limit(1);
        const inst = instResult[0];
        if (!inst) throw new TRPCError({ code: "NOT_FOUND", message: "Installatore non trovato" });
        if (!inst.consensoWhatsApp) throw new TRPCError({ code: "FORBIDDEN", message: "Installatore non ha dato il consenso WhatsApp" });
        if (!inst.telefono) throw new TRPCError({ code: "BAD_REQUEST", message: "Numero di telefono non disponibile" });
        
        // Log del messaggio per tracciabilità GDPR
        console.log(`[WhatsApp] Messaggio inviato a ${inst.ragioneSociale} (${inst.telefono}): ${input.messaggio}`);
        
        // TODO: Integrare con API WhatsApp (Twilio, WhatsApp Business API, ecc.)
        // Per ora, ritorniamo un successo simulato
        return { success: true, message: "Messaggio WhatsApp inviato", telefono: inst.telefono };
      }),
  }),

  fatturazione: router({
    generaFattura: adminProcedure
      .input(z.object({ ordineId: z.number() }))
      .mutation(async ({ input }) => {
        const db = await getDb();
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB non disponibile" });
        const ordineResult = await db.select().from(ordini).where(eq(ordini.id, input.ordineId)).limit(1);
        const ordine = ordineResult[0];
        if (!ordine) throw new TRPCError({ code: "NOT_FOUND", message: "Ordine non trovato" });
        const installatoriResult = await db.select().from(installatori).where(eq(installatori.id, ordine.installatoreId)).limit(1);
        const installatore = installatoriResult[0];
        if (!installatore) throw new TRPCError({ code: "NOT_FOUND", message: "Installatore non trovato" });
        try {
          const numeroFattura = `FAT-${new Date().getFullYear()}-${String(ordine.id).padStart(5, "0")}`;
          const fatturaXML = `<?xml version="1.0" encoding="UTF-8"?>
<FatturaElettronica versione="FPR12">
  <FatturaElettronicaHeader>
    <DatiTrasmissione>
      <IdTrasmittente>
        <IdPaese>IT</IdPaese>
        <IdCodice>12345678901</IdCodice>
      </IdTrasmittente>
      <ProgressivoInvio>1</ProgressivoInvio>
      <FormatoTrasmissione>FPR12</FormatoTrasmissione>
    </DatiTrasmissione>
  </FatturaElettronicaHeader>
  <FatturaElettronicaBody>
    <DatiGenerali>
      <DatiGeneraliDocumento>
        <TipoDocumento>TD01</TipoDocumento>
        <Numero>${numeroFattura}</Numero>
        <Data>${new Date().toISOString().split("T")[0]}</Data>
        <Importo>${(ordine.importo / 100).toFixed(2)}</Importo>
      </DatiGeneraliDocumento>
    </DatiGenerali>
  </FatturaElettronicaBody>
</FatturaElettronica>`;
          const fatturaUrl = await storagePut(`fatture/${numeroFattura}.xml`, fatturaXML, "application/xml");
          await db.update(ordini).set({ fatturaUrl: fatturaUrl.url }).where(eq(ordini.id, input.ordineId));
          return { success: true, numeroFattura, fatturaUrl: fatturaUrl.url };
        } catch (error) {
          console.error("Errore generazione fattura:", error);
          return { success: false, message: "Errore nella generazione della fattura" };
        }
      }),
  }),

  webhook: router({
    paypalIPN: publicProcedure
      .input(z.object({ txn_id: z.string(), payment_status: z.string(), custom: z.string(), mc_gross: z.string() }))
      .mutation(async ({ input }) => {
        const db = await getDb();
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB non disponibile" });
        if (input.payment_status !== "Completed") return { success: false, message: "Pagamento non completato" };
        try {
          const ordineId = Number(input.custom);
          const ordineResult = await db.select().from(ordini).where(eq(ordini.id, ordineId)).limit(1);
          const ordine = ordineResult[0];
          if (!ordine) throw new Error("Ordine non trovato");
          await db.update(ordini).set({ stato: "pagato", metodoPagamento: "paypal", txn_id: input.txn_id }).where(eq(ordini.id, ordineId));
          const installatoriResult = await db.select().from(installatori).where(eq(installatori.id, ordine.installatoreId)).limit(1);
          const installatore = installatoriResult[0];
          if (installatore?.email) {
            await fetch(process.env.VITE_FRONTEND_FORGE_API_URL + "/notification/send-email", {
              method: "POST",
              headers: { "Authorization": `Bearer ${process.env.VITE_FRONTEND_FORGE_API_KEY}`, "Content-Type": "application/json" },
              body: JSON.stringify({
                to: installatore.email,
                subject: `Pagamento confermato - Ordine #${ordineId}`,
                html: `<h2>Pagamento Confermato</h2><p>Il tuo pagamento PayPal è stato elaborato con successo.</p><p>Ordine: #${ordineId}</p><p>Importo: €${(ordine.importo / 100).toFixed(2)}</p>`
              })
            });
          }
          return { success: true, message: "Webhook PayPal elaborato" };
        } catch (error) {
          console.error("Errore webhook PayPal:", error);
          return { success: false, message: "Errore elaborazione webhook" };
        }
      }),
  }),

  email: router({
    inviaRicevuta: protectedProcedure
      .input(z.object({ ordineId: z.number(), emailDestinatario: z.string().email() }))
      .mutation(async ({ input, ctx }) => {
        const db = await getDb();
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB non disponibile" });
        const ordineResult = await db.select().from(ordini).where(eq(ordini.id, input.ordineId)).limit(1);
        const ordine = ordineResult[0];
        if (!ordine) throw new TRPCError({ code: "NOT_FOUND", message: "Ordine non trovato" });
        try {
          const response = await fetch(process.env.VITE_FRONTEND_FORGE_API_URL + "/notification/send-email", {
            method: "POST",
            headers: { "Authorization": `Bearer ${process.env.VITE_FRONTEND_FORGE_API_KEY}`, "Content-Type": "application/json" },
            body: JSON.stringify({
              to: input.emailDestinatario,
              subject: `Ricevuta Ordine #${ordine.id}`,
              html: `<h2>Ricevuta Ordine</h2><p>Ordine: #${ordine.id}</p><p>Importo: €${(ordine.importo / 100).toFixed(2)}</p><p>Data: ${new Date(ordine.createdAt).toLocaleDateString("it-IT")}</p><p>Grazie per l'acquisto!</p>`
            })
          });
          if (!response.ok) throw new Error("Errore invio email");
          return { success: true, message: "Email inviata con successo" };
        } catch (error) {
          console.error("Errore invio email:", error);
          return { success: false, message: "Errore nell'invio dell'email" };
        }
      }),
  }),
});
// ─── PROCEDURA PUBBLICA PER CONFIG DOCUMENTI ──────────────────────────────
// Estendi appRouter con procedura per installatori
export type AppRouter = typeof appRouter;
