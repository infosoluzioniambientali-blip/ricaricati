ALTER TABLE `installatori` ADD `sogliaPackOmaggio` decimal(10,2) DEFAULT '2000' NOT NULL;--> statement-breakpoint
ALTER TABLE `installatori` ADD `packOmaggioNotificato` boolean DEFAULT false NOT NULL;