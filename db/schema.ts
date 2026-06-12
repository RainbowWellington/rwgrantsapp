import { pgTable, serial, text, timestamp, integer, boolean, numeric } from "drizzle-orm/pg-core";

export const fundingRounds = pgTable("funding_rounds", {
  id: serial().primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  startDate: text("start_date").notNull(),
  endDate: text("end_date").notNull(),
  budgetAmount: numeric("budget_amount", { precision: 12, scale: 2 }).notNull(),
  status: text("status").notNull().default("open"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const applications = pgTable("applications", {
  id: serial().primaryKey(),
  fullName: text("full_name").notNull(),
  email: text("email").notNull(),
  phone: text("phone"),
  organizationName: text("organization_name"),
  organizationType: text("organization_type"),
  roleInOrganization: text("role_in_organization"),
  organizationWebsite: text("organization_website"),
  projectOrganizer: text("project_organizer"),
  projectTitle: text("project_title").notNull(),
  projectDescription: text("project_description").notNull(),
  projectStartDate: text("project_start_date"),
  projectEndDate: text("project_end_date"),
  projectLocation: text("project_location"),
  targetAudience: text("target_audience"),
  expectedBeneficiaries: text("expected_beneficiaries"),
  grantAmountRequested: integer("grant_amount_requested").notNull(),
  totalProjectBudget: integer("total_project_budget"),
  budgetBreakdown: text("budget_breakdown"),
  otherFundingSources: text("other_funding_sources"),
  previousFunding: boolean("previous_funding").default(false),
  previousFundingDetails: text("previous_funding_details"),
  communityBenefit: text("community_benefit").notNull(),
  exclusivityJustification: text("exclusivity_justification"),
  engageRainbowWellington: text("engage_rainbow_wellington"),
  promoteRainbowWellington: text("promote_rainbow_wellington"),
  expectedOutcomes: text("expected_outcomes"),
  successMeasurement: text("success_measurement"),
  howDidYouHear: text("how_did_you_hear"),
  additionalInfo: text("additional_info"),
  uploadedFiles: text("uploaded_files"),
  status: text("status").notNull().default("submitted"),
  notes: text("notes"),
  eligible: boolean("eligible").default(false),
  amountAwarded: integer("amount_awarded"),
  bankAccountNumber: text("bank_account_number"),
  bankAccountName: text("bank_account_name"),
  datePaid: text("date_paid"),
  accountabilityReportReceived: boolean("accountability_report_received").default(false),
  postEventFiles: text("post_event_files"),
  signedTermsAndConditions: boolean("signed_terms_and_conditions").default(false),
  outcomeInformed: boolean("outcome_informed").default(false),
  projectOrganisationMethod: text("project_organisation_method"),
  budgetFile: text("budget_file"),
  fundingRoundId: integer("funding_round_id").references(() => fundingRounds.id),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const comments = pgTable("comments", {
  id: serial().primaryKey(),
  applicationId: integer("application_id")
    .notNull()
    .references(() => applications.id),
  authorEmail: text("author_email").notNull(),
  authorName: text("author_name").notNull(),
  content: text("content").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const assessments = pgTable("assessments", {
  id: serial().primaryKey(),
  applicationId: integer("application_id")
    .notNull()
    .references(() => applications.id),
  reviewerEmail: text("reviewer_email").notNull(),
  reviewerName: text("reviewer_name").notNull(),
  alignmentWithMission: integer("alignment_with_mission"),
  needAndImpact: integer("need_and_impact"),
  projectDesignAndOrganisation: integer("project_design_and_organisation"),
  engagementWithOrganisation: integer("engagement_with_organisation"),
  promotionOfMembership: integer("promotion_of_membership"),
  budgetAndUseOfFunds: integer("budget_and_use_of_funds"),
  fundingLeverageOtherGrants: integer("funding_leverage_other_grants"),
  sustainabilityAndLegacy: integer("sustainability_and_legacy"),
  comments: text("comments"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const adminUsers = pgTable("admin_users", {
  id: serial().primaryKey(),
  email: text("email").notNull().unique(),
  name: text("name"),
  role: text("role").notNull().default("admin"),
  createdAt: timestamp("created_at").defaultNow(),
});
