import type { Handler, HandlerEvent, HandlerContext } from "@netlify/functions";
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

const handler: Handler = async (event: HandlerEvent, context: HandlerContext) => {
  try {
    const { user } = JSON.parse(event.body || "{}");
    const userEmail = user?.email?.toLowerCase();

    let roles = ["user"];

    if (userEmail) {
      try {
        const [adminUser] = await db
          .select()
          .from(adminUsers)
          .where(eq(adminUsers.email, userEmail));
        if (adminUser) {
          roles = [adminUser.role];
        }
      } catch {
        // Fall back to default role if DB lookup fails
      }
    }

    return {
      statusCode: 200,
      body: JSON.stringify({
        app_metadata: {
          ...user?.app_metadata,
          roles,
        },
        user_metadata: {
          ...user?.user_metadata,
          signed_up_at: new Date().toISOString(),
        },
      }),
    };
  } catch {
    return {
      statusCode: 200,
      body: JSON.stringify({
        app_metadata: { roles: ["user"] },
      }),
    };
  }
};

exports.handler = async function (event, context) {
  // ... your custom logic (like saving the user to a database) ...

  // 1. Parse the user data that Netlify sent to this function
  const { user } = JSON.parse(event.body);

  // 2. CRITICAL: You must return a 200 status and the user object back
  return {
    statusCode: 200,
    body: JSON.stringify({
      ...user,
      // Optional: You can append custom roles or app_metadata here if you need to
    }),
  };
};
