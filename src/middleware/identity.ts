import { createMiddleware } from "@tanstack/react-start";
import { getUser } from "@netlify/identity";
import { db } from "../../db/index.js";
import { adminUsers } from "../../db/schema.js";
import { eq } from "drizzle-orm";

/**
 * Requires an authenticated Netlify Identity user. The user is read from the
 * `nf_jwt` cookie by `getUser()`. Throws if no valid session is present.
 */
export const requireAuthMiddleware = createMiddleware().server(
  async ({ next }) => {
    const user = await getUser();
    if (!user) throw new Error("Authentication required");
    return next({ context: { user } });
  }
);

/**
 * Requires an authenticated user who is also recorded as an admin in the
 * `admin_users` table. Reviewers and unknown users are rejected.
 */
export const requireAdminRoleMiddleware = createMiddleware().server(
  async ({ next }) => {
    const user = await getUser();
    if (!user?.email) throw new Error("Authentication required");
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
