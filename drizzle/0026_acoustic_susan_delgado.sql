ALTER TABLE `documenti` ADD `statoRevisione` enum('in_attesa','approvato','rifiutato') DEFAULT 'in_attesa' NOT NULL;--> statement-breakpoint
ALTER TABLE `documenti` ADD `notaRevisione` text;