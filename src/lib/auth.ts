import { createServerFn } from "@tanstack/react-start";
import { getUser, type User } from "@netlify/identity";

export type { User as IdentityUser };

/**
 * Reads the currently authenticated Netlify Identity user during SSR from the
 * `nf_jwt` cookie. Returns `null` when no valid session exists.
 */
export const getServerUser = createServerFn({ method: "GET" }).handler(
  async () => {
    const user = await getUser();
    return (user ?? null) as User | null;
  }
);
