import { createServerFn } from "@tanstack/react-start";
import { db } from "../../db/index.js";
import { fundingRounds, applications } from "../../db/schema.js";
import { eq, desc } from "drizzle-orm";
import { requireAuthMiddleware } from "../middleware/identity.js";

export const getFundingRounds = createServerFn({ method: "GET" })
  .middleware([requireAuthMiddleware])
  .handler(async () => {
    const rows = await db
      .select()
      .from(fundingRounds)
      .orderBy(desc(fundingRounds.createdAt));
    return rows;
  });

export const getFundingRoundById = createServerFn({ method: "GET" })
  .middleware([requireAuthMiddleware])
  .inputValidator((input: { id: number }) => input)
  .handler(async ({ data }) => {
    const [round] = await db
      .select()
      .from(fundingRounds)
      .where(eq(fundingRounds.id, data.id));
    return round ?? null;
  });

export const createFundingRound = createServerFn({ method: "POST" })
  .middleware([requireAuthMiddleware])
  .inputValidator(
    (input: {
      name: string;
      description?: string;
      startDate: string;
      endDate: string;
      budgetAmount: string;
    }) => input
  )
  .handler(async ({ data }) => {
    const [round] = await db
      .insert(fundingRounds)
      .values({
        name: data.name,
        description: data.description || null,
        startDate: data.startDate,
        endDate: data.endDate,
        budgetAmount: data.budgetAmount,
        status: "open",
      })
      .returning();
    return round;
  });

export const updateFundingRound = createServerFn({ method: "POST" })
  .middleware([requireAuthMiddleware])
  .inputValidator(
    (input: {
      id: number;
      name: string;
      description?: string;
      startDate: string;
      endDate: string;
      budgetAmount: string;
      status: string;
    }) => input
  )
  .handler(async ({ data }) => {
    const { id, ...fields } = data;
    const [updated] = await db
      .update(fundingRounds)
      .set({ ...fields, description: fields.description || null, updatedAt: new Date() })
      .where(eq(fundingRounds.id, id))
      .returning();
    return updated ?? null;
  });

export const deleteFundingRound = createServerFn({ method: "POST" })
  .middleware([requireAuthMiddleware])
  .inputValidator((input: { id: number }) => input)
  .handler(async ({ data }) => {
    await db
      .update(applications)
      .set({ fundingRoundId: null })
      .where(eq(applications.fundingRoundId, data.id));
    const [deleted] = await db
      .delete(fundingRounds)
      .where(eq(fundingRounds.id, data.id))
      .returning();
    return deleted ?? null;
  });

export const assignApplicationToRound = createServerFn({ method: "POST" })
  .middleware([requireAuthMiddleware])
  .inputValidator((input: { applicationId: number; fundingRoundId: number | null }) => input)
  .handler(async ({ data }) => {
    const [updated] = await db
      .update(applications)
      .set({ fundingRoundId: data.fundingRoundId, updatedAt: new Date() })
      .where(eq(applications.id, data.applicationId))
      .returning();
    return updated ?? null;
  });

export const getApplicationsForRound = createServerFn({ method: "GET" })
  .middleware([requireAuthMiddleware])
  .inputValidator((input: { roundId: number }) => input)
  .handler(async ({ data }) => {
    const rows = await db
      .select()
      .from(applications)
      .where(eq(applications.fundingRoundId, data.roundId))
      .orderBy(desc(applications.createdAt));
    return rows;
  });

export const getRoundStats = createServerFn({ method: "GET" })
  .middleware([requireAuthMiddleware])
  .inputValidator((input: { roundId: number }) => input)
  .handler(async ({ data }) => {
    const roundApps = await db
      .select()
      .from(applications)
      .where(eq(applications.fundingRoundId, data.roundId));

    const total = roundApps.length;
    const submitted = roundApps.filter((a) => a.status === "submitted").length;
    const underReview = roundApps.filter((a) => a.status === "under_review").length;
    const approved = roundApps.filter((a) => a.status === "approved").length;
    const declined = roundApps.filter((a) => a.status === "declined").length;
    const totalRequested = roundApps.reduce(
      (sum, a) => sum + (a.grantAmountRequested || 0),
      0
    );
    const totalApproved = roundApps
      .filter((a) => a.status === "approved")
      .reduce((sum, a) => sum + (a.grantAmountRequested || 0), 0);

    return { total, submitted, underReview, approved, declined, totalRequested, totalApproved };
  });
