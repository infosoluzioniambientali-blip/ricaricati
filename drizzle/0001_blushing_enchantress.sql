CREATE TABLE `documenti` (
	`id` int AUTO_INCREMENT NOT NULL,
	`praticaId` int NOT NULL,
	`installatoreId` int NOT NULL,
	`nomeFile` varchar(255) NOT NULL,
	`tipoFile` varchar(100),
	`storageKey` varchar(500) NOT NULL,
	`storageUrl` varchar(500) NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `documenti_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `installatori` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`ragioneSociale` varchar(255) NOT NULL,
	`partitaIva` varchar(20),
	`telefono` varchar(30),
	`citta` varchar(100),
	`provincia` varchar(10),
	`stato` enum('in_attesa','approvato','rifiutato') NOT NULL DEFAULT 'in_attesa',
	`saldoPratiche` int NOT NULL DEFAULT 0,
	`saldoBusiness` int NOT NULL DEFAULT 0,
	`totaleFatturato` decimal(12,2) NOT NULL DEFAULT '0',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `installatori_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `ordini` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`installatoreId` int,
	`packId` enum('pack1','pack2','pack3') NOT NULL,
	`importo` decimal(10,2) NOT NULL,
	`metodoPagamento` enum('paypal','bonifico') NOT NULL,
	`stato` enum('in_attesa','pagato','annullato') NOT NULL DEFAULT 'in_attesa',
	`nomeAcquirente` varchar(255) NOT NULL,
	`emailAcquirente` varchar(320) NOT NULL,
	`telefonoAcquirente` varchar(30),
	`ragioneSocialeAcquirente` varchar(255),
	`note` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `ordini_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `pratiche` (
	`id` int AUTO_INCREMENT NOT NULL,
	`installatoreId` int NOT NULL,
	`userId` int NOT NULL,
	`tipologia` enum('residenziale','business') NOT NULL,
	`potenzaKw` decimal(8,2),
	`indirizzoImpianto` text,
	`comuneImpianto` varchar(100),
	`provinciaImpianto` varchar(10),
	`nomeTitolare` varchar(255),
	`stato` enum('bozza','inviata','in_lavorazione','completata','rifiutata') NOT NULL DEFAULT 'bozza',
	`note` text,
	`noteAdmin` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `pratiche_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `ricariche` (
	`id` int AUTO_INCREMENT NOT NULL,
	`installatoreId` int NOT NULL,
	`tipo` enum('bolletta','passaparola') NOT NULL,
	`importo` decimal(8,2) NOT NULL,
	`descrizione` text,
	`approvato` boolean NOT NULL DEFAULT false,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `ricariche_id` PRIMARY KEY(`id`)
);
