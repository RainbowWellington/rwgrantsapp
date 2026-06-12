import { admin, getIdentityConfig } from "@netlify/identity";
import type { Context, Config } from "@netlify/functions";

/**
 * Completes a password recovery flow.
 *
 * The browser-side `recoverPassword()` helper redeems the recovery token to
 * mint a short-lived user session and then writes the new password through that
 * session's `PUT /user` endpoint. On this site that session-based write fails
 * with "Database error updating user". This endpoint avoids that path entirely:
 * it redeems the recovery token only to identify the user, then sets the
 * password through the operator-token admin endpoint (`/admin/users/:id`) — the
 * same reliable mechanism used to manage Identity users elsewhere in the app.
 *
 * Recovery is unauthenticated by design: possession of the single-use token
 * emailed to the account owner is the authorization.
 */

function decodeJwtSubject(jwt: string): string | null {
  const parts = jwt.split(".");
  if (parts.length !== 3) return null;
  try {
    const payload = JSON.parse(
      Buffer.from(parts[1], "base64").toString("utf8")
    );
    return typeof payload.sub === "string" ? payload.sub : null;
  } catch {
    return null;
  }
}

export default async (req: Request, _context: Context) => {
  if (req.method !== "POST") {
    return Response.json({ error: "Method not allowed" }, { status: 405 });
  }

  let body: { token?: string; password?: string };
  try {
    body = (await req.json()) as { token?: string; password?: string };
  } catch {
    return Response.json({ error: "Invalid request body" }, { status: 400 });
  }

  const { token, password } = body;
  if (!token || !password) {
    return Response.json(
      { error: "A reset token and new password are required." },
      { status: 400 }
    );
  }
  if (typeof password !== "string" || password.length < 6) {
    return Response.json(
      { error: "Password must be at least 6 characters." },
      { status: 422 }
    );
  }

  const config = getIdentityConfig();
  if (!config?.url || !config.token) {
    return Response.json({ error: "Identity not configured" }, { status: 500 });
  }

  // Step 1: Redeem the recovery token to identify the account it belongs to.
  const verifyRes = await fetch(`${config.url}/verify`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ type: "recovery", token }),
  });

  if (!verifyRes.ok) {
    const status =
      verifyRes.status === 401 || verifyRes.status === 404
        ? 400
        : verifyRes.status;
    return Response.json(
      {
        error:
          "This password reset link has expired or is invalid. Please request a new one.",
      },
      { status }
    );
  }

  const verifyData = (await verifyRes.json().catch(() => ({}))) as {
    access_token?: string;
  };
  const userId = verifyData.access_token
    ? decodeJwtSubject(verifyData.access_token)
    : null;

  if (!userId) {
    return Response.json(
      { error: "Could not verify the reset link. Please request a new one." },
      { status: 400 }
    );
  }

  // Step 2: Set the new password via the operator-token admin endpoint.
  try {
    await admin.updateUser(userId, { password });
  } catch {
    return Response.json(
      { error: "Failed to update password. Please try again." },
      { status: 500 }
    );
  }

  return Response.json({ success: true });
};

export const config: Config = {
  path: "/api/reset-password",
};
