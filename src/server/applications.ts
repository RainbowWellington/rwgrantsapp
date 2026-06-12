import { createServerFn } from "@tanstack/react-start";
import { db } from "../../db/index.js";
import { applications, comments, assessments } from "../../db/schema.js";
import { eq, desc } from "drizzle-orm";
import { requireAuthMiddleware } from "../middleware/identity.js";
import {
  sendApplicationConfirmation,
  sendNewApplicationNotification,
  sendStatusChangeNotification,
} from "../lib/email.js";

export const submitApplication = createServerFn({ method: "POST" })
  .inputValidator(
    (input: {
      fullName: string;
      email: string;
      phone?: string;
      organizationName?: string;
      organizationType?: string;
      roleInOrganization?: string;
      organizationWebsite?: string;
      projectOrganizer?: string;
      projectOrganisationMethod?: string;
      projectTitle: string;
      projectDescription: string;
      projectStartDate?: string;
      projectEndDate?: string;
      projectLocation?: string;
      targetAudience?: string;
      expectedBeneficiaries?: string;
      grantAmountRequested: number;
      totalProjectBudget?: number;
      budgetBreakdown?: string;
      otherFundingSources?: string;
      previousFunding?: boolean;
      previousFundingDetails?: string;
      communityBenefit: string;
      exclusivityJustification?: string;
      engageRainbowWellington?: string;
      promoteRainbowWellington?: string;
      expectedOutcomes?: string;
      successMeasurement?: string;
      howDidYouHear?: string;
      additionalInfo?: string;
      uploadedFiles?: string;
      budgetFile?: string;
    }) => input
  )
  .handler(async ({ data }) => {
    const [application] = await db
      .insert(applications)
      .values({
        ...data,
        status: "submitted",
      })
      .returning();

    await Promise.all([
      sendApplicationConfirmation(application),
      sendNewApplicationNotification({
        fullName: application.fullName,
        email: application.email,
        projectTitle: application.projectTitle,
        organizationName: application.organizationName,
        grantAmountRequested: application.grantAmountRequested,
      }),
    ]).catch((err) => console.error("Email send failed:", err));

    return application;
  });

export const getApplications = createServerFn({ method: "GET" })
  .middleware([requireAuthMiddleware])
  .handler(async () => {
    const rows = await db
      .select()
      .from(applications)
      .orderBy(desc(applications.createdAt));
    return rows;
  });

export const getApplicationById = createServerFn({ method: "GET" })
  .middleware([requireAuthMiddleware])
  .inputValidator((input: { id: number }) => input)
  .handler(async ({ data }) => {
    const [application] = await db
      .select()
      .from(applications)
      .where(eq(applications.id, data.id));
    return application ?? null;
  });

export const updateApplicationStatus = createServerFn({ method: "POST" })
  .middleware([requireAuthMiddleware])
  .inputValidator(
    (input: {
      id: number;
      status: string;
      notes?: string;
      sendEmail?: boolean;
    }) => input
  )
  .handler(async ({ data }) => {
    const updateFields: Record<string, unknown> = {
      status: data.status,
      updatedAt: new Date(),
    };
    if (data.notes !== undefined) {
      updateFields.notes = data.notes;
    }

    const [updated] = await db
      .update(applications)
      .set(updateFields)
      .where(eq(applications.id, data.id))
      .returning();

    if (updated && data.sendEmail) {
      await sendStatusChangeNotification({
        fullName: updated.fullName,
        email: updated.email,
        projectTitle: updated.projectTitle,
        status: updated.status,
        notes: updated.notes,
      }).catch((err) =>
        console.error("Status notification email failed:", err)
      );
    }

    return updated;
  });

export const getApplicationStats = createServerFn({ method: "GET" })
  .middleware([requireAuthMiddleware])
  .handler(async () => {
    const allApps = await db.select().from(applications);
    const total = allApps.length;
    const submitted = allApps.filter((a) => a.status === "submitted").length;
    const underReview = allApps.filter(
      (a) => a.status === "under_review"
    ).length;
    const approved = allApps.filter((a) => a.status === "approved").length;
    const declined = allApps.filter((a) => a.status === "declined").length;
    const moreInfoNeeded = allApps.filter(
      (a) => a.status === "more_info_needed"
    ).length;
    const paid = allApps.filter((a) => a.status === "paid").length;
    const completed = allApps.filter((a) => a.status === "completed").length;
    const totalRequested = allApps.reduce(
      (sum, a) => sum + (a.grantAmountRequested || 0),
      0
    );
    const totalApproved = allApps
      .filter((a) => a.status === "approved" || a.status === "paid" || a.status === "completed")
      .reduce((sum, a) => sum + (a.grantAmountRequested || 0), 0);
    const totalAwarded = allApps
      .filter((a) => a.amountAwarded != null)
      .reduce((sum, a) => sum + (a.amountAwarded || 0), 0);

    return {
      total,
      submitted,
      underReview,
      approved,
      declined,
      moreInfoNeeded,
      paid,
      completed,
      totalRequested,
      totalApproved,
      totalAwarded,
    };
  });

export const updateApplication = createServerFn({ method: "POST" })
  .middleware([requireAuthMiddleware])
  .inputValidator(
    (input: {
      id: number;
      fullName: string;
      email: string;
      phone?: string;
      organizationName?: string;
      organizationType?: string;
      roleInOrganization?: string;
      organizationWebsite?: string;
      projectOrganizer?: string;
      projectOrganisationMethod?: string;
      projectTitle: string;
      projectDescription: string;
      projectStartDate?: string;
      projectEndDate?: string;
      projectLocation?: string;
      targetAudience?: string;
      expectedBeneficiaries?: string;
      grantAmountRequested: number;
      totalProjectBudget?: number;
      budgetBreakdown?: string;
      otherFundingSources?: string;
      previousFunding?: boolean;
      previousFundingDetails?: string;
      communityBenefit: string;
      exclusivityJustification?: string;
      engageRainbowWellington?: string;
      promoteRainbowWellington?: string;
      expectedOutcomes?: string;
      successMeasurement?: string;
      howDidYouHear?: string;
      additionalInfo?: string;
      notes?: string | null;
      amountAwarded?: number | null;
      bankAccountNumber?: string | null;
      bankAccountName?: string | null;
      datePaid?: string | null;
      accountabilityReportReceived?: boolean;
      postEventFiles?: string | null;
      signedTermsAndConditions?: boolean;
      outcomeInformed?: boolean;
    }) => input
  )
  .handler(async ({ data }) => {
    const { id, ...fields } = data;
    const [updated] = await db
      .update(applications)
      .set({ ...fields, updatedAt: new Date() })
      .where(eq(applications.id, id))
      .returning();
    return updated ?? null;
  });

export const toggleApplicationEligibility = createServerFn({ method: "POST" })
  .middleware([requireAuthMiddleware])
  .inputValidator((input: { id: number; eligible: boolean }) => input)
  .handler(async ({ data }) => {
    const [updated] = await db
      .update(applications)
      .set({ eligible: data.eligible, updatedAt: new Date() })
      .where(eq(applications.id, data.id))
      .returning();
    return updated ?? null;
  });

export const updateAmountAwarded = createServerFn({ method: "POST" })
  .middleware([requireAuthMiddleware])
  .inputValidator((input: { id: number; amountAwarded: number | null }) => input)
  .handler(async ({ data }) => {
    const [updated] = await db
      .update(applications)
      .set({ amountAwarded: data.amountAwarded, updatedAt: new Date() })
      .where(eq(applications.id, data.id))
      .returning();
    return updated ?? null;
  });

export const deleteApplication = createServerFn({ method: "POST" })
  .middleware([requireAuthMiddleware])
  .inputValidator((input: { id: number }) => input)
  .handler(async ({ data }) => {
    await db.delete(assessments).where(eq(assessments.applicationId, data.id));
    await db.delete(comments).where(eq(comments.applicationId, data.id));
    const [deleted] = await db
      .delete(applications)
      .where(eq(applications.id, data.id))
      .returning();
    return deleted ?? null;
  });
