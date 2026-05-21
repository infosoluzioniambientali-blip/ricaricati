CREATE TABLE `pec` (
	`id` int AUTO_INCREMENT NOT NULL,
	`installatoreId` int NOT NULL,
	`email` varchar(320) NOT NULL,
	`verificato` boolean NOT NULL DEFAULT false,
	`dataVerifica` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `pec_id` PRIMARY KEY(`id`)
);
