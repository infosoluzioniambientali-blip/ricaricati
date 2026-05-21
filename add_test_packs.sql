-- Aggiungere pacchetti personalizzati
INSERT INTO pack_configurazione (slug, nome, prezzo, praticheRes, prezzoRes, praticheBus, prezzoBus, descrizione, badge, colore, attivo, ordine) VALUES
('pack-starter', 'Pack Starter', 1500.00, 10, 150, 3, 400, 'Pack perfetto per iniziare', 'Consigliato', 'blue', 1, 1),
('pack-premium', 'Pack Premium', 7500.00, 100, 75, 30, 250, 'Pack per professionisti', 'Miglior Valore', 'yellow', 1, 2);

-- Aggiungere promo globali
INSERT INTO promo_installatore (installatoreId, titolo, descrizione, prezzo, prezzoOriginale, cta, ctaUrl, scadenza, attivo, colore, ordine, praticheRes, praticheBus, mostraInHome) VALUES
(0, 'Promo Primavera', 'Sconto speciale per le nuove iscrizioni', 1800.00, 2000.00, 'Acquista Ora', '/acquista?promo=primavera', DATE_ADD(NOW(), INTERVAL 30 DAY), 1, 'green', 1, 15, 5, 1),
(0, 'Offerta Flash', 'Disponibile solo questa settimana', 2800.00, 3150.00, 'Scopri di più', '/acquista?promo=flash', DATE_ADD(NOW(), INTERVAL 7 DAY), 1, 'red', 2, 25, 8, 1);
