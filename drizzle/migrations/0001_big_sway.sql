CREATE TABLE `images` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`filename` text NOT NULL,
	`original_name` text NOT NULL,
	`url` text NOT NULL,
	`mime_type` text NOT NULL,
	`size_bytes` integer NOT NULL,
	`card_focal_x` integer DEFAULT 50,
	`card_focal_y` integer DEFAULT 50,
	`hero_focal_x` integer DEFAULT 50,
	`hero_focal_y` integer DEFAULT 50,
	`created_at` text DEFAULT (datetime('now'))
);
--> statement-breakpoint
CREATE UNIQUE INDEX `images_filename_unique` ON `images` (`filename`);