// ─── TIPI ITER ────────────────────────────────────────────────────────────────
// Definizione completa di tutti gli iter gestiti dalla piattaforma,
// con i relativi step, documenti richiesti e categorie allegati.
// Fonte: TICA ARERA, e-Distribuzione, GSE, Terna GAUDI, ENEA, ADM

export type TipoIter =
  | "connessione_ordinario"
  | "connessione_semplificato"
  | "gse"
  | "terna_gaudi"
  | "enea_conto_termico"
  | "dogane_officina_elettrica"
  | "dogane_dichiarazione_consumo"
  | "arera"
  | "distribuzione"
  | "progettazione";

// Iter che possono essere scalati dal credito di un pack.
// Solo connessione ordinario e semplificato rientrano nel pack.
// Tutti gli altri iter (GSE, Terna, ENEA, Dogane, ARERA, ecc.) sono pratiche singole.
export const ITER_DA_PACK: TipoIter[] = ["connessione_ordinario", "connessione_semplificato"];
export const isIterDaPack = (tipoIter: TipoIter): boolean => ITER_DA_PACK.includes(tipoIter);

export type PrioritaDocumento = "obbligatorio" | "consigliato" | "opzionale";
export interface DocumentoRichiesto {
  nome: string;
  priorita: PrioritaDocumento;
  note?: string;
}
export interface StepIter {
  id: string;
  label: string;
  descrizione: string;
  documentiRichiesti?: string[];
  // Documenti con priorità esplicita (sovrascrive documentiRichiesti se presente)
  documentiConPriorita?: DocumentoRichiesto[];
}

export interface DefinizioneIter {
  tipo: TipoIter;
  label: string;
  descrizione: string;
  ente: string;
  steps: StepIter[];
  categorieDocumenti: string[];
}

// ─── ITER CONNESSIONE ORDINARIO ───────────────────────────────────────────────
// Fonte: TICA ARERA Del. 99/08 e ss.mm.ii., e-Distribuzione
// Per impianti con potenza > 200 kW o non rientranti nei requisiti semplificati
const connessioneOrdinario: DefinizioneIter = {
  tipo: "connessione_ordinario",
  label: "Connessione Ordinario",
  descrizione: "Iter ordinario per la connessione di impianti di produzione alla rete di distribuzione (TICA)",
  ente: "Distributore (e-Distribuzione / altri DSO)",
  steps: [
    {
      id: "domanda_presentata",
      label: "Domanda presentata",
      descrizione: "Richiesta di connessione inviata al distributore con allegati obbligatori",
      documentiRichiesti: [
        "Documento identità titolare",
        "Mandato senza rappresentanza",
        "Schema unifilare generale impianto",
        "Planimetria catastale",
        "Dichiarazione disponibilità sito",
        "Schema unifilare singola sezione",
        "Addendum tecnico sistema accumulo (se presente)",
        "Ricevuta pagamento contributo istruttoria",
      ],
    },
    {
      id: "preventivo_ricevuto",
      label: "Preventivo ricevuto",
      descrizione: "Preventivo di connessione emesso dal distributore (entro 20/45/60 gg lavorativi)",
      documentiRichiesti: ["Preventivo di connessione firmato dal distributore"],
    },
    {
      id: "preventivo_accettato",
      label: "Preventivo accettato",
      descrizione: "Accettazione del preventivo con pagamento della quota indicata",
      documentiRichiesti: [
        "Modulo accettazione preventivo (timbro e firma)",
        "Ricevuta pagamento importo preventivo",
      ],
    },
    {
      id: "regolamento_esercizio_ricevuto",
      label: "Regolamento di esercizio ricevuto",
      descrizione: "Il distributore invia il regolamento di esercizio da sottoscrivere",
      documentiRichiesti: ["Regolamento di esercizio (bozza dal distributore)"],
    },
    {
      id: "lavori_in_corso",
      label: "Lavori in corso",
      descrizione: "Realizzazione opere di connessione e dell'impianto fotovoltaico",
      documentiRichiesti: [
        "Comunicazione inizio lavori",
        "Comunicazione avvio iter autorizzativo (se applicabile)",
        "Dichiarazione assunzione responsabilità",
      ],
    },
    {
      id: "fine_lavori",
      label: "Fine lavori comunicata",
      descrizione: "Comunicazione di ultimazione lavori al distributore",
      documentiRichiesti: [
        "Comunicazione fine lavori impianto",
        "Comunicazione completamento opere connessione",
        "Attestazione registrazione GAUDI (Terna)",
      ],
    },
    {
      id: "regolamento_esercizio_firmato",
      label: "Regolamento di esercizio firmato",
      descrizione: "Invio del regolamento di esercizio sottoscritto (CEI 0-21 BT / CEI 0-16 MT)",
      documentiRichiesti: [
        "Regolamento esercizio CEI 0-21 (BT, P > 0,8 kW) firmato",
        "Regolamento esercizio CEI 0-16 (MT) firmato",
        "Dichiarazione conformità DM 37/08",
        "Schema elettrico as-built",
        "Dichiarazione sostitutiva atto notorietà",
        "Dichiarazione conformità inverter CEI 0-21 / CEI 0-16",
        "Dichiarazione conformità protezione interfaccia CEI 0-21 / CEI 0-16",
        "Copia verifica SPI (cassetta prova relè o foto display autotest inverter)",
      ],
    },
    {
      id: "messa_in_esercizio",
      label: "Messa in esercizio",
      descrizione: "Attivazione impianto da parte del distributore e invio verbali",
      documentiRichiesti: ["Verbale attivazione impianto", "Dichiarazione tipologia ASSPC"],
    },
    {
      id: "completata",
      label: "Completata",
      descrizione: "Pratica conclusa — impianto in esercizio",
      documentiRichiesti: [],
    },
  ],
  categorieDocumenti: [
    "Documenti principali",
    "Domanda di connessione",
    "Preventivo",
    "Accettazione preventivo",
    "Iter autorizzativo",
    "Regolamento di esercizio",
    "Messa in esercizio",
    "Altro",
  ],
};

// ─── ITER CONNESSIONE SEMPLIFICATO ────────────────────────────────────────────
// Fonte: DM 19/05/2015, DM 16/03/2017, DM 297/2022, ARERA Del. 400/2015, 581/2017, 674/2022
// Per impianti fotovoltaici ≤ 200 kW su clienti finali con POD attivo
const connessioneSemplificato: DefinizioneIter = {
  tipo: "connessione_semplificato",
  label: "Connessione Semplificato",
  descrizione: "Iter semplificato per impianti fotovoltaici ≤ 200 kW su clienti finali con POD attivo (DM 2022)",
  ente: "Distributore (e-Distribuzione / altri DSO)",
  steps: [
    {
      id: "modello_unico_parte1_presentato",
      label: "Modello Unico Parte I presentato",
      descrizione: "Invio della domanda di connessione con Modello Unico Parte I al distributore",
      documentiRichiesti: [
        "Modello Unico Parte I (domanda di connessione)",
        "Schema elettrico unifilare",
        "Documento identità richiedente",
        "Addendum tecnico sistema accumulo (se presente)",
        "Mandato con rappresentanza (se il richiedente ≠ cliente finale)",
        "Mandato cliente finale per modifica connessione esistente (se applicabile)",
      ],
      documentiConPriorita: [
        { nome: "Modello Unico Parte I (domanda di connessione)", priorita: "obbligatorio" },
        { nome: "Schema elettrico unifilare", priorita: "obbligatorio" },
        { nome: "Documento identità richiedente", priorita: "obbligatorio" },
        { nome: "Addendum tecnico sistema accumulo", priorita: "consigliato", note: "Solo se è presente un sistema di accumulo" },
        { nome: "Mandato con rappresentanza", priorita: "consigliato", note: "Se il richiedente è diverso dal cliente finale" },
        { nome: "Mandato cliente finale per modifica connessione", priorita: "opzionale", note: "Solo per modifica di connessione esistente" },
      ],
    },
    {
      id: "modello_unico_parte1_ricevuto",
      label: "Modello Unico Parte I ricevuto",
      descrizione: "Il distributore ha ricevuto e protocollato la domanda",
      documentiRichiesti: ["Ricevuta protocollo dal distributore"],
    },
    {
      id: "lavori_in_corso",
      label: "Lavori in corso",
      descrizione: "Realizzazione impianto fotovoltaico e opere di connessione",
      documentiRichiesti: [],
    },
    {
      id: "modello_unico_parte2_presentato",
      label: "Modello Unico Parte II presentato",
      descrizione: "Comunicazione fine lavori con Modello Unico Parte II e regolamento di esercizio",
      documentiRichiesti: [
        "Modello Unico Parte II (comunicazione fine lavori)",
        "Regolamento esercizio CEI 0-21 (P > 0,8 kW) firmato",
        "Regolamento esercizio CEI 0-16 (MT) firmato",
        "Dichiarazione sostitutiva atto notorietà",
        "Dichiarazione conformità DM 37/08",
        "Schema elettrico as-built",
        "Copia verifica SPI (cassetta prova relè o foto display autotest inverter)",
      ],
      documentiConPriorita: [
        { nome: "Modello Unico Parte II (comunicazione fine lavori)", priorita: "obbligatorio" },
        { nome: "Dichiarazione conformità DM 37/08", priorita: "obbligatorio" },
        { nome: "Schema elettrico as-built", priorita: "obbligatorio" },
        { nome: "Regolamento esercizio CEI 0-21 (P > 0,8 kW) firmato", priorita: "obbligatorio", note: "Per impianti BT con P > 0,8 kW" },
        { nome: "Copia verifica SPI", priorita: "obbligatorio", note: "Cassetta prova relè o foto display autotest inverter" },
        { nome: "Regolamento esercizio CEI 0-16 (MT) firmato", priorita: "consigliato", note: "Solo per impianti in media tensione" },
        { nome: "Dichiarazione sostitutiva atto notorietà", priorita: "consigliato" },
      ],
    },
    {
      id: "modello_unico_parte2_ricevuto",
      label: "Modello Unico Parte II ricevuto",
      descrizione: "Il distributore ha ricevuto la comunicazione fine lavori",
      documentiRichiesti: [],
    },
    {
      id: "messa_in_esercizio",
      label: "Messa in esercizio",
      descrizione: "Attivazione impianto (da remoto se non richiesto contatore M2)",
      documentiRichiesti: ["Verbale attivazione impianto"],
    },
    {
      id: "completata",
      label: "Completata",
      descrizione: "Pratica conclusa — impianto in esercizio",
      documentiRichiesti: [],
    },
  ],
  categorieDocumenti: [
    "Documenti principali",
    "Modello Unico Parte I (domanda connessione)",
    "Modello Unico Parte II (fine lavori)",
    "Regolamento di esercizio",
    "Messa in esercizio",
    "Altro",
  ],
};

// ─── ITER GSE ─────────────────────────────────────────────────────────────────
// Fonte: GSE — Scambio sul Posto (SSP), Ritiro Dedicato (RID), Conto Energia
const gse: DefinizioneIter = {
  tipo: "gse",
  label: "GSE — Incentivi / SSP / RID",
  descrizione: "Pratica GSE per Scambio sul Posto, Ritiro Dedicato o accesso a incentivi fotovoltaico",
  ente: "GSE — Gestore Servizi Energetici",
  steps: [
    {
      id: "documenti_raccolti",
      label: "Documenti raccolti",
      descrizione: "Raccolta documentazione tecnica e fiscale necessaria",
      documentiConPriorita: [
        { nome: "Schema unifilare impianto", priorita: "obbligatorio", note: "Firmato da professionista abilitato o ditta esecutrice" },
        { nome: "Dati pannelli e inverter", priorita: "obbligatorio", note: "Marca, modello, potenza, seriale, quantità per stringa" },
        { nome: "Visura catastale", priorita: "obbligatorio", note: "Con foglio, particella e sub" },
        { nome: "Indirizzo residenza cliente", priorita: "obbligatorio", note: "Indirizzo completo" },
        { nome: "Documento identità titolare", priorita: "obbligatorio", note: "Fronte e retro" },
        { nome: "Tessera sanitaria titolare", priorita: "obbligatorio", note: "Fronte e retro" },
        { nome: "Recapiti cliente", priorita: "obbligatorio", note: "Telefono, email, IBAN" },
        { nome: "Ultima fattura energia", priorita: "obbligatorio", note: "Da cui si evince POD e indirizzo fornitura" },
        { nome: "Titolo edilizio", priorita: "consigliato", note: "Se presentato (con protocollo e data)" },
        { nome: "Mandato rappresentanza", priorita: "consigliato", note: "Prodotto in seguito, da far firmare al cliente" },
        { nome: "Descrizione installazione", priorita: "consigliato", note: "Tipo: su tetto piano, falda, ecc." },
        { nome: "Dati interruttori e protezione", priorita: "consigliato", note: "Marca, modello, DG. Devono essere riportati su schema unifilare" },
        { nome: "Preventivo spesa", priorita: "consigliato", note: "Con dichiarazione accesso a prestiti/finanziamenti" },
        { nome: "Posizione GPS impianto", priorita: "opzionale", note: "Coordinate WGS84" },
      ],
    },
    {
      id: "pratica_inviata_gse",
      label: "Pratica inviata al GSE",
      descrizione: "Invio pratica tramite portale GSE (con SPID o CIE)",
      documentiConPriorita: [
        { nome: "Autotest inverter o certificazione protezione", priorita: "obbligatorio", note: "Timbrato e firmato da ditta installatrice" },
        { nome: "Dichiarazione conformità impianto", priorita: "obbligatorio", note: "Secondo D.M. 22/01/08 n. 37 + visura camerale + ID rappresentante" },
        { nome: "Dichiarazioni conformità apparecchiature", priorita: "obbligatorio", note: "Secondo Allegato C Norma CEI 0-21" },
        { nome: "Foto targa inverter", priorita: "obbligatorio", note: "Marca, modello, numero seriale leggibili" },
        { nome: "Foto installazione pannelli", priorita: "obbligatorio", note: "Almeno 3 da diverse angolazioni" },
        { nome: "Foto quadretti e inverter", priorita: "obbligatorio", note: "Con accumulo se presente" },
        { nome: "Foto interruttori installati", priorita: "obbligatorio", note: "Marca e modello leggibili, con DG" },
        { nome: "Ricevuta invio pratica GSE", priorita: "consigliato", note: "Conferma di invio dal portale GSE" },
      ],
    },
    {
      id: "in_verifica_gse",
      label: "In verifica al GSE",
      descrizione: "Valutazione documentale da parte del GSE (30-90 gg)",
      documentiRichiesti: [],
    },
    {
      id: "richiesta_integrazioni",
      label: "Richiesta integrazioni",
      descrizione: "Il GSE ha richiesto documenti aggiuntivi o chiarimenti",
      documentiRichiesti: ["Documenti integrativi richiesti dal GSE"],
    },
    {
      id: "qualifica_emessa",
      label: "Qualifica emessa",
      descrizione: "Il GSE ha emesso la qualifica / approvato la pratica",
      documentiRichiesti: ["Decreto / qualifica GSE"],
    },
    {
      id: "contratto_attivo",
      label: "Contratto attivo",
      descrizione: "Contratto SSP / RID attivo — incentivi in erogazione",
      documentiRichiesti: ["Contratto GSE firmato"],
    },
    {
      id: "completata",
      label: "Completata",
      descrizione: "Pratica GSE conclusa",
      documentiRichiesti: [],
    },
  ],
  categorieDocumenti: [
    "Documenti principali",
    "Documentazione tecnica",
    "Documentazione fiscale",
    "Invio GSE",
    "Integrazioni richieste",
    "Qualifica / Decreto",
    "Contratto",
    "Altro",
  ],
};

// ─── ITER TERNA GAUDI ─────────────────────────────────────────────────────────
// Fonte: Terna — Procedura GAUDI (Gestione Anagrafica Unica Degli Impianti)
const ternaGaudi: DefinizioneIter = {
  tipo: "terna_gaudi",
  label: "Terna — GAUDI",
  descrizione: "Registrazione impianto fotovoltaico sul portale GAUDI di Terna (obbligatoria per l'allaccio)",
  ente: "Terna S.p.A.",
  steps: [
    {
      id: "documenti_raccolti",
      label: "Documenti raccolti",
      descrizione: "Raccolta dati tecnici dell'impianto per la registrazione",
      documentiRichiesti: [
        "Dati tecnici impianto (potenza, tecnologia, coordinate GPS)",
        "Dati titolare / produttore",
        "Schema unifilare impianto",
        "Codice POD / punto di connessione",
      ],
    },
    {
      id: "registrazione_inviata",
      label: "Registrazione inviata a GAUDI",
      descrizione: "Invio dati tecnici sul portale GAUDI di Terna",
      documentiRichiesti: ["Ricevuta registrazione GAUDI"],
    },
    {
      id: "codice_censimp_ricevuto",
      label: "Codice CENSIMP ricevuto",
      descrizione: "Terna ha assegnato il codice identificativo univoco CENSIMP all'impianto",
      documentiRichiesti: ["Codice CENSIMP / codice impianto GAUDI"],
    },
    {
      id: "unita_produzione_abilitata",
      label: "Unità di Produzione abilitata",
      descrizione: "UP e impianto risultano 'Abilitati ai fini dell'attivazione e dell'esercizio' su GAUDI",
      documentiRichiesti: ["Attestazione abilitazione UP su GAUDI"],
    },
    {
      id: "completata",
      label: "Completata",
      descrizione: "Registrazione GAUDI completata",
      documentiRichiesti: [],
    },
  ],
  categorieDocumenti: [
    "Documenti principali",
    "Dati tecnici impianto",
    "Registrazione GAUDI",
    "Codice CENSIMP",
    "Attestazioni",
    "Altro",
  ],
};

// ─── ITER ENEA CONTO TERMICO ──────────────────────────────────────────────────
// Fonte: GSE — Conto Termico 3.0 (DM 7 agosto 2025)
const eneaContoTermico: DefinizioneIter = {
  tipo: "enea_conto_termico",
  label: "ENEA / GSE — Conto Termico",
  descrizione: "Accesso agli incentivi Conto Termico 3.0 per efficienza energetica e fonti rinnovabili termiche",
  ente: "GSE / ENEA",
  steps: [
    {
      id: "diagnosi_energetica",
      label: "Diagnosi energetica pre-intervento",
      descrizione: "Redazione diagnosi energetica e APE prima dell'intervento",
      documentiRichiesti: [
        "Diagnosi energetica pre-intervento",
        "APE (Attestato Prestazione Energetica) ante-operam",
      ],
    },
    {
      id: "documenti_raccolti",
      label: "Documenti raccolti",
      descrizione: "Raccolta documentazione tecnica e fiscale",
      documentiRichiesti: [
        "Dati catastali immobile",
        "Fatture intervento",
        "Dichiarazione conformità impianto",
        "Schede tecniche apparecchiature installate",
        "IBAN per accredito incentivi",
        "APE post-operam",
      ],
    },
    {
      id: "pratica_inviata_portaltermico",
      label: "Pratica inviata al Portaltermico",
      descrizione: "Invio domanda tramite Portaltermico GSE",
      documentiRichiesti: ["Ricevuta invio Portaltermico", "Numero pratica Conto Termico"],
    },
    {
      id: "in_verifica",
      label: "In verifica",
      descrizione: "Valutazione tecnico-documentale da parte del GSE",
      documentiRichiesti: [],
    },
    {
      id: "richiesta_integrazioni",
      label: "Richiesta integrazioni",
      descrizione: "GSE ha richiesto documenti aggiuntivi",
      documentiRichiesti: ["Documenti integrativi richiesti"],
    },
    {
      id: "decreto_incentivo",
      label: "Decreto incentivo emesso",
      descrizione: "GSE ha emesso il decreto di ammissione all'incentivo",
      documentiRichiesti: ["Decreto incentivo Conto Termico"],
    },
    {
      id: "incentivo_in_erogazione",
      label: "Incentivo in erogazione",
      descrizione: "Pagamenti incentivo in corso (rate mensili/trimestrali)",
      documentiRichiesti: [],
    },
    {
      id: "completata",
      label: "Completata",
      descrizione: "Pratica Conto Termico conclusa",
      documentiRichiesti: [],
    },
  ],
  categorieDocumenti: [
    "Documenti principali",
    "Diagnosi energetica / APE",
    "Documentazione tecnica",
    "Fatture e spese",
    "Invio Portaltermico",
    "Integrazioni richieste",
    "Decreto incentivo",
    "Altro",
  ],
};

// ─── ITER DOGANE — OFFICINA ELETTRICA ─────────────────────────────────────────
// Fonte: TUA (Testo Unico Accise) Art. 53 — ADM
// Obbligatorio per impianti fotovoltaici > 20 kWp
const doganeOfficinaElettrica: DefinizioneIter = {
  tipo: "dogane_officina_elettrica",
  label: "Dogane — Officina Elettrica (Licenza)",
  descrizione: "Denuncia e ottenimento licenza di Officina Elettrica presso ADM per impianti > 20 kWp (Art. 53 TUA)",
  ente: "Agenzia delle Dogane e dei Monopoli (ADM)",
  steps: [
    {
      id: "documenti_raccolti",
      label: "Documenti raccolti",
      descrizione: "Raccolta documentazione per la denuncia di apertura officina elettrica",
      documentiRichiesti: [
        "Documento identità titolare",
        "Codice fiscale / P.IVA",
        "Visura camerale (per persone giuridiche)",
        "Schema unifilare impianto",
        "Planimetria impianto con indicazione contatori",
        "Dati tecnici impianto (potenza, produzione stimata)",
        "Codice POD",
        "Contratto di connessione alla rete",
      ],
    },
    {
      id: "denuncia_presentata",
      label: "Denuncia presentata all'ADM",
      descrizione: "Invio telematico della denuncia di apertura officina elettrica all'ufficio ADM competente",
      documentiRichiesti: [
        "Ricevuta presentazione denuncia ADM",
        "Numero pratica ADM",
      ],
    },
    {
      id: "verifica_formale",
      label: "Verifica formale documentazione",
      descrizione: "ADM verifica la completezza della documentazione allegata",
      documentiRichiesti: [],
    },
    {
      id: "sopralluogo",
      label: "Sopralluogo ADM (se richiesto)",
      descrizione: "Eventuale sopralluogo da parte degli ispettori ADM",
      documentiRichiesti: ["Verbale sopralluogo ADM"],
    },
    {
      id: "licenza_rilasciata",
      label: "Licenza di Officina Elettrica rilasciata",
      descrizione: "ADM rilascia la licenza di officina elettrica",
      documentiRichiesti: ["Licenza Officina Elettrica ADM"],
    },
    {
      id: "completata",
      label: "Completata",
      descrizione: "Licenza ottenuta — obbligo dichiarazione annuale attivo",
      documentiRichiesti: [],
    },
  ],
  categorieDocumenti: [
    "Documenti principali",
    "Denuncia ADM",
    "Documentazione tecnica impianto",
    "Verbali / Sopralluogo",
    "Licenza",
    "Altro",
  ],
};

// ─── ITER DOGANE — DICHIARAZIONE ANNUALE CONSUMI ──────────────────────────────
// Fonte: TUA Art. 53 — ADM — scadenza 31 marzo ogni anno
const doganeDichiarazioneConsumo: DefinizioneIter = {
  tipo: "dogane_dichiarazione_consumo",
  label: "Dogane — Dichiarazione Annuale Consumi",
  descrizione: "Dichiarazione annuale dei consumi di energia elettrica all'ADM (scadenza 31 marzo) per impianti > 20 kWp",
  ente: "Agenzia delle Dogane e dei Monopoli (ADM)",
  steps: [
    {
      id: "dati_raccolti",
      label: "Dati anno precedente raccolti",
      descrizione: "Raccolta letture contatori e dati di produzione/consumo dell'anno di riferimento",
      documentiRichiesti: [
        "Letture contatore produzione (iniziale e finale)",
        "Letture contatore scambio/immissione",
        "Dati energia autoconsumata",
        "Dati energia immessa in rete",
        "Licenza officina elettrica vigente",
      ],
    },
    {
      id: "dichiarazione_compilata",
      label: "Dichiarazione compilata",
      descrizione: "Compilazione del modello dichiarazione annuale consumi",
      documentiRichiesti: ["Modello dichiarazione annuale consumi compilato"],
    },
    {
      id: "dichiarazione_inviata",
      label: "Dichiarazione inviata all'ADM",
      descrizione: "Trasmissione telematica entro il 31 marzo",
      documentiRichiesti: [
        "Ricevuta trasmissione telematica ADM",
        "Numero protocollo dichiarazione",
      ],
    },
    {
      id: "completata",
      label: "Completata",
      descrizione: "Dichiarazione annuale presentata nei termini",
      documentiRichiesti: [],
    },
  ],
  categorieDocumenti: [
    "Documenti principali",
    "Letture contatori",
    "Dichiarazione compilata",
    "Ricevuta trasmissione",
    "Altro",
  ],
};

// ─── MAPPA COMPLETA ITER ──────────────────────────────────────────────────────
export const ITER_DEFINIZIONI: Record<TipoIter, DefinizioneIter> = {
  connessione_ordinario: connessioneOrdinario,
  connessione_semplificato: connessioneSemplificato,
  gse: gse,
  terna_gaudi: ternaGaudi,
  enea_conto_termico: eneaContoTermico,
  dogane_officina_elettrica: doganeOfficinaElettrica,
  dogane_dichiarazione_consumo: doganeDichiarazioneConsumo,
  arera: {
    tipo: "arera",
    label: "ARERA — Pratiche Regolatorie",
    descrizione: "Pratiche regolatorie ARERA (reclami, accesso agli atti, procedure di conciliazione)",
    ente: "ARERA — Autorità di Regolazione per Energia Reti e Ambiente",
    steps: [
      { id: "documenti_raccolti", label: "Documenti raccolti", descrizione: "Raccolta documentazione", documentiRichiesti: ["Documentazione specifica pratica"] },
      { id: "pratica_inviata", label: "Pratica inviata", descrizione: "Invio pratica ad ARERA", documentiRichiesti: ["Ricevuta invio ARERA"] },
      { id: "in_istruttoria", label: "In istruttoria", descrizione: "ARERA sta esaminando la pratica", documentiRichiesti: [] },
      { id: "completata", label: "Completata", descrizione: "Pratica ARERA conclusa", documentiRichiesti: [] },
    ],
    categorieDocumenti: ["Documenti principali", "Invio ARERA", "Risposte / Atti", "Altro"],
  },
  distribuzione: {
    tipo: "distribuzione",
    label: "Distribuzione — Pratiche Varie",
    descrizione: "Pratiche varie con il distributore locale (variazioni, modifiche, reclami)",
    ente: "Distributore locale",
    steps: [
      { id: "documenti_raccolti", label: "Documenti raccolti", descrizione: "Raccolta documentazione", documentiRichiesti: [] },
      { id: "pratica_inviata", label: "Pratica inviata", descrizione: "Invio pratica al distributore", documentiRichiesti: ["Ricevuta invio"] },
      { id: "in_lavorazione", label: "In lavorazione", descrizione: "Il distributore sta elaborando la pratica", documentiRichiesti: [] },
      { id: "completata", label: "Completata", descrizione: "Pratica conclusa", documentiRichiesti: [] },
    ],
    categorieDocumenti: ["Documenti principali", "Invio distributore", "Risposte", "Altro"],
  },
  progettazione: {
    tipo: "progettazione",
    label: "Progettazione Impianto FV",
    descrizione: "Progettazione tecnica impianto fotovoltaico: inquadramento urbanistico, layout cartografico, schema unifilare, relazione tecnica, procedura PAS/DILA",
    ente: "Studio tecnico interno",
    steps: [
      { id: "raccolta_dati", label: "Raccolta dati", descrizione: "Acquisizione dati tecnici e catastali dell'impianto", documentiRichiesti: ["Visura catastale", "Documento identità titolare", "Planimetria sito"] },
      { id: "in_progettazione", label: "In progettazione", descrizione: "Elaborazione del progetto tecnico", documentiRichiesti: [] },
      { id: "revisione", label: "Revisione", descrizione: "Revisione e approvazione del progetto", documentiRichiesti: [] },
      { id: "consegnato", label: "Progetto consegnato", descrizione: "Progetto completo consegnato al cliente", documentiRichiesti: ["Progetto firmato", "Schema unifilare", "Relazione tecnica"] },
    ],
    categorieDocumenti: ["Documenti cliente", "Elaborati tecnici", "Documentazione catastale", "Altro"],
  },
};

export const TIPI_ITER_LABELS: Record<TipoIter, string> = Object.fromEntries(
  Object.entries(ITER_DEFINIZIONI).map(([k, v]) => [k, v.label])
) as Record<TipoIter, string>;

export const TIPI_ITER_OPTIONS = Object.entries(ITER_DEFINIZIONI).map(([value, def]) => ({
  value: value as TipoIter,
  label: def.label,
  ente: def.ente,
}));

// ─── HELPER PER PERSONALIZZAZIONI ────────────────────────────────────────────
// Applica le personalizzazioni dal DB agli step dell'iter
export function applicaPersonalizzazioniStep(
  tipoIter: TipoIter,
  personalizzazioni: Array<{ stepId: string; labelCustom?: string | null; descrizioneCustom?: string | null }>
): DefinizioneIter {
  const def = ITER_DEFINIZIONI[tipoIter];
  if (!personalizzazioni.length) return def;
  return {
    ...def,
    steps: def.steps.map(step => {
      const custom = personalizzazioni.find(p => p.stepId === step.id);
      if (!custom) return step;
      return {
        ...step,
        label: custom.labelCustom || step.label,
        descrizione: custom.descrizioneCustom || step.descrizione,
      };
    }),
  };
}
