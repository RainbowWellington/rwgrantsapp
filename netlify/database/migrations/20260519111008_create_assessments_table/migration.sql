CREATE TABLE "assessments" (
	"id" serial PRIMARY KEY,
	"application_id" integer NOT NULL,
	"reviewer_email" text NOT NULL,
	"reviewer_name" text NOT NULL,
	"alignment_with_mission" integer,
	"need_and_impact" integer,
	"project_design_and_organisation" integer,
	"engagement_with_organisation" integer,
	"promotion_of_membership" integer,
	"budget_and_use_of_funds" integer,
	"funding_leverage_other_grants" integer,
	"sustainability_and_legacy" integer,
	"comments" text,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "assessments" ADD CONSTRAINT "assessments_application_id_applications_id_fkey" FOREIGN KEY ("application_id") REFERENCES "applications"("id");
