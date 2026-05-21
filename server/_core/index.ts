import "dotenv/config";
import express from "express";
import { createServer } from "http";
import net from "net";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { registerOAuthRoutes } from "./oauth";
import { registerStorageProxy } from "./storageProxy";
import { appRouter } from "../routers";
import { createContext } from "./context";
import { serveStatic, setupVite } from "./vite";
import { getAllInstallatori, getAllOrdini, getAllPratiche, getAllDocumenti, createBackupStorico, getBackupConfig, upsertBackupConfig, getOrdineById, getInstallatoreById, getProspectInstallatori, updateProspectInstallatore } from "../db";
import { notifyOwner } from "./notification";
import { storagePut } from "../storage";
import { generateRicevutaPDF } from "../pdf";
import { sdk } from "./sdk";

function isPortAvailable(port: number): Promise<boolean> {
  return new Promise(resolve => {
    const server = net.createServer();
    server.listen(port, () => {
      server.close(() => resolve(true));
    });
    server.on("error", () => resolve(false));
  });
}

async function findAvailablePort(startPort: number = 3000): Promise<number> {
  for (let port = startPort; port < startPort + 20; port++) {
    if (await isPortAvailable(port)) {
      return port;
    }
  }
  throw new Error(`No available port found starting from ${startPort}`);
}

async function startServer() {
  const app = express();
  const server = createServer(app);
  // Configure body parser with larger size limit for file uploads
  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ limit: "50mb", extended: true }));
  registerStorageProxy(app);
  registerOAuthRoutes(app);

  // ─── ENDPOINT BACKUP AUTOMATICO SCHEDULATO ────────────────────────────────
  app.post("/api/scheduled/backup", async (req, res) => {
    try {
      const [installatori, ordini, pratiche, documenti] = await Promise.all([
        getAllInstallatori(),
        getAllOrdini(),
        getAllPratiche(),
        getAllDocumenti(),
      ]);
      const backupData = {
        versione: "1.0",
        dataEsportazione: new Date().toISOString(),
        sito: "Ricaricati di Connessioni",
        installatori,
        ordini,
        pratiche,
        documenti,
      };
      const json = JSON.stringify(backupData, null, 2);
      const bytes = Buffer.from(json, "utf-8");
      const key = `backups/ricaricati-backup-${new Date().toISOString().slice(0, 19).replace(/:/g, "-")}-automatico.json`;
      const { url } = await storagePut(key, bytes, "application/json");
      await createBackupStorico({
        storageKey: key,
        storageUrl: url,
        dimensioneBytes: bytes.length,
        stato: "completato",
        tipo: "automatico",
      });
      const config = await getBackupConfig();
      if (config) {
        await upsertBackupConfig({ frequenza: config.frequenza, attivo: config.attivo });
      }
      console.log(`[Backup] Backup automatico completato: ${key} (${bytes.length} bytes)`);
      res.json({ success: true, key, dimensioneBytes: bytes.length });
    } catch (err: any) {
      console.error("[Backup] Errore backup automatico:", err);
      res.status(500).json({ success: false, error: err?.message ?? String(err) });
    }
  });

  // ─── ENDPOINT FOLLOW-UP AUTOMATICO LEAD INGROSSO ─────────────────────
  app.post("/api/scheduled/followup-ingrosso", async (req, res) => {
    try {
      const now = new Date();
      const MS_PER_DAY = 24 * 60 * 60 * 1000;
      // Prendi tutti i prospect con stato "nuovo" e fonte landing ingrosso
      const prospects = await getProspectInstallatori({ statoContatto: "nuovo" });
      const leadIngrosso = (prospects as any[]).filter((p) =>
        p.fonte === "altro" && typeof p.note === "string" && p.note.includes("[LEAD INGROSSO]")
      );
      let reminder2 = 0;
      let reminder7 = 0;
      for (const lead of leadIngrosso) {
        const giorniDa = Math.floor((now.getTime() - new Date(lead.createdAt).getTime()) / MS_PER_DAY);
        const step = lead.sequenzaStep ?? 0;
        const tel = lead.telefono
          ? `https://wa.me/39${String(lead.telefono).replace(/\D/g, "")}`
          : "(nessun telefono)";
        const categoria = String(lead.note ?? "").match(/Categoria: ([^\n]+)/)?.[1] ?? "-";
        // Reminder giorno 2 (non ancora contattato)
        if (giorniDa >= 2 && giorniDa < 3 && step === 0) {
          await notifyOwner({
            title: `⏰ Reminder Giorno 2 — ${lead.ragioneSociale}`,
            content: `Il lead **${lead.ragioneSociale}** (${categoria}) si è registrato 2 giorni fa dalla landing /ingrosso e non è ancora stato contattato.\n\nTelefono: ${lead.telefono ?? "-"}\nWhatsApp: ${tel}\n\nContattalo ora prima che si raffreddi!`,
          });
          await updateProspectInstallatore(lead.id, { sequenzaStep: 1, sequenzaUltimoStep: now });
          reminder2++;
        }
        // Reminder giorno 7 (reminder 2 già inviato, ancora senza risposta)
        if (giorniDa >= 7 && giorniDa < 8 && step === 1) {
          await notifyOwner({
            title: `🔔 Ultimo Reminder — ${lead.ragioneSociale} (7 giorni)`,
            content: `Il lead **${lead.ragioneSociale}** è nella pipeline da 7 giorni senza risposta. È l'ultimo reminder automatico.\n\nTelefono: ${lead.telefono ?? "-"}\nWhatsApp: ${tel}\n\nSe non risponde, considera di cambiare stato a "Non Interessato" nel CRM.`,
          });
          await updateProspectInstallatore(lead.id, { sequenzaStep: 2, sequenzaUltimoStep: now });
          reminder7++;
        }
      }
      console.log(`[FollowUp] Reminder inviati: giorno2=${reminder2}, giorno7=${reminder7}, totale lead=${leadIngrosso.length}`);
      res.json({ success: true, reminder2, reminder7, totaleLeadIngrosso: leadIngrosso.length });
    } catch (err: any) {
      console.error("[FollowUp] Errore:", err);
      res.status(500).json({ success: false, error: err?.message ?? String(err) });
    }
  });

  // ─── ENDPOINT DOWNLOAD PDF RICEVUTA ─────────────────────────────────────
  app.get("/api/ordini/:id/ricevuta.pdf", async (req, res) => {
    try {
      // Autenticazione tramite cookie di sessione
      let user: any = null;
      try { user = await sdk.authenticateRequest(req as any); } catch { /* not authenticated */ }
      if (!user) { res.status(401).json({ error: "Non autenticato" }); return; }

      const ordineId = parseInt(req.params.id);
      if (isNaN(ordineId)) { res.status(400).json({ error: "ID non valido" }); return; }

      const ordine = await getOrdineById(ordineId);
      if (!ordine) { res.status(404).json({ error: "Ordine non trovato" }); return; }

      // Verifica che l'ordine appartenga all'utente (o che sia admin)
      if (ordine.userId !== user.id && user.role !== "admin") {
        res.status(403).json({ error: "Accesso negato" }); return;
      }

      // Dati installatore (se collegato)
      const installatore = ordine.installatoreId ? await getInstallatoreById(ordine.installatoreId) : null;

      const pdfBuffer = await generateRicevutaPDF({
        id: ordine.id,
        packId: ordine.packId,
        importo: ordine.importo,
        metodoPagamento: ordine.metodoPagamento,
        stato: ordine.stato,
        nomeAcquirente: ordine.nomeAcquirente,
        emailAcquirente: ordine.emailAcquirente,
        telefonoAcquirente: ordine.telefonoAcquirente,
        ragioneSocialeAcquirente: ordine.ragioneSocialeAcquirente,
        note: ordine.note,
        pratiche_incluse: ordine.pratiche_incluse,
        pratiche_incluse_residenziali: ordine.pratiche_incluse_residenziali,
        pratiche_incluse_business: ordine.pratiche_incluse_business,
        createdAt: ordine.createdAt,
        installatoreRagioneSociale: installatore?.ragioneSociale ?? null,
        installatorePartitaIva: installatore?.partitaIva ?? null,
        installatoreCitta: installatore?.citta ?? null,
        installatoreProvincia: installatore?.provincia ?? null,
      });

      const filename = `ricevuta-ordine-${String(ordine.id).padStart(5, "0")}.pdf`;
      res.setHeader("Content-Type", "application/pdf");
      res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
      res.setHeader("Content-Length", pdfBuffer.length);
      res.send(pdfBuffer);
    } catch (err: any) {
      console.error("[PDF] Errore generazione ricevuta:", err);
      res.status(500).json({ error: err?.message ?? "Errore interno" });
    }
  });

  // ─── ENDPOINT UPLOAD ALLEGATO BOLLETTA ─────────────────────────────────────
  app.post("/api/premi/upload-bolletta", async (req, res) => {
    try {
      let user: any = null;
      try { user = await sdk.authenticateRequest(req as any); } catch { /* not authenticated */ }
      if (!user) { res.status(401).json({ error: "Non autenticato" }); return; }

      // Il file arriva come base64 nel body JSON
      const { base64, mimeType, nomeFile } = req.body;
      if (!base64 || !mimeType || !nomeFile) {
        res.status(400).json({ error: "Parametri mancanti: base64, mimeType, nomeFile" }); return;
      }

      const MAX_SIZE = 16 * 1024 * 1024; // 16MB
      const buffer = Buffer.from(base64, "base64");
      if (buffer.length > MAX_SIZE) {
        res.status(400).json({ error: "File troppo grande (max 16MB)" }); return;
      }

      const ext = nomeFile.split(".").pop()?.toLowerCase() || "bin";
      const key = `premi/bollette/${user.id}-${Date.now()}.${ext}`;
      const { url } = await storagePut(key, buffer, mimeType);

      res.json({ success: true, fileUrl: url, fileKey: key, nomeFile });
    } catch (err: any) {
      console.error("[Upload Bolletta] Errore:", err);
      res.status(500).json({ error: err?.message ?? "Errore interno" });
    }
  });

  // tRPC API
  app.use(
    "/api/trpc",
    createExpressMiddleware({
      router: appRouter,
      createContext,
    })
  );
  // development mode uses Vite, production mode uses static files
  if (process.env.NODE_ENV === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  const preferredPort = parseInt(process.env.PORT || "3000");
  const port = await findAvailablePort(preferredPort);

  if (port !== preferredPort) {
    console.log(`Port ${preferredPort} is busy, using port ${port} instead`);
  }

  server.listen(port, () => {
    console.log(`Server running on http://localhost:${port}/`);
  });
}

startServer().catch(console.error);
