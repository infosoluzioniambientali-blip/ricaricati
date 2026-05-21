# Ripristino Ricaricati di Connessioni - TODO

## Fase 1: Estrazione e Sovrascrittura File
- [x] Estrarre codice_sorgente.zip dal backup
- [x] Ripristinare la struttura completa del progetto

## Fase 2: Database TiDB e Migrazioni
- [x] Configurare DATABASE_URL per TiDB
- [x] Eseguire pnpm db:push per creare 25 tabelle
- [x] Importare database_dump.sql (24 utenti, 17 installatori, 13 ordini)
- [x] Verificare migrazioni completate

## Fase 3: Dipendenze e Correzioni TypeScript
- [x] Installare tutte le dipendenze (pnpm install)
- [x] Verificare che non ci siano errori TypeScript

## Fase 4: Verifica Funzionamento
- [x] Verificare server avviato correttamente su http://localhost:3000
- [x] Verificare database connesso e dati presenti
- [x] Verificare UI caricata correttamente

## Fase 5: Pubblicazione e Dominio Custom
- [ ] Creare checkpoint finale
- [ ] Pubblicare il sito
- [ ] Configurare dominio custom soluzionipratiche.info
- [ ] Verificare dominio raggiungibile

## Note
- Progetto: Ricaricati di Connessioni
- Database: TiDB Cloud (hj4iMukfUvkm7N5bse2N5k)
- Dominio: soluzionipratiche.info
- Checkpoint originale: c5cfe08b (20 maggio 2026)
