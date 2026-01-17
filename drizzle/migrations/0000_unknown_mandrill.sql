CREATE TABLE `admin_sessions` (
	`id` text PRIMARY KEY NOT NULL,
	`expires_at` text NOT NULL,
	`created_at` text DEFAULT (datetime('now'))
);
--> statement-breakpoint
CREATE TABLE `daily_capacity` (
	`date` text PRIMARY KEY NOT NULL,
	`cookies_ordered` integer DEFAULT 0,
	`updated_at` text DEFAULT (datetime('now'))
);
--> statement-breakpoint
CREATE TABLE `fulfillment_slots` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`date` text NOT NULL,
	`start_time` text NOT NULL,
	`end_time` text NOT NULL,
	`slot_type` text DEFAULT 'both',
	`max_cookies` integer DEFAULT 200,
	`active` integer DEFAULT true
);
--> statement-breakpoint
CREATE TABLE `newsletter` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`email` text NOT NULL,
	`source` text DEFAULT 'website',
	`subscribed_at` text DEFAULT (datetime('now'))
);
--> statement-breakpoint
CREATE UNIQUE INDEX `newsletter_email_unique` ON `newsletter` (`email`);--> statement-breakpoint
CREATE TABLE `orders` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`stripe_session_id` text,
	`status` text DEFAULT 'pending',
	`customer_name` text,
	`customer_email` text,
	`customer_phone` text,
	`fulfillment_type` text,
	`fulfillment_date` text,
	`fulfillment_time` text,
	`delivery_address` text,
	`items` text NOT NULL,
	`subtotal_cents` integer,
	`tip_cents` integer DEFAULT 0,
	`gift_box` integer DEFAULT false,
	`gift_message` text,
	`tax_cents` integer DEFAULT 0,
	`total_cents` integer,
	`created_at` text DEFAULT (datetime('now'))
);
--> statement-breakpoint
CREATE UNIQUE INDEX `orders_stripe_session_id_unique` ON `orders` (`stripe_session_id`);--> statement-breakpoint
CREATE TABLE `products` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`slug` text NOT NULL,
	`title` text NOT NULL,
	`price_cents` integer NOT NULL,
	`stripe_price_id` text NOT NULL,
	`description` text,
	`ingredients` text,
	`image_url` text,
	`hero_image_url` text,
	`tags` text,
	`featured` integer DEFAULT false,
	`active` integer DEFAULT true,
	`sort_order` integer DEFAULT 0,
	`created_at` text DEFAULT (datetime('now')),
	`updated_at` text DEFAULT (datetime('now'))
);
--> statement-breakpoint
CREATE UNIQUE INDEX `products_slug_unique` ON `products` (`slug`);