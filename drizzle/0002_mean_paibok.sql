ALTER TABLE `tournaments` MODIFY COLUMN `ruleset` varchar(120) NOT NULL DEFAULT 'IBJJF Standard';--> statement-breakpoint
ALTER TABLE `registrations` ADD `weighInNotes` text;--> statement-breakpoint
ALTER TABLE `tournaments` ADD `organizationName` varchar(160) DEFAULT 'Championship OS' NOT NULL;--> statement-breakpoint
ALTER TABLE `tournaments` ADD `registrationSlug` varchar(120) NOT NULL;--> statement-breakpoint
ALTER TABLE `tournaments` ADD `weighInMode` enum('ibjjf','custom') DEFAULT 'ibjjf' NOT NULL;--> statement-breakpoint
ALTER TABLE `tournaments` ADD `weighInTolerance` decimal(4,2) DEFAULT '0.00' NOT NULL;--> statement-breakpoint
ALTER TABLE `tournaments` ADD CONSTRAINT `tournaments_registrationSlug_unique` UNIQUE(`registrationSlug`);