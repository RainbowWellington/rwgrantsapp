ALTER TABLE "applications" DROP COLUMN IF EXISTS "postal_address";--> statement-breakpoint
ALTER TABLE "applications" ADD COLUMN "project_organizer" text;--> statement-breakpoint
ALTER TABLE "applications" ADD COLUMN "exclusivity_justification" text;--> statement-breakpoint
ALTER TABLE "applications" ADD COLUMN "engage_rainbow_wellington" text;--> statement-breakpoint
ALTER TABLE "applications" ADD COLUMN "promote_rainbow_wellington" text;--> statement-breakpoint
ALTER TABLE "applications" ADD COLUMN "uploaded_files" text;