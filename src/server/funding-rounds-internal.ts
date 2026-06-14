import { db } from "../../db/index.js";
import { fundingRounds } from "../../db/schema.js";
import { eq, desc } from "drizzle-orm";

// Funding round start/end dates are stored as plain YYYY-MM-DD calendar dates
// (New Zealand local dates). Comparing them against a UTC "today" makes a round
// that is only open today disappear during NZ morning hours, when UTC is still on
// the previous calendar day. Compute today in the New Zealand time zone instead.
function getNewZealandToday(): string {
  // en-CA formats as YYYY-MM-DD, which matches the stored date strings.
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Pacific/Auckland",
  }).format(new Date());
}

// Shared lookup for the funding round that is currently open and within its
// date window. Used both by the public endpoint and at submission time so that
// new applications are attached to the round they are created under.
//
// This helper lives in its own module (rather than alongside the server
// functions in funding-rounds.ts) on purpose: it touches the database client at
// module scope, outside any createServerFn handler. Keeping it out of the
// server-function module lets TanStack Start strip the `db` import from the
// client build of funding-rounds.ts, which otherwise pulls the Postgres driver
// into the browser bundle and crashes every page with "Buffer is not defined".
export async function findActiveFundingRound() {
  const today = getNewZealandToday();
  const rows = await db
    .select()
    .from(fundingRounds)
    .where(eq(fundingRounds.status, "open"))
    .orderBy(desc(fundingRounds.createdAt));
  const active = rows.find((r) => r.startDate <= today && r.endDate >= today);
  return active ?? null;
}
