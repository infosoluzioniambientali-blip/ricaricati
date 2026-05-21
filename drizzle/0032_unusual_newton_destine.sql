CREATE TABLE `impostazioni` (
	`id` int AUTO_INCREMENT NOT NULL,
	`chiave` varchar(100) NOT NULL,
	`valore` text NOT NULL,
	`descrizione` text,
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `impostazioni_id` PRIMARY KEY(`id`),
	CONSTRAINT `impostazioni_chiave_unique` UNIQUE(`chiave`)
);
