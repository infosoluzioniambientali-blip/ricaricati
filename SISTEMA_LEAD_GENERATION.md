# Sistema Lead Generation — Soluzioni Ambientali / Ricaricati di Connessioni

**Documento preparato da:** Manus AI  
**Data:** Maggio 2026  
**Progetto:** soluzionipratiche.info — Pratiche Fotovoltaiche All'Ingrosso

---

## 1. Panoramica del Sistema

Questo documento descrive il sistema di lead generation implementato per **Soluzioni Ambientali**, grossista di pratiche fotovoltaiche (connessioni GSE, iter V1/V2, pratiche TERNA, ARERA, ecc.) che vende all'ingrosso a installatori, geometri, tecnici ed energy manager in tutta Italia.

Il sistema è composto da **3 livelli** integrati tra loro, tutti costruiti all'interno del sito web `soluzionipratiche.info` (stack: React + tRPC + MySQL/TiDB su piattaforma Manus).

---

## 2. Perché Questo Sistema (e Non lo Scraping Automatico)

Il settore fotovoltaico B2B ha caratteristiche specifiche che rendono il sistema di lead generation attiva (scraping + cold outreach) meno efficace rispetto a quello di acquisizione inbound:

| Fattore | Bollette (B2C) | Pratiche Fotovoltaico (B2B) |
|---|---|---|
| Target | Milioni di privati | ~15.000-20.000 installatori in Italia |
| Decisione d'acquisto | Emotiva, rapida | Professionale, razionale |
| Risposta a cold outreach | Media (15-20%) | Bassa (3-5%) |
| Valore per cliente | €50-200 | €2.000-5.100+ |
| Canale preferito | WhatsApp/SMS | Ricerca attiva su Google, passaparola |

Un installatore che cerca attivamente "pratiche fotovoltaico prezzi" su Google e trova la landing page vale 10 volte un installatore contattato a freddo. Il sistema è quindi orientato all'**acquisizione inbound qualificata**.

---

## 3. Livello 1 — Landing Page `/ingrosso` (Google Ads)

### Obiettivo
Convertire il traffico a pagamento (Google Ads) e organico (SEO) in lead qualificati che lasciano il proprio numero di telefono.

### URL
`soluzionipratiche.info/ingrosso`

### Contenuto della pagina
La landing page contiene:

- **Headline principale:** "Pratiche Fotovoltaiche All'Ingrosso — Fino all'80% in Meno Rispetto al Mercato"
- **Tabella comparativa** con prezzi di mercato barrati vs prezzi Soluzioni Ambientali:

| Tipo pratica | Mercato standard | Soluzioni Ambientali |
|---|---|---|
| Residenziale | €200–250 | **€85** (-66%) |
| Business | €800–1.500+ | **€250** (-83%) |
| Scadenza | Sì | **Mai** |

- **Form di contatto** con: nome/ragione sociale, numero di telefono, categoria (installatore, geometra/tecnico, energy manager, altro)
- **CTA WhatsApp** diretta al numero aziendale

### Come funziona il form
Quando un utente compila il form, il sistema:
1. Crea automaticamente un record nella tabella `prospect_installatori` del database con `fonte = "altro"` e una nota che include `[LEAD INGROSSO]` e la categoria selezionata
2. Invia una **notifica immediata all'owner** (tramite il sistema di notifiche Manus) con il nome, la categoria e il link WhatsApp diretto per contattare il lead

### Come usare per Google Ads
1. Crea una campagna Google Search su `ads.google.com`
2. Parole chiave consigliate: "pratiche fotovoltaico ingrosso", "connessione GSE prezzi", "pratiche V1 V2 costo", "iter fotovoltaico prezzi", "pratiche fotovoltaico all'ingrosso"
3. URL di destinazione: `soluzionipratiche.info/ingrosso`
4. Budget minimo efficace: €300-500/mese
5. Tutti i lead entrano automaticamente nel CRM

---

## 4. Livello 2 — Sequenza Follow-Up Automatica

### Obiettivo
Assicurarsi che nessun lead venga dimenticato, inviando reminder automatici all'owner nei giorni critici.

### Come funziona
Un job schedulato (`/api/scheduled/followup-ingrosso`) gira ogni notte e controlla tutti i lead provenienti dalla landing `/ingrosso` con stato "nuovo" (non ancora contattati). Per ogni lead:

- **Giorno 2:** Se il lead non è ancora stato contattato, l'owner riceve una notifica con il link WhatsApp diretto e un messaggio di urgenza ("Contattalo prima che si raffreddi!")
- **Giorno 7:** Se il lead è ancora senza risposta dopo 7 giorni, l'owner riceve un ultimo reminder con il suggerimento di cambiare stato a "Non Interessato" nel CRM

Il sistema aggiorna automaticamente il campo `sequenzaStep` del prospect per tracciare a quale step della sequenza si trova:
- `0` = lead nuovo, non ancora contattato
- `1` = reminder giorno 2 inviato
- `2` = reminder giorno 7 inviato (fine sequenza automatica)

### Configurazione del job schedulato
Il job è registrato come Heartbeat Manus. Per crearlo o verificarlo, usare il comando:

```bash
manus-heartbeat list
```

Per crearlo ex novo (se non esiste):

```bash
manus-heartbeat create \
  --name followup-ingrosso \
  --cron "0 0 7 * * *" \
  --path /api/scheduled/followup-ingrosso \
  --description "Follow-up automatico lead landing /ingrosso (reminder giorno 2 e 7)"
```

> **Nota:** Il job deve essere creato **dopo** il deploy del sito. Il sito deve essere pubblicato prima di attivare il job schedulato.

---

## 5. Livello 3 — SEO (Ottimizzazione per Google)

### Obiettivo
Generare traffico organico gratuito da installatori e tecnici che cercano attivamente pratiche fotovoltaiche su Google.

### Cosa è stato implementato

**Meta tag in `client/index.html`:**
- `<title>` ottimizzato: "Pratiche Fotovoltaiche All'Ingrosso | Soluzioni Ambientali"
- `<meta name="description">` con parole chiave principali
- Open Graph (Facebook/WhatsApp preview)
- Twitter Card
- Structured Data JSON-LD (LocalBusiness + Offer)

**Sitemap XML** (`/sitemap.xml`):
Include tutte le pagine principali del sito con priorità e frequenza di aggiornamento.

**Robots.txt** (`/robots.txt`):
Configurato per permettere l'indicizzazione di tutte le pagine pubbliche.

### Prossimi passi SEO consigliati
1. Registrare il sito su **Google Search Console** (`search.google.com/search-console`)
2. Inviare la sitemap: `soluzionipratiche.info/sitemap.xml`
3. Creare una pagina blog con articoli su "come fare pratiche fotovoltaico", "costo connessione GSE", ecc.

---

## 6. CRM Integrato

Tutti i lead (sia dalla landing `/ingrosso` che inseriti manualmente) confluiscono nel **CRM Prospect** dell'admin, accessibile dalla tab "CRM Prospect" nel pannello di amministrazione.

### Funzionalità del CRM
- Lista completa dei prospect con filtri per regione, settore, stato contatto
- Gestione stati: Nuovo → Da Contattare → Contattato → Trattativa → Accordo → Cliente Attivo
- Note e storico attività per ogni prospect
- Score AI (0-100) calcolato automaticamente
- Generazione link offerta personalizzata con token univoco
- Tab "Ordini Probabili" per tracciare la pipeline di vendita
- Tab "Prospect Inst." per gestire i prospect installatori specifici

### Come identificare i lead dalla landing `/ingrosso`
Nel CRM, i lead dalla landing hanno:
- `fonte = "altro"`
- `note` che contiene il testo `[LEAD INGROSSO]` e la categoria selezionata
- `statoContatto = "interessato"` (impostato automaticamente)

---

## 7. Concetto Commerciale "Grossista"

Il posizionamento commerciale del sito è basato sul concetto di **grossista delle pratiche fotovoltaiche**. Questo significa:

- **Soluzioni Ambientali è il grossista** — non l'installatore
- Gli installatori, geometri e tecnici **acquistano da noi all'ingrosso** e rivendono ai loro clienti con margine
- Il risparmio rispetto al mercato è fino all'**80%** (residenziale da €200-250 a €85; business da €800-1.500 a €250)
- Le pratiche non hanno scadenza — si possono acquistare in anticipo e usare quando serve

Questo concetto è comunicato in tutto il sito:
- **Hero section** della home: badge "Il Grossista delle Pratiche Fotovoltaiche"
- **Sezione comparativa** con tabella prezzi mercato vs Soluzioni Ambientali
- **Landing `/ingrosso`**: pagina dedicata al concetto di acquisto all'ingrosso
- **Pagina Partner**: sezione dedicata a tecnici/geometri/energy manager che rivendono ai loro clienti

---

## 8. Struttura Tecnica del Sistema

### File principali da conoscere

| File | Funzione |
|---|---|
| `client/src/pages/Ingrosso.tsx` | Landing page `/ingrosso` con form lead |
| `client/src/pages/Home.tsx` | Home page con sezione grossista e blocco tecnici |
| `client/src/pages/Partner.tsx` | Pagina partner con sezione rivendita tecnici |
| `server/routers.ts` (riga ~1609) | Procedura `leadIngrosso` (pubblica, crea prospect + notifica) |
| `server/_core/index.ts` (riga ~86) | Endpoint `/api/scheduled/followup-ingrosso` |
| `client/index.html` | Meta tag SEO, Open Graph, structured data |
| `client/public/sitemap.xml` | Sitemap per Google |
| `client/public/robots.txt` | Configurazione crawler |

### Procedura tRPC `leadIngrosso`
```typescript
// Chiamata dal frontend (Ingrosso.tsx)
trpc.prospectInstallatori.leadIngrosso.useMutation()

// Input richiesto
{
  ragioneSociale: string,  // nome/ragione sociale del lead
  telefono: string,         // numero di telefono
  settore?: string,         // categoria (installatore, geometra, energy manager, altro)
  note?: string,            // note aggiuntive
}
```

La procedura è **pubblica** (non richiede autenticazione) e:
1. Crea il record in `prospect_installatori` con `fonte="altro"`, `statoContatto="interessato"`, e una nota che include `[LEAD INGROSSO]` e la categoria
2. Invia una notifica immediata all'owner con il link WhatsApp

### Endpoint follow-up schedulato
```
POST /api/scheduled/followup-ingrosso
```
Non richiede autenticazione (è protetto dal gateway Manus per i job schedulati). Risponde con:
```json
{
  "success": true,
  "reminder2": 3,
  "reminder7": 1,
  "totaleLeadIngrosso": 15
}
```

---

## 9. Come Replicare Questo Sistema su un Altro Sito

Per applicare lo stesso sistema a un altro progetto Manus (es. Soluzioni Bollette), seguire questi passi:

**Passo 1 — Landing page**
Creare una pagina dedicata (es. `/ingrosso` o `/offerta`) con:
- Headline forte con il vantaggio principale
- Tabella comparativa prezzi mercato vs vostri prezzi
- Form con nome, telefono, categoria
- CTA WhatsApp

**Passo 2 — Procedura tRPC pubblica**
Nel router del progetto, aggiungere una procedura pubblica che:
1. Crea il record nel database con un tag identificativo (es. `[LEAD LANDING]`)
2. Chiama `notifyOwner()` con i dati del lead e il link WhatsApp

**Passo 3 — Endpoint follow-up**
In `server/_core/index.ts`, aggiungere:
```typescript
app.post("/api/scheduled/followup-lead", async (req, res) => {
  // Recupera lead con tag identificativo e stato "nuovo"
  // Per ogni lead: calcola giorni trascorsi
  // Se giorno 2 e step=0: invia notifica + aggiorna step=1
  // Se giorno 7 e step=1: invia notifica + aggiorna step=2
  res.json({ success: true });
});
```

**Passo 4 — Job schedulato**
Dopo il deploy:
```bash
manus-heartbeat create \
  --name followup-lead \
  --cron "0 0 7 * * *" \
  --path /api/scheduled/followup-lead \
  --description "Follow-up automatico lead landing"
```

**Passo 5 — SEO**
Aggiornare `client/index.html` con meta tag, Open Graph e structured data specifici per il settore. Creare `sitemap.xml` e `robots.txt` in `client/public/`.

---

## 10. Numeri Attesi

| Metrica | Stima (con Google Ads €300-500/mese) |
|---|---|
| Visite alla landing `/ingrosso` | 200-500/mese |
| Tasso di conversione form | 5-10% |
| Lead qualificati/mese | 10-50 |
| Costo per lead | €6-50 |
| Tasso di chiusura (lead → cliente) | 20-30% (B2B qualificato) |
| Nuovi clienti/mese | 2-15 |
| Valore medio per cliente | €2.000-5.100 |
| ROI stimato | 200-500% |

I numeri sono conservativi per il primo mese. Con ottimizzazione continua delle campagne e accumulo di recensioni/referral, il tasso di conversione può migliorare significativamente.

---

*Documento preparato da Manus AI — Maggio 2026*  
*Per domande tecniche sul codice: vedere i file indicati nella sezione 8.*
