import { admin, getIdentityConfig } from "@netlify/identity";
import type { Context, Config } from "@netlify/functions";

/**
 * Backs the password-recovery flow in two steps so that a single-use, short-lived
 * recovery token is never the thing standing between the user and a successful
 * reset.
 *
 * Step 1 — "redeem" (`{ token }`): the browser hands over the raw recovery token
 * the instant the reset page loads. We redeem it once against the Identity
 * `/verify` endpoint and hand back the resulting session (`accessToken`). This
 * happens within a second of the user clicking the email link, well inside the
 * recovery token's lifetime, and the token is spent exactly once.
 *
 * Step 2 — "commit" (`{ accessToken, password }`): when the user submits their
 * new password we validate the session against `/user` and set the password via
 * the operator-token admin endpoint (`/admin/users/:id`). The browser-side
 * `PUT /user` path returns "Database error updating user" on this site, so we
 * avoid it entirely. `confirm: true` also clears any unconfirmed-account state,
 * another source of that database error.
 *
 * Splitting the flow means the user can type their password at their own pace,
 * and a failed attempt no longer burns the recovery token: the session, not the
 * one-time token, is what the commit step relies on.
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

  let body: { token?: string; accessToken?: string; password?: string };
  try {
    body = (await req.json()) as typeof body;
  } catch {
    return Response.json({ error: "Invalid request body" }, { status: 400 });
  }

  const config = getIdentityConfig();
  if (!config?.url || !config.token) {
    return Response.json({ error: "Identity not configured" }, { status: 500 });
  }

  // ---- Step 1: redeem the recovery token for a session -------------------
  if (body.token && !body.accessToken) {
    let verifyRes: Response;
    try {
      verifyRes = await fetch(`${config.url}/verify`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "recovery", token: body.token }),
      });
    } catch {
      return Response.json(
        { error: TEMPORARY_MESSAGE, code: "temporary" },
        { status: 502 }
      );
    }

    if (!verifyRes.ok) {
      // 4xx means the link itself is no good (expired, already used, unknown).
      // 5xx is a transient backend problem the user can retry — don't tell
      // them to request a brand-new link in that case.
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
    if (!verifyData.access_token || !decodeJwtSubject(verifyData.access_token)) {
      return Response.json(
        { error: INVALID_LINK_MESSAGE, code: "invalid" },
        { status: 400 }
      );
    }

    return Response.json({ accessToken: verifyData.access_token });
  }

  // ---- Step 2: commit the new password using the redeemed session --------
  const { accessToken, password } = body;
  if (!accessToken || !password) {
    return Response.json(
      { error: "A valid session and new password are required." },
      { status: 400 }
    );
  }
  if (typeof password !== "string" || password.length < 6) {
    return Response.json(
      { error: "Password must be at least 6 characters." },
      { status: 422 }
    );
  }

  // Validate the session against Identity so a forged token can't be used to
  // reset an arbitrary account, and to recover the user's id.
  let userRes: Response;
  try {
    userRes = await fetch(`${config.url}/user`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
  } catch {
    return Response.json(
      { error: TEMPORARY_MESSAGE, code: "temporary" },
      { status: 502 }
    );
  }

  if (!userRes.ok) {
    if (userRes.status >= 500) {
      return Response.json(
        { error: TEMPORARY_MESSAGE, code: "temporary" },
        { status: 502 }
      );
    }
    return Response.json(
      {
        error:
          "Your reset session has expired. Please request a new password reset link.",
        code: "invalid",
      },
      { status: 400 }
    );
  }

  const userData = (await userRes.json().catch(() => ({}))) as { id?: string };
  const userId = userData.id || decodeJwtSubject(accessToken);
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
