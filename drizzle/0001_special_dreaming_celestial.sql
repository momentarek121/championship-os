CREATE TABLE `athletes` (
	`id` int AUTO_INCREMENT NOT NULL,
	`fullName` varchar(180) NOT NULL,
	`email` varchar(320),
	`phone` varchar(40),
	`dateOfBirth` timestamp,
	`gender` enum('male','female') NOT NULL,
	`belt` varchar(40) NOT NULL,
	`expectedWeight` decimal(6,2),
	`actualWeight` decimal(6,2),
	`clubId` int,
	`federationId` varchar(80),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `athletes_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `audit_logs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`actorUserId` int NOT NULL,
	`entityType` varchar(60) NOT NULL,
	`entityId` int NOT NULL,
	`action` varchar(80) NOT NULL,
	`beforeValue` text,
	`afterValue` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `audit_logs_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `categories` (
	`id` int AUTO_INCREMENT NOT NULL,
	`tournamentId` int NOT NULL,
	`name` varchar(180) NOT NULL,
	`ageGroup` varchar(60) NOT NULL,
	`gender` varchar(20) NOT NULL,
	`belt` varchar(40) NOT NULL,
	`weightLimit` decimal(6,2) NOT NULL,
	`sport` varchar(80) NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `categories_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `clubs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(160) NOT NULL,
	`country` varchar(80),
	`contactName` varchar(120),
	`contactPhone` varchar(40),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `clubs_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `matches` (
	`id` int AUTO_INCREMENT NOT NULL,
	`tournamentId` int NOT NULL,
	`categoryId` int NOT NULL,
	`matId` int,
	`round` varchar(40) NOT NULL,
	`matchNumber` int NOT NULL,
	`athleteAId` int,
	`athleteBId` int,
	`scoreA` int NOT NULL DEFAULT 0,
	`scoreB` int NOT NULL DEFAULT 0,
	`winnerId` int,
	`status` enum('queued','called','live','finished','no_show') NOT NULL DEFAULT 'queued',
	`scheduledAt` timestamp,
	`finishedAt` timestamp,
	CONSTRAINT `matches_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `mats` (
	`id` int AUTO_INCREMENT NOT NULL,
	`tournamentId` int NOT NULL,
	`name` varchar(40) NOT NULL,
	`status` enum('available','live','paused') NOT NULL DEFAULT 'available',
	CONSTRAINT `mats_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `registrations` (
	`id` int AUTO_INCREMENT NOT NULL,
	`tournamentId` int NOT NULL,
	`athleteId` int NOT NULL,
	`categoryId` int,
	`status` enum('pending','approved','rejected') NOT NULL DEFAULT 'pending',
	`paymentStatus` enum('unpaid','pending','paid','refunded') NOT NULL DEFAULT 'unpaid',
	`paymentMethod` varchar(40),
	`checkInStatus` enum('not_checked_in','checked_in') NOT NULL DEFAULT 'not_checked_in',
	`weighInStatus` enum('pending','passed','overweight') NOT NULL DEFAULT 'pending',
	`accreditationCode` varchar(40),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `registrations_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `tournaments` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(180) NOT NULL,
	`sport` varchar(80) NOT NULL,
	`location` varchar(180),
	`startDate` timestamp,
	`endDate` timestamp,
	`status` enum('draft','registration','live','completed') NOT NULL DEFAULT 'draft',
	`ruleset` varchar(120) NOT NULL DEFAULT 'Standard',
	`createdBy` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `tournaments_id` PRIMARY KEY(`id`)
);
