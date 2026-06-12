import { createServerFn } from "@tanstack/react-start";
import { db } from "../../db/index.js";
import { adminUsers } from "../../db/schema.js";
import { eq, desc } from "drizzle-orm";
import {
  requireAuthMiddleware,
  requireAdminRoleMiddleware,
} from "../middleware/identity.js";

export const getAdminUsers = createServerFn({ method: "GET" })
  .middleware([requireAdminRoleMiddleware])
  .handler(async () => {
    const rows = await db
      .select()
      .from(adminUsers)
      .orderBy(desc(adminUsers.createdAt));
    return rows;
  });

export const addAdminUser = createServerFn({ method: "POST" })
  .middleware([requireAdminRoleMiddleware])
  .inputValidator(
    (input: { email: string; name?: string; role?: string }) => {
      const validRoles = ["admin", "reviewer"];
      if (input.role && !validRoles.includes(input.role)) {
        throw new Error("Invalid role. Must be 'admin' or 'reviewer'.");
      }
      return input;
    }
  )
  .handler(async ({ data }) => {
    const [user] = await db
      .insert(adminUsers)
      .values({
        email: data.email.toLowerCase(),
        name: data.name || null,
        role: data.role || "reviewer",
      })
      .returning();
    return user;
  });

export const updateAdminUser = createServerFn({ method: "POST" })
  .middleware([requireAdminRoleMiddleware])
  .inputValidator(
    (input: { id: number; email?: string; name?: string; role?: string }) => {
      const validRoles = ["admin", "reviewer"];
      if (input.role && !validRoles.includes(input.role)) {
        throw new Error("Invalid role. Must be 'admin' or 'reviewer'.");
      }
      return input;
    }
  )
  .handler(async ({ data }) => {
    const updates: Record<string, unknown> = {};
    if (data.email !== undefined) updates.email = data.email.toLowerCase();
    if (data.name !== undefined) updates.name = data.name || null;
    if (data.role !== undefined) updates.role = data.role;
    const [updated] = await db
      .update(adminUsers)
      .set(updates)
      .where(eq(adminUsers.id, data.id))
      .returning();
    return updated;
  });

export const removeAdminUser = createServerFn({ method: "POST" })
  .middleware([requireAdminRoleMiddleware])
  .inputValidator((input: { id: number }) => input)
  .handler(async ({ data }) => {
    await db.delete(adminUsers).where(eq(adminUsers.id, data.id));
    return { success: true };
  });

export const isUserAdmin = createServerFn({ method: "GET" })
  .inputValidator((input: { email: string }) => input)
  .handler(async ({ data }) => {
    const admins = await db.select().from(adminUsers);
    if (admins.length === 0)
      return { isAdmin: true, isFirstUser: true, role: "admin" as const };
    const found = admins.find(
      (a) => a.email.toLowerCase() === data.email.toLowerCase()
    );
    return {
      isAdmin: !!found,
      isFirstUser: false,
      role: (found?.role as "admin" | "reviewer") ?? null,
    };
  });

export const autoRegisterFirstAdmin = createServerFn({ method: "POST" })
  .middleware([requireAuthMiddleware])
  .inputValidator((input: { email: string; name?: string }) => input)
  .handler(async ({ data }) => {
    const admins = await db.select().from(adminUsers);
    if (admins.length > 0) return null;
    const [user] = await db
      .insert(adminUsers)
      .values({
        email: data.email.toLowerCase(),
        name: data.name || null,
        role: "admin",
      })
      .returning();
    return user;
  });
