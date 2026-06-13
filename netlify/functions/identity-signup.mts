import type { Handler, HandlerEvent, HandlerContext } from "@netlify/functions";

/**
 * Netlify Identity `signup` webhook.
 *
 * GoTrue calls this function *synchronously* while it writes the user record —
 * not only on signup, but also while verifying confirmation and recovery
 * tokens. If the call fails for any reason (non-2xx, crash, or timeout) GoTrue
 * rolls back the surrounding user write and surfaces a "Database error updating
 * user". That is what previously broke account confirmation *and* the
 * password-reset flow: this webhook was querying the application database on
 * every invocation, and when that query errored or stalled it returned 502,
 * which in turn made `/.netlify/identity/verify` return 500 and
 * `/api/reset-password` return 502.
 *
 * Admin authorization is resolved from the `admin_users` table at request time
 * (see `src/middleware/identity.ts`), so the JWT roles assigned here are never
 * consulted for access control. The webhook therefore does no I/O at all: it
 * stamps a default role plus a signup timestamp and returns immediately, so it
 * can never become the reason a user write fails.
 */
const handler: Handler = async (
  event: HandlerEvent,
  _context: HandlerContext
) => {
  let user: {
    app_metadata?: Record<string, unknown>;
    user_metadata?: Record<string, unknown>;
  } = {};

  try {
    ({ user = {} } = JSON.parse(event.body || "{}"));
  } catch {
    // Ignore a malformed payload and fall through to safe defaults.
  }

  const appMetadata = user.app_metadata ?? {};
  const userMetadata = user.user_metadata ?? {};

  return {
    statusCode: 200,
    body: JSON.stringify({
      app_metadata: {
        ...appMetadata,
        // Preserve a role already set in the Netlify UI; otherwise default.
        roles: appMetadata.roles ?? ["user"],
      },
      user_metadata: {
        ...userMetadata,
        signed_up_at: new Date().toISOString(),
      },
    }),
  };
};

export { handler };
