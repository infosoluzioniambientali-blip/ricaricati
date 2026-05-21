CREATE TABLE `listino_personalizzato` (
	`id` int AUTO_INCREMENT NOT NULL,
	`installatoreId` int NOT NULL,
	`nomeListino` varchar(255) NOT NULL DEFAULT 'Listino Personalizzato',
	`prezzi` text NOT NULL,
	`attivo` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `listino_personalizzato_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `installatori` ADD `tipoInterfaccia` enum('pack_e_singole','solo_singole') DEFAULT 'pack_e_singole' NOT NULL;--> statement-breakpoint
ALTER TABLE `ordini` ADD `pratiche_incluse_residenziali` int DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `ordini` ADD `pratiche_incluse_business` int DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `ordini` ADD `pratiche_usate_residenziali` int DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `ordini` ADD `pratiche_usate_business` int DEFAULT 0 NOT NULL;