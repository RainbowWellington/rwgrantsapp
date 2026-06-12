import { createServerFn } from "@tanstack/react-start";
import { db } from "../../db/index.js";
import { comments } from "../../db/schema.js";
import { eq, desc } from "drizzle-orm";
import { requireAuthMiddleware } from "../middleware/identity.js";

export const getComments = createServerFn({ method: "GET" })
  .middleware([requireAuthMiddleware])
  .inputValidator((input: { applicationId: number }) => input)
  .handler(async ({ data }) => {
    const rows = await db
      .select()
      .from(comments)
      .where(eq(comments.applicationId, data.applicationId))
      .orderBy(desc(comments.createdAt));
    return rows;
  });

export const addComment = createServerFn({ method: "POST" })
  .middleware([requireAuthMiddleware])
  .inputValidator(
    (input: {
      applicationId: number;
      content: string;
      authorEmail: string;
      authorName: string;
    }) => input
  )
  .handler(async ({ data }) => {
    const [comment] = await db.insert(comments).values(data).returning();
    return comment;
  });
