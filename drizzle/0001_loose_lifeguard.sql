CREATE TABLE `api_keys` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`name` varchar(255) NOT NULL,
	`keyHash` varchar(128) NOT NULL,
	`keyPrefix` varchar(16) NOT NULL,
	`permissions` json,
	`isActive` boolean NOT NULL DEFAULT true,
	`lastUsedAt` timestamp,
	`expiresAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `api_keys_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `documents` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`title` varchar(500) NOT NULL,
	`sourceType` enum('email','waybill','invoice','order_note','customs','price_quote','other') NOT NULL,
	`rawContent` text NOT NULL,
	`fileUrl` text,
	`fileKey` varchar(512),
	`fileName` varchar(255),
	`mimeType` varchar(128),
	`status` enum('pending','processing','completed','failed') NOT NULL DEFAULT 'pending',
	`processedAt` timestamp,
	`supplierName` varchar(255),
	`metadata` json,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `documents_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `email_sources` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`name` varchar(255) NOT NULL,
	`emailAddress` varchar(320) NOT NULL,
	`sourceType` enum('supplier','carrier','customs','internal','other') NOT NULL DEFAULT 'supplier',
	`isActive` boolean NOT NULL DEFAULT true,
	`lastCheckedAt` timestamp,
	`totalProcessed` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `email_sources_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `erp_categories` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`type` enum('expense','operation','material','route','supplier','custom') NOT NULL,
	`code` varchar(64) NOT NULL,
	`name` varchar(255) NOT NULL,
	`description` text,
	`parentId` int,
	`erpField` varchar(128),
	`isActive` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `erp_categories_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `matching_results` (
	`id` int AUTO_INCREMENT NOT NULL,
	`documentId` int NOT NULL,
	`userId` int NOT NULL,
	`extractedTerm` varchar(500) NOT NULL,
	`matchedCategoryId` int,
	`matchedCategoryName` varchar(255),
	`confidenceScore` float NOT NULL,
	`matchType` enum('semantic','rule','exact','manual') NOT NULL DEFAULT 'semantic',
	`erpField` varchar(128),
	`standardizedValue` text,
	`isApproved` boolean NOT NULL DEFAULT false,
	`approvedBy` int,
	`approvedAt` timestamp,
	`llmExplanation` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `matching_results_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `matching_rules` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`name` varchar(255) NOT NULL,
	`description` text,
	`sourcePattern` varchar(500) NOT NULL,
	`targetCategoryId` int NOT NULL,
	`matchStrategy` enum('exact','contains','regex','semantic') NOT NULL DEFAULT 'contains',
	`priority` int NOT NULL DEFAULT 0,
	`isActive` boolean NOT NULL DEFAULT true,
	`timesApplied` int NOT NULL DEFAULT 0,
	`lastAppliedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `matching_rules_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `processing_logs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`documentId` int,
	`action` varchar(64) NOT NULL,
	`details` json,
	`status` enum('success','warning','error') NOT NULL DEFAULT 'success',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `processing_logs_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `users` ADD `companyName` varchar(255);