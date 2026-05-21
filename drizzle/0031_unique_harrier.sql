CREATE TABLE `premi_bollette` (
	`id` int AUTO_INCREMENT NOT NULL,
	`installatoreId` int NOT NULL,
	`nomeCliente` varchar(255) NOT NULL,
	`telefonoCliente` varchar(30),
	`emailCliente` varchar(320),
	`fileUrl` text,
	`fileKey` varchar(500),
	`nomeFile` varchar(255),
	`note` text,
	`stato` enum('in_attesa','approvato','rifiutato') NOT NULL DEFAULT 'in_attesa',
	`creditoAssegnato` decimal(10,2) DEFAULT '0',
	`noteAdmin` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `premi_bollette_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `premi_codici` (
	`id` int AUTO_INCREMENT NOT NULL,
	`codice` varchar(50) NOT NULL,
	`descrizione` text,
	`valoreCreditoEur` decimal(10,2) NOT NULL,
	`installatoreIdAssegnato` int,
	`installatoreIdRiscattato` int,
	`riscattatoAt` timestamp,
	`attivo` boolean NOT NULL DEFAULT true,
	`usatoUnaVolta` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `premi_codici_id` PRIMARY KEY(`id`),
	CONSTRAINT `premi_codici_codice_unique` UNIQUE(`codice`)
);
--> statement-breakpoint
CREATE TABLE `premi_nominativi` (
	`id` int AUTO_INCREMENT NOT NULL,
	`installatoreId` int NOT NULL,
	`nomeInstallatore` varchar(255) NOT NULL,
	`azienda` varchar(255),
	`telefono` varchar(30),
	`email` varchar(320),
	`citta` varchar(100),
	`note` text,
	`stato` enum('in_attesa','contattato','convertito','non_interessato') NOT NULL DEFAULT 'in_attesa',
	`creditoAssegnato` decimal(10,2) DEFAULT '0',
	`noteAdmin` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `premi_nominativi_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `promo_installatore` MODIFY COLUMN `pratiche_res` int NOT NULL DEFAULT 0;--> statement-breakpoint
ALTER TABLE `promo_installatore` MODIFY COLUMN `pratiche_bus` int NOT NULL DEFAULT 0;--> statement-breakpoint
ALTER TABLE `promo_installatore` MODIFY COLUMN `prezzo_res` decimal(10,2);--> statement-breakpoint
ALTER TABLE `promo_installatore` MODIFY COLUMN `prezzo_bus` decimal(10,2);--> statement-breakpoint
ALTER TABLE `installatori` ADD `codicePromo` varchar(20);--> statement-breakpoint
ALTER TABLE `installatori` ADD CONSTRAINT `installatori_codicePromo_unique` UNIQUE(`codicePromo`);