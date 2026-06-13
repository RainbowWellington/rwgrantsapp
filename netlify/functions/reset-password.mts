import { admin, getIdentityConfig } from "@netlify/identity";
import type { Context, Config } from "@netlify/functions";

/**
 * Completes a password recovery in a single request.
 *
 * The browser sends the raw recovery token (from the `#recovery_token=` hash in
 * the emailed link) together with the user's chosen new password. The token is
 * redeemed exactly once, here, at the moment the user submits — never earlier —
 * so there is no window in which a pre-redeemed session can go stale and no way
 * for the single-use token to be spent before it is needed.
 *
 * The new password is set through the operator-token admin endpoint
 * (`admin.updateUser`), not the browser-side `PUT /user` path, which returns
 * "Database error updating user" on this site. `confirm: true` also clears any
 * unconfirmed-account state, another source of that error.
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

const INVALID_LINK_MESSAGE =
  "This password reset link has expired or is invalid. Please request a new one.";
const TEMPORARY_MESSAGE =
  "We couldn't reach the account service. Please try again in a moment.";

export default async (req: Request, _context: Context) => {
  if (req.method !== "POST") {
    return Response.json({ error: "Method not allowed" }, { status: 405 });
  }

  let body: { token?: string; password?: string };
  try {
    body = (await req.json()) as typeof body;
  } catch {
    return Response.json({ error: "Invalid request body" }, { status: 400 });
  }

  const { token, password } = body;
  if (!token) {
    return Response.json(
      { error: INVALID_LINK_MESSAGE, code: "invalid" },
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

  // Redeem the single-use recovery token for a short-lived session.
  let verifyRes: Response;
  try {
    verifyRes = await fetch(`${config.url}/verify`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: "recovery", token }),
    });
  } catch {
    return Response.json(
      { error: TEMPORARY_MESSAGE, code: "temporary" },
      { status: 502 }
    );
  }

  if (!verifyRes.ok) {
    // 4xx means the link itself is no good (expired, already used, unknown).
    // 5xx is a transient backend problem the user can retry.
    if (verifyRes.status >= 500) {
      return Response.json(
        { error: TEMPORARY_MESSAGE, code: "temporary" },
        { status: 502 }
      );
    }
    return Response.json(
      { error: INVALID_LINK_MESSAGE, code: "invalid" },
      { status: 400 }
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
      { error: INVALID_LINK_MESSAGE, code: "invalid" },
      { status: 400 }
    );
  }

  try {
    await admin.updateUser(userId, { password, confirm: true });
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
