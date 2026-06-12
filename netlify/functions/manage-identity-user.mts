import { admin, getUser, getIdentityConfig } from "@netlify/identity";
import type { Context, Config } from "@netlify/functions";
import { drizzle } from "drizzle-orm/netlify-db";
import { pgTable, serial, text, timestamp } from "drizzle-orm/pg-core";
import { eq } from "drizzle-orm";

const adminUsers = pgTable("admin_users", {
  id: serial().primaryKey(),
  email: text("email").notNull().unique(),
  name: text("name"),
  role: text("role").notNull().default("admin"),
  createdAt: timestamp("created_at").defaultNow(),
});

const db = drizzle();

async function verifyAdmin(): Promise<boolean> {
  const user = await getUser();
  if (!user?.email) return false;
  const [found] = await db
    .select()
    .from(adminUsers)
    .where(eq(adminUsers.email, user.email.toLowerCase()));
  return found?.role === "admin";
}

export default async (req: Request, context: Context) => {
  if (!(await verifyAdmin())) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (req.method === "POST") {
    const { email, name } = (await req.json()) as {
      email: string;
      name?: string;
    };

    const config = getIdentityConfig();
    if (!config?.token) {
      return Response.json(
        { error: "Identity not configured" },
        { status: 500 }
      );
    }

    const existingUsers = await admin.listUsers();
    const existing = existingUsers.find(
      (u) => u.email?.toLowerCase() === email.toLowerCase()
    );
    if (existing) {
      return Response.json({
        success: true,
        message: "User already exists in Identity",
        alreadyExists: true,
      });
    }

    const res = await fetch(`${config.url}/invite`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${config.token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email,
        data: { full_name: name || "" },
      }),
    });

    if (!res.ok) {
      const errorText = await res.text();
      return Response.json(
        { error: `Failed to invite user: ${errorText}` },
        { status: res.status }
      );
    }

    return Response.json({ success: true, message: "Invite sent" });
  }

  if (req.method === "PUT") {
    const { email, name, password, newEmail } = (await req.json()) as {
      email: string;
      name?: string;
      password?: string;
      newEmail?: string;
    };

    const users = await admin.listUsers();
    const identityUser = users.find(
      (u) => u.email?.toLowerCase() === email.toLowerCase()
    );

    if (!identityUser) {
      return Response.json(
        { error: "User not found in Identity" },
        { status: 404 }
      );
    }

    const updates: Record<string, unknown> = {};
    if (newEmail) updates.email = newEmail;
    if (password) updates.password = password;
    if (name !== undefined)
      updates.user_metadata = { full_name: name || "" };

    if (Object.keys(updates).length === 0) {
      return Response.json({ success: true, message: "Nothing to update" });
    }

    await admin.updateUser(identityUser.id, updates);
    return Response.json({ success: true, message: "User updated" });
  }

  if (req.method === "DELETE") {
    const { email } = (await req.json()) as { email: string };

    const users = await admin.listUsers();
    const identityUser = users.find(
      (u) => u.email?.toLowerCase() === email.toLowerCase()
    );

    if (!identityUser) {
      return Response.json({
        success: true,
        message: "User not found in Identity",
      });
    }

    await admin.deleteUser(identityUser.id);
    return Response.json({
      success: true,
      message: "User removed from Identity",
    });
  }

  return Response.json({ error: "Method not allowed" }, { status: 405 });
};

export const config: Config = {
  path: "/api/manage-identity-user",
};
