import { createMiddleware } from "@tanstack/react-start";
import { getUser, type User } from "@netlify/identity";
import { db } from "../../db/index.js";
import { adminUsers } from "../../db/schema.js";
import { eq } from "drizzle-orm";

export const identityMiddleware = createMiddleware().server(
  async ({ next }) => {
    const user: User | null = (await getUser()) ?? null;
    return next({ context: { user } });
  }
);

export const requireAuthMiddleware = createMiddleware().server(
  async ({ next }) => {
    const user = await getUser();
    if (!user) throw new Error("Authentication required");
    return next({ context: { user } });
  }
);

export const requireAdminRoleMiddleware = createMiddleware().server(
  async ({ next }) => {
    const user = await getUser();
    if (!user) throw new Error("Authentication required");
    const [adminUser] = await db
      .select()
      .from(adminUsers)
      .where(eq(adminUsers.email, user.email.toLowerCase()));
    if (!adminUser || adminUser.role !== "admin") {
      throw new Error("Admin role required");
    }
    return next({ context: { user } });
  }
);

export function requireRoleMiddleware(role: string) {
  return createMiddleware().server(async ({ next }) => {
    const user = await getUser();
    if (!user) throw new Error("Authentication required");
    if (!user.roles?.includes(role))
      throw new Error(`Role '${role}' required`);
    return next({ context: { user } });
  });
}
