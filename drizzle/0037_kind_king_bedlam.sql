CREATE TABLE `admin_documents` (
	`id` int AUTO_INCREMENT NOT NULL,
	`nome` varchar(255) NOT NULL,
	`descrizione` text,
	`stato` enum('obbligatorio','opzionale','consigliato') NOT NULL DEFAULT 'obbligatorio',
	`ordine` int NOT NULL DEFAULT 0,
	`attivo` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `admin_documents_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `installatore_documents` (
	`id` int AUTO_INCREMENT NOT NULL,
	`installatoreId` int NOT NULL,
	`adminDocumentId` int NOT NULL,
	`fileUrl` text,
	`statoCompilazione` enum('da_compilare','compilato','rifiutato') NOT NULL DEFAULT 'da_compilare',
	`note` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `installatore_documents_id` PRIMARY KEY(`id`)
);
