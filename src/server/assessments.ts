import { createServerFn } from "@tanstack/react-start";
import { db } from "../../db/index.js";
import { assessments, applications, adminUsers } from "../../db/schema.js";
import { eq, and, desc } from "drizzle-orm";
import { requireAuthMiddleware } from "../middleware/identity.js";
import { admin as identityAdmin } from "@netlify/identity";

async function getIdentityNameMap(): Promise<Map<string, string>> {
  const map = new Map<string, string>();
  try {
    const users = await identityAdmin.listUsers({ perPage: 100 });
    for (const u of users) {
      if (u.email && u.name) {
        map.set(u.email.toLowerCase(), u.name);
      }
    }
  } catch {
    // Identity admin API may not be available in all contexts
  }
  return map;
}

async function buildNameMap(): Promise<Map<string, string>> {
  const allAdmins = await db.select().from(adminUsers);
  const identityNames = await getIdentityNameMap();
  const map = new Map<string, string>();
  for (const [email, name] of identityNames) {
    map.set(email, name);
  }
  for (const a of allAdmins) {
    if (a.name) {
      map.set(a.email.toLowerCase(), a.name);
    }
  }
  return map;
}

function resolveNameFromMap(
  reviewerEmail: string,
  reviewerName: string | null,
  nameMap: Map<string, string>
): string {
  if (reviewerName && reviewerName !== reviewerEmail) return reviewerName;
  return nameMap.get(reviewerEmail.toLowerCase()) || reviewerName || reviewerEmail;
}

async function resolveReviewerName(
  reviewerEmail: string,
  providedName: string
): Promise<string> {
  if (providedName && providedName !== reviewerEmail) return providedName;
  const [adminRow] = await db
    .select()
    .from(adminUsers)
    .where(eq(adminUsers.email, reviewerEmail.toLowerCase()));
  if (adminRow?.name) return adminRow.name;
  const identityNames = await getIdentityNameMap();
  const identityName = identityNames.get(reviewerEmail.toLowerCase());
  if (identityName) return identityName;
  return providedName || reviewerEmail;
}

export const getAssessmentsForApplication = createServerFn({ method: "GET" })
  .middleware([requireAuthMiddleware])
  .inputValidator((input: { applicationId: number }) => input)
  .handler(async ({ data }) => {
    const rows = await db
      .select()
      .from(assessments)
      .where(eq(assessments.applicationId, data.applicationId))
      .orderBy(assessments.reviewerName);
    const nameMap = await buildNameMap();
    return rows.map((a) => ({
      ...a,
      reviewerName: resolveNameFromMap(a.reviewerEmail, a.reviewerName, nameMap),
    }));
  });

export const getAssessmentByReviewer = createServerFn({ method: "GET" })
  .middleware([requireAuthMiddleware])
  .inputValidator(
    (input: { applicationId: number; reviewerEmail: string }) => input
  )
  .handler(async ({ data }) => {
    const [row] = await db
      .select()
      .from(assessments)
      .where(
        and(
          eq(assessments.applicationId, data.applicationId),
          eq(assessments.reviewerEmail, data.reviewerEmail)
        )
      );
    return row ?? null;
  });

export const upsertAssessment = createServerFn({ method: "POST" })
  .middleware([requireAuthMiddleware])
  .inputValidator(
    (input: {
      applicationId: number;
      reviewerEmail: string;
      reviewerName: string;
      alignmentWithMission?: number | null;
      needAndImpact?: number | null;
      projectDesignAndOrganisation?: number | null;
      engagementWithOrganisation?: number | null;
      promotionOfMembership?: number | null;
      budgetAndUseOfFunds?: number | null;
      fundingLeverageOtherGrants?: number | null;
      sustainabilityAndLegacy?: number | null;
      comments?: string | null;
    }) => input
  )
  .handler(async ({ data }) => {
    const { applicationId, reviewerEmail, reviewerName: providedName, ...scores } = data;
    const reviewerName = await resolveReviewerName(reviewerEmail, providedName);

    if (reviewerName && reviewerName !== reviewerEmail) {
      const [admin] = await db
        .select()
        .from(adminUsers)
        .where(eq(adminUsers.email, reviewerEmail.toLowerCase()));
      if (admin && !admin.name) {
        await db
          .update(adminUsers)
          .set({ name: reviewerName })
          .where(eq(adminUsers.id, admin.id));
      }
    }

    const [existing] = await db
      .select()
      .from(assessments)
      .where(
        and(
          eq(assessments.applicationId, applicationId),
          eq(assessments.reviewerEmail, reviewerEmail)
        )
      );

    if (existing) {
      const [updated] = await db
        .update(assessments)
        .set({ ...scores, reviewerName, updatedAt: new Date() })
        .where(eq(assessments.id, existing.id))
        .returning();
      return updated;
    }

    const [created] = await db
      .insert(assessments)
      .values({
        applicationId,
        reviewerEmail,
        reviewerName,
        ...scores,
      })
      .returning();
    return created;
  });

export const deleteAssessment = createServerFn({ method: "POST" })
  .middleware([requireAuthMiddleware])
  .inputValidator((input: { id: number }) => input)
  .handler(async ({ data }) => {
    await db.delete(assessments).where(eq(assessments.id, data.id));
    return { success: true };
  });

export const getAllAssessments = createServerFn({ method: "GET" })
  .middleware([requireAuthMiddleware])
  .handler(async () => {
    const rows = await db
      .select()
      .from(assessments)
      .orderBy(assessments.applicationId, assessments.reviewerName);
    const nameMap = await buildNameMap();
    return rows.map((a) => ({
      ...a,
      reviewerName: resolveNameFromMap(a.reviewerEmail, a.reviewerName, nameMap),
    }));
  });

export const getApplicationsWithAssessments = createServerFn({ method: "GET" })
  .middleware([requireAuthMiddleware])
  .handler(async () => {
    const allApps = await db
      .select()
      .from(applications)
      .orderBy(desc(applications.createdAt));
    const allAssessments = await db
      .select()
      .from(assessments)
      .orderBy(assessments.reviewerName);
    const nameMap = await buildNameMap();

    const resolvedAssessments = allAssessments.map((a) => ({
      ...a,
      reviewerName: resolveNameFromMap(a.reviewerEmail, a.reviewerName, nameMap),
    }));

    return allApps.map((app) => ({
      ...app,
      assessments: resolvedAssessments.filter(
        (a) => a.applicationId === app.id
      ),
    }));
  });
