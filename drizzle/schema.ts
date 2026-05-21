import {
  int,
  mysqlEnum,
  mysqlTable,
  text,
  timestamp,
  varchar,
  decimal,
  boolean,
} from "drizzle-orm/mysql-core";

export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  password: varchar("password", { length: 255 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

// Installatori (profilo esteso degli utenti installatori)
export const installatori = mysqlTable("installatori", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  ragioneSociale: varchar("ragioneSociale", { length: 255 }).notNull(),
  partitaIva: varchar("partitaIva", { length: 20 }),
  telefono: varchar("telefono", { length: 30 }),
  email: varchar("email", { length: 320 }),
  sito: varchar("sito", { length: 255 }),
  indirizzo: text("indirizzo"),
  citta: varchar("citta", { length: 100 }),
  provincia: varchar("provincia", { length: 10 }),
  regione: varchar("regione", { length: 100 }),
  settore: varchar("settore", { length: 100 }),
  specializzazioni: text("specializzazioni"),
  note: text("note"),
  stato: mysqlEnum("stato", ["in_attesa", "approvato", "rifiutato"]).default("in_attesa").notNull(),
  saldoPratiche: int("saldoPratiche").default(0).notNull(),
  saldoBusiness: int("saldoBusiness").default(0).notNull(),
  totaleFatturato: decimal("totaleFatturato", { precision: 12, scale: 2 }).default("0").notNull(),
  // Tipo interfaccia: pack_e_singole = accesso a tutto; solo_singole = solo pratiche singole senza pack
  tipoInterfaccia: mysqlEnum("tipoInterfaccia", ["pack_e_singole", "solo_singole"]).default("pack_e_singole").notNull(),
  // Codice promo personale dell'installatore (generato automaticamente)
  codicePromo: varchar("codicePromo", { length: 20 }).unique(),
  // Credito bollette (ricaricabile dall'admin)
  creditoResiduo: decimal("creditoResiduo", { precision: 12, scale: 2 }).default("0").notNull(),
  creditoTotale: decimal("creditoTotale", { precision: 12, scale: 2 }).default("0").notNull(),
  // Soglia credito per pack omaggio (configurabile dall'admin, default €2.000)
  sogliaPackOmaggio: decimal("sogliaPackOmaggio", { precision: 10, scale: 2 }).default("2000").notNull(),
  // Pack omaggio raggiunto (notifica inviata all'admin)
  packOmaggioNotificato: boolean("packOmaggioNotificato").default(false).notNull(),
  // Consenso GDPR per messaggi WhatsApp
  consensoWhatsApp: boolean("consensoWhatsApp").default(false).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Installatore = typeof installatori.$inferSelect;
export type InsertInstallatore = typeof installatori.$inferInsert;

// Ordini pack
export const ordini = mysqlTable("ordini", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  installatoreId: int("installatoreId"),
  packId: mysqlEnum("packId", ["pack1", "pack2", "pack3", "singolo", "custom"]).notNull(),
  nomePacchetto: varchar("nomePacchetto", { length: 255 }), // Solo per pack custom
  prezzoResidenziale: decimal("prezzoResidenziale", { precision: 10, scale: 2 }), // Prezzo per pratica residenziale
  prezzoBusiness: decimal("prezzoBusiness", { precision: 10, scale: 2 }), // Prezzo per pratica business
  importo: decimal("importo", { precision: 10, scale: 2 }).notNull(),
  // Tipo ordine: acquisto = pagato dall'installatore; assegnazione_admin = assegnato da admin (già pagato)
  tipoOrdine: mysqlEnum("tipoOrdine", ["acquisto", "assegnazione_admin"]).default("acquisto").notNull(),
  metodoPagamento: mysqlEnum("metodoPagamento", ["paypal", "bonifico"]).notNull(),
  stato: mysqlEnum("stato", ["in_attesa", "pagato", "annullato"]).default("in_attesa").notNull(),
  nomeAcquirente: varchar("nomeAcquirente", { length: 255 }).notNull(),
  emailAcquirente: varchar("emailAcquirente", { length: 320 }).notNull(),
  telefonoAcquirente: varchar("telefonoAcquirente", { length: 30 }),
  ragioneSocialeAcquirente: varchar("ragioneSocialeAcquirente", { length: 255 }),
  note: text("note"),
  pratiche_incluse: int("pratiche_incluse").default(0).notNull(),
  pratiche_usate: int("pratiche_usate").default(0).notNull(),
  // Separazione residenziali/business nel pack
  pratiche_incluse_residenziali: int("pratiche_incluse_residenziali").default(0).notNull(),
  pratiche_incluse_business: int("pratiche_incluse_business").default(0).notNull(),
  pratiche_usate_residenziali: int("pratiche_usate_residenziali").default(0).notNull(),
  pratiche_usate_business: int("pratiche_usate_business").default(0).notNull(),
  // Sistema di credito in euro (nuovo sistema)
  creditoResiduo: decimal("creditoResiduo", { precision: 10, scale: 2 }).notNull().default("0"),
  creditoTotale: decimal("creditoTotale", { precision: 10, scale: 2 }).notNull().default("0"),
  // URL del PDF esplicativo del pack
  pdfUrl: varchar("pdfUrl", { length: 512 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Ordine = typeof ordini.$inferSelect;
export type InsertOrdine = typeof ordini.$inferInsert;

// Pratiche fotovoltaiche
export const pratiche = mysqlTable("pratiche", {
  id: int("id").autoincrement().primaryKey(),
  installatoreId: int("installatoreId").notNull(),
  userId: int("userId").notNull(),
  tipologia: mysqlEnum("tipologia", ["residenziale", "business"]).notNull(),
  // Tipo di iter: connessione ordinario/semplificato, GSE, Terna, ENEA, Dogane, ecc.
  tipoIter: mysqlEnum("tipoIter", [
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
  // Step corrente dell'iter (es. "modello_unico_parte1_presentato")
  statoIter: varchar("statoIter", { length: 100 }),
  potenzaKw: decimal("potenzaKw", { precision: 8, scale: 2 }),
  indirizzoImpianto: text("indirizzoImpianto"),
  comuneImpianto: varchar("comuneImpianto", { length: 100 }),
  provinciaImpianto: varchar("provinciaImpianto", { length: 10 }),
  nomeTitolare: varchar("nomeTitolare", { length: 255 }),
  stato: mysqlEnum("stato", [
    "bozza",
    "inviata",
    "in_lavorazione",
    "completata",
    "rifiutata",
  ]).default("bozza").notNull(),
  note: text("note"),
  noteAdmin: text("noteAdmin"),
  // Collegamento a ordine (per tracciare quale ordine/pacchetto ha generato questa pratica)
  ordineId: int("ordineId"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Pratica = typeof pratiche.$inferSelect;
export type InsertPratica = typeof pratiche.$inferInsert;

// Documenti allegati alle pratiche
export const documenti = mysqlTable("documenti", {
  id: int("id").autoincrement().primaryKey(),
  praticaId: int("praticaId").notNull(),
  installatoreId: int("installatoreId").notNull(),
  nomeFile: varchar("nomeFile", { length: 255 }).notNull(),
  tipoFile: varchar("tipoFile", { length: 100 }),
  // Categoria documento specifica per tipo iter (es. "Modello Unico Parte I", "Regolamento di esercizio")
  categoriaDocumento: varchar("categoriaDocumento", { length: 200 }),
  // Nome dello slot fisso a cui appartiene il documento (es. "Documento identità titolare", "Schema unifilare")
  slotNome: varchar("slotNome", { length: 300 }),
   storageKey: varchar("storageKey", { length: 500 }).notNull(),
  storageUrl: varchar("storageUrl", { length: 500 }).notNull(),
  statoRevisione: mysqlEnum("statoRevisione", ["in_attesa", "approvato", "rifiutato"]).default("in_attesa"),
  notaRevisione: text("notaRevisione"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
export type Documento = typeof documenti.$inferSelect;
export type InsertDocumento = typeof documenti.$inferInsert;

// Ricariche crediti (bollette / passaparola)
export const ricariche = mysqlTable("ricariche", {
  id: int("id").autoincrement().primaryKey(),
  installatoreId: int("installatoreId").notNull(),
  tipo: mysqlEnum("tipo", ["bolletta", "passaparola"]).notNull(),
  importo: decimal("importo", { precision: 8, scale: 2 }).notNull(),
  descrizione: text("descrizione"),
  approvato: boolean("approvato").default(false).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Ricarica = typeof ricariche.$inferSelect;
export type InsertRicarica = typeof ricariche.$inferInsert;

// Configurazione ordine documenti per iter (admin)
export const configDocumenti = mysqlTable("config_documenti", {
  id: int("id").autoincrement().primaryKey(),
  tipoIter: varchar("tipoIter", { length: 100 }).notNull(),
  nomeDocumenti: varchar("nomeDocumenti", { length: 300 }).notNull(),
  ordine: int("ordine").notNull().default(0),
  obbligatorio: boolean("obbligatorio").default(false).notNull(),
  // Importanza del documento: obbligatorio | consigliato | opzionale
  importanza: mysqlEnum("importanza", ["obbligatorio", "consigliato", "opzionale"]).default("opzionale").notNull(),
  visibile: boolean("visibile").default(true).notNull(),
  // Chi inserisce il documento: sistema (admin/bot) o installatore (cliente)
  responsabileInserimento: mysqlEnum("responsabileInserimento", ["sistema", "installatore"]).default("installatore").notNull(),
  // Se installatoreId è null, è configurazione globale; altrimenti è personalizzata
   installatoreId: int("installatoreId"),
  note: text("note"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type ConfigDocumento = typeof configDocumenti.$inferSelect;
export type InsertConfigDocumento = typeof configDocumenti.$inferInsert;

// Configurazione backup automatico
export const backupConfig = mysqlTable("backup_config", {
  id: int("id").autoincrement().primaryKey(),
  frequenza: mysqlEnum("frequenza", ["giornaliero", "settimanale", "mensile"]).default("settimanale").notNull(),
  attivo: boolean("attivo").default(false).notNull(),
  ultimoBackup: timestamp("ultimoBackup"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type BackupConfig = typeof backupConfig.$inferSelect;
export type InsertBackupConfig = typeof backupConfig.$inferInsert;

// Storico backup eseguiti
export const backupStorico = mysqlTable("backup_storico", {
  id: int("id").autoincrement().primaryKey(),
  storageKey: varchar("storageKey", { length: 500 }).notNull(),
  storageUrl: varchar("storageUrl", { length: 500 }).notNull(),
  dimensioneBytes: int("dimensioneBytes").default(0).notNull(),
  stato: mysqlEnum("stato", ["completato", "errore"]).default("completato").notNull(),
  erroreMessaggio: text("erroreMessaggio"),
  tipo: mysqlEnum("tipo", ["manuale", "automatico"]).default("manuale").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type BackupStorico = typeof backupStorico.$inferSelect;
export type InsertBackupStorico = typeof backupStorico.$inferInsert;

// Listino prezzi personalizzato per installatore
export const listinoPersonalizzato = mysqlTable("listino_personalizzato", {
  id: int("id").autoincrement().primaryKey(),
  installatoreId: int("installatoreId").notNull(),
  nomeListino: varchar("nomeListino", { length: 255 }).notNull().default("Listino Personalizzato"),
  // JSON con i prezzi personalizzati: { [servizioId]: { prezzo: number, note?: string } }
  prezzi: text("prezzi").notNull(),
  attivo: boolean("attivo").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type ListinoPersonalizzato = typeof listinoPersonalizzato.$inferSelect;
export type InsertListinoPersonalizzato = typeof listinoPersonalizzato.$inferInsert;

// ─── PROSPECT INSTALLATORI FOTOVOLTAICO ──────────────────────────────────────
// Database di potenziali installatori da contattare per i pacchetti
export const prospectInstallatori = mysqlTable("prospect_installatori", {
  id: int("id").autoincrement().primaryKey(),
  nome: varchar("nome", { length: 255 }),                  // nome referente
  ragioneSociale: varchar("ragioneSociale", { length: 255 }).notNull(),
  settore: varchar("settore", { length: 100 }),            // es. "Elettricista", "Impianti FV", "Termoidraulico"
  regione: varchar("regione", { length: 100 }),
  provincia: varchar("provincia", { length: 5 }),
  comune: varchar("comune", { length: 100 }),
  indirizzo: varchar("indirizzo", { length: 255 }),
  telefono: varchar("telefono", { length: 30 }),
  email: varchar("email", { length: 255 }),
  sito: varchar("sito", { length: 255 }),
  // Fascia fatturato: "sotto_100k" | "100k_500k" | "500k_1m" | "1m_5m" | "sopra_5m"
  fasciaFatturato: mysqlEnum("fasciaFatturato", ["sotto_100k", "100k_500k", "500k_1m", "1m_5m", "sopra_5m"]),
  dipendenti: int("dipendenti"),
  // Stato CRM: "nuovo" | "contattato" | "trattativa" | "accordo" | "cliente_attivo" | "non_interessato"
  statoContatto: mysqlEnum("statoContatto", ["nuovo", "da_contattare", "contattato", "trattativa", "interessato", "accordo", "cliente_attivo", "cliente", "non_interessato"]).default("nuovo").notNull(),
  note: text("note"),
  // Fonte di acquisizione del contatto
  fonte: mysqlEnum("fonte", ["webinar", "excel", "google_maps", "manuale", "cciaa", "linkedin", "altro"]).default("manuale").notNull(),
  // Referente interno (chi lo segue)
  referente: varchar("referente", { length: 100 }),
  // Dati accordo (quando statoContatto = accordo | cliente_attivo)
  dataAccordo: timestamp("dataAccordo"),
  sconto: decimal("sconto", { precision: 5, scale: 2 }),   // % sconto applicato
  noteAccordo: text("noteAccordo"),
  dataUltimoContatto: timestamp("dataUltimoContatto"),
  // CRM Avanzato
  scoreAI: int("scoreAI").default(0),                      // score 0-100 calcolato automaticamente
  tokenOfferta: varchar("tokenOfferta", { length: 64 }),   // token univoco per link offerta personalizzato
  tokenOffertaScadenza: timestamp("tokenOffertaScadenza"),
  tokenOffertaPackId: varchar("tokenOffertaPackId", { length: 20 }), // pack pre-selezionato nell'offerta
  tokenOffertaSconto: int("tokenOffertaSconto"),           // % sconto nell'offerta
  tokenOffertaMessaggio: text("tokenOffertaMessaggio"),     // messaggio personale nell'offerta
  sequenzaStep: int("sequenzaStep").default(0),            // step della sequenza di contatto (0=non iniziata)
  sequenzaUltimoStep: timestamp("sequenzaUltimoStep"),
  ultimaAttivita: timestamp("ultimaAttivita"),
  eliminatoAt: timestamp("eliminatoAt"),                   // soft delete: null = attivo, data = nel cestino
  consensoGdpr: boolean("consensoGdpr").default(false).notNull(), // consenso per comunicazioni WhatsApp/email
  dataConsensoGdpr: timestamp("dataConsensoGdpr"),         // data quando ha dato il consenso
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type ProspectInstallatore = typeof prospectInstallatori.$inferSelect;
export type InsertProspectInstallatore = typeof prospectInstallatori.$inferInsert;

// ─── OPPORTUNITÀ IMMOBILI FOTOVOLTAICO ───────────────────────────────────────
// Capannoni e terreni dove installare impianti fotovoltaici
export const immobiliFotovoltaico = mysqlTable("immobili_fotovoltaico", {
  id: int("id").autoincrement().primaryKey(),
  tipo: mysqlEnum("tipo", ["capannone", "terreno"]).notNull(),
  titolo: varchar("titolo", { length: 255 }).notNull(),
  regione: varchar("regione", { length: 100 }),
  provincia: varchar("provincia", { length: 5 }),
  comune: varchar("comune", { length: 100 }),
  indirizzo: varchar("indirizzo", { length: 255 }),
  // Per capannoni: superficie in m²
  superficieMq: int("superficieMq"),
  // Per terreni: superficie in ettari (es. 1.5, 8.0)
  superficieEttari: decimal("superficieEttari", { precision: 8, scale: 2 }),
  // Capannone: attività energivora presente (es. fonderia, ceramica, industria)
  attivitaEnergivora: boolean("attivitaEnergivora").default(false),
  tipoAttivita: varchar("tipoAttivita", { length: 100 }),  // es. "Fonderia", "Ceramica"
  // Terreno: prossimità ad aree strategiche
  vicinanzaAutostrada: boolean("vicinanzaAutostrada").default(false),
  vicinanzaAreaIndustriale: boolean("vicinanzaAreaIndustriale").default(false),
  distanzaAutostradaKm: decimal("distanzaAutostradaKm", { precision: 5, scale: 1 }),
  distanzaAreaIndustrialeKm: decimal("distanzaAreaIndustrialeKm", { precision: 5, scale: 1 }),
  // Potenza fotovoltaico stimata (kWp)
  potenzaStimataKwp: decimal("potenzaStimataKwp", { precision: 8, scale: 2 }),
  // Disponibilità
  disponibilita: mysqlEnum("disponibilita", ["vendita", "affitto", "disponibile", "trattativa"]).default("disponibile").notNull(),
  prezzoEuro: decimal("prezzoEuro", { precision: 12, scale: 2 }),
  // Contatto proprietario/agente
  nomeContatto: varchar("nomeContatto", { length: 255 }),
  telefonoContatto: varchar("telefonoContatto", { length: 30 }),
  emailContatto: varchar("emailContatto", { length: 255 }),
  note: text("note"),
  // Visibilità pubblica
  pubblicato: boolean("pubblicato").default(false).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type ImmobileFotovoltaico = typeof immobiliFotovoltaico.$inferSelect;
export type InsertImmobileFotovoltaico = typeof immobiliFotovoltaico.$inferInsert;

// ─── PEC INSTALLATORI ────────────────────────────────────────────────────────
// Gestione PEC per gli installatori
export const pec = mysqlTable("pec", {
  id: int("id").autoincrement().primaryKey(),
  installatoreId: int("installatoreId").notNull(),
  email: varchar("email", { length: 320 }).notNull(),
  verificato: boolean("verificato").default(false).notNull(),
  dataVerifica: timestamp("dataVerifica"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Pec = typeof pec.$inferSelect;
export type InsertPec = typeof pec.$inferInsert;

// Prospect Installatori — per ricerca e matching
// ─── PACK CONFIGURAZIONE (pack visibili nella home, gestibili dall'admin) ─────
export const packConfigurazione = mysqlTable("pack_configurazione", {
  id: int("id").autoincrement().primaryKey(),
  slug: varchar("slug", { length: 50 }).notNull().unique(), // es. "pack1", "pack2", "pack3", "pack-custom"
  nome: varchar("nome", { length: 255 }).notNull(), // es. "Pack 1", "Pack Starter"
  prezzo: decimal("prezzo", { precision: 10, scale: 2 }).notNull(),
  praticheRes: int("praticheRes").default(0).notNull(),
  prezzoRes: decimal("prezzoRes", { precision: 10, scale: 2 }).default("0").notNull(),
  praticheBus: int("praticheBus").default(0).notNull(),
  prezzoBus: decimal("prezzoBus", { precision: 10, scale: 2 }).default("0").notNull(),
  descrizione: text("descrizione"), // Testo descrittivo mostrato nella card
  badge: varchar("badge", { length: 100 }), // es. "Più Venduto", "Consigliato"
  colore: varchar("colore", { length: 50 }).default("green"), // es. "green", "yellow", "blue"
  attivo: boolean("attivo").default(true).notNull(),
  ordine: int("ordine").default(0).notNull(), // Ordine di visualizzazione
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type PackConfigurazione = typeof packConfigurazione.$inferSelect;
export type InsertPackConfigurazione = typeof packConfigurazione.$inferInsert;

// ─── RICARICHE CONFIGURAZIONE (ricariche visibili nella home) ─────────────────
export const ricaricheConfigurazione = mysqlTable("ricariche_configurazione", {
  id: int("id").autoincrement().primaryKey(),
  slug: varchar("slug", { length: 50 }).notNull().unique(),
  nome: varchar("nome", { length: 255 }).notNull(), // es. "Ricarica Bollette", "Installatori Presentati"
  prezzo: decimal("prezzo", { precision: 10, scale: 2 }).notNull(),
  descrizione: text("descrizione"),
  badge: varchar("badge", { length: 100 }),
  icona: varchar("icona", { length: 100 }).default("zap"), // nome icona lucide-react
  attivo: boolean("attivo").default(true).notNull(),
  ordine: int("ordine").default(0).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type RicaricaConfigurazione = typeof ricaricheConfigurazione.$inferSelect;
export type InsertRicaricaConfigurazione = typeof ricaricheConfigurazione.$inferInsert;

// ─── PROMO PERSONALIZZATE PER INSTALLATORE ────────────────────────────────────
export const promoInstallatore = mysqlTable("promo_installatore", {
  id: int("id").autoincrement().primaryKey(),
  installatoreId: int("installatoreId").notNull(), // 0 = promo globale per tutti
  titolo: varchar("titolo", { length: 255 }).notNull(),
  descrizione: text("descrizione"),
  prezzo: decimal("prezzo", { precision: 10, scale: 2 }),
  prezzoOriginale: decimal("prezzoOriginale", { precision: 10, scale: 2 }), // Per mostrare lo sconto
  cta: varchar("cta", { length: 100 }).default("Scopri di più"), // Testo del pulsante
  ctaUrl: varchar("ctaUrl", { length: 500 }), // Link del pulsante (es. /acquista)
  scadenza: timestamp("scadenza"), // Data scadenza promo (null = nessuna scadenza)
  attivo: boolean("attivo").default(true).notNull(),
  colore: varchar("colore", { length: 50 }).default("yellow"), // "yellow", "green", "blue", "red"
  ordine: int("ordine").default(0).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  // Campi già presenti nel DB
  praticheRes: int("pratiche_res").default(0).notNull(),
  praticheBus: int("pratiche_bus").default(0).notNull(),
  prezzoRes: decimal("prezzo_res", { precision: 10, scale: 2 }),
  prezzoBus: decimal("prezzo_bus", { precision: 10, scale: 2 }),
  mostraInHome: boolean("mostra_in_home").default(false).notNull(),
  // Visibilità: singolo = solo installatore specifico, tutti = tutti gli installatori, home = tutti + home
  visibilita: mysqlEnum("visibilita", ["singolo", "tutti", "home"]).default("singolo").notNull(),
});
export type PromoInstallatore = typeof promoInstallatore.$inferSelect;
export type InsertPromoInstallatore = typeof promoInstallatore.$inferInsert;

// ─── PROSPECT: ORDINI PROBABILI ───────────────────────────────────────────────
export const prospectOrdiniProbabili = mysqlTable("prospect_ordini_probabili", {
  id: int("id").autoincrement().primaryKey(),
  prospectId: int("prospectId").notNull(),
  prodotto: varchar("prodotto", { length: 255 }).notNull(), // es. "Pack 1", "Pack 2", "Pratica Singola"
  importoStimato: decimal("importoStimato", { precision: 10, scale: 2 }).default("0"),
  probabilita: int("probabilita").default(50), // 0-100%
  stato: varchar("stato", { length: 50 }).default("bozza"), // bozza | proposta | trattativa | accettato | rifiutato
  scadenza: timestamp("scadenza"),
  note: text("note"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type ProspectOrdineProbabile = typeof prospectOrdiniProbabili.$inferSelect;
export type InsertProspectOrdineProbabile = typeof prospectOrdiniProbabili.$inferInsert;

// ─── PROSPECT: CORSI / IMPIANTI 100KW+ PROBABILI ─────────────────────────────
export const prospectCorsi = mysqlTable("prospect_corsi", {
  id: int("id").autoincrement().primaryKey(),
  prospectId: int("prospectId").notNull(),
  potenzaKw: decimal("potenzaKw", { precision: 10, scale: 2 }).default("100"),
  tipo: varchar("tipo", { length: 100 }).default("industriale"), // industriale | agrivoltaico | commerciale | altro
  comune: varchar("comune", { length: 255 }),
  dataPrevista: timestamp("dataPrevista"),
  stato: varchar("stato", { length: 50 }).default("valutazione"), // valutazione | progettazione | approvato | in_corso | completato | annullato
  valoreStimato: decimal("valoreStimato", { precision: 10, scale: 2 }),
  praticheStimate: int("praticheStimate").default(1),
  note: text("note"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type ProspectCorso = typeof prospectCorsi.$inferSelect;
export type InsertProspectCorso = typeof prospectCorsi.$inferInsert;

// ─── PREMI: BOLLETTE CARICATE DALL'INSTALLATORE ───────────────────────────────
export const premiBollette = mysqlTable("premi_bollette", {
  id: int("id").autoincrement().primaryKey(),
  installatoreId: int("installatoreId").notNull(),
  nomeCliente: varchar("nomeCliente", { length: 255 }).notNull(),
  telefonoCliente: varchar("telefonoCliente", { length: 30 }),
  emailCliente: varchar("emailCliente", { length: 320 }),
  fileUrl: text("fileUrl"), // URL del file bolletta su S3
  fileKey: varchar("fileKey", { length: 500 }), // Key S3
  nomeFile: varchar("nomeFile", { length: 255 }),
  note: text("note"),
  stato: mysqlEnum("stato", ["in_attesa", "approvato", "rifiutato"]).default("in_attesa").notNull(),
  creditoAssegnato: decimal("creditoAssegnato", { precision: 10, scale: 2 }).default("0"),
  noteAdmin: text("noteAdmin"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type PremiBolletta = typeof premiBollette.$inferSelect;
export type InsertPremiBolletta = typeof premiBollette.$inferInsert;

// ─── PREMI: NOMINATIVI INSTALLATORI SEGNALATI ────────────────────────────────
export const premiNominativi = mysqlTable("premi_nominativi", {
  id: int("id").autoincrement().primaryKey(),
  installatoreId: int("installatoreId").notNull(), // chi ha segnalato
  nomeInstallatore: varchar("nomeInstallatore", { length: 255 }).notNull(),
  azienda: varchar("azienda", { length: 255 }),
  telefono: varchar("telefono", { length: 30 }),
  email: varchar("email", { length: 320 }),
  citta: varchar("citta", { length: 100 }),
  note: text("note"),
  pacchettoDiInteresse: varchar("pacchettoDiInteresse", { length: 50 }), // es. pack1, pack2, pack3, singolo
  stato: mysqlEnum("stato", ["in_attesa", "contattato", "convertito", "non_interessato"]).default("in_attesa").notNull(),
  creditoAssegnato: decimal("creditoAssegnato", { precision: 10, scale: 2 }).default("0"),
  noteAdmin: text("noteAdmin"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type PremiNominativo = typeof premiNominativi.$inferSelect;
export type InsertPremiNominativo = typeof premiNominativi.$inferInsert;

// ─── PREMI: CODICI REFERRAL ───────────────────────────────────────────────────
export const premiCodici = mysqlTable("premi_codici", {
  id: int("id").autoincrement().primaryKey(),
  codice: varchar("codice", { length: 50 }).notNull().unique(),
  descrizione: text("descrizione"),
  valoreCreditoEur: decimal("valoreCreditoEur", { precision: 10, scale: 2 }).notNull(), // credito da assegnare
  installatoreIdAssegnato: int("installatoreIdAssegnato"), // null = codice generico, non ancora assegnato
  installatoreIdRiscattato: int("installatoreIdRiscattato"), // chi lo ha riscattato
  riscattatoAt: timestamp("riscattatoAt"),
  attivo: boolean("attivo").default(true).notNull(),
  usatoUnaVolta: boolean("usatoUnaVolta").default(true).notNull(), // se true, può essere usato solo una volta
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type PremiCodice = typeof premiCodici.$inferSelect;
export type InsertPremiCodice = typeof premiCodici.$inferInsert;

// ─── IMPOSTAZIONI GLOBALI ─────────────────────────────────────────────────────
export const impostazioni = mysqlTable("impostazioni", {
  id: int("id").autoincrement().primaryKey(),
  chiave: varchar("chiave", { length: 100 }).notNull().unique(),
  valore: text("valore").notNull(),
  descrizione: text("descrizione"),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type Impostazione = typeof impostazioni.$inferSelect;
export type InsertImpostazione = typeof impostazioni.$inferInsert;

// ─── SISTEMA DOCUMENTALE ──────────────────────────────────────────────────────
export const adminDocuments = mysqlTable("admin_documents", {
  id: int("id").autoincrement().primaryKey(),
  nome: varchar("nome", { length: 255 }).notNull(), // es. "Dichiarazione conformità DM 37/08"
  descrizione: text("descrizione"),
  stato: mysqlEnum("stato", ["obbligatorio", "opzionale", "consigliato"]).default("obbligatorio").notNull(),
  ordine: int("ordine").default(0).notNull(), // per ordinare i documenti
  attivo: boolean("attivo").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type AdminDocument = typeof adminDocuments.$inferSelect;
export type InsertAdminDocument = typeof adminDocuments.$inferInsert;

// Documenti assegnati agli installatori (sincronizzazione)
export const installatoreDocuments = mysqlTable("installatore_documents", {
  id: int("id").autoincrement().primaryKey(),
  installatoreId: int("installatoreId").notNull(),
  adminDocumentId: int("adminDocumentId").notNull(),
  fileUrl: text("fileUrl"), // URL del file caricato dall'installatore
  statoCompilazione: mysqlEnum("statoCompilazione", ["da_compilare", "compilato", "rifiutato"]).default("da_compilare").notNull(),
  note: text("note"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type InstallatoreDocument = typeof installatoreDocuments.$inferSelect;
export type InsertInstallatoreDocument = typeof installatoreDocuments.$inferInsert;

// ─── STORICO ORDINI (AUDIT TRAIL) ──────────────────────────────────────────────
// Tabella immutabile che traccia ogni cambio di stato e riassegnazione degli ordini
export const storicoOrdini = mysqlTable("storico_ordini", {
  id: int("id").autoincrement().primaryKey(),
  ordineId: int("ordineId").notNull(), // Riferimento all'ordine
  tipoEvento: mysqlEnum("tipoEvento", [
    "creazione",           // Ordine creato
    "assegnazione",        // Ordine assegnato a installatore
    "riassegnazione",      // Ordine riassegnato a installatore diverso
    "cambio_stato",        // Cambio di stato (in_attesa -> pagato -> annullato)
    "utilizzo_pratica",    // Una pratica del pack è stata utilizzata
    "credito_aggiornato",  // Credito residuo aggiornato
    "note_aggiunte",       // Note aggiunte all'ordine
  ]).notNull(),
  statoPrec: varchar("statoPrec", { length: 50 }), // Stato precedente (per cambio_stato)
  statoNuovo: varchar("statoNuovo", { length: 50 }), // Stato nuovo (per cambio_stato)
  installatoreIdPrec: int("installatoreIdPrec"), // Installatore precedente (per riassegnazione)
  installatoreIdNuovo: int("installatoreIdNuovo"), // Installatore nuovo (per riassegnazione)
  descrizione: text("descrizione"), // Descrizione dell'evento
  dettagli: text("dettagli"), // JSON con dettagli aggiuntivi
  utenteCheHaFattoIlCambio: varchar("utenteCheHaFattoIlCambio", { length: 255 }), // Email/ID dell'utente che ha fatto il cambio
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type StoricoOrdine = typeof storicoOrdini.$inferSelect;
export type InsertStoricoOrdine = typeof storicoOrdini.$inferInsert;

// Personalizzazione step iter (label e descrizione modificabili dall'admin)
export const configStepIter = mysqlTable("config_step_iter", {
  id: int("id").autoincrement().primaryKey(),
  tipoIter: varchar("tipoIter", { length: 100 }).notNull(),
  stepId: varchar("stepId", { length: 100 }).notNull(),
  labelCustom: varchar("labelCustom", { length: 300 }),
  descrizioneCustom: text("descrizioneCustom"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type ConfigStepIter = typeof configStepIter.$inferSelect;
export type InsertConfigStepIter = typeof configStepIter.$inferInsert;
