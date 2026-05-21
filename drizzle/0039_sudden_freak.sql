CREATE TABLE `storico_ordini` (
	`id` int AUTO_INCREMENT NOT NULL,
	`ordineId` int NOT NULL,
	`tipoEvento` enum('creazione','assegnazione','riassegnazione','cambio_stato','utilizzo_pratica','credito_aggiornato','note_aggiunte') NOT NULL,
	`statoPrec` varchar(50),
	`statoNuovo` varchar(50),
	`installatoreIdPrec` int,
	`installatoreIdNuovo` int,
	`descrizione` text,
	`dettagli` text,
	`utenteCheHaFattoIlCambio` varchar(255),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `storico_ordini_id` PRIMARY KEY(`id`)
);
