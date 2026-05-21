ALTER TABLE `ordini` MODIFY COLUMN `packId` enum('pack1','pack2','pack3','singolo','custom') NOT NULL;--> statement-breakpoint
ALTER TABLE `ordini` ADD `nomePacchetto` varchar(255);--> statement-breakpoint
ALTER TABLE `ordini` ADD `prezzoResidenziale` decimal(10,2);--> statement-breakpoint
ALTER TABLE `ordini` ADD `prezzoBusiness` decimal(10,2);