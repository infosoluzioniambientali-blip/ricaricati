ALTER TABLE `prospect_installatori` MODIFY COLUMN `statoContatto` enum('nuovo','da_contattare','contattato','trattativa','interessato','accordo','cliente_attivo','cliente','non_interessato') NOT NULL DEFAULT 'nuovo';--> statement-breakpoint
ALTER TABLE `prospect_installatori` MODIFY COLUMN `fonte` enum('webinar','excel','google_maps','manuale','cciaa','linkedin','altro') NOT NULL DEFAULT 'manuale';--> statement-breakpoint
ALTER TABLE `prospect_installatori` ADD `nome` varchar(255);--> statement-breakpoint
ALTER TABLE `prospect_installatori` ADD `referente` varchar(100);--> statement-breakpoint
ALTER TABLE `prospect_installatori` ADD `dataAccordo` timestamp;--> statement-breakpoint
ALTER TABLE `prospect_installatori` ADD `sconto` decimal(5,2);--> statement-breakpoint
ALTER TABLE `prospect_installatori` ADD `noteAccordo` text;--> statement-breakpoint
ALTER TABLE `prospect_installatori` ADD `dataUltimoContatto` timestamp;--> statement-breakpoint
ALTER TABLE `prospect_installatori` ADD `scoreAI` int DEFAULT 0;--> statement-breakpoint
ALTER TABLE `prospect_installatori` ADD `tokenOfferta` varchar(64);--> statement-breakpoint
ALTER TABLE `prospect_installatori` ADD `tokenOffertaScadenza` timestamp;--> statement-breakpoint
ALTER TABLE `prospect_installatori` ADD `tokenOffertaPackId` varchar(20);--> statement-breakpoint
ALTER TABLE `prospect_installatori` ADD `tokenOffertaSconto` int;--> statement-breakpoint
ALTER TABLE `prospect_installatori` ADD `tokenOffertaMessaggio` text;--> statement-breakpoint
ALTER TABLE `prospect_installatori` ADD `sequenzaStep` int DEFAULT 0;--> statement-breakpoint
ALTER TABLE `prospect_installatori` ADD `sequenzaUltimoStep` timestamp;--> statement-breakpoint
ALTER TABLE `prospect_installatori` ADD `ultimaAttivita` timestamp;--> statement-breakpoint
ALTER TABLE `prospect_installatori` ADD `eliminatoAt` timestamp;