CREATE TABLE `backup_config` (
	`id` int AUTO_INCREMENT NOT NULL,
	`frequenza` enum('giornaliero','settimanale','mensile') NOT NULL DEFAULT 'settimanale',
	`attivo` boolean NOT NULL DEFAULT false,
	`ultimoBackup` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `backup_config_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `backup_storico` (
	`id` int AUTO_INCREMENT NOT NULL,
	`storageKey` varchar(500) NOT NULL,
	`storageUrl` varchar(500) NOT NULL,
	`dimensioneBytes` int NOT NULL DEFAULT 0,
	`stato` enum('completato','errore') NOT NULL DEFAULT 'completato',
	`erroreMessaggio` text,
	`tipo` enum('manuale','automatico') NOT NULL DEFAULT 'manuale',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `backup_storico_id` PRIMARY KEY(`id`)
);
