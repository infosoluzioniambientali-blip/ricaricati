-- Schema sync: colonne già presenti nel DB promo_installatore
-- pratiche_res, pratiche_bus, prezzo_res, prezzo_bus, mostra_in_home, visibilita
-- Queste colonne esistono già nel database, questa migrazione le registra solo nel journal Drizzle
SELECT 1;
