CREATE TABLE `pack_configurazione` (
	`id` int AUTO_INCREMENT NOT NULL,
	`slug` varchar(50) NOT NULL,
	`nome` varchar(255) NOT NULL,
	`prezzo` decimal(10,2) NOT NULL,
	`praticheRes` int NOT NULL DEFAULT 0,
	`prezzoRes` decimal(10,2) NOT NULL DEFAULT '0',
	`praticheBus` int NOT NULL DEFAULT 0,
	`prezzoBus` decimal(10,2) NOT NULL DEFAULT '0',
	`descrizione` text,
	`badge` varchar(100),
	`colore` varchar(50) DEFAULT 'green',
	`attivo` boolean NOT NULL DEFAULT true,
	`ordine` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `pack_configurazione_id` PRIMARY KEY(`id`),
	CONSTRAINT `pack_configurazione_slug_unique` UNIQUE(`slug`)
);
--> statement-breakpoint
CREATE TABLE `promo_installatore` (
	`id` int AUTO_INCREMENT NOT NULL,
	`installatoreId` int NOT NULL,
	`titolo` varchar(255) NOT NULL,
	`descrizione` text,
	`prezzo` decimal(10,2),
	`prezzoOriginale` decimal(10,2),
	`cta` varchar(100) DEFAULT 'Scopri di più',
	`ctaUrl` varchar(500),
	`scadenza` timestamp,
	`attivo` boolean NOT NULL DEFAULT true,
	`colore` varchar(50) DEFAULT 'yellow',
	`ordine` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `promo_installatore_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `ricariche_configurazione` (
	`id` int AUTO_INCREMENT NOT NULL,
	`slug` varchar(50) NOT NULL,
	`nome` varchar(255) NOT NULL,
	`prezzo` decimal(10,2) NOT NULL,
	`descrizione` text,
	`badge` varchar(100),
	`icona` varchar(100) DEFAULT 'zap',
	`attivo` boolean NOT NULL DEFAULT true,
	`ordine` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `ricariche_configurazione_id` PRIMARY KEY(`id`),
	CONSTRAINT `ricariche_configurazione_slug_unique` UNIQUE(`slug`)
);
