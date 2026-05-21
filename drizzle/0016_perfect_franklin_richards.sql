CREATE TABLE `config_documenti` (
	`id` int AUTO_INCREMENT NOT NULL,
	`tipoIter` varchar(100) NOT NULL,
	`nomeDocumento` varchar(300) NOT NULL,
	`ordine` int NOT NULL DEFAULT 0,
	`obbligatorio` boolean NOT NULL DEFAULT false,
	`visibile` boolean NOT NULL DEFAULT true,
	`installatoreId` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `config_documenti_id` PRIMARY KEY(`id`)
);
