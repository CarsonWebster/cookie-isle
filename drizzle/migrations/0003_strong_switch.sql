-- Add new columns for unsubscribe functionality
ALTER TABLE `newsletter` ADD `subscribed` integer DEFAULT true;--> statement-breakpoint
ALTER TABLE `newsletter` ADD `unsubscribe_token` text;--> statement-breakpoint
ALTER TABLE `newsletter` ADD `unsubscribed_at` text;--> statement-breakpoint

-- Generate unique tokens for existing subscribers using hex(randomblob(16))
UPDATE `newsletter` SET `unsubscribe_token` = lower(hex(randomblob(16))) WHERE `unsubscribe_token` IS NULL;--> statement-breakpoint

-- Now we can create the unique index
CREATE UNIQUE INDEX `newsletter_unsubscribe_token_unique` ON `newsletter` (`unsubscribe_token`);
