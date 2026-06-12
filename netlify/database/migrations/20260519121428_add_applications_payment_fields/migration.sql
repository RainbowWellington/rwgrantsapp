ALTER TABLE "applications" ADD COLUMN "amount_awarded" integer;--> statement-breakpoint
ALTER TABLE "applications" ADD COLUMN "bank_account_number" text;--> statement-breakpoint
ALTER TABLE "applications" ADD COLUMN "bank_account_name" text;--> statement-breakpoint
ALTER TABLE "applications" ADD COLUMN "date_paid" text;--> statement-breakpoint
ALTER TABLE "applications" ADD COLUMN "accountability_report_received" boolean DEFAULT false;