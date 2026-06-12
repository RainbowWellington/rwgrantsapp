CREATE TABLE "admin_users" (
	"id" serial PRIMARY KEY,
	"email" text NOT NULL UNIQUE,
	"name" text,
	"role" text DEFAULT 'admin' NOT NULL,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "applications" (
	"id" serial PRIMARY KEY,
	"full_name" text NOT NULL,
	"email" text NOT NULL,
	"phone" text,
	"postal_address" text,
	"organization_name" text,
	"organization_type" text,
	"role_in_organization" text,
	"organization_website" text,
	"project_title" text NOT NULL,
	"project_description" text NOT NULL,
	"project_start_date" text,
	"project_end_date" text,
	"project_location" text,
	"target_audience" text,
	"expected_beneficiaries" text,
	"grant_amount_requested" integer NOT NULL,
	"total_project_budget" integer,
	"budget_breakdown" text,
	"other_funding_sources" text,
	"previous_funding" boolean DEFAULT false,
	"previous_funding_details" text,
	"community_benefit" text NOT NULL,
	"expected_outcomes" text,
	"success_measurement" text,
	"how_did_you_hear" text,
	"additional_info" text,
	"status" text DEFAULT 'submitted' NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "comments" (
	"id" serial PRIMARY KEY,
	"application_id" integer NOT NULL,
	"author_email" text NOT NULL,
	"author_name" text NOT NULL,
	"content" text NOT NULL,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "comments" ADD CONSTRAINT "comments_application_id_applications_id_fkey" FOREIGN KEY ("application_id") REFERENCES "applications"("id");