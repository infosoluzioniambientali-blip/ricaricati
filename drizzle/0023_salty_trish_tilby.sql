CREATE TABLE `prospect_corsi` (
	`id` int AUTO_INCREMENT NOT NULL,
	`prospectId` int NOT NULL,
	`potenzaKw` decimal(10,2) DEFAULT '100',
	`tipo` varchar(100) DEFAULT 'industriale',
	`comune` varchar(255),
	`dataPrevista` timestamp,
	`stato` varchar(50) DEFAULT 'valutazione',
	`valoreStimato` decimal(10,2),
	`praticheStimate` int DEFAULT 1,
	`note` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `prospect_corsi_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `prospect_ordini_probabili` (
	`id` int AUTO_INCREMENT NOT NULL,
	`prospectId` int NOT NULL,
	`prodotto` varchar(255) NOT NULL,
	`importoStimato` decimal(10,2) DEFAULT '0',
	`probabilita` int DEFAULT 50,
	`stato` varchar(50) DEFAULT 'bozza',
	`scadenza` timestamp,
	`note` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `prospect_ordini_probabili_id` PRIMARY KEY(`id`)
);
