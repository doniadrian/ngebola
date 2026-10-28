CREATE TABLE `audit_logs` (
	`id` text PRIMARY KEY NOT NULL,
	`actor_user_id` text,
	`action` text NOT NULL,
	`target_type` text NOT NULL,
	`target_id` text,
	`reason` text,
	`detail` text,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`actor_user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `audit_created_idx` ON `audit_logs` (`created_at`);--> statement-breakpoint
CREATE TABLE `chat_messages` (
	`id` text PRIMARY KEY NOT NULL,
	`match_id` text NOT NULL,
	`sender_user_id` text,
	`kind` text NOT NULL,
	`body` text NOT NULL,
	`lat` real,
	`lng` real,
	`hidden_by_moderator` integer DEFAULT false NOT NULL,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`match_id`) REFERENCES `matches`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`sender_user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `chat_match_idx` ON `chat_messages` (`match_id`,`created_at`);--> statement-breakpoint
CREATE TABLE `checkins` (
	`match_id` text NOT NULL,
	`club_id` text NOT NULL,
	`checked_in_at` integer NOT NULL,
	`lat` real,
	`lng` real,
	`by_user_id` text NOT NULL,
	PRIMARY KEY(`match_id`, `club_id`),
	FOREIGN KEY (`match_id`) REFERENCES `matches`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`club_id`) REFERENCES `clubs`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`by_user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `club_blocks` (
	`blocker_club_id` text NOT NULL,
	`blocked_club_id` text NOT NULL,
	`created_at` integer NOT NULL,
	PRIMARY KEY(`blocker_club_id`, `blocked_club_id`),
	FOREIGN KEY (`blocker_club_id`) REFERENCES `clubs`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`blocked_club_id`) REFERENCES `clubs`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `club_photos` (
	`id` text PRIMARY KEY NOT NULL,
	`club_id` text NOT NULL,
	`path` text NOT NULL,
	`sort_order` integer DEFAULT 0 NOT NULL,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`club_id`) REFERENCES `clubs`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `club_ratings` (
	`club_id` text NOT NULL,
	`format` text NOT NULL,
	`rating` integer DEFAULT 1200 NOT NULL,
	`confirmed_matches` integer DEFAULT 0 NOT NULL,
	PRIMARY KEY(`club_id`, `format`),
	FOREIGN KEY (`club_id`) REFERENCES `clubs`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `clubs` (
	`id` text PRIMARY KEY NOT NULL,
	`admin_user_id` text NOT NULL,
	`slug` text NOT NULL,
	`name` text NOT NULL,
	`name_key` text NOT NULL,
	`city` text DEFAULT 'Pekanbaru' NOT NULL,
	`area` text NOT NULL,
	`founded_year` integer,
	`level` text NOT NULL,
	`description` text,
	`contact_phone` text,
	`logo_path` text,
	`crest_color` text DEFAULT '#123b2c' NOT NULL,
	`initials` text NOT NULL,
	`jersey_home` text DEFAULT '#123b2c' NOT NULL,
	`jersey_away` text DEFAULT '#fbf8f1' NOT NULL,
	`registration_status` text DEFAULT 'diajukan' NOT NULL,
	`rejection_reason` text,
	`reviewed_by` text,
	`reviewed_at` integer,
	`suspended_at` integer,
	`suspension_reason` text,
	`squad_code` text NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`admin_user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`reviewed_by`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `clubs_adminUserId_unique` ON `clubs` (`admin_user_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `clubs_slug_unique` ON `clubs` (`slug`);--> statement-breakpoint
CREATE UNIQUE INDEX `clubs_squadCode_unique` ON `clubs` (`squad_code`);--> statement-breakpoint
CREATE UNIQUE INDEX `clubs_city_name_key` ON `clubs` (`city`,`name_key`);--> statement-breakpoint
CREATE TABLE `dispute_evidence` (
	`id` text PRIMARY KEY NOT NULL,
	`dispute_id` text NOT NULL,
	`club_id` text NOT NULL,
	`note` text,
	`url` text,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`dispute_id`) REFERENCES `disputes`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`club_id`) REFERENCES `clubs`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `disputes` (
	`id` text PRIMARY KEY NOT NULL,
	`match_id` text NOT NULL,
	`opened_at` integer NOT NULL,
	`evidence_deadline` integer NOT NULL,
	`decision` text,
	`final_creator_score` integer,
	`final_opponent_score` integer,
	`reason` text,
	`decided_by` text,
	`decided_at` integer,
	FOREIGN KEY (`match_id`) REFERENCES `matches`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`decided_by`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `disputes_matchId_unique` ON `disputes` (`match_id`);--> statement-breakpoint
CREATE TABLE `match_change_requests` (
	`id` text PRIMARY KEY NOT NULL,
	`match_id` text NOT NULL,
	`kind` text NOT NULL,
	`requested_by_club_id` text NOT NULL,
	`from_value` text,
	`to_value` text,
	`reason` text,
	`status` text DEFAULT 'menunggu' NOT NULL,
	`decided_by` text,
	`created_at` integer NOT NULL,
	`decided_at` integer,
	FOREIGN KEY (`match_id`) REFERENCES `matches`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`requested_by_club_id`) REFERENCES `clubs`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`decided_by`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `match_readiness` (
	`match_id` text NOT NULL,
	`club_id` text NOT NULL,
	`players_ready` integer DEFAULT 0 NOT NULL,
	`manual_override` integer DEFAULT false NOT NULL,
	`is_ready` integer DEFAULT false NOT NULL,
	`updated_at` integer NOT NULL,
	`updated_by` text,
	PRIMARY KEY(`match_id`, `club_id`),
	FOREIGN KEY (`match_id`) REFERENCES `matches`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`club_id`) REFERENCES `clubs`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`updated_by`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `matches` (
	`id` text PRIMARY KEY NOT NULL,
	`type` text NOT NULL,
	`format` text NOT NULL,
	`status` text DEFAULT 'draf' NOT NULL,
	`creator_club_id` text NOT NULL,
	`opponent_club_id` text,
	`area` text NOT NULL,
	`level` text NOT NULL,
	`fee_total` integer,
	`notes` text,
	`scheduled_at` integer,
	`venue_id` text,
	`manual_venue_name` text,
	`manual_venue_address` text,
	`negotiation_round` integer DEFAULT 0 NOT NULL,
	`response_deadline` integer,
	`scorer_club_id` text,
	`started_at` integer,
	`ended_at` integer,
	`cancelled_by_club_id` text,
	`cancel_reason` text,
	`cancel_note` text,
	`late_cancel` integer DEFAULT false NOT NULL,
	`postponed_at` integer,
	`reschedule_deadline` integer,
	`wo_winner_club_id` text,
	`rematch_of` text,
	`excluded_from_rating` integer DEFAULT false NOT NULL,
	`created_by` text NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`creator_club_id`) REFERENCES `clubs`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`opponent_club_id`) REFERENCES `clubs`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`venue_id`) REFERENCES `venues`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`scorer_club_id`) REFERENCES `clubs`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`cancelled_by_club_id`) REFERENCES `clubs`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`wo_winner_club_id`) REFERENCES `clubs`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`created_by`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `matches_status_idx` ON `matches` (`status`);--> statement-breakpoint
CREATE INDEX `matches_creator_idx` ON `matches` (`creator_club_id`);--> statement-breakpoint
CREATE INDEX `matches_opponent_idx` ON `matches` (`opponent_club_id`);--> statement-breakpoint
CREATE TABLE `moderation_flags` (
	`id` text PRIMARY KEY NOT NULL,
	`kind` text NOT NULL,
	`club_id` text,
	`other_club_id` text,
	`match_id` text,
	`detail` text,
	`status` text DEFAULT 'terbuka' NOT NULL,
	`resolved_by` text,
	`created_at` integer NOT NULL,
	`resolved_at` integer,
	FOREIGN KEY (`club_id`) REFERENCES `clubs`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`other_club_id`) REFERENCES `clubs`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`match_id`) REFERENCES `matches`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`resolved_by`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `notification_deliveries` (
	`id` text PRIMARY KEY NOT NULL,
	`notification_id` text NOT NULL,
	`channel` text NOT NULL,
	`status` text DEFAULT 'menunggu' NOT NULL,
	`error` text,
	`sent_at` integer,
	FOREIGN KEY (`notification_id`) REFERENCES `notifications`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `notification_prefs` (
	`user_id` text PRIMARY KEY NOT NULL,
	`push_enabled` integer DEFAULT true NOT NULL,
	`quiet_start` text,
	`quiet_end` text,
	`mute_reminders` integer DEFAULT false NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `notifications` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`trigger` text NOT NULL,
	`title` text NOT NULL,
	`body` text,
	`url` text,
	`read_at` integer,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `notifications_user_idx` ON `notifications` (`user_id`,`created_at`);--> statement-breakpoint
CREATE TABLE `password_reset_tokens` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`token_hash` text NOT NULL,
	`expires_at` integer NOT NULL,
	`used_at` integer,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `password_reset_tokens_tokenHash_unique` ON `password_reset_tokens` (`token_hash`);--> statement-breakpoint
CREATE TABLE `platform_settings` (
	`key` text PRIMARY KEY NOT NULL,
	`value` text NOT NULL,
	`updated_by` text,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`updated_by`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `players` (
	`user_id` text PRIMARY KEY NOT NULL,
	`photo_path` text,
	`position` text,
	`dominant_foot` text,
	`area` text,
	`avatar_seed` text NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `push_subscriptions` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`session_id` text NOT NULL,
	`endpoint` text NOT NULL,
	`p256dh` text NOT NULL,
	`auth` text NOT NULL,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`session_id`) REFERENCES `sessions`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `push_subscriptions_endpoint_unique` ON `push_subscriptions` (`endpoint`);--> statement-breakpoint
CREATE TABLE `rate_limit_events` (
	`id` text PRIMARY KEY NOT NULL,
	`bucket` text NOT NULL,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE INDEX `rate_limit_bucket_idx` ON `rate_limit_events` (`bucket`,`created_at`);--> statement-breakpoint
CREATE TABLE `rating_history` (
	`id` text PRIMARY KEY NOT NULL,
	`club_id` text NOT NULL,
	`format` text NOT NULL,
	`match_id` text NOT NULL,
	`rating_before` integer NOT NULL,
	`rating_after` integer NOT NULL,
	`delta` integer NOT NULL,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`club_id`) REFERENCES `clubs`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`match_id`) REFERENCES `matches`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `reminder_log` (
	`match_id` text NOT NULL,
	`user_id` text NOT NULL,
	`kind` text NOT NULL,
	`sent_at` integer NOT NULL,
	PRIMARY KEY(`match_id`, `user_id`, `kind`),
	FOREIGN KEY (`match_id`) REFERENCES `matches`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `reports` (
	`id` text PRIMARY KEY NOT NULL,
	`reporter_user_id` text NOT NULL,
	`target_type` text NOT NULL,
	`target_id` text NOT NULL,
	`reason` text NOT NULL,
	`status` text DEFAULT 'terbuka' NOT NULL,
	`resolved_by` text,
	`resolution` text,
	`created_at` integer NOT NULL,
	`resolved_at` integer,
	FOREIGN KEY (`reporter_user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`resolved_by`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `result_confirmations` (
	`id` text PRIMARY KEY NOT NULL,
	`match_id` text NOT NULL,
	`proposer_club_id` text NOT NULL,
	`creator_score` integer NOT NULL,
	`opponent_score` integer NOT NULL,
	`proposed_at` integer NOT NULL,
	`deadline` integer NOT NULL,
	`response` text,
	`counter_creator_score` integer,
	`counter_opponent_score` integer,
	`responded_at` integer,
	`reminders_sent` integer DEFAULT 0 NOT NULL,
	FOREIGN KEY (`match_id`) REFERENCES `matches`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`proposer_club_id`) REFERENCES `clubs`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `result_confirmations_matchId_unique` ON `result_confirmations` (`match_id`);--> statement-breakpoint
CREATE TABLE `reviews` (
	`id` text PRIMARY KEY NOT NULL,
	`match_id` text NOT NULL,
	`reviewer_club_id` text NOT NULL,
	`reviewed_club_id` text NOT NULL,
	`sportsmanship` integer NOT NULL,
	`tidiness` integer NOT NULL,
	`comment` text,
	`excluded` integer DEFAULT false NOT NULL,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`match_id`) REFERENCES `matches`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`reviewer_club_id`) REFERENCES `clubs`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`reviewed_club_id`) REFERENCES `clubs`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `reviews_match_reviewer` ON `reviews` (`match_id`,`reviewer_club_id`);--> statement-breakpoint
CREATE TABLE `rsvps` (
	`match_id` text NOT NULL,
	`player_user_id` text NOT NULL,
	`club_id` text NOT NULL,
	`answer` text NOT NULL,
	`updated_at` integer NOT NULL,
	PRIMARY KEY(`match_id`, `player_user_id`),
	FOREIGN KEY (`match_id`) REFERENCES `matches`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`player_user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`club_id`) REFERENCES `clubs`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `schedule_proposals` (
	`id` text PRIMARY KEY NOT NULL,
	`match_id` text NOT NULL,
	`round` integer DEFAULT 0 NOT NULL,
	`proposed_by_club_id` text NOT NULL,
	`starts_at` integer NOT NULL,
	`venue_id` text,
	`manual_venue_name` text,
	`manual_venue_address` text,
	`fee_total` integer,
	`status` text DEFAULT 'menunggu' NOT NULL,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`match_id`) REFERENCES `matches`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`proposed_by_club_id`) REFERENCES `clubs`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`venue_id`) REFERENCES `venues`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `proposals_match_idx` ON `schedule_proposals` (`match_id`);--> statement-breakpoint
CREATE TABLE `score_entries` (
	`id` text PRIMARY KEY NOT NULL,
	`match_id` text NOT NULL,
	`half` integer NOT NULL,
	`creator_score` integer NOT NULL,
	`opponent_score` integer NOT NULL,
	`event` text NOT NULL,
	`recorded_by` text NOT NULL,
	`client_entry_id` text NOT NULL,
	`recorded_at` integer NOT NULL,
	`synced_at` integer NOT NULL,
	`conflict` integer DEFAULT false NOT NULL,
	FOREIGN KEY (`match_id`) REFERENCES `matches`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`recorded_by`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `score_entries_clientEntryId_unique` ON `score_entries` (`client_entry_id`);--> statement-breakpoint
CREATE INDEX `score_match_idx` ON `score_entries` (`match_id`);--> statement-breakpoint
CREATE TABLE `sessions` (
	`id` text PRIMARY KEY NOT NULL,
	`token_hash` text NOT NULL,
	`user_id` text NOT NULL,
	`created_at` integer NOT NULL,
	`expires_at` integer NOT NULL,
	`user_agent` text,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `sessions_tokenHash_unique` ON `sessions` (`token_hash`);--> statement-breakpoint
CREATE INDEX `sessions_user_idx` ON `sessions` (`user_id`);--> statement-breakpoint
CREATE TABLE `squad_invites` (
	`id` text PRIMARY KEY NOT NULL,
	`club_id` text NOT NULL,
	`token_hash` text NOT NULL,
	`created_by` text NOT NULL,
	`expires_at` integer NOT NULL,
	`revoked_at` integer,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`club_id`) REFERENCES `clubs`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`created_by`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `squad_invites_tokenHash_unique` ON `squad_invites` (`token_hash`);--> statement-breakpoint
CREATE TABLE `squad_memberships` (
	`id` text PRIMARY KEY NOT NULL,
	`player_user_id` text NOT NULL,
	`club_id` text NOT NULL,
	`status` text NOT NULL,
	`via` text NOT NULL,
	`decided_by` text,
	`created_at` integer NOT NULL,
	`decided_at` integer,
	`ended_at` integer,
	`ended_by` text,
	FOREIGN KEY (`player_user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`club_id`) REFERENCES `clubs`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`decided_by`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `squad_satu_aktif` ON `squad_memberships` (`player_user_id`) WHERE status = 'aktif';--> statement-breakpoint
CREATE INDEX `squad_club_idx` ON `squad_memberships` (`club_id`,`status`);--> statement-breakpoint
CREATE TABLE `users` (
	`id` text PRIMARY KEY NOT NULL,
	`email` text NOT NULL,
	`password_hash` text,
	`role` text NOT NULL,
	`name` text NOT NULL,
	`birth_date` text,
	`status` text DEFAULT 'aktif' NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	`deleted_at` integer
);
--> statement-breakpoint
CREATE UNIQUE INDEX `users_email_unique` ON `users` (`email`);--> statement-breakpoint
CREATE TABLE `venue_photos` (
	`id` text PRIMARY KEY NOT NULL,
	`venue_id` text NOT NULL,
	`path` text NOT NULL,
	`sort_order` integer DEFAULT 0 NOT NULL,
	FOREIGN KEY (`venue_id`) REFERENCES `venues`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `venue_slots` (
	`id` text PRIMARY KEY NOT NULL,
	`venue_id` text NOT NULL,
	`day_of_week` integer NOT NULL,
	`start_time` text NOT NULL,
	`end_time` text NOT NULL,
	`note` text,
	FOREIGN KEY (`venue_id`) REFERENCES `venues`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `venues` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`address` text NOT NULL,
	`area` text NOT NULL,
	`lat` real,
	`lng` real,
	`surface` text NOT NULL,
	`for_football` integer DEFAULT false NOT NULL,
	`for_mini` integer DEFAULT false NOT NULL,
	`price_per_hour` integer,
	`open_hours` text,
	`facilities` text,
	`contact` text,
	`verified` integer DEFAULT false NOT NULL,
	`managed_by` text,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`managed_by`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
