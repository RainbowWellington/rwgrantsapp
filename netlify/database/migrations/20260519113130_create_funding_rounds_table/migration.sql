CREATE TABLE "funding_rounds" (
	"id" serial PRIMARY KEY,
	"name" text NOT NULL,
	"description" text,
	"start_date" text NOT NULL,
	"end_date" text NOT NULL,
	"budget_amount" numeric(12,2) NOT NULL,
	"status" text DEFAULT 'open' NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "applications" ADD COLUMN "funding_round_id" integer;--> statement-breakpoint
ALTER TABLE "applications" ADD CONSTRAINT "applications_funding_round_id_funding_rounds_id_fkey" FOREIGN KEY ("funding_round_id") REFERENCES "funding_rounds"("id");