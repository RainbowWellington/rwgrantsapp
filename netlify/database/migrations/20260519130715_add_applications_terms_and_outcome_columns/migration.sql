ALTER TABLE "applications" ADD COLUMN "signed_terms_and_conditions" boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE "applications" ADD COLUMN "outcome_informed" boolean DEFAULT false;