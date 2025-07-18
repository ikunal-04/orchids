ALTER TABLE "recently_played_songs" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "users" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
DROP TABLE "recently_played_songs" CASCADE;--> statement-breakpoint
DROP TABLE "users" CASCADE;--> statement-breakpoint
ALTER TABLE "songs" RENAME COLUMN "duration_seconds" TO "duration";--> statement-breakpoint
ALTER TABLE "songs" ALTER COLUMN "id" SET DATA TYPE uuid;--> statement-breakpoint
ALTER TABLE "songs" ALTER COLUMN "id" SET DEFAULT gen_random_uuid();--> statement-breakpoint
ALTER TABLE "songs" ALTER COLUMN "title" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "songs" ALTER COLUMN "artist" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "songs" ALTER COLUMN "album" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "songs" ALTER COLUMN "album" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "songs" ADD COLUMN "album_art" text NOT NULL;--> statement-breakpoint
ALTER TABLE "songs" ADD COLUMN "last_played_at" timestamp;--> statement-breakpoint
ALTER TABLE "songs" ADD COLUMN "created_at" timestamp DEFAULT now() NOT NULL;