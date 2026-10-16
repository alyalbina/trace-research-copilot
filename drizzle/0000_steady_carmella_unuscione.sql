CREATE TABLE `evaluationCases` (
	`id` text PRIMARY KEY NOT NULL,
	`segmentId` text NOT NULL,
	`expectedKind` text NOT NULL,
	`themeTitle` text NOT NULL,
	`relevant` integer NOT NULL,
	FOREIGN KEY (`segmentId`) REFERENCES `segments`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `evidence` (
	`id` text PRIMARY KEY NOT NULL,
	`segmentId` text NOT NULL,
	`quote` text NOT NULL,
	`kind` text NOT NULL,
	`themeId` text,
	`provenance` text NOT NULL,
	`createdAt` text NOT NULL,
	FOREIGN KEY (`segmentId`) REFERENCES `segments`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`themeId`) REFERENCES `themes`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `insightLinks` (
	`insightId` text NOT NULL,
	`evidenceId` text NOT NULL,
	`role` text NOT NULL,
	PRIMARY KEY(`insightId`, `evidenceId`),
	FOREIGN KEY (`insightId`) REFERENCES `insights`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`evidenceId`) REFERENCES `evidence`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `insights` (
	`id` text PRIMARY KEY NOT NULL,
	`projectId` text NOT NULL,
	`themeId` text,
	`title` text NOT NULL,
	`explanation` text NOT NULL,
	`limitations` text NOT NULL,
	`status` text NOT NULL,
	`provenance` text NOT NULL,
	`createdAt` text NOT NULL,
	FOREIGN KEY (`projectId`) REFERENCES `projects`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`themeId`) REFERENCES `themes`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `interviews` (
	`id` text PRIMARY KEY NOT NULL,
	`projectId` text NOT NULL,
	`participantId` text NOT NULL,
	`title` text NOT NULL,
	`date` text NOT NULL,
	`tags` text NOT NULL,
	`objective` text NOT NULL,
	`notes` text NOT NULL,
	`transcript` text NOT NULL,
	`synthetic` integer NOT NULL,
	`analysisStatus` text NOT NULL,
	`createdAt` text NOT NULL,
	FOREIGN KEY (`projectId`) REFERENCES `projects`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`participantId`) REFERENCES `participants`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `interview_transcript_project` ON `interviews` (`projectId`,`transcript`);--> statement-breakpoint
CREATE TABLE `opportunities` (
	`id` text PRIMARY KEY NOT NULL,
	`projectId` text NOT NULL,
	`title` text NOT NULL,
	`problem` text NOT NULL,
	`hypothesis` text NOT NULL,
	`direction` text NOT NULL,
	`segment` text NOT NULL,
	`assumptions` text NOT NULL,
	`outcome` text NOT NULL,
	`risk` text NOT NULL,
	`impact` integer NOT NULL,
	`confidence` integer NOT NULL,
	`effort` integer NOT NULL,
	`status` text NOT NULL,
	`metric` text NOT NULL,
	`validation` text NOT NULL,
	`createdAt` text NOT NULL,
	FOREIGN KEY (`projectId`) REFERENCES `projects`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `opportunityLinks` (
	`opportunityId` text NOT NULL,
	`insightId` text NOT NULL,
	PRIMARY KEY(`opportunityId`, `insightId`),
	FOREIGN KEY (`opportunityId`) REFERENCES `opportunities`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`insightId`) REFERENCES `insights`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `participants` (
	`id` text PRIMARY KEY NOT NULL,
	`identifier` text NOT NULL,
	`segment` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `projects` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`objective` text NOT NULL,
	`questions` text NOT NULL,
	`context` text NOT NULL,
	`methodology` text NOT NULL,
	`criteria` text NOT NULL,
	`status` text NOT NULL,
	`createdAt` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `reports` (
	`id` text PRIMARY KEY NOT NULL,
	`projectId` text NOT NULL,
	`title` text NOT NULL,
	`markdown` text NOT NULL,
	`createdAt` text NOT NULL,
	FOREIGN KEY (`projectId`) REFERENCES `projects`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `reviews` (
	`id` text PRIMARY KEY NOT NULL,
	`entityId` text NOT NULL,
	`action` text NOT NULL,
	`note` text NOT NULL,
	`createdAt` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `runs` (
	`id` text PRIMARY KEY NOT NULL,
	`projectId` text NOT NULL,
	`mode` text NOT NULL,
	`status` text NOT NULL,
	`detail` text NOT NULL,
	`createdAt` text NOT NULL,
	FOREIGN KEY (`projectId`) REFERENCES `projects`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `segments` (
	`id` text PRIMARY KEY NOT NULL,
	`interviewId` text NOT NULL,
	`position` integer NOT NULL,
	`speaker` text,
	`timestamp` text,
	`text` text NOT NULL,
	`startOffset` integer NOT NULL,
	`endOffset` integer NOT NULL,
	FOREIGN KEY (`interviewId`) REFERENCES `interviews`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `themes` (
	`id` text PRIMARY KEY NOT NULL,
	`projectId` text NOT NULL,
	`title` text NOT NULL,
	`explanation` text NOT NULL,
	`status` text NOT NULL,
	FOREIGN KEY (`projectId`) REFERENCES `projects`(`id`) ON UPDATE no action ON DELETE no action
);
